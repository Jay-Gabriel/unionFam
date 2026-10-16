import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, BookOpen, ArrowRight, MessageSquare, Compass, Key } from 'lucide-react';
import confetti from 'canvas-confetti';

interface StoryChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToExperiments: () => void;
}

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

export const StoryChatModal: React.FC<StoryChatModalProps> = ({ isOpen, onClose, onGoToExperiments }) => {
  // Step 1: Reading Story vs Step 2: Live AI Chat
  const [phase, setPhase] = useState<'story' | 'chat'>('story');
  const [inputText, setInputText] = useState('');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('life_lab_gemini_key') || '');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      sender: 'ai',
      text: 'Chào bạn. Tôi là người bạn đồng hành của bạn tại Life Lab. Hãy dừng lại một nhịp và lắng nghe chính mình: Giữa những bận rộn và kỳ vọng của người khác, điều gì đang thực sự khiến tâm trí bạn nặng lòng nhất lúc này?',
      timestamp: 'Vừa xong',
    },
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiTyping]);

  if (!isOpen) return null;

  const handleStartChat = () => {
    setPhase('chat');
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#fef08a', '#f59e0b', '#d97706'],
    });
  };

  const handleSend = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputText).trim();
    if (!textToSend) return;

    const userMsg: Message = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsAiTyping(true);

    // Call Gemini API if Key is provided, else use intelligent simulated reflection
    if (apiKey) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: `Bạn là Life Lab AI Companion (UnionFam Blueprint). Triết lý: "Hãy kiếm tiền, nhưng trước tiên hãy biết tiền đang phục vụ cuộc đời nào". Phản chiếu nhẹ nhàng, ngắn gọn 2-3 câu, nêu giả thuyết ("Dường như...", "Có vẻ..."), không phán xét, không khuyên bảo sáo rỗng. Người dùng vừa nói: "${textToSend}"`,
                  },
                ],
              },
            ],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (aiResponse) {
            setMessages((prev) => [
              ...prev,
              {
                id: `ai_${Date.now()}`,
                sender: 'ai',
                text: aiResponse,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
            setIsAiTyping(false);
            return;
          }
        }
      } catch (e) {
        console.error('Gemini error:', e);
      }
    }

    // Fallback reflective responses (Life Lab Tone)
    setTimeout(() => {
      let reply = 'Có vẻ bạn đang phải gánh vác nhiều kỳ vọng cùng một lúc. Giữa những thứ bạn "phải làm" và điều bạn thực sự muốn dành trọn năng lượng cho nó, bạn cảm thấy sự đánh đổi lớn nhất đang nằm ở đâu?';
      if (textToSend.toLowerCase().includes('tiền') || textToSend.toLowerCase().includes('tài chính')) {
        reply = 'Dường như áp lực tài chính đang che khuất đi mục đích thực sự của bạn. Nếu gác tạm các hóa đơn sang một bên, bạn muốn dòng tiền của mình phục vụ cho một ngày sống bình an như thế nào?';
      } else if (textToSend.toLowerCase().includes('mệt') || textToSend.toLowerCase().includes('mắc kẹt')) {
        reply = 'Cảm giác mắc kẹt này không phải do bạn yếu đuối, mà là dấu hiệu cho thấy bạn đã quá sức chịu đựng với chiếc áo cũ của người khác may sẵn. Điều gì sẽ xảy ra nếu hôm nay bạn cho phép mình được nghỉ 30 phút mà không thấy tội lỗi?';
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `ai_${Date.now()}`,
          sender: 'ai',
          text: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setIsAiTyping(false);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl h-[90vh] bg-[#12162a]/95 border border-amber-300/40 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.35)] flex flex-col overflow-hidden text-stone-200">
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-amber-300/20 flex items-center justify-between bg-[#191e38]/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-300/50 flex items-center justify-center text-amber-300 shadow-md">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="font-cinzel text-sm sm:text-base font-bold text-amber-200 tracking-wider">
                CỔNG 1 · THE AWAKENING & REFLECTION
              </h2>
              <p className="text-[11px] text-amber-100/60 font-sans">
                {phase === 'story' ? 'Hành trình thức tỉnh nhận thức' : 'Đối thoại phản chiếu cùng Life Lab AI'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {phase === 'chat' && (
              <button
                onClick={() => setShowKeyInput(!showKeyInput)}
                title="Cài đặt Gemini API Key"
                className="p-2 rounded-xl bg-stone-800/60 hover:bg-amber-500/20 text-amber-300 border border-amber-300/30 transition-all cursor-pointer"
              >
                <Key className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-stone-800/60 hover:bg-red-500/20 text-stone-300 hover:text-red-300 border border-stone-700 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* API Key Drawer (Optional) */}
        {showKeyInput && (
          <div className="p-3 bg-[#1e2447] border-b border-amber-300/30 flex items-center gap-3 text-xs">
            <span className="text-amber-200 whitespace-nowrap font-semibold">Gemini API Key:</span>
            <input
              type="password"
              placeholder="Dán khóa API của bạn vào đây (tùy chọn)..."
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                localStorage.setItem('life_lab_gemini_key', e.target.value);
              }}
              className="flex-1 bg-black/40 border border-amber-300/30 rounded-lg px-3 py-1.5 text-stone-100 focus:outline-none focus:border-amber-400"
            />
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {phase === 'story' ? (
            /* STAGE 1: THE STORY */
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-6 max-w-3xl mx-auto leading-relaxed text-stone-300 select-text">
              <div className="text-center space-y-2 mb-8">
                <span className="font-cinzel text-xs text-amber-300 tracking-[0.3em] uppercase block">
                  Chương I · Lời Kêu Gọi
                </span>
                <h3 className="font-playfair text-2xl sm:text-3xl lg:text-4xl font-bold text-amber-100 gold-glow-text">
                  Bạn Đang Sống Cuộc Đời Của Ai?
                </h3>
              </div>

              <div className="space-y-4 font-sans text-sm sm:text-base text-stone-200/90 leading-relaxed">
                <p className="first-letter:text-4xl first-letter:font-cinzel first-letter:text-amber-300 first-letter:mr-2 first-letter:float-left">
                  Rất nhiều năm trong đời, chúng ta bận rộn chạy theo những chiếc huy chương do người khác trao tặng. Chúng ta làm việc cật lực để mua những thứ mình không thực sự cần, chỉ để gây ấn tượng với những người ta thậm chí không thích.
                </p>

                <p className="border-l-2 border-amber-400/80 pl-4 py-1 italic text-amber-100 bg-amber-500/10 rounded-r-lg">
                  "Hãy kiếm tiền, nhưng trước tiên hãy biết tiền đang phục vụ cho cuộc đời nào."
                </p>

                <p>
                  Life Lab không bảo bạn phải buông bỏ tất cả để lao theo đam mê viển vông. Điều chúng ta cùng làm ở đây là một cuộc thám hiểm trung thực: Nhận diện sự đánh đổi (Trade-offs), phân tách ranh giới giữa kỳ vọng xã hội và nhu cầu sâu thẳm bên trong tâm hồn bạn.
                </p>

                <p>
                  Khi bước qua cánh cổng này, bạn không còn đơn độc. Khung chat phía trước là chiếc gương phản chiếu tĩnh lặng, nơi bạn có thể trút bỏ lớp áo giáp phòng thủ và thành thật với chính mình.
                </p>
              </div>

              {/* Action Button to Transition to Chat */}
              <div className="pt-8 text-center">
                <button
                  onClick={handleStartChat}
                  className="px-8 py-3.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-stone-950 font-cinzel font-bold text-sm tracking-widest uppercase shadow-[0_0_25px_rgba(245,158,11,0.6)] hover:scale-105 transition-all cursor-pointer inline-flex items-center gap-3"
                >
                  <span>Tôi Đã Hiểu · Bắt Đầu Đối Thoại</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* STAGE 2: LIVE CHAT TERMINAL */
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 select-text">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed ${
                        m.sender === 'user'
                          ? 'bg-amber-500 text-stone-950 font-medium rounded-tr-xs shadow-md'
                          : 'bg-[#1b2140]/90 text-stone-100 border border-amber-300/30 rounded-tl-xs shadow-[0_0_15px_rgba(0,0,0,0.3)]'
                      }`}
                    >
                      <p>{m.text}</p>
                      <span className={`text-[10px] block mt-1 ${m.sender === 'user' ? 'text-stone-800' : 'text-stone-400'}`}>
                        {m.timestamp}
                      </span>
                    </div>
                  </div>
                ))}

                {isAiTyping && (
                  <div className="flex justify-start">
                    <div className="bg-[#1b2140] border border-amber-300/30 rounded-2xl rounded-tl-xs p-3 text-xs text-amber-200 flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                      <span>Life Lab đang lắng nghe và phản chiếu...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Quick Prompt Suggestions */}
              <div className="px-4 py-2 border-t border-amber-300/10 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
                <span className="text-[11px] text-amber-300/70 whitespace-nowrap">Gợi ý băn khoăn:</span>
                {[
                  'Tôi đang cảm thấy quá tải và mất phương hướng',
                  'Tôi làm việc kiếm tiền nhưng không thấy hạnh phúc',
                  'Làm sao để biết mình thực sự muốn gì?',
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(chip)}
                    className="text-xs bg-[#181d38] hover:bg-amber-500/20 border border-amber-300/30 text-amber-200/90 px-3 py-1 rounded-full whitespace-nowrap cursor-pointer transition-all active:scale-95 shrink-0"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 sm:p-4 bg-[#161a33] border-t border-amber-300/20 flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  placeholder="Chia sẻ băn khoăn hay cảm xúc của bạn..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  className="flex-1 bg-black/40 border border-amber-300/30 rounded-xl px-4 py-3 text-stone-100 text-sm placeholder:text-stone-500 focus:outline-none focus:border-amber-400"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!inputText.trim() || isAiTyping}
                  className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all active:scale-95 shadow-md"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Jump to Portal 2 */}
              <div className="p-2.5 bg-[#121528] border-t border-stone-800 flex items-center justify-between text-xs px-4">
                <span className="text-stone-400">Đã có insight và muốn biến thành hành động?</span>
                <button
                  onClick={onGoToExperiments}
                  className="text-amber-300 hover:text-amber-200 font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Chuyển sang Cổng 2 (Thí Nghiệm)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
