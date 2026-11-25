import React from 'react';
import { Play } from 'lucide-react';
import { LeafMascot3D } from '../ui/LeafMascot3D';
import { Tilt3DCard } from '../ui/Tilt3DCard';

interface LandingScreenProps {
  onStart: () => void;
  onReplayIntro?: () => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ onStart, onReplayIntro }) => {
  return (
    <div className="w-full bg-[#F7F5EF] text-[#182D26] px-4 sm:px-6 py-5 sm:py-12 max-w-5xl mx-auto flex flex-col gap-6 sm:gap-10">
      {/* Hero Section with Interactive 3D Leaf Mascot */}
      <header className="relative text-center flex flex-col items-center space-y-4 sm:space-y-5">
        <div className="relative inline-flex flex-col items-center">
          <div className="relative px-5 py-3 sm:px-8 sm:py-4 rounded-[28px] sm:rounded-[36px] bg-gradient-to-b from-white/90 to-[#E8EDE5]/70 border border-[#BBC7BC]/80 shadow-[0_24px_48px_-20px_rgba(37,75,61,0.28)]">
            <LeafMascot3D
              mood="welcoming"
              size="xl"
              whisper="Chào bạn, mình là Chiếc Lá nhỏ. Mình ở đây để lắng nghe bạn chậm rãi."
            />
            <span className="block mt-2 text-[11px] text-[#596A55]/85 font-medium">
              Chạm hoặc kéo nhẹ để xoay Chiếc Lá 3D
            </span>
            <img
              src="/assets/3d/sparkles-3d.png"
              alt=""
              aria-hidden="true"
              className="hidden sm:block absolute -top-3 -right-3 w-11 h-11 object-contain pollen-drift pointer-events-none"
            />
          </div>
        </div>

        <h1 className="font-playfair text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#254B3D] max-w-3xl leading-tight">
          Đang mắc kẹt trước một lựa chọn?
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-[#182D26]/80 max-w-2xl mx-auto leading-relaxed">
          Cùng Chiếc Lá làm rõ điều quan trọng và chọn một bước nhỏ để thử trước khi quyết định — không áp lực, không vội vã.
        </p>

        <div className="pt-1 sm:pt-2 w-full sm:w-auto flex flex-col sm:flex-row justify-center gap-3">
          <button
            type="button"
            onClick={onStart}
            className="w-full sm:w-auto min-h-[46px] px-8 py-3 bg-[#254B3D] text-[#F7F5EF] font-medium rounded-full hover:bg-[#182D26] transition shadow-md cursor-pointer"
          >
            Làm rõ một lựa chọn
          </button>
          {onReplayIntro && (
            <button
              type="button"
              onClick={onReplayIntro}
              className="w-full sm:w-auto min-h-[46px] px-6 py-3 bg-white border border-[#BBC7BC] text-[#254B3D] font-medium rounded-full hover:bg-[#E8EDE5] transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Xem video Chiếc Lá</span>
            </button>
          )}
        </div>
      </header>

      {/* Thẻ ví dụ minh họa với hiệu ứng nghiêng 3D */}
      <Tilt3DCard
        intensity={6}
        className="bg-[#E8EDE5] border border-[#BBC7BC] p-6 md:p-7 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center gap-5 shadow-sm"
      >
        <div className="w-16 h-16 rounded-2xl bg-white/80 border border-[#BBC7BC]/70 flex items-center justify-center shrink-0 shadow-xs">
          <img
            src="/assets/3d/leaf-fluttering-3d.png"
            alt="Lá xanh bay nhẹ"
            className="w-12 h-12 object-contain leaf-float"
          />
        </div>
        <div className="space-y-2.5 flex-1">
          <span className="inline-block text-xs uppercase font-semibold text-[#254B3D] px-2.5 py-1 bg-white/80 rounded-md">
            Ví dụ minh họa
          </span>
          <h3 className="font-semibold text-lg text-[#254B3D]">
            Nên ở lại và điều chỉnh công việc hay chuẩn bị chuyển việc?
          </h3>
          <p className="text-sm text-[#182D26]/80 leading-relaxed">
            Điều quan trọng: Sức khỏe tinh thần, đảm bảo thu nhập tối thiểu để chi trả sinh hoạt gia đình, không làm ngoài giờ kéo dài.
          </p>
          <div className="pt-1 flex flex-wrap gap-4 text-xs text-[#182D26]/75">
            <span>• Bước thử: 3 ngày trao đổi với quản lý</span>
            <span>• Nhìn lại: Sau 3 ngày</span>
          </div>
        </div>
      </Tilt3DCard>

      {/* 3 Bước giải thích đời thường kèm bộ icon 3D */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
        <Tilt3DCard
          intensity={7}
          className="sanctuary-3d-surface p-6 rounded-2xl border border-[#BBC7BC] space-y-3"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#E8EDE5]/70 flex items-center justify-center">
            <img
              src="/assets/3d/icon-3d-clarify.png"
              alt="La bàn 3D làm rõ"
              className="w-11 h-11 object-contain leaf-float"
            />
          </div>
          <div>
            <span className="text-xs font-bold text-[#254B3D] tracking-wide">01. LÀM RÕ</span>
            <p className="text-xs text-[#182D26]/80 mt-1.5 leading-relaxed">
              Xác định điều gì thực sự quan trọng và các giới hạn không thể đánh đổi.
            </p>
          </div>
        </Tilt3DCard>

        <Tilt3DCard
          intensity={7}
          className="sanctuary-3d-surface p-6 rounded-2xl border border-[#BBC7BC] space-y-3"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#E8EDE5]/70 flex items-center justify-center">
            <img
              src="/assets/3d/icon-3d-experiment.png"
              alt="Mầm non 3D thử nhỏ"
              className="w-11 h-11 object-contain leaf-float"
              style={{ animationDelay: '0.6s' }}
            />
          </div>
          <div>
            <span className="text-xs font-bold text-[#254B3D] tracking-wide">02. THỬ NHỎ</span>
            <p className="text-xs text-[#182D26]/80 mt-1.5 leading-relaxed">
              Chọn một hành động đảo ngược được trong 1-7 ngày để kiểm chứng.
            </p>
          </div>
        </Tilt3DCard>

        <Tilt3DCard
          intensity={7}
          className="sanctuary-3d-surface p-6 rounded-2xl border border-[#BBC7BC] space-y-3"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#E8EDE5]/70 flex items-center justify-center">
            <img
              src="/assets/3d/icon-3d-reflect.png"
              alt="Gương soi 3D nhìn lại"
              className="w-11 h-11 object-contain leaf-float"
              style={{ animationDelay: '1.2s' }}
            />
          </div>
          <div>
            <span className="text-xs font-bold text-[#254B3D] tracking-wide">03. NHÌN LẠI</span>
            <p className="text-xs text-[#182D26]/80 mt-1.5 leading-relaxed">
              Quan sát điều thực tế đã xảy ra trước khi quyết định tiếp tục hay dừng.
            </p>
          </div>
        </Tilt3DCard>
      </section>
    </div>
  );
};
