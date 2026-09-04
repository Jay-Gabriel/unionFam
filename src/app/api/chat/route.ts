import { NextResponse } from 'next/server';
import { GeminiConversationProvider } from '@/server/ai/provider';
import { requireUser } from '@/server/auth/current-user';
import { createClient } from '@/lib/supabase/server';
import { computeEligibleQuestions } from '@/server/domain/questions';
import { allowedNextStages, resolveNextStage } from '@/server/domain/conversation';
import { BLUEPRINT_OPENING_QUESTION } from '@/server/ai/life-lab-blueprint';
import { consumeRateLimit } from '@/server/security/rate-limit';
import { recordAiRunLog, recordApplicationError } from '@/server/observability/log';
import { labelDimension } from '@/lib/i18n';
import { DEMO_USER_ID, isDemoMode } from '@/lib/demo-mode';
import { loadPublishedScripts } from '@/server/ai/script-library';

export const dynamic = 'force-dynamic';

type ChatEvent = { event: string; data: Record<string, unknown> };

function errorResponse(error: unknown, fallback: string, requestId: string) {
  const message = error instanceof Error ? error.message : '';
  if (message === 'AUTH_REQUIRED') {
    return NextResponse.json(
      { error: 'AUTH_REQUIRED', requestId },
      { status: 401, headers: { 'X-Request-Id': requestId } }
    );
  }
  console.error(fallback, error instanceof Error ? error.name : 'UnknownError');
  return NextResponse.json(
    { error: fallback, requestId },
    { status: 503, headers: { 'X-Request-Id': requestId } }
  );
}

function streamEvents(events: ChatEvent[]) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for (const item of events) {
        controller.enqueue(encoder.encode(`event: ${item.event}\ndata: ${JSON.stringify(item.data)}\n\n`));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

function toMessageEvents(params: {
  conversationId: string;
  assistantMessageId: string;
  responseText: string;
  nextStage: string;
  requiresPermission: boolean;
  observation?: {
    id: string;
    dimension: string;
    contentOriginal: string;
    status: string;
  };
  experimentProposal?: {
    title: string;
    hypothesis: string;
    smallestStep: string;
    successSignal: string;
    targetDays: number;
    dimension?: string;
  };
  reflectionProposal?: {
    result: string;
    learningCandidate: string;
    feeling: string;
    nextAction: string;
    rating: number;
    experimentTitle?: string;
  };
  resourceProposal?: {
    dimension: string;
    resourceType: string;
    name: string;
    description?: string;
  };
  idempotencyKey: string | null;
}) {
  const chunks = params.responseText.match(/[\s\S]{1,32}/g) || [params.responseText];
  const events: ChatEvent[] = [
    {
      event: 'message.started',
      data: {
        conversationId: params.conversationId,
        assistantMessageId: params.assistantMessageId,
        idempotencyKey: params.idempotencyKey,
      },
    },
    ...chunks.map((text) => ({ event: 'message.delta', data: { text } })),
  ];

  if (params.observation) {
    events.push({
      event: 'observation.created',
      data: {
        id: params.observation.id,
        dimension: params.observation.dimension,
        dimensionLabel: labelDimension(params.observation.dimension),
        contentOriginal: params.observation.contentOriginal,
        status: params.observation.status,
      },
    });
  }

  if (params.experimentProposal) {
    events.push({
      event: 'experiment.created',
      data: {
        ...params.experimentProposal,
        dimensionLabel: params.experimentProposal.dimension ? labelDimension(params.experimentProposal.dimension) : undefined,
      },
    });
  }

  if (params.reflectionProposal) {
    events.push({
      event: 'reflection.created',
      data: params.reflectionProposal,
    });
  }

  if (params.resourceProposal) {
    events.push({
      event: 'resource.created',
      data: {
        ...params.resourceProposal,
        dimensionLabel: params.resourceProposal.dimension ? labelDimension(params.resourceProposal.dimension) : undefined,
      },
    });
  }

  events.push({
    event: 'message.completed',
    data: {
      conversationId: params.conversationId,
      assistantMessageId: params.assistantMessageId,
      nextStage: params.nextStage,
      requiresPermission: params.requiresPermission,
    },
  });
  return events;
}

function demoRecentMessages(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is { role: string; content: string } => {
      if (!item || typeof item !== 'object') return false;
      const candidate = item as Record<string, unknown>;
      return (candidate.role === 'user' || candidate.role === 'assistant') && typeof candidate.content === 'string';
    })
    .slice(-8)
    .map((item) => ({ role: item.role, content: item.content.slice(0, 2000) }));
}

async function handleDemoChat(body: unknown, requestId: string) {
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'INVALID_REQUEST', requestId }, { status: 400, headers: { 'X-Request-Id': requestId } });
  }

  const payload = body as Record<string, unknown>;
  const opening = payload.opening === true;
  const content = typeof payload.content === 'string' ? payload.content.trim() : '';
  const conversationId = typeof payload.conversationId === 'string' ? payload.conversationId.trim() : '';
  const providedIdempotencyKey = typeof payload.idempotencyKey === 'string' ? payload.idempotencyKey.trim() : '';
  const idempotencyKey = opening
    ? providedIdempotencyKey || (conversationId ? `opening:${conversationId}` : '')
    : providedIdempotencyKey;

  if ((!opening && !content) || content.length > 4000 || idempotencyKey.length > 128) {
    return NextResponse.json({ error: 'INVALID_MESSAGE', requestId }, { status: 422, headers: { 'X-Request-Id': requestId } });
  }
  if (!conversationId || conversationId === 'new') {
    return NextResponse.json({ error: 'CONVERSATION_ID_REQUIRED', requestId }, { status: 422, headers: { 'X-Request-Id': requestId } });
  }

  const rate = consumeRateLimit(`demo:${conversationId}`, 20, 60_000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'RATE_LIMITED', requestId },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds), 'X-Request-Id': requestId } }
    );
  }

  const provider = new GeminiConversationProvider();
  const result = await provider.generateResponse(
    {
      userId: DEMO_USER_ID,
      conversationId,
      currentStage: 'discovery',
      methodologyVersion: 'demo',
      recentMessages: demoRecentMessages(payload.recentMessages),
      confirmedInsights: [],
      userAnswersSummary: '',
    },
    opening
      ? BLUEPRINT_OPENING_QUESTION
      : content,
    [],
    opening ? 'opening' : 'message'
  );

  if (!result.success || !result.data) {
    return NextResponse.json(
      { error: result.errorCode || 'AI_PROVIDER_UNAVAILABLE', requestId },
      { status: 502, headers: { 'X-Request-Id': requestId } }
    );
  }

  return streamEvents(
    toMessageEvents({
      conversationId,
      assistantMessageId: `demo-ai-${crypto.randomUUID()}`,
      responseText: result.data.responseText,
      nextStage: result.data.nextStage || 'discovery',
      requiresPermission: false,
      experimentProposal: result.data.experimentProposal,
      reflectionProposal: result.data.reflectionProposal,
      resourceProposal: result.data.resourceProposal,
      idempotencyKey: idempotencyKey || null,
    })
  );
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    const body = await request.json().catch(() => null);
    if (isDemoMode()) return await handleDemoChat(body, requestId);

    const user = await requireUser();
    const rate = consumeRateLimit(`chat:${user.id}`, 20, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'RATE_LIMITED' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
      );
    }
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'INVALID_REQUEST', requestId }, { status: 400, headers: { 'X-Request-Id': requestId } });
    }
    const opening = body.opening === true;
    const content = typeof body.content === 'string' ? body.content.trim() : '';
    const requestedConversationId = typeof body.conversationId === 'string' ? body.conversationId : '';
    const providedIdempotencyKey = typeof body.idempotencyKey === 'string' ? body.idempotencyKey.trim() : '';
    const idempotencyKey = opening
      ? providedIdempotencyKey || (requestedConversationId ? `opening:${requestedConversationId}` : '')
      : providedIdempotencyKey;

    if ((!opening && !content) || content.length > 4000 || idempotencyKey.length > 128) {
      return NextResponse.json({ error: 'INVALID_MESSAGE' }, { status: 422 });
    }
    if (opening && (!requestedConversationId || requestedConversationId === 'new')) {
      return NextResponse.json({ error: 'CONVERSATION_ID_REQUIRED' }, { status: 422 });
    }

    const supabase = createClient();
    let conversationId = requestedConversationId;
    let existingUserMessage: { id: string; conversation_id: string; sequence_no: number; content: string; status: string } | null = null;
    let existingAssistantMessage: { id: string; content: string; status: string } | null = null;

    if (opening) {
      const { data: existingAssistant } = await supabase
        .from('messages')
        .select('id, content, status')
        .eq('user_id', user.id)
        .eq('conversation_id', requestedConversationId)
        .eq('role', 'assistant')
        .eq('idempotency_key', `${idempotencyKey}:assistant`)
        .maybeSingle();
      existingAssistantMessage = existingAssistant;

      if (existingAssistant?.status === 'complete') {
        const [{ data: replayConversation }, { data: replayObservation }] = await Promise.all([
          supabase
            .from('conversations')
            .select('current_stage')
            .eq('id', requestedConversationId)
            .eq('user_id', user.id)
            .maybeSingle(),
          supabase
            .from('ai_observations')
            .select('id, dimension, content_original, status')
            .eq('assistant_message_id', existingAssistant.id)
            .eq('user_id', user.id)
            .maybeSingle(),
        ]);
        return streamEvents(
          toMessageEvents({
            conversationId: requestedConversationId,
            assistantMessageId: existingAssistant.id,
            responseText: existingAssistant.content,
            nextStage: replayConversation?.current_stage || 'discovery',
            requiresPermission: Boolean(replayObservation),
            observation: replayObservation
              ? {
                  id: replayObservation.id,
                  dimension: replayObservation.dimension,
                  contentOriginal: replayObservation.content_original,
                  status: replayObservation.status,
                }
              : undefined,
            idempotencyKey,
          })
        );
      }
      if (existingAssistant && existingAssistant.status !== 'failed') {
        return NextResponse.json({
          data: { duplicate: true, conversationId: requestedConversationId, messageId: existingAssistant.id },
        }, { status: 409 });
      }
    } else if (idempotencyKey) {
      const { data: existingMessage } = await supabase
        .from('messages')
        .select('id, conversation_id, sequence_no, content, status')
        .eq('user_id', user.id)
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle();

      if (existingMessage) {
        if (existingMessage.content !== content) {
          return NextResponse.json({ error: 'IDEMPOTENCY_KEY_REUSED' }, { status: 409 });
        }
        existingUserMessage = existingMessage;
        const { data: existingAssistant } = await supabase
          .from('messages')
          .select('id, content, status')
          .eq('user_id', user.id)
          .eq('idempotency_key', `${idempotencyKey}:assistant`)
          .maybeSingle();
        existingAssistantMessage = existingAssistant;

        if (existingAssistant?.status === 'complete') {
          const [{ data: replayConversation }, { data: replayObservation }] = await Promise.all([
            supabase
              .from('conversations')
              .select('current_stage')
              .eq('id', existingMessage.conversation_id)
              .eq('user_id', user.id)
              .maybeSingle(),
            supabase
              .from('ai_observations')
              .select('id, dimension, content_original, status')
              .eq('assistant_message_id', existingAssistant.id)
              .eq('user_id', user.id)
              .maybeSingle(),
          ]);
          return streamEvents(
            toMessageEvents({
              conversationId: existingMessage.conversation_id,
              assistantMessageId: existingAssistant.id,
              responseText: existingAssistant.content,
              nextStage: replayConversation?.current_stage || 'discovery',
              requiresPermission: Boolean(replayObservation),
              observation: replayObservation
                ? {
                    id: replayObservation.id,
                    dimension: replayObservation.dimension,
                    contentOriginal: replayObservation.content_original,
                    status: replayObservation.status,
                  }
                : undefined,
              idempotencyKey,
            })
          );
        }
        if (existingAssistant && existingAssistant.status !== 'failed') {
          return NextResponse.json({
            data: { duplicate: true, conversationId: existingMessage.conversation_id, messageId: existingMessage.id },
          }, { status: 409 });
        }
        // A failed/incomplete provider turn is retryable. Reuse the canonical
        // user message and update the failed assistant row on success.
        conversationId = existingMessage.conversation_id;
      }
    }

    if (!conversationId || conversationId === 'new') {
      const { data: flow } = await supabase
        .from('question_flow_versions')
        .select('id')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      const { data: conversation, error } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          title: 'Cuộc trò chuyện mới',
          current_stage: 'discovery',
          question_flow_version_id: flow?.id || null,
        })
        .select('id, current_stage, prompt_version, question_flow_version_id')
        .single();
      if (error || !conversation) throw error || new Error('CONVERSATION_CREATE_FAILED');
      conversationId = conversation.id;
    }

    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('id, status, current_stage, prompt_version, question_flow_version_id')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .maybeSingle();
    if (conversationError) throw conversationError;
    if (!conversation) return NextResponse.json({ error: 'CONVERSATION_NOT_FOUND' }, { status: 404 });
    if (conversation.status !== 'active') {
      return NextResponse.json({ error: 'CONVERSATION_NOT_ACTIVE' }, { status: 409 });
    }

    type PreviousMessage = { role: string; content: string; sequence_no: number };
    type InsightRow = { dimension: string; content: string };
    type AnswerRow = { question_id: string; answer: unknown };
    type RejectedRow = { content_original: string };
    type QuestionRow = {
      id: string;
      question_key: string;
      title: string;
      helper_text: string | null;
      branch_rules: unknown;
      ordinal: number;
    };
    type ProfileRow = { snapshot: unknown; version_no: number };
    type ResourceRow = { dimension: string; resource_type: string; name: string; description: string | null };
    type GapRow = { dimension: string; title: string; current_state: string; desired_state: string; priority: number; status: string };
    type ExperimentRow = { title: string; hypothesis: string; smallest_step: string; success_signal: string; progress_percent: number; status: string; target_date: string | null };
    type ReflectionRow = { result: string | null; learning_candidate: string | null; feeling: string | null; next_action: string | null; created_at: string };

    // The opening turn only needs the conversation record and a short greeting.
    // Loading the full profile/context here added ten database round trips before
    // Gemini could even start. Defer that context work to regular user turns.
    let previousMessages: PreviousMessage[] = [];
    let insightRows: InsightRow[] = [];
    let answerRows: AnswerRow[] = [];
    let rejectedRows: RejectedRow[] = [];
    let questionRows: QuestionRow[] = [];
    let profileRow: ProfileRow | null = null;
    let resourceRows: ResourceRow[] = [];
    let gapRows: GapRow[] = [];
    let experimentRow: ExperimentRow | null = null;
    let reflectionRow: ReflectionRow | null = null;
    let approvedScripts: Awaited<ReturnType<typeof loadPublishedScripts>> = [];

    if (!opening) {
      const [previousResult, insightResult, answerResult, rejectedResult, questionResult, profileResult, resourceResult, gapResult, experimentResult, reflectionResult, scriptsResult] = await Promise.all([
        supabase
          .from('messages')
          .select('role, content, sequence_no')
          .eq('conversation_id', conversationId)
          .eq('user_id', user.id)
          .order('sequence_no', { ascending: false })
          .limit(8),
        supabase
          .from('confirmed_insights')
          .select('dimension, content')
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .order('confirmed_at', { ascending: false })
          .limit(20),
        supabase
          .from('user_answers')
          .select('question_id, answer')
          .eq('user_id', user.id)
          .eq('flow_version_id', conversation.question_flow_version_id || '')
          .is('deleted_at', null),
        supabase
          .from('ai_observations')
          .select('content_original')
          .eq('user_id', user.id)
          .eq('status', 'rejected')
          .order('created_at', { ascending: false })
          .limit(8),
          conversation.question_flow_version_id
          ? supabase
              .from('questions')
              .select('id, question_key, title, helper_text, branch_rules, ordinal')
              .eq('flow_version_id', conversation.question_flow_version_id)
              .order('ordinal', { ascending: true })
          : Promise.resolve({ data: [] as unknown[], error: null }),
        supabase
          .from('life_profile_versions')
          .select('snapshot, version_no')
          .eq('user_id', user.id)
          .eq('is_current', true)
          .maybeSingle(),
        supabase
          .from('resources')
          .select('dimension, resource_type, name, description')
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .order('updated_at', { ascending: false })
          .limit(10),
        supabase
          .from('gaps')
          .select('dimension, title, current_state, desired_state, priority, status')
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .in('status', ['open', 'in_progress'])
          .order('priority', { ascending: true })
          .limit(10),
        supabase
          .from('experiments')
          .select('title, hypothesis, smallest_step, success_signal, progress_percent, status, target_date')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .is('deleted_at', null)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('reflections')
          .select('result, learning_candidate, feeling, next_action, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        loadPublishedScripts(),
      ]);

      const readError = [
        previousResult.error,
        insightResult.error,
        answerResult.error,
        rejectedResult.error,
        questionResult.error,
        profileResult.error,
        resourceResult.error,
        gapResult.error,
        experimentResult.error,
        reflectionResult.error,
      ].find(Boolean);
      if (readError) throw readError;

      previousMessages = (previousResult.data || []) as PreviousMessage[];
      insightRows = (insightResult.data || []) as InsightRow[];
      answerRows = (answerResult.data || []) as AnswerRow[];
      rejectedRows = (rejectedResult.data || []) as RejectedRow[];
      questionRows = (questionResult.data || []) as QuestionRow[];
      profileRow = (profileResult.data || null) as ProfileRow | null;
      resourceRows = (resourceResult.data || []) as ResourceRow[];
      gapRows = (gapResult.data || []) as GapRow[];
      experimentRow = (experimentResult.data || null) as ExperimentRow | null;
      reflectionRow = (reflectionResult.data || null) as ReflectionRow | null;
      approvedScripts = scriptsResult;
    }

    const questionData = questionRows;
    const answersByKey: Record<string, unknown> = {};
    const questionKeyById = new Map(questionData.map((question) => [question.id, question.question_key]));
    (answerRows || []).forEach((answer: { question_id: string; answer: unknown }) => {
      const key = questionKeyById.get(answer.question_id);
      if (key) answersByKey[key] = answer.answer;
    });
    const eligibleQuestionIds = computeEligibleQuestions(
      questionData.map((question) => ({
        id: question.id,
        questionKey: question.question_key,
        title: question.title,
        helperText: question.helper_text || undefined,
        answerType: 'text' as const,
        options: [],
        branchRules: Array.isArray(question.branch_rules) ? question.branch_rules as never : [],
        ordinal: question.ordinal,
        isRequired: false,
      })),
      answersByKey
    );

    let userMessage = existingUserMessage;
    if (!userMessage && !opening) {
      const { data: insertedUserMessage, error: userMessageError } = await supabase
        .from('messages')
        .insert({
          user_id: user.id,
          conversation_id: conversationId,
          role: 'user',
          content,
          status: 'complete',
          // The database trigger allocates sequence under a conversation lock.
          sequence_no: 0,
          idempotency_key: idempotencyKey || null,
        })
        .select('id, conversation_id, sequence_no, content, status')
        .single();
      if (userMessageError || !insertedUserMessage) {
        if (userMessageError?.code === '23505' && idempotencyKey) {
          return NextResponse.json({ data: { duplicate: true, conversationId } }, { status: 409 });
        }
        throw userMessageError || new Error('USER_MESSAGE_SAVE_FAILED');
      }
      userMessage = insertedUserMessage;

      await supabase.from('user_statements').insert({
        user_id: user.id,
        conversation_id: conversationId,
        message_id: userMessage.id,
        content,
        statement_type: 'verbatim',
      });
    }

    const recentMessages = (previousMessages || [])
      .slice()
      .reverse()
      .map((message: { role: string; content: string }) => ({ role: message.role, content: message.content }));
    // A retry reuses the canonical user row, which is already present in the
    // recent-message query. Avoid injecting the same turn twice into context.
    if (!opening && !existingUserMessage) {
      recentMessages.push({ role: 'user', content: userMessage?.content || content });
    }
    const provider = new GeminiConversationProvider();
    const aiStartedAt = Date.now();
    const result = await provider.generateResponse(
      {
        userId: user.id,
        conversationId,
        currentStage: conversation.current_stage,
        allowedTransitions: allowedNextStages(conversation.current_stage),
        eligibleQuestionIds,
        questionCatalog: questionData
          .filter((question) => eligibleQuestionIds.includes(question.id))
          .map((question) => ({
            id: question.id,
            questionKey: question.question_key,
            title: question.title,
            helperText: question.helper_text || undefined,
          })),
        methodologyVersion: conversation.prompt_version,
        profile: profileRow ? JSON.stringify(profileRow.snapshot) : undefined,
        recentMessages,
        confirmedInsights: (insightRows || []).map((row: { dimension: string; content: string }) => `${row.dimension}: ${row.content}`),
        userAnswersSummary: Object.entries(answersByKey).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join('\n'),
        activeResources: (resourceRows || []).map((row: { dimension: string; resource_type: string; name: string; description: string | null }) => `${row.dimension}/${row.resource_type}: ${row.name}${row.description ? ` — ${row.description}` : ''}`),
        activeGaps: (gapRows || []).map((row: { dimension: string; title: string; current_state: string; desired_state: string; priority: number; status: string }) => `${row.dimension}: ${row.title} (${row.status}, ưu tiên ${row.priority}) ${row.current_state} → ${row.desired_state}`),
        activeExperiment: experimentRow ? JSON.stringify(experimentRow) : undefined,
        recentReflection: reflectionRow ? JSON.stringify(reflectionRow) : undefined,
        rejectedObservations: (rejectedRows || []).map((row: { content_original: string }) => row.content_original),
        approvedScripts,
        answeredTopics: Object.keys(answersByKey),
        knownFacts: (insightRows || []).map((row: { dimension: string; content: string }) => `${row.dimension}: ${row.content}`),
      },
      opening
        ? BLUEPRINT_OPENING_QUESTION
        : content,
      eligibleQuestionIds,
      opening ? 'opening' : 'message'
    );

    await recordAiRunLog({
      requestId,
      userId: user.id,
      provider: 'gemini',
      model: process.env.AI_MODEL || 'gemini-flash-lite-latest',
      latencyMs: Date.now() - aiStartedAt,
      status: result.success ? 'success' : 'error',
      errorCode: result.errorCode,
      completionTokens: result.data?.responseText.length || 0,
    });

    if (!result.success || !result.data) {
      const failedPayload = {
        content: 'Life Lab chưa thể hoàn tất phản hồi này. Bạn có thể thử lại; chia sẻ của bạn đã được giữ lại.',
        status: 'failed' as const,
        error_code: result.errorCode || 'AI_SCHEMA_INVALID',
        updated_at: new Date().toISOString(),
      };
      if (existingAssistantMessage?.status === 'failed') {
        await supabase.from('messages').update(failedPayload).eq('id', existingAssistantMessage.id).eq('user_id', user.id);
      } else {
        await supabase.from('messages').insert({
          user_id: user.id,
          conversation_id: conversationId,
          role: 'assistant',
          ...failedPayload,
          sequence_no: 0,
          idempotency_key: idempotencyKey ? `${idempotencyKey}:assistant` : null,
        });
      }
      await recordApplicationError({
        requestId,
        userId: user.id,
        errorCode: result.errorCode || 'AI_SCHEMA_INVALID',
        route: '/api/chat',
      });
      return NextResponse.json(
        { error: result.errorCode || 'AI_SCHEMA_INVALID', requestId },
        { status: 502, headers: { 'X-Request-Id': requestId } }
      );
    }

    const aiData = result.data;
    const nextStage = resolveNextStage(conversation.current_stage, aiData.nextStage);
    const assistantQuery = existingAssistantMessage?.status === 'failed'
      ? supabase.from('messages').update({ content: aiData.responseText, status: 'complete', error_code: null, prompt_version: conversation.prompt_version, updated_at: new Date().toISOString() }).eq('id', existingAssistantMessage.id).eq('user_id', user.id).select('id').single()
      : supabase.from('messages').insert({
          user_id: user.id,
          conversation_id: conversationId,
          role: 'assistant',
          content: aiData.responseText,
          status: 'complete',
          sequence_no: 0,
          prompt_version: conversation.prompt_version,
          idempotency_key: idempotencyKey ? `${idempotencyKey}:assistant` : null,
        }).select('id').single();
    const { data: assistantMessage, error: assistantError } = await assistantQuery;
    if (assistantError || !assistantMessage) throw assistantError || new Error('ASSISTANT_MESSAGE_SAVE_FAILED');

    let observation: { id: string; dimension: string; contentOriginal: string; status: string } | undefined;
    if (!opening && aiData.observationProposal && aiData.safety.isSafe && aiData.observationProposal.observationType === 'insight_candidate') {
      const { data: observationPayload, error: observationError } = await supabase.rpc('create_pending_observation', {
        p_conversation_id: conversationId,
        p_assistant_message_id: assistantMessage.id,
        p_observation_type: aiData.observationProposal.observationType,
        p_dimension: aiData.observationProposal.dimension,
        p_content_original: aiData.observationProposal.contentOriginal,
        p_confidence: aiData.observationProposal.confidence,
      });
      if (observationError) {
        // Do not expose a completed assistant turn when its agency proposal
        // could not be persisted. Mark it retryable while keeping the user
        // message as the canonical request lineage.
        await supabase
          .from('messages')
          .update({ status: 'failed', error_code: 'OBSERVATION_PERSIST_FAILED', updated_at: new Date().toISOString() })
          .eq('id', assistantMessage.id)
          .eq('user_id', user.id);
        await recordApplicationError({
          requestId,
          userId: user.id,
          errorCode: 'OBSERVATION_PERSIST_FAILED',
          route: '/api/chat',
        });
        return NextResponse.json(
          { error: 'OBSERVATION_PERSIST_FAILED', requestId },
          { status: 503, headers: { 'X-Request-Id': requestId } }
        );
      }
      const row = observationPayload as {
        id?: string;
        dimension?: string;
        content_original?: string;
        status?: string;
      } | null;
      if (row?.id && row.dimension && row.content_original && row.status) {
        observation = {
          id: row.id,
          dimension: row.dimension,
          contentOriginal: row.content_original,
          status: row.status,
        };
      }
    }

    // 1. Auto-persist Experiment Proposal into database
    if (!opening && aiData.experimentProposal && aiData.safety.isSafe) {
      try {
        const today = new Date().toISOString().split('T')[0];
        const targetDays = aiData.experimentProposal.targetDays || 7;
        const targetDate = new Date(Date.now() + targetDays * 86400000).toISOString().split('T')[0];
        const { data: savedExp } = await supabase.from('experiments').insert({
          user_id: user.id,
          title: aiData.experimentProposal.title.slice(0, 240),
          hypothesis: aiData.experimentProposal.hypothesis.slice(0, 2000),
          smallest_step: aiData.experimentProposal.smallestStep.slice(0, 2000),
          success_signal: aiData.experimentProposal.successSignal.slice(0, 2000),
          start_date: today,
          target_date: targetDate,
          progress_percent: 0,
          status: 'active',
        }).select('id').single();

        if (savedExp) {
          await supabase.from('activity_events').insert({
            user_id: user.id,
            event_type: 'experiment_created',
            metadata: { experiment_id: savedExp.id, source: 'ai_chat_auto' },
          });
        }
      } catch (expErr) {
        console.error('Auto-persist experiment error', expErr);
      }
    }

    // 2. Auto-persist Reflection & Learning Proposal into database
    if (!opening && aiData.reflectionProposal && aiData.safety.isSafe) {
      try {
        const { data: latestExp } = await supabase
          .from('experiments')
          .select('id, status')
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        let expId = latestExp?.id;
        if (latestExp) {
          if (latestExp.status !== 'completed') {
            await supabase.from('experiments').update({
              status: 'completed',
              progress_percent: 100,
              updated_at: new Date().toISOString(),
            }).eq('id', expId).eq('user_id', user.id);
          }
        } else {
          const today = new Date().toISOString().split('T')[0];
          const { data: createdExp } = await supabase.from('experiments').insert({
            user_id: user.id,
            title: aiData.reflectionProposal.experimentTitle || 'Thử nghiệm thực tế từ trò chuyện',
            hypothesis: 'Thực hiện hành động nhỏ và quan sát phản hồi thực tế.',
            smallest_step: aiData.reflectionProposal.nextAction || 'Bắt đầu bước nhỏ đầu tiên.',
            success_signal: 'Thu nhận được bài học và cảm nhận rõ ràng hơn.',
            start_date: today,
            target_date: today,
            progress_percent: 100,
            status: 'completed',
          }).select('id').single();
          if (createdExp) expId = createdExp.id;
        }

        if (expId) {
          const { data: savedRef } = await supabase.from('reflections').upsert({
            user_id: user.id,
            experiment_id: expId,
            result: aiData.reflectionProposal.result.slice(0, 4000),
            learning_candidate: aiData.reflectionProposal.learningCandidate.slice(0, 2000),
            feeling: aiData.reflectionProposal.feeling.slice(0, 2000),
            next_action: aiData.reflectionProposal.nextAction.slice(0, 2000),
            rating: aiData.reflectionProposal.rating || 5,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'experiment_id' }).select('id').single();

          if (savedRef) {
            await supabase.from('learning_records').insert({
              user_id: user.id,
              source_reflection_id: savedRef.id,
              content: aiData.reflectionProposal.learningCandidate.slice(0, 2000),
              status: 'confirmed',
            });
            await supabase.from('activity_events').insert({
              user_id: user.id,
              event_type: 'reflection_saved',
              metadata: { experiment_id: expId, reflection_id: savedRef.id, source: 'ai_chat_auto' },
            });
          }
        }
      } catch (refErr) {
        console.error('Auto-persist reflection error', refErr);
      }
    }

    // 3. Auto-persist Resource Proposal into database
    if (!opening && aiData.resourceProposal && aiData.safety.isSafe) {
      try {
        const RESOURCE_TYPES = ['person', 'skill', 'time', 'money', 'community', 'tool', 'other'];
        const rawType = (aiData.resourceProposal.resourceType || 'other').toLowerCase();
        const resourceType = RESOURCE_TYPES.includes(rawType) ? rawType : 'other';
        await supabase.from('resources').insert({
          user_id: user.id,
          dimension: (aiData.resourceProposal.dimension || 'other').slice(0, 64),
          resource_type: resourceType,
          name: aiData.resourceProposal.name.slice(0, 240),
          description: aiData.resourceProposal.description ? aiData.resourceProposal.description.slice(0, 2000) : null,
          confidence: 1,
        });
      } catch (resErr) {
        console.error('Auto-persist resource error', resErr);
      }
    }

    await Promise.all([
      supabase
        .from('conversations')
        .update({ current_stage: nextStage, last_message_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', conversationId)
        .eq('user_id', user.id),
      supabase.from('activity_events').insert({
        user_id: user.id,
        event_type: 'conversation_message_completed',
        metadata: { conversation_id: conversationId, stage: nextStage },
      }),
    ]);

    return streamEvents(
      toMessageEvents({
        conversationId,
        assistantMessageId: assistantMessage.id,
        responseText: aiData.responseText,
        nextStage,
        requiresPermission: aiData.requiresPermission,
        observation,
        experimentProposal: aiData.experimentProposal,
        reflectionProposal: aiData.reflectionProposal,
        resourceProposal: aiData.resourceProposal,
        idempotencyKey: idempotencyKey || null,
      })
    );
  } catch (error) {
    await recordApplicationError({
      requestId,
      errorCode: error instanceof Error && /^[A-Z0-9_]+$/.test(error.message)
        ? error.message
        : 'CHAT_REQUEST_FAILED',
      route: '/api/chat',
    });
    return errorResponse(error, 'CHAT_REQUEST_FAILED', requestId);
  }
}
