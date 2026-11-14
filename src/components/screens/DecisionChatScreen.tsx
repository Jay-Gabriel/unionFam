import React, { useState } from 'react';
import { DecisionCardRecord } from '../../types/decisionJourney';
import { canDesignExperiment } from '../../services/decisionStateMachine';

export const DecisionChatScreen: React.FC<{ onDesignExperiment: () => void }> = ({ onDesignExperiment }) => {
  const [messages, setMessages] = useState<{ id: string; role: 'user' | 'assistant'; text: string }[]>([
    { id: '1', role: 'assistant', text: 'Chào bạn. Bạn đang băn khoăn về lựa chọn nào nhất lúc này?' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [card, setCard] = useState<DecisionCardRecord>({
    id: 'dec-current',
    title: 'Quyết định công việc',
    status: 'DRAFT',
    current_revision: 1,
    decision_question: 'Tôi nên ở lại hay đổi việc?',
    criteria: ['Bảo toàn sức khỏe'],
    hard_constraints: [],
    options: [],
    uncertainties: [],
    confirmed_fields: { decision_question: true, criteria: true }
  });

  const [activeProposal, setActiveProposal] = useState<any>(null);

  const handleSend = () => {
    if (!inputText.trim()) return;
    const userMsg = { id: Date.now().toString(), role: 'user' as const, text: inputText };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsAiLoading(true);

    // Giả lập phản hồi AI an toàn có đề xuất
    setTimeout(() => {
      setIsAiLoading(false);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: 'Mình đã nắm được. Mình có đề xuất thêm tiêu chí vào Thẻ Quyết Định bên phải.'
      }]);
      setActiveProposal({
        criteria: ['Bảo toàn sức khỏe', 'Thu nhập tối thiểu duy trì sinh hoạt']
      });
    }, 400);
  };

  const handleStop = () => {
    setIsAiLoading(false);
  };

  const handleAcceptProposal = () => {
    if (activeProposal) {
      setCard(prev => ({
        ...prev,
        criteria: activeProposal.criteria,
        current_revision: prev.current_revision + 1,
        confirmed_fields: { ...prev.confirmed_fields, criteria: true }
      }));
      setActiveProposal(null);
    }
  };

  const experimentReady = canDesignExperiment(card);

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#182D26] flex flex-col md:flex-row">
      {/* Cột 1: Chat (khoảng 60%) */}
      <div className="flex-1 md:w-[60%] flex flex-col h-screen border-r border-[#BBC7BC]">
        <div className="p-4 border-b border-[#BBC7BC] flex justify-between items-center bg-white/50">
          <div>
            <h2 className="font-semibold text-lg text-[#254B3D]">{card.title}</h2>
            <span className="text-xs text-[#182D26]/60">Phiên bản: r{card.current_revision}</span>
          </div>
          {isAiLoading && (
            <button
              onClick={handleStop}
              className="text-xs px-3 py-1.5 bg-red-100 text-red-700 rounded-full font-medium min-h-[32px]"
            >
              Dừng trò chuyện
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[80%] p-3.5 rounded-2xl text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'ml-auto bg-[#254B3D] text-[#F7F5EF]'
                  : 'bg-[#E8EDE5] text-[#182D26]'
              }`}
            >
              {m.text}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-[#BBC7BC] flex gap-2 bg-white/50">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Nhập chia sẻ của bạn..."
            disabled={isAiLoading}
            className="flex-1 p-2.5 rounded-xl border border-[#BBC7BC] bg-white focus:outline-[#254B3D] text-sm"
          />
          <button
            onClick={handleSend}
            disabled={isAiLoading || !inputText.trim()}
            className="px-6 py-2.5 bg-[#254B3D] text-white rounded-xl font-medium disabled:opacity-40 min-h-[44px]"
          >
            Gửi
          </button>
        </div>
      </div>

      {/* Cột 2: Thẻ Quyết Định (khoảng 40%) */}
      <div className="md:w-[40%] p-6 overflow-y-auto flex flex-col justify-between h-screen bg-[#F7F5EF]">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-xl text-[#254B3D]">Thẻ Quyết Định</h3>
            <span className="text-xs px-2 py-0.5 rounded bg-[#E8EDE5] text-[#254B3D] font-medium">
              {card.status}
            </span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-[#BBC7BC] space-y-3">
            <div>
              <span className="text-xs font-semibold text-[#182D26]/60">CÂU HỎI QUYẾT ĐỊNH</span>
              <p className="font-medium text-sm mt-0.5">{card.decision_question}</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-[#182D26]/60">ĐIỀU QUAN TRỌNG</span>
              <ul className="list-disc list-inside text-sm space-y-1 mt-1">
                {card.criteria.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>

            {/* Khối Proposal Review */}
            {activeProposal && (
              <div className="p-3 bg-[#E8EDE5] border border-[#254B3D]/30 rounded-xl space-y-2">
                <span className="text-xs font-bold text-[#254B3D]">ĐỀ XUẤT MỚI TỪ AI</span>
                <p className="text-xs text-[#182D26]/80">Cập nhật thêm tiêu chí quan trọng</p>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleAcceptProposal}
                    className="text-xs px-3 py-1.5 bg-[#254B3D] text-white rounded-lg font-medium min-h-[36px]"
                  >
                    Đúng với tôi
                  </button>
                  <button
                    onClick={() => setActiveProposal(null)}
                    className="text-xs px-3 py-1.5 border border-[#BBC7BC] text-[#182D26] rounded-lg min-h-[36px]"
                  >
                    Bỏ qua
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={onDesignExperiment}
          disabled={!experimentReady}
          className="w-full min-h-[44px] py-3.5 bg-[#254B3D] text-white font-medium rounded-full transition disabled:opacity-40 mt-4"
        >
          {experimentReady ? 'Thiết kế bước thử' : 'Cần làm rõ thêm câu hỏi & điều quan trọng'}
        </button>
      </div>
    </div>
  );
};
