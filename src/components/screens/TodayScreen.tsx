import React from 'react';

export const TodayScreen: React.FC<{
  activeExperiment?: { action: string; learningQuestion: string; reviewDate: string } | null;
  onGoCheckin?: () => void;
}> = ({ activeExperiment, onGoCheckin }) => {
  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#182D26] px-6 py-10 max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#254B3D]">Hôm nay</h2>
        <p className="text-sm text-[#182D26]/70 mt-1">
          Tập trung vào bước đi nhỏ kế tiếp để giữ sự liền mạch.
        </p>
      </div>

      {activeExperiment ? (
        <div className="p-6 bg-white rounded-2xl border border-[#BBC7BC] space-y-4 shadow-sm">
          <div className="flex justify-between items-center">
            <span className="text-xs uppercase font-semibold text-[#254B3D] px-2.5 py-1 bg-[#E8EDE5] rounded-md">
              Bước thử đang chạy
            </span>
            <span className="text-xs text-[#182D26]/60">Nhìn lại: {activeExperiment.reviewDate}</span>
          </div>

          <div>
            <h3 className="font-semibold text-lg text-[#254B3D]">{activeExperiment.action}</h3>
            <p className="text-sm text-[#182D26]/80 mt-1 leading-relaxed">
              Mục tiêu kiểm chứng: {activeExperiment.learningQuestion}
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={onGoCheckin}
              className="px-6 py-2.5 bg-[#254B3D] text-white rounded-full font-medium text-sm min-h-[44px] shadow-sm"
            >
              Ghi nhận hôm nay
            </button>
          </div>
        </div>
      ) : (
        <div className="p-10 text-center bg-white rounded-2xl border border-[#BBC7BC] space-y-4">
          <p className="text-base text-[#182D26]/80 font-medium">Bạn đang phân vân điều gì?</p>
          <a
            href="/start"
            className="inline-flex items-center justify-center px-6 py-3 bg-[#254B3D] text-[#F7F5EF] rounded-full font-medium min-h-[44px] shadow-sm text-sm"
          >
            Bắt đầu một quyết định
          </a>
        </div>
      )}
    </div>
  );
};
