import { NextResponse } from 'next/server';
import { GeminiConversationProvider } from '@/server/ai/provider';
import { requireUser } from '@/server/auth/current-user';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const session = await requireUser();
    const userId = session.id;

    const body = await request.json();
    const { conversationId, content, idempotencyKey } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    const supabase = createClient();
    let actualConvId = conversationId;

    if (!actualConvId) {
      // Create new conversation
      const { data: conv, error: convErr } = await supabase
        .from('conversations')
        .insert({ user_id: userId, title: 'Cuộc trò chuyện mới' })
        .select('id')
        .single();
      if (convErr || !conv) throw convErr;
      actualConvId = conv.id;
    } else {
      // Verify ownership
      const { data: conv, error: convErr } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', actualConvId)
        .eq('user_id', userId)
        .single();
      if (convErr || !conv) {
        return NextResponse.json({ error: 'Conversation not found or forbidden' }, { status: 403 });
      }
    }

    // Load recent messages
    const { data: prevMessages } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', actualConvId)
      .eq('user_id', userId)
      .order('sequence_no', { ascending: true })
      .limit(10);

    const recentMessages =
      prevMessages?.map((message: { role: string; content: string }) => ({
        role: message.role,
        content: message.content,
      })) || [];
    recentMessages.push({ role: 'user', content });

    // Determine sequence_no
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', actualConvId);
    const seqNo = (count || 0) + 1;

    // Insert user message
    const { data: userMsg, error: userMsgErr } = await supabase
      .from('messages')
      .insert({
        user_id: userId,
        conversation_id: actualConvId,
        role: 'user',
        content,
        sequence_no: seqNo,
        idempotency_key: idempotencyKey,
      })
      .select('id')
      .single();

    if (userMsgErr) {
      // Idempotency check: if duplicate, just return success early or ignore
      if (userMsgErr.code === '23505') {
        // Unique constraint violation on idempotency_key or sequence_no
        return NextResponse.json({ success: true, duplicate: true });
      }
      throw userMsgErr;
    }

    // Call Provider
    const provider = new GeminiConversationProvider();
    const parseResult = await provider.generateResponse(
      {
        userId: userId,
        conversationId: actualConvId,
        recentMessages: recentMessages,
        confirmedInsights: [], // In full version, fetch from confirmed_insights
        userAnswersSummary: '', // In full version, fetch from user_answers
      },
      content,
      [] // Eligible questions
    );

    if (!parseResult.success || !parseResult.data) {
      // Mark user message as failed (or just leave it)
      return NextResponse.json(
        {
          error_code: parseResult.errorCode || 'AI_SCHEMA_INVALID',
          message: parseResult.errorMessage || 'Invalid AI output schema',
        },
        { status: 502 }
      );
    }

    const aiData = parseResult.data;

    // Insert assistant message
    const { data: asstMsg, error: asstMsgErr } = await supabase
      .from('messages')
      .insert({
        user_id: userId,
        conversation_id: actualConvId,
        role: 'assistant',
        content: aiData.responseText,
        sequence_no: seqNo + 1,
      })
      .select('id')
      .single();

    if (asstMsgErr) throw asstMsgErr;

    // Insert pending observation if exists
    let observationId: string | undefined;
    if (aiData.observationProposal) {
      const { data: obs, error: obsErr } = await supabase
        .from('ai_observations')
        .insert({
          user_id: userId,
          conversation_id: actualConvId,
          assistant_message_id: asstMsg.id,
          observation_type: 'insight_candidate',
          dimension: aiData.observationProposal.dimension,
          content_original: aiData.observationProposal.contentOriginal,
          status: 'pending',
          confidence: 0.85
        })
        .select('id')
        .single();
      
      if (!obsErr && obs) {
        observationId = obs.id;
      }
    }

    // Return Server-Sent Events (SSE) Stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Event 1: message.started
        controller.enqueue(encoder.encode(`event: message.started\ndata: ${JSON.stringify({ conversationId: actualConvId, idempotencyKey })}\n\n`));

        // Event 2: message.delta (Simulate text streaming chunks)
        const textParts = aiData.responseText.match(/.{1,15}/g) || [aiData.responseText];
        for (const chunk of textParts) {
          controller.enqueue(encoder.encode(`event: message.delta\ndata: ${JSON.stringify({ text: chunk })}\n\n`));
          await new Promise((resolve) => setTimeout(resolve, 50));
        }

        // Event 3: observation.created (if proposed)
        if (aiData.observationProposal && observationId) {
          controller.enqueue(
            encoder.encode(
              `event: observation.created\ndata: ${JSON.stringify({
                id: observationId,
                dimension: aiData.observationProposal.dimension,
                dimensionLabel: aiData.observationProposal.dimension.toUpperCase(),
                contentOriginal: aiData.observationProposal.contentOriginal,
                status: 'pending',
              })}\n\n`
            )
          );
        }

        // Event 4: message.completed
        controller.enqueue(
          encoder.encode(
            `event: message.completed\ndata: ${JSON.stringify({
              nextStage: aiData.nextStage,
              requiresPermission: aiData.requiresPermission,
            })}\n\n`
          )
        );

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
