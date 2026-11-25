import React from 'react';
import { Tilt3DCard } from '../ui/Tilt3DCard';

export const TodayScreen: React.FC<{
  activeExperiment?: { action: string; learningQuestion: string; reviewDate: string } | null;
  onGoCheckin?: () => void;
  onGoReview?: () => void;
}> = ({ activeExperiment, onGoCheckin, onGoReview }) => {
  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#182D26] px-6 py-10 max-w-2xl mx-auto space-y-6">
      <Tilt3DCard
        intensity={4}
        className="p-5 rounded-3xl bg-[#E8EDE5]/70 border border-[#BBC7BC] flex items-center gap-4"
      >
        <div className="w-14 h-14 rounded-2xl bg-white border border-[#BBC7BC] flex items-center justify-center shrink-0">
          <img
            src="/assets/3d/leaf-seed-garden.png"
            alt="Khu vườn hạt mầm 3D"
            className="w-10 h-10 object-contain leaf-float"
          />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[#254B3D]">Hôm nay</h2>
          <p className="text-sm text-[#182D26]/75 mt-1">
            Tập trung vào bước đi nhỏ kế tiếp để giữ sự liền mạch.
          </p>
        </div>
      </Tilt3DCard>

      {activeExperiment ? (
        <Tilt3DCard
          intensity={4}
          className="p-6 bg-white rounded-2xl border border-[#BBC7BC] space-y-4 shadow-sm"
        >
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

          <div className="pt-2 flex flex-wrap justify-end gap-2.5">
            {onGoReview && (
              <button
                type="button"
                onClick={onGoReview}
                className="px-5 py-2.5 border border-[#BBC7BC] bg-white hover:bg-[#E8EDE5] text-[#254B3D] rounded-full font-medium text-sm min-h-[44px] cursor-pointer"
              >
                Nhìn lại bước thử
              </button>
            )}
            <button
              type="button"
              onClick={onGoCheckin}
              className="px-6 py-2.5 bg-[#254B3D] hover:bg-[#182D26] text-white rounded-full font-medium text-sm min-h-[44px] shadow-sm cursor-pointer"
            >
              Ghi nhận hôm nay
            </button>
          </div>
        </Tilt3DCard>
      ) : (
        <div className="p-10 text-center bg-white rounded-2xl border border-[#BBC7BC] space-y-4 shadow-xs">
          <img
            src="/assets/3d/leaf-fluttering-3d.png"
            alt=""
            aria-hidden="true"
            className="w-14 h-14 mx-auto object-contain leaf-float"
          />
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
