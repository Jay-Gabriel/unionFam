'use client';

import React, { useEffect, useRef, useState } from 'react';
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

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const routeConversationId = (params?.id as string) || 'new';
  const [conversationId, setConversationId] = useState(routeConversationId);

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingConversation, setIsLoadingConversation] = useState(true);
  const [conversationError, setConversationError] = useState('');

  const [inputContent, setInputContent] = useState('');
  const [editingObsId, setEditingObsId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendError, setSendError] = useState('');
  const [retryContent, setRetryContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLoadingConversation) return;

    // Keep the latest turn visible while Gemini streams. `auto` avoids
    // queueing dozens of smooth animations for each small delta; once the
    // response is complete, a smooth settle makes the final position gentle.
    const frame = window.requestAnimationFrame(() => {
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
      setIsLoadingConversation(true);
      setConversationError('');
      try {
        let activeId = routeConversationId;
        if (activeId === 'new') {
          const createResponse = await fetch('/api/conversations', { method: 'POST' });
          if (!createResponse.ok) throw new Error('Không thể tạo cuộc trò chuyện');
          const created = await createResponse.json();
          activeId = created.data.id;
          if (!cancelled) {
            setConversationId(activeId);
            router.replace(`/app/conversations/${activeId}`);
          }
        }

        const response = await fetch(`/api/conversations/${activeId}`);
        if (!response.ok) throw new Error(response.status === 401 ? 'Phiên đăng nhập đã hết hạn' : 'Không thể tải cuộc trò chuyện');
        const json = await response.json();
        if (cancelled) return;

        const observationsByMessage = new Map<string, Observation>();
        (json.data.observations || []).forEach((observation: Record<string, unknown>) => {
          observationsByMessage.set(String(observation.assistant_message_id), {
            id: String(observation.id),
            dimension: String(observation.dimension),
            dimensionLabel: String(observation.dimension).replaceAll('_', ' ').toUpperCase(),
            contentOriginal: String(observation.content_original),
            contentEdited: typeof observation.content_user_edited === 'string' ? observation.content_user_edited : undefined,
            status: observation.status as Observation['status'],
          });
        });

        setConversationId(activeId);
        setMessages((json.data.messages || []).filter((message: Record<string, unknown>) => message.role !== 'system_tool').map((message: Record<string, unknown>) => ({
          id: String(message.id),
          role: message.role as Message['role'],
          content: String(message.content || ''),
          timestamp: new Date(String(message.created_at)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          observation: observationsByMessage.get(String(message.id)),
        })));
      } catch (error) {
        if (!cancelled) setConversationError(error instanceof Error ? error.message : 'Không thể tải cuộc trò chuyện');
      } finally {
        if (!cancelled) setIsLoadingConversation(false);
      }
    }

    loadConversation();
    return () => {
      cancelled = true;
    };
  }, [routeConversationId, router]);

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

      const reader = response.body?.getReader();
      if (!reader) {
        setMessages((previous) => previous.filter((message) => message.id !== assistantMsgId));
        setSendError('Kết nối không trả về dữ liệu. Bạn có thể thử lại.');
        setRetryContent(userText);
        return;
      }

      const decoder = new TextDecoder();
      let accumulatedText = '';
      let eventBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        eventBuffer += decoder.decode(value, { stream: true });
        const events = eventBuffer.split('\n\n');
        eventBuffer = events.pop() || '';

        for (const eventBlock of events) {
          let eventType = '';
          let dataString = '';

          for (const line of eventBlock.split('\n')) {
            if (line.startsWith('event: ')) eventType = line.slice(7).trim();
            if (line.startsWith('data: ')) dataString += line.slice(6).trim();
          }

          if (!dataString) continue;

          try {
            const data = JSON.parse(dataString);
            if (eventType === 'message.delta' && data.text) {
              accumulatedText += data.text;
              setMessages((previous) =>
                previous.map((message) =>
                  message.id === assistantMsgId
                    ? { ...message, content: accumulatedText }
                    : message
                )
              );
            }
            if (eventType === 'observation.created') {
              setMessages((previous) =>
                previous.map((message) =>
                  message.id === assistantMsgId
                    ? { ...message, observation: data as Observation }
                    : message
                )
              );
            }
          } catch {
            // Malformed provider events are ignored without breaking the current conversation.
          }
        }
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
        <div className="flex items-center gap-2 self-start rounded-full border border-calm-lichen/20 bg-calm-lichen/10 px-3.5 py-2 text-[11px] font-medium text-calm-lichen sm:self-auto">
          <ShieldCheck size={14} />
          Bạn giữ quyền quyết định
        </div>
      </section>

      <section className="min-h-[380px] rounded-[34px] border border-white/10 bg-calm-deep-moss/35 px-4 py-6 sm:px-7 sm:py-8">
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
                    <span className="block px-2 text-[10px] text-calm-fog/55">{message.timestamp}</span>

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
                                Chỉ lưu vào Life Design Map khi điều này đúng với bạn.
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
                              <CheckCircle2 size={16} /> Đã xác nhận và thêm vào Life Design Map
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
