'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Sparkles,
  Send,
  Paperclip,
  CheckCircle2,
  Edit3,
  XCircle,
  ShieldCheck,
  Loader2
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
  const conversationId = (params?.id as string) || 'conv-001';

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      role: 'assistant',
      content: 'Chào Minh Anh, hôm nay chúng ta cùng phản chiếu sâu hơn về mong muốn kinh doanh và tự do thời gian của bạn nhé. Khi hình dung 3 năm nữa bạn đã hoàn toàn tự do tài chính, ngày thường của bạn diễn ra như thế nào?',
      timestamp: '10:30',
    },
  ]);

  const [inputContent, setInputContent] = useState('');
  const [editingObsId, setEditingObsId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputContent.trim() || isStreaming) return;

    const userText = inputContent;
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputContent('');
    setIsStreaming(true);

    const assistantMsgId = `ai-${Date.now()}`;
    const initialAssistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, initialAssistantMsg]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          content: userText,
          idempotencyKey: `msg-${Date.now()}`,
        }),
      });

      if (!res.ok) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: 'Lỗi gián đoạn AI. Vui lòng gửi lại tin nhắn.' }
              : m
          )
        );
        setIsStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;

      let accumulatedText = '';
      let pendingObs: Observation | undefined;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const textChunk = decoder.decode(value);
        const lines = textChunk.split('\n');

        let eventType = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.replace('event: ', '').trim();
          } else if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            try {
              const data = JSON.parse(dataStr);
              if (eventType === 'message.delta' && data.text) {
                accumulatedText += data.text;
                setMessages((prev) =>
                  prev.map((m) => (m.id === assistantMsgId ? { ...m, content: accumulatedText } : m))
                );
              } else if (eventType === 'observation.created') {
                pendingObs = data;
                setMessages((prev) =>
                  prev.map((m) => (m.id === assistantMsgId ? { ...m, observation: pendingObs } : m))
                );
              }
            } catch (err) {
              // Ignore partial JSON chunks
            }
          }
        }
      }
    } catch (err) {
      console.error('Chat error', err);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleDecision = async (
    msgId: string,
    obsId: string,
    decision: 'accepted' | 'rejected',
    editedContent?: string
  ) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/observations/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          observationId: obsId,
          decision,
          editedContent,
          idempotencyKey: `dec-${obsId}-${Date.now()}`,
        }),
      });

      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id === msgId && m.observation) {
              return {
                ...m,
                observation: {
                  ...m.observation,
                  status: decision,
                  contentEdited: editedContent,
                },
              };
            }
            return m;
          })
        );
      }
    } catch (err) {
      console.error('Failed decision', err);
    } finally {
      setEditingObsId(null);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-card flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="font-bold text-slate-900 text-lg">AI Conversation & User Agency Gate</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Session ID: {conversationId}</p>
        </div>
        <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
          Stage: Ideal Day Exploration
        </span>
      </div>

      {/* Messages Timeline */}
      <div className="space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className="space-y-3">
            {/* User Message */}
            {msg.role === 'user' ? (
              <div className="flex items-start justify-end gap-3 ml-auto max-w-[85%]">
                <div className="space-y-1 text-right">
                  <div className="bg-indigo-600 text-white text-xs md:text-sm p-4 rounded-3xl rounded-tr-sm leading-relaxed shadow-sm">
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-slate-400 block px-2">{msg.timestamp}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 overflow-hidden flex-shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120"
                    alt="User"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ) : (
              /* Assistant Message */
              <div className="flex items-start gap-3 max-w-[90%]">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0 mt-1">
                  L
                </div>
                <div className="space-y-3 flex-1">
                  <div className="bg-white border border-slate-200/80 text-slate-800 text-xs md:text-sm p-4 rounded-3xl rounded-tl-sm leading-relaxed shadow-card">
                    {msg.content || (isStreaming && <Loader2 size={16} className="animate-spin text-indigo-600" />)}
                  </div>
                  <span className="text-[10px] text-slate-400 block px-2">{msg.timestamp}</span>

                  {/* Pending Observation Card */}
                  {msg.observation && (
                    <div className="bg-gradient-to-br from-indigo-50/70 via-purple-50/50 to-white border border-indigo-200/80 rounded-3xl p-5 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShieldCheck size={16} className="text-indigo-600" />
                          <span className="text-xs font-bold text-indigo-950">
                            {msg.observation.dimensionLabel}
                          </span>
                        </div>
                        <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                          AI Observation Proposal
                        </span>
                      </div>

                      {editingObsId === msg.observation.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            rows={3}
                            className="w-full text-xs md:text-sm p-3 bg-white border border-indigo-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEditingObsId(null)}
                              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
                            >
                              Hủy
                            </button>
                            <button
                              onClick={() =>
                                handleDecision(msg.id, msg.observation!.id, 'accepted', editText)
                              }
                              disabled={isSubmitting}
                              className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                              Xác nhận bản sửa
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white/90 p-3.5 rounded-2xl border border-indigo-100 text-xs md:text-sm text-slate-800 font-medium leading-relaxed">
                          {msg.observation.status === 'accepted' && msg.observation.contentEdited
                            ? msg.observation.contentEdited
                            : msg.observation.contentOriginal}
                        </div>
                      )}

                      {msg.observation.status === 'pending' && editingObsId !== msg.observation.id && (
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                          <p className="text-[11px] text-slate-500 font-medium">
                            Hãy xác nhận để đưa insight này vào Life Design Map của bạn:
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDecision(msg.id, msg.observation!.id, 'rejected')}
                              disabled={isSubmitting}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-xs font-semibold flex items-center gap-1 transition-colors"
                            >
                              <XCircle size={14} />
                              Từ chối
                            </button>
                            <button
                              onClick={() => {
                                setEditingObsId(msg.observation!.id);
                                setEditText(msg.observation!.contentOriginal);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 text-xs font-semibold flex items-center gap-1 transition-colors"
                            >
                              <Edit3 size={14} />
                              Sửa & Đồng ý
                            </button>
                            <button
                              onClick={() => handleDecision(msg.id, msg.observation!.id, 'accepted')}
                              disabled={isSubmitting}
                              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1 shadow-sm transition-all"
                            >
                              <CheckCircle2 size={14} />
                              Đồng ý
                            </button>
                          </div>
                        </div>
                      )}

                      {msg.observation.status === 'accepted' && (
                        <div className="flex items-center justify-between text-xs font-semibold text-emerald-700 bg-emerald-50 px-3.5 py-2 rounded-2xl border border-emerald-200">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 size={16} />
                            <span>Đã xác nhận & thêm vào Life Design Map</span>
                          </div>
                          <span className="text-[10px] text-emerald-600 font-bold uppercase">Confirmed Insight</span>
                        </div>
                      )}

                      {msg.observation.status === 'rejected' && (
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 bg-slate-100 px-3.5 py-2 rounded-2xl border border-slate-200">
                          <div className="flex items-center gap-1.5">
                            <XCircle size={16} />
                            <span>Đã từ chối đề xuất này</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Rejected</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input Form */}
      <div className="sticky bottom-4 pt-2">
        <form
          onSubmit={handleSendMessage}
          className="bg-white/90 backdrop-blur-md rounded-3xl p-3 border border-slate-200 shadow-lg flex items-center gap-2"
        >
          <button type="button" className="p-2 text-slate-400 hover:text-slate-600 rounded-xl transition-colors">
            <Paperclip size={18} />
          </button>
          <input
            type="text"
            placeholder="Trả lời Life Lab..."
            value={inputContent}
            onChange={(e) => setInputContent(e.target.value)}
            className="flex-1 bg-transparent text-xs md:text-sm text-slate-800 placeholder-slate-400 focus:outline-none px-2"
          />
          <button
            type="submit"
            disabled={isStreaming}
            className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-200 transition-all disabled:opacity-50"
          >
            <span>{isStreaming ? 'Đang stream...' : 'Gửi'}</span>
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}
