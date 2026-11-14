import React, { useState } from 'react';

export const StartScreen: React.FC<{ onSubmit: (data: any) => void }> = ({ onSubmit }) => {
  const [selectedScenario, setSelectedScenario] = useState('work_life');
  const [problemText, setProblemText] = useState('');
  const [consented, setConsented] = useState(false);

  const handleSelectScenario = (id: string, samplePrompt: string) => {
    setSelectedScenario(id);
    if (!problemText.trim()) {
      setProblemText(samplePrompt);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#182D26] px-6 py-10 max-w-2xl mx-auto flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-[#254B3D]">Bắt đầu một lựa chọn</h2>
        <p className="text-sm text-[#182D26]/70 mt-1">
          Chúng ta không cần giải quyết toàn bộ cuộc sống hôm nay. Hãy bắt đầu từ một điều đang khiến bạn băn khoăn.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold">Tình huống của bạn:</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleSelectScenario('work_life', 'Tôi cảm thấy công việc quá tải và muốn cân bằng lại ranh giới cá nhân.')}
            className={`p-3 text-left rounded-xl border text-sm transition min-h-[44px] ${
              selectedScenario === 'work_life' ? 'border-[#254B3D] bg-[#E8EDE5]' : 'border-[#BBC7BC] bg-white'
            }`}
          >
            Ở lại hay đổi việc?
          </button>
          <button
            type="button"
            onClick={() => handleSelectScenario('custom', '')}
            className={`p-3 text-left rounded-xl border text-sm transition min-h-[44px] ${
              selectedScenario === 'custom' ? 'border-[#254B3D] bg-[#E8EDE5]' : 'border-[#BBC7BC] bg-white'
            }`}
          >
            Một lựa chọn khác
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm font-semibold">
          <label htmlFor="problem-input">Điều gì đang khiến bạn phân vân?</label>
          <span className="text-xs text-[#182D26]/60">{problemText.length}/2000 ký tự</span>
        </div>
        <textarea
          id="problem-input"
          rows={5}
          maxLength={2000}
          value={problemText}
          onChange={(e) => setProblemText(e.target.value)}
          placeholder="Điều gì đang khiến bạn phân vân?"
          className="w-full p-3 rounded-xl border border-[#BBC7BC] bg-white focus:outline-[#254B3D] text-sm"
        />
      </div>

      <div className="p-4 rounded-xl bg-[#E8EDE5]/70 border border-[#BBC7BC] space-y-2 text-sm">
        <p className="text-xs text-[#182D26]/80 leading-relaxed">
          Nội dung phiên này sẽ được gửi đến đối tác AI để phân tích gợi ý. Không cần nhập họ tên thật hoặc thông tin định danh cá nhân. Khách dùng phiên tạm trong bộ nhớ RAM; đóng trình duyệt có thể mất bản nháp.
        </p>
        <label className="flex items-center gap-2.5 cursor-pointer pt-1 min-h-[44px]">
          <input
            type="checkbox"
            checked={consented}
            onChange={(e) => setConsented(e.target.checked)}
            className="w-4 h-4 accent-[#254B3D]"
          />
          <span className="text-xs font-semibold text-[#182D26]">Đồng ý xử lý nội dung cho phiên làm việc này</span>
        </label>
      </div>

      <button
        type="button"
        disabled={!consented || !problemText.trim()}
        onClick={() => onSubmit({ scenarioId: selectedScenario, problemText, consented })}
        className="w-full min-h-[44px] py-3.5 bg-[#254B3D] disabled:opacity-40 text-[#F7F5EF] font-medium rounded-full transition shadow-sm"
      >
        Bắt đầu làm rõ
      </button>
    </div>
  );
};
