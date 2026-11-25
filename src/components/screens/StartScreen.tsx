import React, { useState } from 'react';
import { LeafMascot3D } from '../ui/LeafMascot3D';
import { Tilt3DCard } from '../ui/Tilt3DCard';

const SCENARIOS = [
  {
    id: 'work_life',
    title: 'Ở lại hay đổi việc?',
    samplePrompt: 'Tôi cảm thấy công việc quá tải và muốn cân bằng lại ranh giới cá nhân.',
  },
  {
    id: 'family_boundary',
    title: 'Ranh giới gia đình & bản thân',
    samplePrompt: 'Mình đang phân vân giữa kỳ vọng của gia đình và nhịp sống mình thực sự muốn.',
  },
  {
    id: 'money_time',
    title: 'Tiền bạc & thời gian sống',
    samplePrompt: 'Thu nhập hiện tại ổn nhưng mình cảm thấy đánh đổi quá nhiều thời gian và sức khỏe.',
  },
  {
    id: 'custom',
    title: 'Một lựa chọn khác',
    samplePrompt: '',
  },
];

export const StartScreen: React.FC<{ onSubmit: (data: any) => void }> = ({ onSubmit }) => {
  const [selectedScenario, setSelectedScenario] = useState('work_life');
  const [problemText, setProblemText] = useState('');
  const [consented, setConsented] = useState(false);

  const handleSelectScenario = (id: string, samplePrompt: string) => {
    setSelectedScenario(id);
    if (!problemText.trim() && samplePrompt) {
      setProblemText(samplePrompt);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#182D26] px-6 py-10 max-w-2xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#E8EDE5]/60 border border-[#BBC7BC] rounded-3xl p-5">
        <LeafMascot3D mood="caring" size="md" />
        <div className="text-center sm:text-left">
          <h2 className="text-2xl font-bold text-[#254B3D]">Bắt đầu một lựa chọn</h2>
          <p className="text-sm text-[#182D26]/75 mt-1 leading-relaxed">
            Cứ chậm rãi kể một điều nhỏ thôi, Chiếc Lá đang lắng nghe bạn. Chúng ta không cần giải quyết toàn bộ cuộc sống hôm nay.
          </p>
        </div>
      </div>

      <div className="space-y-2.5">
        <label className="text-sm font-semibold">Tình huống của bạn:</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SCENARIOS.map((sc) => (
            <Tilt3DCard key={sc.id} intensity={4}>
              <button
                type="button"
                onClick={() => handleSelectScenario(sc.id, sc.samplePrompt)}
                className={`w-full p-3.5 text-left rounded-2xl border text-sm font-medium transition min-h-[44px] cursor-pointer ${
                  selectedScenario === sc.id
                    ? 'border-[#254B3D] bg-[#E8EDE5] text-[#254B3D] shadow-xs'
                    : 'border-[#BBC7BC] bg-white hover:bg-[#FAF8F2]'
                }`}
              >
                {sc.title}
              </button>
            </Tilt3DCard>
          ))}
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
          className="w-full p-3.5 rounded-2xl border border-[#BBC7BC] bg-white focus:outline-[#254B3D] text-sm shadow-xs"
        />
      </div>

      <div className="p-4 rounded-2xl bg-[#E8EDE5]/70 border border-[#BBC7BC] space-y-2 text-sm">
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
          <span className="text-xs font-semibold text-[#182D26]">
            Đồng ý xử lý nội dung cho phiên làm việc này
          </span>
        </label>
      </div>

      <button
        type="button"
        disabled={!consented || !problemText.trim()}
        onClick={() => onSubmit({ scenarioId: selectedScenario, problemText, consented })}
        className="w-full min-h-[44px] py-3.5 bg-[#254B3D] hover:bg-[#182D26] disabled:opacity-40 text-[#F7F5EF] font-medium rounded-full transition shadow-sm cursor-pointer"
      >
        Bắt đầu làm rõ
      </button>
    </div>
  );
};
