import React, { useState } from 'react';

export const ReviewScreen: React.FC<{ onFinishReview: (data: any) => void }> = ({ onFinishReview }) => {
  const [facts, setFacts] = useState('');
  const [learning, setLearning] = useState('');
  const [nextAction, setNextAction] = useState<'continue_cycle' | 'new_experiment' | 'pause' | 'close'>('continue_cycle');

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#182D26] px-6 py-10 max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#254B3D]">Nhìn lại bước thử</h2>
        <p className="text-sm text-[#182D26]/70 mt-1">
          Dừng lại và lắng nghe trải nghiệm thực tế của chính bạn.
        </p>
      </div>

      <div className="p-6 bg-white rounded-2xl border border-[#BBC7BC] space-y-4">
        <div>
          <label className="text-xs font-semibold text-[#182D26]/70">1. Điều gì đã xảy ra?</label>
          <textarea
            rows={3}
            value={facts}
            onChange={(e) => setFacts(e.target.value)}
            placeholder="Điều gì đã diễn ra trong những ngày thử?"
            className="w-full mt-1.5 p-3 rounded-xl border border-[#BBC7BC] text-sm focus:outline-[#254B3D]"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-[#182D26]/70">2. Bạn hiểu thêm điều gì?</label>
          <textarea
            rows={3}
            value={learning}
            onChange={(e) => setLearning(e.target.value)}
            placeholder="Điều bạn học được qua trải nghiệm này?"
            className="w-full mt-1.5 p-3 rounded-xl border border-[#BBC7BC] text-sm focus:outline-[#254B3D]"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-[#182D26]/70">3. Bạn muốn làm gì tiếp theo?</label>
          <select
            value={nextAction}
            onChange={(e) => setNextAction(e.target.value as any)}
            className="w-full mt-1.5 p-3 rounded-xl border border-[#BBC7BC] bg-white text-sm min-h-[44px]"
          >
            <option value="continue_cycle">Tiếp tục hành động với chu kỳ mới</option>
            <option value="new_experiment">Thiết kế một bước thử khác</option>
            <option value="pause">Tạm dừng quyết định này</option>
            <option value="close">Tôi chưa muốn quyết định (Đóng quyết định)</option>
          </select>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onFinishReview({ facts, learning, nextAction })}
        className="w-full min-h-[44px] py-3.5 bg-[#254B3D] text-[#F7F5EF] font-medium rounded-full shadow-sm"
      >
        Lưu nhìn lại
      </button>
    </div>
  );
};
