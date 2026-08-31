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
  Volume2,
  VolumeX,
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

async function requestOpeningTurn(id: string) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversationId: id,
      opening: true,
      idempotencyKey: `opening:${id}`,
    }),
  });

  if (!response.ok) {
    const json = await response.json().catch(() => ({}));
    throw new Error(typeof json.error === 'string' ? `Chưa thể mở lời chào (${json.error}).` : 'Chưa thể mở lời chào của Life Lab.');
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('Kết nối mở lời chào không trả về dữ liệu.');
  while (true) {
    const { done } = await reader.read();
    if (done) break;
  }
}

async function requestSpeechAudio(text: string, signal: AbortSignal) {
  const response = await fetch('/api/speech', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
    signal,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const code = payload && typeof payload.error === 'string' ? payload.error : 'TTS_PROVIDER_UNAVAILABLE';
    throw new Error(code);
  }

  const audio = await response.blob();
  if (!audio.size) throw new Error('TTS_AUDIO_INVALID');
  return audio;
}

async function requestSpeechStream(text: string, signal: AbortSignal) {
  const response = await fetch('/api/speech/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
    signal,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const code = payload && typeof payload.error === 'string' ? payload.error : 'TTS_PROVIDER_UNAVAILABLE';
    throw new Error(code);
  }

  if (!response.body) throw new Error('TTS_STREAM_UNAVAILABLE');
  return response;
}

function streamAudioPart(payload: unknown) {
  if (!payload || typeof payload !== 'object') return null;
  const candidates = (payload as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates)) return null;

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'object') continue;
    const content = (candidate as { content?: unknown }).content;
    if (!content || typeof content !== 'object') continue;
    const parts = (content as { parts?: unknown }).parts;
    if (!Array.isArray(parts)) continue;
    for (const part of parts) {
      if (!part || typeof part !== 'object') continue;
      const inlineData = (part as { inlineData?: unknown }).inlineData;
      if (!inlineData || typeof inlineData !== 'object') continue;
      const base64 = (inlineData as { data?: unknown }).data;
      if (typeof base64 !== 'string' || !base64) continue;
      const mimeType = (inlineData as { mimeType?: unknown }).mimeType;
      return {
        base64,
        mimeType: typeof mimeType === 'string' ? mimeType : '',
      };
    }
  }
  return null;
}

function streamSampleRate(mimeType: string) {
  const match = mimeType.match(/(?:rate|samplerate)\s*=\s*(\d+)/i);
  const parsed = match ? Number(match[1]) : 24_000;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 24_000;
}

function decodePcmBase64(base64: string) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
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
  const [autoRead, setAutoRead] = useState(true);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [speechNotice, setSpeechNotice] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesScrollRef = useRef<HTMLElement>(null);
  const openingStartedRef = useRef<string | null>(null);
  const openingPromiseRef = useRef<{ id: string; promise: Promise<void> } | null>(null);
  const newConversationPromiseRef = useRef<Promise<string> | null>(null);
  const autoReadRef = useRef(true);
  const speakingMessageIdRef = useRef<string | null>(null);
  const speechGenerationRef = useRef(0);
  const spokenMessageIdsRef = useRef(new Set<string>());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const audioRequestRef = useRef<AbortController | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourcesRef = useRef(new Set<AudioBufferSourceNode>());
  const audioStreamRequestRef = useRef<AbortController | null>(null);

  const stopSpeech = useCallback(() => {
    speechGenerationRef.current += 1;
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
    audioStreamRequestRef.current?.abort();
    audioStreamRequestRef.current = null;
    audioRequestRef.current?.abort();
    audioRequestRef.current = null;
    for (const source of audioSourcesRef.current) {
      source.onended = null;
      try {
        source.stop();
      } catch {
        // A source can already have ended between the iteration and stop().
      }
    }
    audioSourcesRef.current.clear();
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    audioRef.current = null;
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    speakingMessageIdRef.current = null;
    setSpeakingMessageId(null);
  }, []);

  const speakText = useCallback((text: string, messageId: string, reportError: boolean) => {
    if (!text.trim()) return false;
    stopSpeech();
    const generation = speechGenerationRef.current;

    if (reportError) {
      setSendError('');
      setSpeechNotice('');
    }

    const clearSpeakingState = () => {
      if (speechGenerationRef.current === generation) {
        speakingMessageIdRef.current = null;
        setSpeakingMessageId(null);
      }
    };

    const showSpeechError = (error: unknown) => {
      if (speechGenerationRef.current !== generation) return;
      const code = error instanceof Error ? error.message : '';
      const message = code === 'TTS_NOT_CONFIGURED'
        ? 'Giọng đọc AI chưa được cấu hình trên máy chủ.'
        : code === 'TTS_RATE_LIMITED'
          ? 'Gemini đang giới hạn lượt đọc. Bạn hãy thử lại sau vài giây nhé.'
        : code === 'TTS_PROVIDER_TIMEOUT'
          ? 'Giọng đọc đang phản hồi chậm. Bạn hãy thử lại sau một chút nhé.'
          : code === 'TTS_AUDIO_MISSING'
            ? 'Life Lab chưa tạo được âm thanh cho phản hồi này. Bạn hãy thử lại nhé.'
            : 'Chưa tải được giọng đọc AI. Bạn hãy thử lại sau.';
      if (reportError) setSendError(message);
      else setSpeechNotice(message);
    };

    const startBufferedAudio = () => {
      if (speechGenerationRef.current !== generation) return;
      const controller = new AbortController();
      audioRequestRef.current = controller;

      void requestSpeechAudio(text, controller.signal)
        .then(async (audioBlob) => {
          if (speechGenerationRef.current !== generation) return;

          const objectUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(objectUrl);
          audio.preload = 'auto';
          audio.setAttribute('playsinline', 'true');
          audioUrlRef.current = objectUrl;
          audioRef.current = audio;

          const finish = () => {
            if (audioRef.current === audio) audioRef.current = null;
            if (audioUrlRef.current === objectUrl) {
              URL.revokeObjectURL(objectUrl);
              audioUrlRef.current = null;
            }
            clearSpeakingState();
          };
          audio.onended = finish;
          audio.onerror = () => {
            const isCurrent = speechGenerationRef.current === generation;
            finish();
            if (isCurrent) showSpeechError(new Error('TTS_AUDIO_PLAYBACK_FAILED'));
          };

          try {
            await audio.play();
          } catch (error) {
            finish();
            if (speechGenerationRef.current === generation) {
              const blocked = error instanceof DOMException && error.name === 'NotAllowedError';
              if (blocked) {
                const message = 'Trình duyệt đang chặn tự phát âm thanh. Chạm “Nghe phản hồi” để bật giọng đọc.';
                if (reportError) setSendError(message);
                else setSpeechNotice(message);
              } else {
                showSpeechError(error);
              }
            }
          }
        })
        .catch((error) => {
          if (speechGenerationRef.current !== generation || (error instanceof DOMException && error.name === 'AbortError')) return;
          clearSpeakingState();
          showSpeechError(error);
        })
        .finally(() => {
          if (audioRequestRef.current === controller) audioRequestRef.current = null;
        });
    };

    const startStreamingAudio = () => {
      const controller = new AbortController();
      audioStreamRequestRef.current = controller;

      void requestSpeechStream(text, controller.signal)
        .then(async (response) => {
          if (speechGenerationRef.current !== generation) return;

          const AudioContextConstructor = window.AudioContext ||
            (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
          if (!AudioContextConstructor) throw new Error('TTS_AUDIO_UNAVAILABLE');

          const context = audioContextRef.current || new AudioContextConstructor();
          audioContextRef.current = context;
          if (context.state === 'suspended') await context.resume();

          const reader = response.body!.getReader();
          const decoder = new TextDecoder();
          let eventBuffer = '';
          let nextStartTime = context.currentTime + 0.04;
          let streamFinished = false;
          let receivedAudio = false;
          let receivedPcmBytes = 0;

          const finishIfDone = () => {
            if (streamFinished && audioSourcesRef.current.size === 0) clearSpeakingState();
          };

          const scheduleAudio = (base64: string, mimeType: string) => {
            const bytes = decodePcmBase64(base64);
            const usableBytes = bytes.byteLength - (bytes.byteLength % 2);
            if (!usableBytes) return;

            receivedPcmBytes += usableBytes;
            if (receivedPcmBytes > 10 * 1024 * 1024) throw new Error('TTS_AUDIO_INVALID');

            const pcmView = new DataView(bytes.buffer, bytes.byteOffset, usableBytes);
            const audioBuffer = context.createBuffer(1, usableBytes / 2, streamSampleRate(mimeType));
            const channel = audioBuffer.getChannelData(0);
            for (let index = 0; index < channel.length; index += 1) {
              channel[index] = pcmView.getInt16(index * 2, true) / 32768;
            }

            const source = context.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(context.destination);
            // Keep the reflective tone while trimming a little dead air from
            // each chunk. The small rate bump is intentionally subtle so the
            // female voice remains natural in Vietnamese.
            source.playbackRate.value = 1.06;
            const startAt = Math.max(nextStartTime, context.currentTime + 0.04);
            source.start(startAt);
            nextStartTime = startAt + audioBuffer.duration / source.playbackRate.value;
            receivedAudio = true;
            audioSourcesRef.current.add(source);
            source.onended = () => {
              audioSourcesRef.current.delete(source);
              source.disconnect();
              finishIfDone();
            };
          };

          const processEvent = (eventBlock: string) => {
            const dataString = eventBlock
              .split(/\r?\n/)
              .filter((line) => line.startsWith('data:'))
              .map((line) => line.slice(5).trim())
              .join('');
            if (!dataString || dataString === '[DONE]') return;
            try {
              const payload = JSON.parse(dataString);
              const audio = streamAudioPart(payload);
              if (audio) scheduleAudio(audio.base64, audio.mimeType);
            } catch (error) {
              if (error instanceof Error && error.message === 'TTS_AUDIO_INVALID') throw error;
              // A malformed provider event should not stop already scheduled audio.
            }
          };

          try {
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
          } finally {
            reader.releaseLock();
          }

          streamFinished = true;
          finishIfDone();
          if (!receivedAudio) throw new Error('TTS_AUDIO_MISSING');
        })
        .catch((error) => {
          if (speechGenerationRef.current !== generation || (error instanceof DOMException && error.name === 'AbortError')) return;
          // Older server builds may not have the streaming route yet. Keep a
          // buffered Gemini WAV fallback for that one compatibility case.
          if (error instanceof Error && error.message === 'TTS_STREAM_UNAVAILABLE') {
            startBufferedAudio();
            return;
          }
          clearSpeakingState();
          showSpeechError(error);
        })
        .finally(() => {
          if (audioStreamRequestRef.current === controller) audioStreamRequestRef.current = null;
        });
    };

    speakingMessageIdRef.current = messageId;
    setSpeakingMessageId(messageId);

    // Server-generated Gemini audio is preferred everywhere. Web Audio lets
    // the first PCM chunk play while the remaining chunks are still arriving;
    // the WAV endpoint remains a compatibility fallback for old browsers.
    const AudioContextConstructor = typeof window !== 'undefined' && (window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
    if (AudioContextConstructor) startStreamingAudio();
    else startBufferedAudio();
    return true;
  }, [stopSpeech]);

  const queueAutoRead = useCallback((message: Message) => {
    if (!autoReadRef.current || !message.content || spokenMessageIdsRef.current.has(message.id)) return;
    spokenMessageIdsRef.current.add(message.id);
    speakText(message.content, message.id, false);
  }, [speakText]);

  useEffect(() => () => {
    stopSpeech();
  }, [stopSpeech]);

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
      setIsLoadingConversation(true);
      setConversationError('');
      try {
        // React Strict Mode can run this effect twice in development. Share
        // the creation request so `/new` never leaves duplicate conversations
        // behind before the router replacement settles.
        if (routeConversationId !== 'new') newConversationPromiseRef.current = null;
        let activeId = routeConversationId;
        let createdNewConversation = false;
        if (activeId === 'new') {
          if (!newConversationPromiseRef.current) {
            newConversationPromiseRef.current = (async () => {
              const createResponse = await fetch('/api/conversations', { method: 'POST' });
              if (!createResponse.ok) throw new Error('Không thể tạo cuộc trò chuyện');
              const created = await createResponse.json();
              if (typeof created?.data?.id !== 'string') throw new Error('Phản hồi tạo cuộc trò chuyện không hợp lệ');
              return created.data.id as string;
            })();
          }
          activeId = await newConversationPromiseRef.current;
          createdNewConversation = true;
          if (!cancelled) {
            setConversationId(activeId);
            router.replace(`/app/conversations/${activeId}`);
          }
        }

        const loadData = async () => {
          const response = await fetch(`/api/conversations/${activeId}`);
          if (!response.ok) throw new Error(response.status === 401 ? 'Phiên đăng nhập đã hết hạn' : 'Không thể tải cuộc trò chuyện');
          const json = await response.json();
          return json.data as Record<string, unknown>;
        };

        let data = await loadData();
        const loadedMessages = Array.isArray(data.messages) ? data.messages : [];
        const shouldOpen = createdNewConversation || loadedMessages.length === 0;
        if (shouldOpen) {
          if (openingStartedRef.current !== activeId) {
            openingStartedRef.current = activeId;
            const openingPromise = requestOpeningTurn(activeId);
            openingPromiseRef.current = { id: activeId, promise: openingPromise };
            await openingPromise;
          } else if (openingPromiseRef.current?.id === activeId) {
            // A route.replace can re-run this effect while the first opening
            // request is still streaming. Wait for that same request instead
            // of briefly rendering an empty conversation.
            await openingPromiseRef.current.promise;
          }
          data = await loadData();
        }
        if (cancelled) return;

        setConversationId(activeId);
        const mappedMessages = mapConversationMessages(data);
        setMessages(mappedMessages);
        if (shouldOpen) {
          const openingMessage = mappedMessages.find((message) => message.role === 'assistant' && message.content);
          if (openingMessage) queueAutoRead(openingMessage);
        }
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
  }, [queueAutoRead, routeConversationId, router]);

  const handleSpeakMessage = (message: Message) => {
    if (speakingMessageIdRef.current === message.id) {
      stopSpeech();
      return;
    }
    speakText(message.content, message.id, true);
  };

  const handleAutoReadChange = (enabled: boolean) => {
    autoReadRef.current = enabled;
    setAutoRead(enabled);
    if (!enabled) {
      setSpeechNotice('');
      stopSpeech();
    }
  };

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
                    ? {
                        ...message,
                        observation: {
                          ...(data as Observation),
                          dimensionLabel: labelDimension(String(data.dimension)),
                        },
                      }
                    : message
                )
              );
            }
            // `message.completed` is the first moment the full answer is
            // available. Start TTS here instead of waiting for the reader's
            // final close notification, so audio generation overlaps that
            // tiny stream teardown.
            if (eventType === 'message.completed' && accumulatedText) {
              queueAutoRead({
                id: assistantMsgId,
                role: 'assistant',
                content: accumulatedText,
                timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
              });
            }
          } catch {
            // Malformed provider events are ignored without breaking the current conversation.
          }
        }
      }
      if (accumulatedText) {
        queueAutoRead({
          id: assistantMsgId,
          role: 'assistant',
          content: accumulatedText,
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        });
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

      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-calm-deep-moss/55 px-3.5 py-2 text-[11px] font-medium text-calm-fog/80">
          <input
            type="checkbox"
            checked={autoRead}
            onChange={(event) => handleAutoReadChange(event.target.checked)}
            className="h-3.5 w-3.5 accent-[#b9c6a5]"
          />
          <Volume2 size={14} className="text-calm-lichen" />
          Tự đọc bằng giọng AI
        </label>
        {speechNotice && (
          <p className="text-[11px] text-[#e7d3a9]" role="status">
            {speechNotice}
          </p>
        )}
      </div>

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
                      {message.content && (
                        <button
                          type="button"
                          onClick={() => handleSpeakMessage(message)}
                          className="inline-flex items-center gap-1 rounded-full px-1.5 py-1 text-calm-fog/65 transition hover:bg-white/5 hover:text-calm-lichen"
                          aria-label={speakingMessageId === message.id ? 'Dừng đọc phản hồi' : 'Đọc phản hồi'}
                          title={speakingMessageId === message.id ? 'Dừng đọc' : 'Đọc phản hồi'}
                        >
                          {speakingMessageId === message.id ? <VolumeX size={13} /> : <Volume2 size={13} />}
                          <span>{speakingMessageId === message.id ? 'Dừng đọc' : 'Nghe phản hồi'}</span>
                        </button>
                      )}
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
