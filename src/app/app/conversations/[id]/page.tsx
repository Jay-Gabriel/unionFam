'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Edit3,
  Loader2,
  Paperclip,
  Send,
  ShieldCheck,
  Sprout,
  UserRound,
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

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  observation?: Observation;
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
        const status = data.status === 'accepted' || data.status === 'rejected' ? data.status : 'pending';
        observation = {
          id: String(data.id || crypto.randomUUID()),
          dimension: data.dimension,
          dimensionLabel: typeof data.dimensionLabel === 'string' ? data.dimensionLabel : labelDimension(data.dimension),
          contentOriginal: data.contentOriginal,
          status,
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
  useEffect(() => {
    if (isLoadingConversation) return;

    // Keep the latest turn visible while Gemini streams. `auto` avoids
    // queueing dozens of smooth animations for each small delta; once the
    // response is complete, a smooth settle makes the final position gentle.
    const frame = window.requestAnimationFrame(() => {
      const container = messagesScrollRef.current;
      if (container) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: isStreaming ? 'auto' : 'smooth',
        });
        return;
      }
      messagesEndRef.current?.scrollIntoView({
        behavior: isStreaming ? 'auto' : 'smooth',
        block: 'end',
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isLoadingConversation, isStreaming, messages]);

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
      if (stream.observation) {
        setMessages((previous) =>
          previous.map((message) =>
            message.id === assistantMsgId
              ? { ...message, observation: stream.observation }
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

  if (isLoadingConversation) {
    return (
      <div className="grid min-h-[420px] place-items-center rounded-[34px] border border-white/10 bg-calm-deep-moss/35 text-calm-fog">
        <div className="flex items-center gap-3 text-sm">
          <Loader2 size={18} className="animate-spin text-calm-lichen" />
          Đang mở khoảng lặng của bạn…
        </div>
      </div>
    );
  }

  if (conversationError) {
    return (
      <div className="mx-auto grid min-h-[420px] max-w-2xl place-items-center rounded-[34px] border border-calm-danger-clay/30 bg-calm-deep-moss/35 p-8 text-center text-calm-paper-white">
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
    <div className="mx-auto max-w-5xl space-y-6 pb-12 text-calm-paper-white">
      <section className="flex flex-col gap-4 rounded-[30px] border border-white/10 bg-calm-deep-moss/80 px-5 py-5 shadow-[0_20px_60px_rgba(10,18,12,0.14)] sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full border border-calm-lichen/25 bg-calm-lichen/10 text-calm-lichen">
            <Sprout size={19} />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-calm-lichen/80">
              Một khoảng lặng của riêng bạn
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-calm-paper-white sm:text-xl">
              Trò chuyện cùng Life Lab
            </h2>
            <p className="mt-1 text-[11px] text-calm-fog/60">Phiên: {conversationId}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto sm:justify-end">
          {isDemoConversation && (
            <div className="rounded-full border border-calm-pollen/25 bg-calm-pollen/10 px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-calm-pollen">
              Bản thử · lưu trên thiết bị
            </div>
          )}
          <div className="flex items-center gap-2 rounded-full border border-calm-lichen/20 bg-calm-lichen/10 px-3.5 py-2 text-[11px] font-medium text-calm-lichen">
            <ShieldCheck size={14} />
            Bạn giữ quyền quyết định
          </div>
        </div>
      </section>

      <section
        ref={messagesScrollRef}
        className="min-h-[380px] max-h-[calc(100svh-260px)] overflow-y-auto overscroll-contain rounded-[34px] border border-white/10 bg-calm-deep-moss/35 px-4 py-6 sm:px-7 sm:py-8"
        aria-label="Nội dung cuộc trò chuyện"
      >
        <div className="space-y-7" aria-live="polite">
          {messages.map((message) => (
            <div key={message.id} className="space-y-3">
              {message.role === 'user' ? (
                <div className="ml-auto flex max-w-[88%] items-start justify-end gap-3 sm:max-w-[78%]">
                  <div className="space-y-1 text-right">
                    <div className="rounded-[24px] rounded-tr-md border border-calm-lichen/25 bg-calm-lichen/20 px-4 py-3.5 text-left text-sm leading-6 text-calm-paper-white shadow-[0_12px_30px_rgba(15,26,18,0.12)] sm:px-5 sm:text-[15px]">
                      {message.content}
                    </div>
                    <span className="block px-2 text-[10px] text-calm-fog/55">{message.timestamp}</span>
                  </div>
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-calm-forest-dusk text-calm-lichen">
                    <UserRound size={16} />
                  </div>
                </div>
              ) : (
                <div className="flex max-w-[92%] items-start gap-3 sm:max-w-[82%]">
                  <div className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-calm-lichen/20 bg-calm-lichen/10 text-calm-lichen">
                    <Sprout size={16} />
                  </div>
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="rounded-[24px] rounded-tl-md border border-white/10 bg-calm-forest-dusk/90 px-4 py-3.5 text-sm leading-6 text-calm-paper-white shadow-[0_12px_30px_rgba(15,26,18,0.12)] sm:px-5 sm:text-[15px]">
                      {message.content ||
                        (isStreaming && <Loader2 size={17} className="animate-spin text-calm-lichen" />)}
                    </div>
                    <div className="flex items-center gap-2 px-2 text-[10px] text-calm-fog/55">
                      <span>{message.timestamp}</span>
                    </div>

                    {message.observation && (
                      <div className="space-y-4 rounded-[28px] border border-calm-lichen/25 bg-calm-moss/60 p-4 shadow-[0_18px_45px_rgba(15,26,18,0.15)] sm:p-5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <ShieldCheck size={16} className="text-calm-lichen" />
                            <span className="text-xs font-semibold text-calm-paper-white">
                              {message.observation.dimensionLabel}
                            </span>
                          </div>
                          <span className="rounded-full border border-calm-lichen/20 bg-calm-deep-moss/35 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-calm-lichen">
                            Gợi ý từ AI
                          </span>
                        </div>

                        {editingObsId === message.observation.id ? (
                          <div className="space-y-3">
                            <textarea
                              value={editText}
                              onChange={(event) => setEditText(event.target.value)}
                              rows={3}
                              className="w-full resize-none rounded-2xl border border-calm-lichen/25 bg-calm-deep-moss/65 p-3 text-sm leading-6 text-calm-paper-white outline-none focus:border-calm-lichen/55 focus:ring-2 focus:ring-calm-lichen/15"
                            />
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingObsId(null)}
                                className="rounded-full border border-white/10 bg-calm-deep-moss/30 px-3.5 py-2 text-xs font-medium text-calm-fog transition hover:bg-calm-deep-moss/50"
                              >
                                Hủy
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleDecision(message.id, message.observation!.id, 'accepted', editText)
                                }
                                disabled={isSubmitting}
                                className="rounded-full bg-calm-lichen px-4 py-2 text-xs font-semibold text-calm-deep-moss transition hover:bg-calm-fog disabled:opacity-50"
                              >
                                Xác nhận bản sửa
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-white/10 bg-calm-deep-moss/45 p-4 text-sm font-medium leading-6 text-calm-paper-white">
                            {message.observation.status === 'accepted' &&
                            message.observation.contentEdited
                              ? message.observation.contentEdited
                              : message.observation.contentOriginal}
                          </div>
                        )}

                        {message.observation.status === 'pending' &&
                          editingObsId !== message.observation.id && (
                            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                              <p className="text-[11px] font-medium leading-5 text-calm-fog/75">
                                Chỉ lưu vào bản đồ cuộc sống khi điều này đúng với bạn.
                              </p>
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDecision(message.id, message.observation!.id, 'rejected')
                                  }
                                  disabled={isSubmitting}
                                  className="flex items-center gap-1.5 rounded-full border border-white/10 bg-calm-deep-moss/25 px-3.5 py-2 text-xs font-medium text-calm-fog transition hover:border-calm-danger-clay/35 hover:text-[#e7bbb5] disabled:opacity-50"
                                >
                                  <XCircle size={14} /> Chưa đúng
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingObsId(message.observation!.id);
                                    setEditText(message.observation!.contentOriginal);
                                  }}
                                  className="flex items-center gap-1.5 rounded-full border border-white/10 bg-calm-deep-moss/25 px-3.5 py-2 text-xs font-medium text-calm-fog transition hover:border-calm-lichen/30 hover:text-calm-paper-white"
                                >
                                  <Edit3 size={14} /> Sửa lại
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDecision(message.id, message.observation!.id, 'accepted')
                                  }
                                  disabled={isSubmitting}
                                  className="flex items-center gap-1.5 rounded-full bg-calm-lichen px-4 py-2 text-xs font-semibold text-calm-deep-moss transition hover:bg-calm-fog disabled:opacity-50"
                                >
                                  <CheckCircle2 size={14} /> Đúng với mình
                                </button>
                              </div>
                            </div>
                          )}

                        {message.observation.status === 'accepted' && (
                          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-calm-success-leaf/35 bg-calm-success-leaf/15 px-3.5 py-2.5 text-xs font-semibold text-[#c9e2cf]">
                            <span className="flex items-center gap-1.5">
                              <CheckCircle2 size={16} /> Đã xác nhận và thêm vào bản đồ cuộc sống
                            </span>
                            <span className="text-[9px] uppercase tracking-[0.12em]">Đã lưu</span>
                          </div>
                        )}

                        {message.observation.status === 'rejected' && (
                          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-calm-deep-moss/25 px-3.5 py-2.5 text-xs font-medium text-calm-fog/75">
                            <span className="flex items-center gap-1.5">
                              <XCircle size={16} /> Đã từ chối đề xuất này
                            </span>
                            <span className="text-[9px] uppercase tracking-[0.12em]">Không lưu</span>
                          </div>
                        )}
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

      {sendError && <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-calm-danger-clay/30 bg-calm-danger-clay/10 px-4 py-3 text-xs text-[#e7bbb5]" role="alert"><span>{sendError}</span><button type="button" onClick={() => { setInputContent(retryContent); setSendError(''); }} className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 font-semibold text-calm-warm-ivory">Giữ lại để gửi lại</button></div>}

      <div className="sticky bottom-4 z-10 pt-1">
        <form
          onSubmit={handleSendMessage}
          className="flex items-center gap-2 rounded-[28px] border border-white/15 bg-calm-deep-moss p-2.5 shadow-[0_18px_55px_rgba(10,18,12,0.28)]"
        >
          <button
            type="button"
            className="rounded-full p-2.5 text-calm-fog/55 transition hover:bg-white/5 hover:text-calm-lichen"
            aria-label="Đính kèm tệp"
          >
            <Paperclip size={18} />
          </button>
          <input
            type="text"
            placeholder="Trả lời Life Lab..."
            value={inputContent}
            onChange={(event) => setInputContent(event.target.value)}
            className="min-w-0 flex-1 bg-transparent px-2 text-sm text-calm-paper-white outline-none placeholder:text-calm-fog/45 sm:text-[15px]"
          />
          <button
            type="submit"
            disabled={isStreaming || !inputContent.trim()}
            className="flex items-center gap-1.5 rounded-full bg-calm-lichen px-5 py-2.5 text-xs font-semibold text-calm-deep-moss transition hover:bg-calm-fog disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span>{isStreaming ? 'Đang trả lời…' : 'Gửi'}</span>
            <Send size={14} />
          </button>
        </form>
        <p className="mt-2 text-center text-[10px] text-calm-fog/45">
          Life Lab không phán xét. Bạn có thể sửa hoặc không lưu bất kỳ gợi ý nào.
        </p>
      </div>
    </div>
  );
}
