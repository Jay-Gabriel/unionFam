import React, { useState } from 'react';
import {
  Compass,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Gem,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  X,
} from 'lucide-react';

interface InteractiveSpotlightTourProps {
  isActive: boolean;
  onComplete: () => void;
}

interface SpotlightStep {
  title: string;
  subtitle: string;
  description: string;
  positionClass: string; // Tailwind positioning for tooltip card
  targetHint: string;
  icon: React.ReactNode;
}

const SPOTLIGHT_STEPS: SpotlightStep[] = [
  {
    title: '1. The Living Map (Bản đồ 3D)',
    subtitle: 'Khu vực Bản đồ bên trái',
    description:
      'Hòn đảo 3D đại diện cho các khía cạnh cuộc sống: Sự nghiệp (Work), Tiền bạc (Money), Kỳ vọng (Relationships), Đảo mong ước (Desired Difference).\n\n👉 Thao tác: Giữ chuột trái xoay 360°, lăn chuột để Zoom, nhấp vào công trình để hướng ngọn hải đăng soi rọi vào đó.',
    positionClass: 'top-20 left-12 max-w-md',
    targetHint: 'Nhấp thử vào các địa danh trên bản đồ 3D để đổi chủ đề hội thoại',
    icon: <MapPin className="w-5 h-5 text-emerald-400" />,
  },
  {
    title: '2. Bảng Đối thoại AI Coaching',
    subtitle: 'Khung Chat bên phải',
    description:
      'Nơi diễn ra các phiên khai vấn phản chiếu (Reflection). AI tại Life Lab không phán xét, không dạy đời, chỉ phản chiếu những điều bạn bộc bạch thành các giả thuyết để bạn tự chiêm nghiệm.',
    positionClass: 'top-28 right-[460px] max-w-md',
    targetHint: 'Gõ tin nhắn chia sẻ hoặc trả lời các câu hỏi phản chiếu của AI',
    icon: <MessageSquare className="w-5 h-5 text-sky-400" />,
  },
  {
    title: '3. Quyền làm chủ sự thật (Verify & Repair)',
    subtitle: '3 Nút Phản hồi & Nút Repair',
    description:
      'Sau khi AI đưa ra phản chiếu, BẠN LÀ NGƯỜI DUY NHẤT XÁC NHẬN:\n• [Right on]: Đúng hoàn toàn → Thăng cấp điểm Clarity.\n• [Partly right]: Đúng một phần → Chia sẻ thêm.\n• [Repair]: AI hiểu sai → Viết lại định nghĩa theo ý bạn.',
    positionClass: 'bottom-20 right-[460px] max-w-md',
    targetHint: 'Bấm thử [Right on] để bắn pháo hoa và thăng hạng nhận thức',
    icon: <ShieldCheck className="w-5 h-5 text-amber-400" />,
  },
  {
    title: '4. Thanh Điểm Nhận Thức (Clarity Score)',
    subtitle: 'Góc trên cùng bên phải',
    description:
      'Thang đo mức độ thấu hiểu bản thân gồm 5 viên đá quý lấp lánh (Ruby, Đồng, Sapphire, Ngọc lục bảo). Càng xác thực được nhiều Insight, bản đồ tâm trí của bạn càng trở nên rõ ràng và vững vàng.',
    positionClass: 'top-16 right-6 max-w-md',
    targetHint: 'Đạt điểm Clarity cao để hoàn thành trọn vẹn phiên làm việc',
    icon: <Gem className="w-5 h-5 text-purple-400" />,
  },
  {
    title: '5. Thanh Điều Khiển & Memory Center',
    subtitle: 'Thanh công cụ dưới cùng',
    description:
      'Bạn luôn nắm quyền kiểm soát tuyệt đối:\n• [Stop]: Dừng phiên ngay lập tức.\n• [Change Topic]: Đổi chủ đề khai vấn.\n• [Memory Center]: Xem, sửa, xóa mọi ký ức đã lưu.\n• [No Memory]: Bật chế độ trò chuyện ẩn danh.',
    positionClass: 'bottom-16 left-12 max-w-md',
    targetHint: 'Bấm Memory Center để xem các insight đã được bạn xác thực',
    icon: <Compass className="w-5 h-5 text-amber-300" />,
  },
];

export const InteractiveSpotlightTour: React.FC<InteractiveSpotlightTourProps> = ({
  isActive,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isActive) return null;

  const step = SPOTLIGHT_STEPS[currentStep];
  const isLast = currentStep === SPOTLIGHT_STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-40 pointer-events-auto select-none">
      {/* Semi-transparent Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300" />

      {/* Floating Spotlight Tooltip Box */}
      <div
        className={`absolute ${step.positionClass} z-50 bg-[#22262c] border-2 border-amber-400/80 rounded-3xl p-5 shadow-[0_0_40px_rgba(0,0,0,0.9)] animate-fadeIn`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
              {step.icon}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                Hướng dẫn trực quan ({currentStep + 1}/{SPOTLIGHT_STEPS.length})
              </span>
              <h3 className="font-serif-title font-bold text-base text-stone-100">
                {step.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onComplete}
            className="text-stone-400 hover:text-stone-200 p-1 cursor-pointer"
            title="Đóng hướng dẫn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Description */}
        <div className="p-3.5 rounded-2xl bg-[#181a1f] border border-stone-800 text-xs text-stone-200 leading-relaxed whitespace-pre-line mb-3">
          {step.description}
        </div>

        {/* Action Hint */}
        <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-[11px] text-amber-200 flex items-center gap-2 mb-4">
          <span className="font-bold text-amber-300">💡 Chỉ dẫn:</span>
          <span>{step.targetHint}</span>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 0))}
            disabled={currentStep === 0}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-stone-300 bg-stone-700/60 hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Trước</span>
          </button>

          <div className="flex items-center gap-2">
            {!isLast ? (
              <button
                onClick={() => setCurrentStep((prev) => prev + 1)}
                className="px-4 py-1.5 rounded-xl text-xs font-bold text-stone-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95"
              >
                <span>Tiếp theo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={onComplete}
                className="px-4 py-1.5 rounded-xl text-xs font-bold text-stone-950 bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Hoàn tất & Khám phá</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
