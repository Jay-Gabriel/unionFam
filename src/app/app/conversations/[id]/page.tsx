'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  BookOpen,
  CheckCircle2,
  Compass,
  Edit3,
  FlaskConical,
  GraduationCap,
  Loader2,
  Paperclip,
  Send,
  ShieldCheck,
  Sprout,
  UserRound,
  Wallet,
  XCircle,
} from 'lucide-react';
import { labelDimension } from '@/lib/i18n';

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
}

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
    .map((message) => ({
      id: String(message.id),
      role: message.role as Message['role'],
      content: String(message.content || ''),
      timestamp: new Date(String(message.created_at)).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      observation: observationsByMessage.get(String(message.id)),
    }));
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
      .map((message) => ({
        id: String(message.id || `${message.role}-${crypto.randomUUID()}`),
        role: message.role as Message['role'],
        content: String(message.content).slice(0, 6000),
        timestamp: typeof message.timestamp === 'string' ? message.timestamp : new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        observation: message.observation as Observation | undefined,
        experimentProposal: message.experimentProposal as ExperimentProposal | undefined,
        reflectionProposal: message.reflectionProposal as ReflectionProposal | undefined,
        resourceProposal: message.resourceProposal as ResourceProposal | undefined,
      }));
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

  throw lastError || new Error('Chưa thể mở lời chào của Life Lab.');
}

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesScrollRef = useRef<HTMLElement>(null);
  const openingStartedRef = useRef<string | null>(null);
  const openingPromiseRef = useRef<{ id: string; promise: Promise<StreamSummary> } | null>(null);
  const newConversationPromiseRef = useRef<Promise<{
    id: string;
    data: Record<string, unknown>;
    demoMode: boolean;
  }> | null>(null);
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
            router.replace(`/app/conversations/${activeId}`);
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
                    content: '',
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

    const userText = inputContent;
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
    setIsStreaming(true);

    const assistantMsgId = `ai-${Date.now()}`;
    setMessages((previous) => [
      ...previous,
      {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
      <div className="grid h-full min-h-[360px] flex-1 place-items-center rounded-[34px] border border-white/10 bg-calm-deep-moss/35 text-calm-fog">
        <div className="flex items-center gap-3 text-sm">
          <Loader2 size={18} className="animate-spin text-calm-lichen" />
          Đang mở khoảng lặng của bạn…
        </div>
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
      <section className="shrink-0 flex flex-col gap-2 rounded-[20px] sm:rounded-[28px] border border-white/10 bg-calm-deep-moss/80 px-4 py-2.5 sm:px-6 sm:py-3.5 shadow-[0_12px_35px_rgba(10,18,12,0.12)] sm:flex-row sm:items-center sm:justify-between mb-2 sm:mb-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 sm:h-10 sm:w-10 shrink-0 place-items-center rounded-full border border-calm-lichen/25 bg-calm-lichen/10 text-calm-lichen">
            <Sprout size={17} />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold tracking-[-0.02em] text-calm-paper-white sm:text-lg">
              Trò chuyện cùng Life Lab
            </h2>
            <p className="truncate text-[10px] text-calm-fog/60">Phiên: {conversationId}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto sm:justify-end">
          {isDemoConversation && (
            <div className="rounded-full border border-calm-pollen/25 bg-calm-pollen/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-calm-pollen">
              Bản thử thiết bị
            </div>
          )}
          <div className="flex items-center gap-1.5 rounded-full border border-calm-lichen/20 bg-calm-lichen/10 px-2.5 py-1 text-[10px] font-medium text-calm-lichen">
            <ShieldCheck size={13} />
            Bạn giữ quyền quyết định
          </div>
        </div>
      </section>

      <section
        ref={messagesScrollRef}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain rounded-[24px] sm:rounded-[32px] border border-white/10 bg-calm-deep-moss/35 px-3 py-4 sm:px-6 sm:py-6"
        aria-label="Nội dung cuộc trò chuyện"
      >
        <div className="space-y-5 sm:space-y-6" aria-live="polite">
          {messages.map((message) => (
            <div key={message.id} className="space-y-2.5">
              {message.role === 'user' ? (
                <div className="ml-auto flex max-w-[90%] items-start justify-end gap-2 sm:max-w-[78%] sm:gap-3">
                  <div className="space-y-1 text-right">
                    <div className="break-words rounded-[22px] rounded-tr-md border border-calm-lichen/25 bg-calm-lichen/20 px-3.5 py-2.5 text-left text-sm leading-6 text-calm-paper-white shadow-[0_12px_30px_rgba(15,26,18,0.12)] sm:px-5 sm:py-3.5 sm:text-[15px]">
                      {message.content}
                    </div>
                    <span className="block px-2 text-[10px] text-calm-fog/55">{message.timestamp}</span>
                  </div>
                  <div className="grid h-8 w-8 sm:h-9 sm:w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-calm-forest-dusk text-calm-lichen">
                    <UserRound size={15} />
                  </div>
                </div>
              ) : (
                <div className="flex max-w-[94%] items-start gap-2 sm:max-w-[82%] sm:gap-3">
                  <div className="mt-0.5 grid h-8 w-8 sm:h-9 sm:w-9 shrink-0 place-items-center rounded-full border border-calm-lichen/20 bg-calm-lichen/10 text-calm-lichen">
                    <Sprout size={15} />
                  </div>
                  <div className="min-w-0 flex-1 space-y-2.5">
                    <div className="break-words rounded-[22px] rounded-tl-md border border-white/10 bg-calm-forest-dusk/90 px-3.5 py-2.5 text-sm leading-6 text-calm-paper-white shadow-[0_12px_30px_rgba(15,26,18,0.12)] sm:px-5 sm:py-3.5 sm:text-[15px]">
                      {message.content ||
                        (isStreaming && <Loader2 size={17} className="animate-spin text-calm-lichen" />)}
                    </div>
                    <div className="flex items-center gap-2 px-2 text-[10px] text-calm-fog/55">
                      <span>{message.timestamp}</span>
                    </div>

                    {/* 1. Life Map Insight Card */}
                    {message.observation && (
                      <div className="space-y-3 rounded-[24px] border border-calm-lichen/30 bg-calm-moss/70 p-3.5 shadow-[0_18px_45px_rgba(15,26,18,0.15)] sm:p-5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <Compass size={16} className="text-calm-lichen" />
                            <span className="text-xs font-semibold text-calm-paper-white">
                              Bản đồ cuộc sống · {message.observation.dimensionLabel}
                            </span>
                          </div>
                          <span className="rounded-full border border-calm-lichen/25 bg-calm-lichen/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-calm-lichen">
                            Tự động trích xuất từ cuộc trò chuyện
                          </span>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-calm-deep-moss/50 p-3.5 sm:p-4 text-xs sm:text-sm font-medium leading-6 text-calm-paper-white break-words">
                          {message.observation.contentEdited || message.observation.contentOriginal}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-calm-success-leaf/35 bg-calm-success-leaf/15 px-3.5 py-2 text-xs font-semibold text-[#c9e2cf]">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 size={15} /> Đã tự động cập nhật vào Bản đồ cuộc sống
                          </span>
                          <Link href="/app/life-map" className="text-[10px] uppercase tracking-[0.12em] text-calm-warm-ivory underline hover:text-white transition">
                            Xem trong Bản đồ →
                          </Link>
                        </div>
                      </div>
                    )}

                    {/* 2. Experiment Proposal Card */}
                    {message.experimentProposal && (
                      <div className="space-y-3 rounded-[24px] border border-calm-pollen/30 bg-calm-moss/70 p-3.5 shadow-[0_18px_45px_rgba(15,26,18,0.15)] sm:p-5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <FlaskConical size={16} className="text-calm-pollen" />
                            <span className="text-xs font-semibold text-calm-paper-white">
                              Thử nghiệm ({message.experimentProposal.targetDays || 7} ngày)
                            </span>
                          </div>
                          <span className="rounded-full border border-calm-pollen/25 bg-calm-pollen/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-calm-pollen">
                            Tự động trích xuất từ cuộc trò chuyện
                          </span>
                        </div>

                        <div className="space-y-2 rounded-2xl border border-white/10 bg-calm-deep-moss/50 p-3.5 sm:p-4 text-xs sm:text-sm leading-6 text-calm-paper-white">
                          <p className="font-semibold text-calm-warm-ivory text-sm sm:text-base">
                            🧪 {message.experimentProposal.title}
                          </p>
                          <p className="text-calm-fog text-xs">
                            <span className="font-medium text-calm-paper-white">Giả thuyết:</span> {message.experimentProposal.hypothesis}
                          </p>
                          <div className="pt-1 text-xs border-t border-white/10">
                            <p className="text-[#c9e2cf]">
                              <span className="font-medium">Bước nhỏ nhất:</span> {message.experimentProposal.smallestStep}
                            </p>
                            <p className="text-calm-fog/80 mt-1">
                              <span className="font-medium text-calm-paper-white">Tín hiệu thành công:</span> {message.experimentProposal.successSignal}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-calm-success-leaf/35 bg-calm-success-leaf/15 px-3.5 py-2 text-xs font-semibold text-[#c9e2cf]">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 size={15} /> Đã tự động tạo & kích hoạt trong Thử nghiệm
                          </span>
                          <Link href="/app/experiments" className="text-[10px] uppercase tracking-[0.12em] text-calm-warm-ivory underline hover:text-white transition">
                            Xem trong Thử nghiệm →
                          </Link>
                        </div>
                      </div>
                    )}

                    {/* 3. Reflection & Learning Proposal Card */}
                    {message.reflectionProposal && (
                      <div className="space-y-3 rounded-[24px] border border-calm-fern/35 bg-calm-moss/70 p-3.5 shadow-[0_18px_45px_rgba(15,26,18,0.15)] sm:p-5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <BookOpen size={16} className="text-calm-fern" />
                            <span className="text-xs font-semibold text-calm-paper-white">
                              Ghi nhận & Bài học đúc kết
                            </span>
                          </div>
                          <span className="rounded-full border border-calm-fern/30 bg-calm-fern/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#c9e2cf]">
                            Tự động trích xuất từ cuộc trò chuyện
                          </span>
                        </div>

                        <div className="space-y-2 rounded-2xl border border-white/10 bg-calm-deep-moss/50 p-3.5 sm:p-4 text-xs sm:text-sm leading-6 text-calm-paper-white">
                          <p className="text-xs">
                            <span className="font-semibold text-calm-warm-ivory">Kết quả:</span> {message.reflectionProposal.result}
                          </p>
                          <div className="p-2.5 rounded-xl bg-calm-lichen/10 border border-calm-lichen/20">
                            <p className="text-xs text-calm-warm-ivory font-medium flex items-center gap-1.5">
                              <GraduationCap size={15} className="text-calm-lichen" />
                              Bài học rút ra:
                            </p>
                            <p className="text-xs text-calm-paper-white mt-0.5">{message.reflectionProposal.learningCandidate}</p>
                          </div>
                          <div className="text-xs text-calm-fog flex flex-wrap gap-x-4 gap-y-1 pt-1">
                            <span><strong className="text-calm-paper-white">Cảm xúc:</strong> {message.reflectionProposal.feeling}</span>
                            <span><strong className="text-calm-paper-white">Bước kế tiếp:</strong> {message.reflectionProposal.nextAction}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-calm-success-leaf/35 bg-calm-success-leaf/15 px-3.5 py-2 text-xs font-semibold text-[#c9e2cf]">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 size={15} /> Đã tự động lưu Ghi nhận & tạo Bài học mới
                          </span>
                          <div className="flex items-center gap-3">
                            <Link href="/app/reflections" className="text-[10px] uppercase tracking-[0.12em] text-calm-warm-ivory underline hover:text-white transition">
                              Ghi nhận →
                            </Link>
                            <Link href="/app/learnings" className="text-[10px] uppercase tracking-[0.12em] text-calm-warm-ivory underline hover:text-white transition">
                              Bài học →
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 4. Resource Proposal Card */}
                    {message.resourceProposal && (
                      <div className="space-y-3 rounded-[24px] border border-calm-lichen/30 bg-calm-moss/70 p-3.5 shadow-[0_18px_45px_rgba(15,26,18,0.15)] sm:p-5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <Wallet size={16} className="text-calm-lichen" />
                            <span className="text-xs font-semibold text-calm-paper-white">
                              Nguồn lực & Tài chính ({message.resourceProposal.resourceType})
                            </span>
                          </div>
                          <span className="rounded-full border border-calm-lichen/25 bg-calm-lichen/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-calm-lichen">
                            Tự động trích xuất từ cuộc trò chuyện
                          </span>
                        </div>

                        <div className="space-y-1.5 rounded-2xl border border-white/10 bg-calm-deep-moss/50 p-3.5 sm:p-4 text-xs sm:text-sm leading-6 text-calm-paper-white">
                          <p className="font-semibold text-calm-warm-ivory text-sm">
                            💼 {message.resourceProposal.name}
                          </p>
                          {message.resourceProposal.description && (
                            <p className="text-calm-fog text-xs">{message.resourceProposal.description}</p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-calm-success-leaf/35 bg-calm-success-leaf/15 px-3.5 py-2 text-xs font-semibold text-[#c9e2cf]">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 size={15} /> Đã tự động lưu vào Tài nguyên & Nguồn lực
                          </span>
                          <Link href="/app/resources" className="text-[10px] uppercase tracking-[0.12em] text-calm-warm-ivory underline hover:text-white transition">
                            Xem trong Tài nguyên →
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
          <button type="button" onClick={() => { setInputContent(retryContent); setSendError(''); }} className="rounded-full border border-white/15 bg-white/10 px-3 py-1 font-semibold text-calm-warm-ivory">
            Giữ lại để gửi lại
          </button>
        </div>
      )}

      <div className="shrink-0 pt-1.5 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
        {/* Quick Suggestion Pills for easy 1-tap testing on Mobile & Desktop */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none text-[11px]">
          <button
            type="button"
            onClick={() => setInputContent('Tôi muốn làm thử nghiệm 15 phút mỗi sáng để tạo nhịp điệu mới')}
            className="shrink-0 rounded-full border border-calm-pollen/30 bg-calm-pollen/10 px-2.5 py-1 font-medium text-calm-pollen transition hover:bg-calm-pollen/20"
          >
            🧪 Thử nghiệm 15 phút
          </button>
          <button
            type="button"
            onClick={() => setInputContent('Hôm nay tôi đã làm thử và nhận ra bài học là bước nhỏ giúp tâm trí nhẹ nhàng hơn')}
            className="shrink-0 rounded-full border border-calm-fern/30 bg-calm-fern/10 px-2.5 py-1 font-medium text-[#c9e2cf] transition hover:bg-calm-fern/20"
          >
            🌱 Ghi nhận & Bài học
          </button>
          <button
            type="button"
            onClick={() => setInputContent('Tôi đang có khoản tiết kiệm 6 tháng và kinh nghiệm chuyên môn 5 năm')}
            className="shrink-0 rounded-full border border-calm-lichen/30 bg-calm-lichen/10 px-2.5 py-1 font-medium text-calm-lichen transition hover:bg-calm-lichen/20"
          >
            💼 Nguồn lực & Tài chính
          </button>
          <button
            type="button"
            onClick={() => setInputContent('Tôi mong muốn một cuộc sống tự do thời gian và dành cho gia đình')}
            className="shrink-0 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 font-medium text-calm-warm-ivory transition hover:bg-white/10"
          >
            🧭 Bản đồ cuộc sống
          </button>
        </div>

        <form
          onSubmit={handleSendMessage}
          className="flex items-center gap-1.5 sm:gap-2 rounded-[24px] sm:rounded-[28px] border border-white/15 bg-calm-deep-moss p-1.5 sm:p-2.5 shadow-[0_18px_55px_rgba(10,18,12,0.28)]"
        >
          <button
            type="button"
            className="rounded-full p-2 text-calm-fog/55 transition hover:bg-white/5 hover:text-calm-lichen"
            aria-label="Đính kèm tệp"
          >
            <Paperclip size={17} />
          </button>
          <textarea
            rows={1}
            placeholder="Trả lời Life Lab..."
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
            className="min-w-0 flex-1 max-h-28 resize-none bg-transparent px-2 py-1.5 text-[16px] leading-5 text-calm-paper-white outline-none placeholder:text-calm-fog/45 sm:text-[15px]"
          />
          <button
            type="submit"
            disabled={isStreaming || !inputContent.trim()}
            className="flex shrink-0 items-center gap-1 sm:gap-1.5 rounded-full bg-calm-lichen px-4 py-2 sm:px-5 sm:py-2.5 text-xs font-semibold text-calm-deep-moss transition hover:bg-calm-fog disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span>{isStreaming ? 'Đang trả lời…' : 'Gửi'}</span>
            <Send size={13} />
          </button>
        </form>
        <p className="mt-1 text-center text-[10px] text-calm-fog/45 hidden sm:block">
          Life Lab không phán xét. Bạn có thể sửa hoặc không lưu bất kỳ gợi ý nào.
        </p>
      </div>
    </div>
  );
}
