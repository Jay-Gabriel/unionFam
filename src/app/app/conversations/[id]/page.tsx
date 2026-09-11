'use client';

import React, { useCallback, useEffect, useRef, useState, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  BookOpen,
  CheckCircle2,
  Compass,
  Edit3,
  ExternalLink,
  FlaskConical,
  GraduationCap,
  Leaf,
  Loader2,
  Paperclip,
  PhoneCall,
  Send,
  ShieldCheck,
  Sparkles,
  Sprout,
  UserRound,
  Wallet,
  XCircle,
} from 'lucide-react';
import { LeafLoader } from '@/components/calm/leaf-loader';
import { SanctuaryAudioPlayer } from '@/components/calm/sanctuary-audio-player';
import {
  LiveVoiceSanctuaryModal,
  IncomingVoiceCallBadge,
  VoiceCallOfferCard,
} from '@/components/calm/live-voice-sanctuary';
import { labelDimension } from '@/lib/i18n';

const DISTRESS_KEYWORDS = [
  'suy sụp',
  'kiệt sức',
  'áp lực',
  'quá tải',
  'bế tắc',
  'khóc',
  'mệt quá',
  'mệt mỏi',
  'muốn buông xuôi',
  'gục ngã',
  'không chịu nổi',
  'bất lực',
  'lo lắng tột cùng',
  'trầm cảm',
  'hoảng loạn',
  'stress nặng',
  'cô đơn quá',
  'tuyệt vọng',
  'mệt quá rồi',
  'nản quá',
  'đuối sức',
];

const CALL_ACCEPT_KEYWORDS = [
  'đồng ý',
  'gọi đi',
  'ừ gọi',
  'gọi luôn',
  'muốn gọi',
  'gọi cho mình',
  'gọi nhé',
  'gọi nha',
  'ok gọi',
  'oke gọi',
  'được gọi đi',
  'ừ',
  'uầy gọi đi',
  'gọi thôi',
  'bắt máy',
  'kết nối đi',
  'nhấc máy',
  'gọi liền',
];

interface Observation {
  id: string;
  dimension: string;
  dimensionLabel: string;
  contentOriginal: string;
  status: 'pending' | 'accepted' | 'rejected';
  contentEdited?: string;
}

interface ExperimentProposal {
  id?: string;
  title: string;
  hypothesis: string;
  smallestStep: string;
  successSignal: string;
  targetDays: number;
  dimension?: string;
  dimensionLabel?: string;
  status: 'pending' | 'accepted' | 'rejected';
}

interface ReflectionProposal {
  id?: string;
  result: string;
  learningCandidate: string;
  feeling: string;
  nextAction: string;
  rating: number;
  experimentTitle?: string;
  status: 'pending' | 'accepted' | 'rejected';
}

interface ResourceProposal {
  id?: string;
  dimension: string;
  dimensionLabel?: string;
  resourceType: string;
  name: string;
  description?: string;
  status: 'pending' | 'accepted' | 'rejected';
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  observation?: Observation;
  experimentProposal?: ExperimentProposal;
  reflectionProposal?: ReflectionProposal;
  resourceProposal?: ResourceProposal;
  hasVoiceOffer?: boolean;
}

const DEFAULT_OPENING_MESSAGE =
  'Chào bạn. Mình ở đây để lắng nghe cùng bạn. Nếu có thể miêu tả cuộc sống mà bạn thực sự mong muốn trong 1–2 câu, bạn sẽ nói điều gì?';

function mapConversationMessages(data: Record<string, unknown>): Message[] {
  const observationsByMessage = new Map<string, Observation>();
  const observations = Array.isArray(data.observations) ? data.observations : [];
  observations.forEach((value) => {
    if (!value || typeof value !== 'object') return;
    const observation = value as Record<string, unknown>;
    observationsByMessage.set(String(observation.assistant_message_id), {
      id: String(observation.id),
      dimension: String(observation.dimension),
      dimensionLabel: labelDimension(String(observation.dimension)),
      contentOriginal: String(observation.content_original),
      contentEdited: typeof observation.content_user_edited === 'string' ? observation.content_user_edited : undefined,
      status: observation.status as Observation['status'],
    });
  });

  const messages = Array.isArray(data.messages) ? data.messages : [];
  return messages
    .filter((value): value is Record<string, unknown> => Boolean(value && typeof value === 'object'))
    .filter((message) => message.role !== 'system_tool')
    .map((message) => {
      const rawContent = String(message.content || '');
      const content = rawContent.trim() ? rawContent : (message.role === 'assistant' ? DEFAULT_OPENING_MESSAGE : '');
      return {
        id: String(message.id),
        role: message.role as Message['role'],
        content,
        timestamp: new Date(String(message.created_at)).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        observation: observationsByMessage.get(String(message.id)),
        hasVoiceOffer: Boolean(message.hasVoiceOffer),
      };
    });
}

const DEMO_STORAGE_PREFIX = 'lifelab:demo:conversation:';

function readDemoMessages(id: string): Message[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(`${DEMO_STORAGE_PREFIX}${id}`);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((value): value is Record<string, unknown> => Boolean(value && typeof value === 'object'))
      .filter((message) => (message.role === 'user' || message.role === 'assistant') && typeof message.content === 'string')
      .slice(-100)
      .map((message) => {
        const rawContent = String(message.content || '').slice(0, 6000);
        const content = rawContent.trim() ? rawContent : (message.role === 'assistant' ? DEFAULT_OPENING_MESSAGE : '');
        return {
          id: String(message.id || `${message.role}-${crypto.randomUUID()}`),
          role: message.role as Message['role'],
          content,
          timestamp: typeof message.timestamp === 'string' ? message.timestamp : new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          observation: message.observation as Observation | undefined,
          experimentProposal: message.experimentProposal as ExperimentProposal | undefined,
          reflectionProposal: message.reflectionProposal as ReflectionProposal | undefined,
          resourceProposal: message.resourceProposal as ResourceProposal | undefined,
          hasVoiceOffer: Boolean(message.hasVoiceOffer),
        };
      });
  } catch {
    return [];
  }
}

function writeDemoMessages(id: string, messages: Message[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(`${DEMO_STORAGE_PREFIX}${id}`, JSON.stringify(messages.slice(-100)));
  } catch {
    // Storage can be unavailable in private browsing or when quota is full.
  }
}

interface StreamSummary {
  responseText: string;
  assistantMessageId: string;
  nextStage: string;
  requiresPermission: boolean;
  observation?: Observation;
  experimentProposal?: ExperimentProposal;
  reflectionProposal?: ReflectionProposal;
  resourceProposal?: ResourceProposal;
}

async function consumeMessageStream(
  response: Response,
  onDelta?: (text: string) => void
): Promise<StreamSummary> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Kết nối không trả về dữ liệu.');

  const decoder = new TextDecoder();
  let eventBuffer = '';
  let responseText = '';
  let assistantMessageId = '';
  let nextStage = 'discovery';
  let requiresPermission = false;
  let observation: Observation | undefined;
  let experimentProposal: ExperimentProposal | undefined;
  let reflectionProposal: ReflectionProposal | undefined;
  let resourceProposal: ResourceProposal | undefined;

  const processEvent = (eventBlock: string) => {
    let eventType = '';
    let dataString = '';
    for (const line of eventBlock.split(/\r?\n/)) {
      if (line.startsWith('event: ')) eventType = line.slice(7).trim();
      if (line.startsWith('data: ')) dataString += line.slice(6).trim();
    }
    if (!dataString) return;

    try {
      const data = JSON.parse(dataString) as Record<string, unknown>;
      if (eventType === 'message.started' && typeof data.assistantMessageId === 'string') {
        assistantMessageId = data.assistantMessageId;
      }
      if (eventType === 'message.delta' && typeof data.text === 'string') {
        responseText += data.text;
        onDelta?.(responseText);
      }
      if (eventType === 'message.completed') {
        if (typeof data.nextStage === 'string') nextStage = data.nextStage;
        requiresPermission = data.requiresPermission === true;
      }
      if (eventType === 'observation.created' && typeof data.dimension === 'string' && typeof data.contentOriginal === 'string') {
        observation = {
          id: String(data.id || crypto.randomUUID()),
          dimension: data.dimension,
          dimensionLabel: typeof data.dimensionLabel === 'string' ? data.dimensionLabel : labelDimension(data.dimension),
          contentOriginal: data.contentOriginal,
          status: 'accepted',
        };
      }
      if (eventType === 'experiment.created' && typeof data.title === 'string' && typeof data.hypothesis === 'string') {
        experimentProposal = {
          title: data.title,
          hypothesis: data.hypothesis,
          smallestStep: String(data.smallestStep || ''),
          successSignal: String(data.successSignal || ''),
          targetDays: typeof data.targetDays === 'number' ? data.targetDays : 7,
          dimension: typeof data.dimension === 'string' ? data.dimension : undefined,
          dimensionLabel: typeof data.dimensionLabel === 'string' ? data.dimensionLabel : (data.dimension ? labelDimension(String(data.dimension)) : undefined),
          status: 'accepted',
        };
      }
      if (eventType === 'reflection.created' && typeof data.result === 'string' && typeof data.learningCandidate === 'string') {
        reflectionProposal = {
          result: data.result,
          learningCandidate: data.learningCandidate,
          feeling: String(data.feeling || ''),
          nextAction: String(data.nextAction || ''),
          rating: typeof data.rating === 'number' ? data.rating : 5,
          experimentTitle: typeof data.experimentTitle === 'string' ? data.experimentTitle : undefined,
          status: 'accepted',
        };
      }
      if (eventType === 'resource.created' && typeof data.name === 'string') {
        resourceProposal = {
          name: data.name,
          resourceType: typeof data.resourceType === 'string' ? data.resourceType : 'other',
          dimension: typeof data.dimension === 'string' ? data.dimension : 'other',
          dimensionLabel: typeof data.dimensionLabel === 'string' ? data.dimensionLabel : (data.dimension ? labelDimension(String(data.dimension)) : undefined),
          description: typeof data.description === 'string' ? data.description : undefined,
          status: 'accepted',
        };
      }
    } catch {
      // Ignore malformed individual events while preserving the rest of the turn.
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    eventBuffer += decoder.decode(value, { stream: true });
    const events = eventBuffer.split(/\r?\n\r?\n/);
    eventBuffer = events.pop() || '';
    events.forEach(processEvent);
  }
  eventBuffer += decoder.decode();
  if (eventBuffer.trim()) processEvent(eventBuffer);

  return {
    responseText,
    assistantMessageId: assistantMessageId || `ai-${Date.now()}`,
    nextStage,
    requiresPermission,
    observation,
    experimentProposal,
    reflectionProposal,
    resourceProposal,
  };
}

async function requestOpeningTurn(id: string, onDelta?: (text: string) => void): Promise<StreamSummary> {
  const idempotencyKey = `opening:${id}`;
  let lastError: Error | null = null;

  // Provider/Supabase cold starts can occasionally return a transient 5xx on
  // the first request for a brand-new session. Reuse the same idempotency key
  // so the server updates/replays the canonical assistant row instead of
  // creating a duplicate opening message.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    // Transport failures (including a dropped connection) are retryable; an
    // HTTP validation/auth response below can explicitly turn this off.
    let retryableFailure = true;
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: id,
          opening: true,
          idempotencyKey,
        }),
      });

      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        const error = new Error(
          typeof json.error === 'string' ? `Chưa thể mở lời chào (${json.error}).` : 'Chưa thể mở lời chào của Life Lab.'
        );
        lastError = error;
        // Retry only transient provider/server failures. Validation/auth
        // errors need to be shown immediately instead of being repeated.
        retryableFailure = response.status >= 500 || response.status === 429;
        if (!retryableFailure) throw error;
      } else {
        return await consumeMessageStream(response, onDelta);
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Không thể kết nối với Life Lab.');
      if (!retryableFailure || attempt === 1) throw lastError;
    }

    if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 350));
  }

  // Graceful fallback: return the canonical opening message
  return {
    responseText: DEFAULT_OPENING_MESSAGE,
    assistantMessageId: `ai-${Date.now()}`,
    nextStage: 'discovery',
    requiresPermission: false,
  };
}

function ConversationPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const routeConversationId = (params?.id as string) || 'new';
  const [conversationId, setConversationId] = useState(routeConversationId);

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingConversation, setIsLoadingConversation] = useState(true);
  const [conversationError, setConversationError] = useState('');
  const [isDemoConversation, setIsDemoConversation] = useState(false);

  const [inputContent, setInputContent] = useState('');
  const [editingObsId, setEditingObsId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendError, setSendError] = useState('');
  const [retryContent, setRetryContent] = useState('');
  const [showIncomingCallBadge, setShowIncomingCallBadge] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [voiceInitialConnected, setVoiceInitialConnected] = useState(false);
  const [hasDismissedCall, setHasDismissedCall] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesScrollRef = useRef<HTMLElement>(null);
  const openingStartedRef = useRef<string | null>(null);
  const openingPromiseRef = useRef<{ id: string; promise: Promise<StreamSummary> } | null>(null);
  const newConversationPromiseRef = useRef<Promise<{
    id: string;
    data: Record<string, unknown>;
    demoMode: boolean;
  }> | null>(null);

  // Read preloaded prompt or call param from Mini-game or deep-links
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const promptQuery = searchParams.get('prompt');
    const storedPrompt = window.sessionStorage.getItem('lifelab_preloaded_prompt');
    const targetPrompt = promptQuery || storedPrompt;
    if (targetPrompt && targetPrompt.trim()) {
      setInputContent(targetPrompt);
    }
    const callQuery = searchParams.get('call');
    if (callQuery === 'true') {
      setVoiceInitialConnected(true);
      setIsVoiceModalOpen(true);
    }
  }, [searchParams]);
  const scrollToBottom = useCallback((smooth = false) => {
    if (typeof window === 'undefined') return;
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    const container = messagesScrollRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
      return;
    }
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
      block: 'end',
    });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const viewport = window.visualViewport;

    const handleViewportChange = () => {
      scrollToBottom(false);
      const t1 = setTimeout(() => scrollToBottom(false), 80);
      const t2 = setTimeout(() => scrollToBottom(false), 250);
      const t3 = setTimeout(() => scrollToBottom(false), 450);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    };

    viewport?.addEventListener('resize', handleViewportChange);
    viewport?.addEventListener('scroll', handleViewportChange);
    window.addEventListener('resize', handleViewportChange);

    return () => {
      viewport?.removeEventListener('resize', handleViewportChange);
      viewport?.removeEventListener('scroll', handleViewportChange);
      window.removeEventListener('resize', handleViewportChange);
    };
  }, [scrollToBottom]);

  useEffect(() => {
    if (isLoadingConversation) return;

    // Keep the latest turn and any auto-extracted cards visible on mobile/desktop
    const frame = window.requestAnimationFrame(() => {
      scrollToBottom(!isStreaming);
    });

    const timer1 = setTimeout(() => scrollToBottom(false), 50);
    const timer2 = setTimeout(() => scrollToBottom(false), 180);
    const timer3 = setTimeout(() => scrollToBottom(false), 400);

    return () => {
      window.cancelAnimationFrame(frame);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isLoadingConversation, isStreaming, messages, scrollToBottom]);

  useEffect(() => {
    let cancelled = false;

    async function loadConversation() {
      let redirectingToConversationIndex = false;
      setIsLoadingConversation(true);
      setIsStreaming(false);
      setConversationError('');
      try {
        // React Strict Mode can run this effect twice in development. Share
        // the creation request so `/new` never leaves duplicate conversations
        // behind before the router replacement settles.
        if (routeConversationId !== 'new') newConversationPromiseRef.current = null;
        let activeId = routeConversationId;
        let createdNewConversation = false;
        let createdConversationData: Record<string, unknown> | null = null;
        if (activeId === 'new') {
          if (!newConversationPromiseRef.current) {
            newConversationPromiseRef.current = (async () => {
              const createResponse = await fetch('/api/conversations', { method: 'POST' });
              if (!createResponse.ok) throw new Error('Không thể tạo cuộc trò chuyện');
              const created = await createResponse.json();
              if (typeof created?.data?.id !== 'string') throw new Error('Phản hồi tạo cuộc trò chuyện không hợp lệ');
              return {
                id: created.data.id as string,
                data: created.data as Record<string, unknown>,
                demoMode: created.demoMode === true,
              };
            })();
          }
          const created = await newConversationPromiseRef.current;
          activeId = created.id;
          createdConversationData = {
            conversation: created.data,
            messages: [],
            observations: [],
            demoMode: created.demoMode,
          };
          createdNewConversation = true;
          if (!cancelled) {
            setConversationId(activeId);
            const searchString = typeof window !== 'undefined' ? window.location.search : '';
            router.replace(`/app/conversations/${activeId}${searchString}`);
          }
        }

        const loadData = async (): Promise<Record<string, unknown>> => {
          const response = await fetch(`/api/conversations/${activeId}`);
          if (!response.ok) {
            if (response.status === 404) throw new Error('CONVERSATION_NOT_FOUND');
            throw new Error(response.status === 401 ? 'Phiên đăng nhập đã hết hạn' : 'Không thể tải cuộc trò chuyện');
          }
          const json = await response.json();
          const data = (json.data && typeof json.data === 'object' ? json.data : {}) as Record<string, unknown>;
          return {
            ...data,
            demoMode: json.demoMode === true,
          };
        };

        // The create endpoint already returned the canonical conversation row.
        // Reusing it avoids an extra authenticated GET before the opening turn
        // for every new session; existing routes still perform the authoritative
        // read above.
        let data = createdConversationData || await loadData();
        const demoMode = data.demoMode === true;
        const demoMessages = demoMode ? readDemoMessages(activeId) : [];
        const loadedMessages = demoMode
          ? demoMessages
          : (Array.isArray(data.messages) ? data.messages : []);
        const shouldOpen = createdNewConversation || loadedMessages.length === 0;

        // Paint the conversation shell as soon as its persisted data arrives.
        // A new session can then show a live opening placeholder while Gemini
        // is still warming up instead of keeping the whole page behind a
        // loading card for several seconds.
        if (!cancelled) {
          setConversationId(activeId);
          setIsDemoConversation(demoMode);
          setMessages(demoMode ? demoMessages : mapConversationMessages(data));
          setIsLoadingConversation(false);
        }

        let openingResult: StreamSummary | null = null;
        if (shouldOpen) {
          const openingPlaceholderId = `opening-${activeId}`;
          if (!cancelled) {
            setIsStreaming(true);
            setMessages((previous) => previous.some((message) => message.id === openingPlaceholderId)
              ? previous
              : [
                  ...previous,
                  {
                    id: openingPlaceholderId,
                    role: 'assistant' as const,
                    content: DEFAULT_OPENING_MESSAGE,
                    timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
                  },
                ]);
          }
          if (openingStartedRef.current !== activeId) {
            openingStartedRef.current = activeId;
            const openingPromise = requestOpeningTurn(activeId, (text) => {
              if (cancelled) return;
              setMessages((previous) => previous.map((message) =>
                message.id === openingPlaceholderId ? { ...message, content: text } : message
              ));
            });
            openingPromiseRef.current = { id: activeId, promise: openingPromise };
            openingResult = await openingPromise;
          } else if (openingPromiseRef.current?.id === activeId) {
            // A route.replace can re-run this effect while the first opening
            // request is still streaming. Wait for that same request instead
            // of briefly rendering an empty conversation.
            openingResult = await openingPromiseRef.current.promise;
          }
          // The opening stream is already the canonical assistant response.
          // Do not immediately issue a second GET just to read the row we
          // have received over SSE; this removes an avoidable network/DB wait
          // on every brand-new conversation. If another effect is waiting on
          // a promise that disappeared, fall back to one authoritative read.
          if (!demoMode && !openingResult) data = await loadData();
          if (!cancelled) setIsStreaming(false);
        }
        if (cancelled) return;

        setConversationId(activeId);
        setIsDemoConversation(demoMode);
        if (demoMode) {
          const nextMessages = openingResult
            ? [
                ...demoMessages,
                {
                  id: openingResult.assistantMessageId,
                  role: 'assistant' as const,
                  content: openingResult.responseText,
                  timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
                },
              ]
            : demoMessages;
          setMessages(nextMessages);
          writeDemoMessages(activeId, nextMessages);
        } else {
          const nextMessages = mapConversationMessages(data);
          if (openingResult && !nextMessages.some((message) => message.id === openingResult?.assistantMessageId)) {
            nextMessages.push({
              id: openingResult.assistantMessageId,
              role: 'assistant',
              content: openingResult.responseText,
              timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
              observation: openingResult.observation,
            });
          }
          setMessages(nextMessages);
        }
      } catch (error) {
        if (!cancelled && error instanceof Error && error.message === 'CONVERSATION_NOT_FOUND' && routeConversationId !== 'new') {
          // A bookmarked/deleted session should never strand the user on a
          // dead conversation URL. The index route resolves the latest live
          // session, or starts a new one when none exists.
          redirectingToConversationIndex = true;
          router.replace('/app/conversations');
          return;
        }
        if (!cancelled) setConversationError(error instanceof Error ? error.message : 'Không thể tải cuộc trò chuyện');
      } finally {
        if (!cancelled && !redirectingToConversationIndex) setIsLoadingConversation(false);
      }
    }

    loadConversation();
    return () => {
      cancelled = true;
    };
  }, [routeConversationId, router]);

  useEffect(() => {
    if (!isDemoConversation || isLoadingConversation || conversationId === 'new') return;
    writeDemoMessages(conversationId, messages);
  }, [conversationId, isDemoConversation, isLoadingConversation, messages]);

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!inputContent.trim() || isStreaming) return;

    const userText = inputContent.trim();
    const lowerUserText = userText.toLowerCase();

    // Check if user is agreeing to a voice call offer or requesting a call
    const hasRecentVoiceOffer = messages.some((m) => m.role === 'assistant' && m.hasVoiceOffer);
    const isAffirmative = CALL_ACCEPT_KEYWORDS.some((kw) => lowerUserText.includes(kw));
    const isExplicitCallRequest =
      lowerUserText.includes('gọi điện') ||
      lowerUserText.includes('gọi thoại') ||
      lowerUserText.includes('muốn gọi') ||
      lowerUserText.includes('gọi luôn');

    if ((hasRecentVoiceOffer && isAffirmative) || isExplicitCallRequest) {
      setVoiceInitialConnected(true);
      setIsVoiceModalOpen(true);
    }

    // Check if user expresses emotional distress / breakdown / exhaustion
    const isDistressed = DISTRESS_KEYWORDS.some((kw) => lowerUserText.includes(kw));

    setSendError('');
    setRetryContent('');
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((previous) => [...previous, userMsg]);
    setInputContent('');
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('lifelab_preloaded_prompt');
    }
    setIsStreaming(true);

    const assistantMsgId = `ai-${Date.now()}`;
    setMessages((previous) => [
      ...previous,
      {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        hasVoiceOffer: isDistressed,
      },
    ]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          content: userText,
          recentMessages: [...messages, userMsg]
            .filter((message) => message.content.trim().length > 0)
            .slice(-8)
            .map((message) => ({ role: message.role, content: message.content })),
          idempotencyKey: `msg-${crypto.randomUUID()}`,
        }),
      });

      if (!response.ok) {
        setMessages((previous) => previous.filter((message) => message.id !== assistantMsgId));
        const json = await response.json().catch(() => ({}));
        setSendError(typeof json.error === 'string' ? `Chưa thể nhận phản hồi (${json.error}).` : 'Chưa thể nhận phản hồi từ Life Lab.');
        setRetryContent(userText);
        return;
      }

      const stream = await consumeMessageStream(response, (text) => {
        setMessages((previous) =>
          previous.map((message) =>
            message.id === assistantMsgId
              ? { ...message, content: text }
              : message
          )
        );
      });
      if (stream.observation || stream.experimentProposal || stream.reflectionProposal || stream.resourceProposal) {
        setMessages((previous) =>
          previous.map((message) =>
            message.id === assistantMsgId
              ? {
                  ...message,
                  observation: stream.observation || message.observation,
                  experimentProposal: stream.experimentProposal || message.experimentProposal,
                  reflectionProposal: stream.reflectionProposal || message.reflectionProposal,
                  resourceProposal: stream.resourceProposal || message.resourceProposal,
                }
              : message
          )
        );
      }
    } catch (error) {
      console.error('Chat error', error);
      setSendError('Kết nối vừa bị gián đoạn. Nội dung của bạn vẫn còn để thử lại.');
      setRetryContent(userText);
      setMessages((previous) =>
        previous.map((message) =>
          message.id === assistantMsgId && !message.content
            ? { ...message, content: 'Kết nối vừa bị gián đoạn. Bạn vui lòng thử lại nhé.' }
            : message
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const handleDecision = async (
    messageId: string,
    observationId: string,
    decision: 'accepted' | 'rejected',
    editedContent?: string
  ) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/observations/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          observationId,
          decision,
          editedContent,
          idempotencyKey: `dec-${observationId}-${crypto.randomUUID()}`,
        }),
      });

      if (response.ok) {
        setMessages((previous) =>
          previous.map((message) => {
            if (message.id !== messageId || !message.observation) return message;
            return {
              ...message,
              observation: {
                ...message.observation,
                status: decision,
                contentEdited: editedContent,
              },
            };
          })
        );
      }
    } catch (error) {
      console.error('Failed decision', error);
    } finally {
      setEditingObsId(null);
      setIsSubmitting(false);
    }
  };

  const handleExperimentDecision = async (
    messageId: string,
    decision: 'accepted' | 'rejected',
    proposal: ExperimentProposal
  ) => {
    setIsSubmitting(true);
    try {
      if (decision === 'accepted' && !isDemoConversation) {
        await fetch('/api/experiments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: proposal.title,
            hypothesis: proposal.hypothesis,
            smallestStep: proposal.smallestStep,
            successSignal: proposal.successSignal,
            targetDays: proposal.targetDays || 7,
            status: 'active',
          }),
        });
      }
      setMessages((previous) =>
        previous.map((message) => {
          if (message.id !== messageId || !message.experimentProposal) return message;
          return {
            ...message,
            experimentProposal: {
              ...message.experimentProposal,
              status: decision,
            },
          };
        })
      );
    } catch (error) {
      console.error('Failed experiment decision', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReflectionDecision = async (
    messageId: string,
    decision: 'accepted' | 'rejected',
    proposal: ReflectionProposal
  ) => {
    setIsSubmitting(true);
    try {
      if (decision === 'accepted' && !isDemoConversation) {
        await fetch('/api/reflections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            result: proposal.result,
            learningCandidate: proposal.learningCandidate,
            feeling: proposal.feeling,
            nextAction: proposal.nextAction,
            rating: proposal.rating || 5,
            experimentTitle: proposal.experimentTitle,
          }),
        });
      }
      setMessages((previous) =>
        previous.map((message) => {
          if (message.id !== messageId || !message.reflectionProposal) return message;
          return {
            ...message,
            reflectionProposal: {
              ...message.reflectionProposal,
              status: decision,
            },
          };
        })
      );
    } catch (error) {
      console.error('Failed reflection decision', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResourceDecision = async (
    messageId: string,
    decision: 'accepted' | 'rejected',
    proposal: ResourceProposal
  ) => {
    setIsSubmitting(true);
    try {
      if (decision === 'accepted' && !isDemoConversation) {
        await fetch('/api/resources', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: proposal.name,
            resourceType: proposal.resourceType || 'other',
            dimension: proposal.dimension || 'other',
            description: proposal.description,
          }),
        });
      }
      setMessages((previous) =>
        previous.map((message) => {
          if (message.id !== messageId || !message.resourceProposal) return message;
          return {
            ...message,
            resourceProposal: {
              ...message.resourceProposal,
              status: decision,
            },
          };
        })
      );
    } catch (error) {
      console.error('Failed resource decision', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingConversation) {
    return (
      <div className="grid h-full min-h-[380px] flex-1 place-items-center rounded-[32px] border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent backdrop-blur-md text-calm-fog shadow-glass">
        <LeafLoader variant="bloom" size="md" label="Đang mở khoảng lặng của bạn…" />
      </div>
    );
  }

  if (conversationError) {
    return (
      <div className="mx-auto grid h-full min-h-[360px] max-w-2xl flex-1 place-items-center rounded-[34px] border border-calm-danger-clay/30 bg-calm-deep-moss/35 p-8 text-center text-calm-paper-white">
        <div className="space-y-4">
          <p className="text-sm text-[#e7bbb5]">{conversationError}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-calm-warm-ivory transition hover:bg-white/15"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-5xl flex-1 flex-col min-h-0 text-calm-paper-white">
      {/* Chat Room Top Bar */}
      <section className="shrink-0 flex flex-col gap-2 rounded-[20px] sm:rounded-[28px] border border-white/10 bg-gradient-to-r from-calm-moss/80 via-calm-deep-moss/85 to-calm-moss/80 backdrop-blur-xl px-3.5 py-2.5 sm:px-6 sm:py-3.5 shadow-[0_12px_36px_rgba(0,0,0,0.18)] sm:flex-row sm:items-center sm:justify-between mb-2 sm:mb-3">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="relative grid h-9 w-9 sm:h-11 sm:w-11 shrink-0 place-items-center rounded-2xl border border-calm-lichen/30 bg-calm-lichen/15 text-calm-warm-ivory shadow-[0_4px_16px_rgba(185,198,165,0.2)]">
            <Sprout size={18} className="text-calm-lichen animate-leaf-wave-1" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h2 className="truncate text-sm font-semibold tracking-[-0.02em] text-calm-paper-white sm:text-[17px]">
                Trò chuyện cùng Life Lab
              </h2>
              <span className="hidden xs:inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[8.5px] sm:text-[9px] font-medium text-emerald-300 shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                Đang lắng nghe
              </span>
            </div>
            <p className="truncate text-[10px] font-mono text-calm-fog/60">Phiên: {conversationId}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setVoiceInitialConnected(true);
              setIsVoiceModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-calm-pollen/40 bg-gradient-to-r from-calm-pollen/20 to-calm-lichen/20 px-2.5 py-1 sm:px-3 sm:py-1 text-[10.5px] sm:text-[11px] font-bold text-calm-pollen shadow-[0_0_12px_rgba(238,213,150,0.2)] hover:border-calm-pollen hover:scale-105 active:scale-95 transition"
            title="Gọi thoại trực tiếp cùng Life Lab"
          >
            <PhoneCall size={12} className="text-calm-pollen animate-pulse" />
            <span>Gọi thoại 1:1</span>
          </button>
          <SanctuaryAudioPlayer />
          {isDemoConversation && (
            <div className="rounded-full border border-calm-pollen/30 bg-calm-pollen/15 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[8.5px] sm:text-[9px] font-semibold uppercase tracking-[0.1em] text-calm-pollen shadow-sm">
              Bản thử
            </div>
          )}
          <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] backdrop-blur-sm px-3 py-1 text-[10.5px] font-medium text-calm-lichen shadow-sm">
            <ShieldCheck size={13} className="text-calm-lichen" />
            Bạn giữ quyền quyết định
          </div>
        </div>
      </section>

      {/* Messages Scroll Sanctuary */}
      <section
        ref={messagesScrollRef}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain rounded-[24px] sm:rounded-[36px] border border-white/10 bg-gradient-to-b from-[#212c23]/60 via-[#1c261e]/40 to-[#18211a]/70 backdrop-blur-xl px-3 py-3.5 sm:px-6 sm:py-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]"
        aria-label="Nội dung cuộc trò chuyện"
      >
        {showIncomingCallBadge && (
          <IncomingVoiceCallBadge
            onAnswer={() => {
              setShowIncomingCallBadge(false);
              setVoiceInitialConnected(true);
              setIsVoiceModalOpen(true);
            }}
            onDismiss={() => {
              setShowIncomingCallBadge(false);
              setHasDismissedCall(true);
            }}
          />
        )}
        <div className="space-y-4 sm:space-y-6" aria-live="polite">
          {messages.map((message) => (
            <div key={message.id} className="space-y-2.5 sm:space-y-3">
              {message.role === 'user' ? (
                <div className="ml-auto flex max-w-[92%] sm:max-w-[78%] items-start justify-end gap-2 sm:gap-3">
                  <div className="space-y-1 text-right min-w-0">
                    <div className="break-words rounded-[20px] rounded-tr-[4px] sm:rounded-[24px] sm:rounded-tr-[6px] border border-calm-lichen/35 bg-gradient-to-br from-[#3b4c3e] to-[#2d3b30] px-3.5 py-2.5 text-left text-xs leading-relaxed text-calm-paper-white shadow-[0_10px_28px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.12)] sm:px-5 sm:py-3.5 sm:text-[15px]">
                      {message.content}
                    </div>
                    <span className="block px-2 text-[10px] sm:text-[10.5px] font-semibold text-calm-warm-ivory/85">{message.timestamp}</span>
                  </div>
                  <div className="grid h-7 w-7 sm:h-9 sm:w-9 shrink-0 place-items-center rounded-full border border-white/20 bg-white/15 text-white shadow-sm mt-0.5">
                    <UserRound size={13} className="sm:hidden" />
                    <UserRound size={15} className="hidden sm:block" />
                  </div>
                </div>
              ) : (
                <div className="flex max-w-[96%] sm:max-w-[85%] items-start gap-2 sm:gap-3.5">
                  <div className="mt-0.5 grid h-7 w-7 sm:h-9 sm:w-9 shrink-0 place-items-center rounded-2xl border border-calm-lichen/35 bg-calm-lichen/20 text-calm-lichen shadow-[0_4px_14px_rgba(185,198,165,0.25)]">
                    <Sprout size={14} className="sm:hidden" />
                    <Sprout size={16} className="hidden sm:block" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-2.5 sm:space-y-3">
                    <div className="break-words rounded-[22px] rounded-tl-[4px] sm:rounded-[26px] sm:rounded-tl-[6px] border border-white/[0.16] bg-gradient-to-b from-[#2e3b31]/98 to-[#243026]/98 backdrop-blur-md px-3.5 py-3 text-xs sm:text-[15px] leading-relaxed text-white shadow-[0_10px_35px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] sm:px-5 sm:py-4">
                      {message.content ? (
                        <div className="whitespace-pre-wrap text-white font-normal">{message.content}</div>
                      ) : isStreaming ? (
                        <LeafLoader variant="inline" size="sm" label="Life Lab đang cảm nhận & suy ngẫm…" />
                      ) : (
                        <div className="whitespace-pre-wrap text-white font-normal">{DEFAULT_OPENING_MESSAGE}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 px-2 text-[10px] sm:text-[10.5px] font-semibold text-calm-warm-ivory/85">
                      <span>{message.timestamp}</span>
                    </div>

                    {/* Proactive 1:1 Voice Call Offer Card on emotional breakdown / distress */}
                    {message.hasVoiceOffer && (
                      <VoiceCallOfferCard
                        onAccept={() => {
                          setVoiceInitialConnected(true);
                          setIsVoiceModalOpen(true);
                        }}
                        onDecline={() => {
                          setMessages((prev) =>
                            prev.map((m) =>
                              m.id === message.id ? { ...m, hasVoiceOffer: false } : m
                            )
                          );
                        }}
                      />
                    )}

                    {/* ONLY Micro-Experiment Card is displayed */}
                    {message.experimentProposal && (
                      <div className="space-y-3 rounded-[22px] sm:rounded-[26px] border border-calm-pollen/40 bg-gradient-to-b from-[#353328]/95 to-[#242c23]/95 backdrop-blur-md p-3.5 sm:p-5 shadow-[0_18px_45px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.1)]">
                        <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
                          <div className="flex items-center gap-2">
                            <span className="grid h-6 w-6 sm:h-7 sm:w-7 place-items-center rounded-xl bg-calm-pollen/20 text-calm-pollen shadow-[0_0_10px_rgba(238,213,150,0.25)] border border-calm-pollen/30">
                              <FlaskConical size={14} />
                            </span>
                            <span className="text-[11px] sm:text-xs font-bold tracking-tight text-white">
                              Đề xuất thử nghiệm ({message.experimentProposal.targetDays || 7} ngày)
                            </span>
                          </div>
                          <span className="rounded-full border border-calm-pollen/40 bg-calm-pollen/15 px-2 py-0.5 text-[8.5px] sm:text-[9.5px] font-bold uppercase tracking-[0.12em] text-calm-pollen shadow-sm">
                            Thực hành ngay
                          </span>
                        </div>

                        <div className="space-y-2 rounded-2xl border border-white/10 bg-black/25 p-3 sm:p-4 text-xs sm:text-sm leading-relaxed text-white">
                          <p className="font-bold text-calm-warm-ivory text-xs sm:text-[15px] flex items-center gap-1.5">
                            <Sparkles size={14} className="text-calm-pollen shrink-0" />
                            {message.experimentProposal.title}
                          </p>
                          <p className="text-calm-fog text-[11px] sm:text-xs leading-relaxed">
                            <strong className="text-white">Giả thuyết:</strong> {message.experimentProposal.hypothesis}
                          </p>
                          <div className="pt-2 text-[11px] sm:text-xs border-t border-white/10 space-y-1">
                            <p className="text-[#bfe7cb] leading-relaxed">
                              <strong className="text-white">Bước nhỏ nhất:</strong> {message.experimentProposal.smallestStep}
                            </p>
                            <p className="text-calm-fog/90 leading-relaxed">
                              <strong className="text-white">Tín hiệu thành công:</strong> {message.experimentProposal.successSignal}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/15 px-3 py-2 text-[11px] sm:text-xs font-semibold text-emerald-100 shadow-sm">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 size={15} className="text-emerald-300 shrink-0" />
                            Đã kích hoạt trong Thử nghiệm
                          </span>
                          <Link
                            href="/app/experiments"
                            className="inline-flex items-center gap-1 text-[10.5px] sm:text-[11px] font-bold uppercase tracking-[0.12em] text-calm-pollen underline hover:text-white transition"
                          >
                            Xem ngay →
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} aria-hidden="true" />
        </div>
      </section>

      {sendError && (
        <div className="shrink-0 mt-2 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-calm-danger-clay/30 bg-calm-danger-clay/10 px-3.5 py-2 text-xs text-[#e7bbb5]" role="alert">
          <span>{sendError}</span>
          <button type="button" onClick={() => { setInputContent(retryContent); setSendError(''); }} className="rounded-full border border-white/15 bg-white/10 px-3 py-1 font-semibold text-calm-warm-ivory active:scale-95 transition">
            Giữ lại để gửi lại
          </button>
        </div>
      )}

      {/* Chat Input & Quick Suggestion Row */}
      <div className="shrink-0 pt-2 pb-[max(0.35rem,env(safe-area-inset-bottom))]">
        {/* Quick Suggestion Pills */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1.5 scrollbar-none text-[11px] sm:text-[11.5px] touch-manipulation">
          <button
            type="button"
            onClick={() => setInputContent('Tôi muốn làm thử nghiệm 15 phút mỗi sáng để tạo nhịp điệu mới')}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-calm-pollen/30 bg-calm-pollen/10 hover:bg-calm-pollen/20 active:bg-calm-pollen/30 backdrop-blur-sm px-3 py-1 sm:px-3.5 sm:py-1.5 font-medium text-calm-pollen shadow-sm transition-all whitespace-nowrap active:scale-95"
          >
            <span>🧪</span> Thử nghiệm 15 phút
          </button>
          <button
            type="button"
            onClick={() => setInputContent('Hôm nay tôi đã làm thử và nhận ra bài học là bước nhỏ giúp tâm trí nhẹ nhàng hơn')}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-calm-fern/35 bg-calm-fern/10 hover:bg-calm-fern/20 active:bg-calm-fern/30 backdrop-blur-sm px-3 py-1 sm:px-3.5 sm:py-1.5 font-medium text-[#c9e2cf] shadow-sm transition-all whitespace-nowrap active:scale-95"
          >
            <span>🌱</span> Ghi nhận & Bài học
          </button>
          <button
            type="button"
            onClick={() => setInputContent('Tôi đang có khoản tiết kiệm 6 tháng và kinh nghiệm chuyên môn 5 năm')}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-calm-lichen/35 bg-calm-lichen/10 hover:bg-calm-lichen/20 active:bg-calm-lichen/30 backdrop-blur-sm px-3 py-1 sm:px-3.5 sm:py-1.5 font-medium text-calm-lichen shadow-sm transition-all whitespace-nowrap active:scale-95"
          >
            <span>💼</span> Nguồn lực & Tài chính
          </button>
          <button
            type="button"
            onClick={() => setInputContent('Tôi mong muốn một cuộc sống tự do thời gian và dành cho gia đình')}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 hover:bg-white/15 active:bg-white/20 backdrop-blur-sm px-3 py-1 sm:px-3.5 sm:py-1.5 font-medium text-calm-warm-ivory shadow-sm transition-all whitespace-nowrap active:scale-95"
          >
            <span>🧭</span> Bản đồ cuộc sống
          </button>
        </div>

        <form
          onSubmit={handleSendMessage}
          className="flex items-center gap-1.5 sm:gap-2 rounded-[24px] sm:rounded-[28px] border border-white/20 bg-gradient-to-r from-[#2c392f]/95 via-[#233026]/95 to-[#2c392f]/95 backdrop-blur-xl p-1.5 sm:p-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.35)] focus-within:border-calm-lichen/60 focus-within:shadow-[0_0_25px_rgba(185,198,165,0.25)] transition-all duration-300"
        >
          <button
            type="button"
            className="rounded-full p-1.5 sm:p-2 text-calm-fog/60 transition hover:bg-white/10 hover:text-calm-lichen active:scale-95 shrink-0"
            aria-label="Đính kèm tệp"
          >
            <Paperclip size={17} />
          </button>
          <textarea
            rows={1}
            placeholder="Gõ tâm tư hoặc trải nghiệm của bạn..."
            value={inputContent}
            onFocus={() => {
              scrollToBottom(false);
              setTimeout(() => scrollToBottom(false), 80);
              setTimeout(() => scrollToBottom(false), 200);
              setTimeout(() => scrollToBottom(false), 350);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            onChange={(event) => {
              setInputContent(event.target.value);
              event.target.style.height = 'auto';
              event.target.style.height = `${Math.min(event.target.scrollHeight, 120)}px`;
            }}
            className="min-w-0 flex-1 max-h-28 resize-none bg-transparent px-2 py-1 text-[16px] leading-5 text-calm-paper-white outline-none placeholder:text-calm-fog/45 sm:text-[15px]"
          />
          <button
            type="submit"
            disabled={isStreaming || !inputContent.trim()}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-calm-lichen to-[#cde0b8] px-3.5 py-2 sm:px-5 sm:py-2.5 text-xs font-bold text-calm-deep-moss shadow-[0_4px_16px_rgba(185,198,165,0.3)] transition-all duration-200 hover:shadow-[0_6px_22px_rgba(185,198,165,0.45)] hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
          >
            {isStreaming ? (
              <LeafLoader variant="inline" size="sm" />
            ) : (
              <>
                <span>Gửi</span>
                <Send size={13} />
              </>
            )}
          </button>
        </form>
        <p className="mt-1 text-center text-[10px] sm:text-[10.5px] text-calm-fog/50 hidden sm:block">
          Life Lab luôn lắng nghe không phán xét. Mọi đề xuất đều do bạn làm chủ.
        </p>
      </div>

      <LiveVoiceSanctuaryModal
        isOpen={isVoiceModalOpen}
        initialConnected={voiceInitialConnected}
        onClose={(callSummary) => {
          setIsVoiceModalOpen(false);
          setVoiceInitialConnected(false);
          if (callSummary) {
            setMessages((prev) => [
              ...prev,
              {
                id: `call-summary-${Date.now()}`,
                role: 'assistant',
                content: callSummary,
                timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
          }
        }}
        conversationId={conversationId}
      />
    </div>
  );
}

export default function ConversationPage() {
  return (
    <Suspense fallback={<div className="grid h-full min-h-[380px] flex-1 place-items-center rounded-[32px] border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent backdrop-blur-md text-calm-fog shadow-glass"><LeafLoader variant="bloom" size="md" label="Đang mở khoảng lặng của bạn…" /></div>}>
      <ConversationPageContent />
    </Suspense>
  );
}

