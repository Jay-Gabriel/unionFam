import React, { useState } from 'react';
import {
  Compass,
  MapPin,
  Sparkles,
  ShieldCheck,
  Gem,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
  BookOpen,
  Play,
} from 'lucide-react';

interface GuideTourModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TourStep {
  title: string;
  badge: string;
  targetArea: string;
  icon: React.ReactNode;
  content: string;
  actionHint: string;
  gameRule: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Chào mừng bạn đến với Life Lab!',
    badge: 'Bước 1/5: Triết lý Khởi đầu',
    targetArea: 'Chào mừng',
    icon: <Compass className="w-7 h-7 text-amber-400" />,
    content:
      'Life Lab không đưa ra lời khuyên sáo rỗng hay quyết định thay cuộc đời bạn.\n\nLife Lab là không gian tương tác giúp bạn hiểu rõ lựa chọn của chính mình theo tiến trình:\n👉 Understand (Thấu hiểu bản thân)\n👉 Choose (Lựa chọn hướng đi & chấp nhận đánh đổi)\n👉 Become (Từng bước trở thành phiên bản phù hợp nhất).',
    actionHint:
      'Dành cho những bạn trẻ đang băn khoăn về sự nghiệp, áp lực kiếm tiền hoặc cảm thấy đang sống theo kỳ vọng của người khác.',
    gameRule:
      'Nguyên tắc: "Hãy kiếm tiền, nhưng trước tiên hãy biết tiền đang phục vụ cuộc đời nào."',
  },
  {
    title: 'The Living Map — Bản đồ Tâm trí 3D',
    badge: 'Bước 2/5: Khám phá Thế giới 3D',
    targetArea: 'Bên trái màn hình (3D Map)',
    icon: <MapPin className="w-7 h-7 text-emerald-400" />,
    content:
      'Hòn đảo 3D bên trái tượng trưng cho các khía cạnh trong đời sống của bạn:\n🏰 Work (Lâu đài sự nghiệp)\n⚖️ Money (Cán cân tài chính)\n🌲 Relationships (Rừng kỳ vọng gia đình & bạn bè)\n🏛️ Learning & Experience (Học viện & Dòng sông bài học)\n🌫️ The Gap & Desired Difference (Khoảng cách sương mù & Hòn đảo mong ước).',
    actionHint:
      'Cách thao tác: Giữ chuột trái để xoay 3D 360°, lăn chuột để Zoom, nhấp vào công trình để hướng Ngọn hải đăng soi rọi vào đó.',
    gameRule:
      'Ngọn hải đăng [Current Focus] sẽ dẫn lối bạn khám phá từng nút thắt cuộc sống.',
  },
  {
    title: 'Đối thoại Phản chiếu với AI Coaching',
    badge: 'Bước 3/5: Khung Chat Tương tác',
    targetArea: 'Bên phải màn hình (Chat Panel)',
    icon: <Sparkles className="w-7 h-7 text-sky-400" />,
    content:
      'AI tại Life Lab hoạt động theo tôn chỉ "Reflect Before Interpret" (Phản chiếu trước khi diễn giải):\n• AI không phán xét, không dạy đời.\n• AI đóng vai trò như chiếc gương phản chiếu những tâm tư bạn chia sẻ thành các Giả thuyết (Hypothesis) để bạn tự nhìn nhận.',
    actionHint:
      'Bạn có thể gõ câu trả lời vào ô "Type a message..." hoặc nhấp vào các gợi ý chủ đề có sẵn.',
    gameRule:
      'Không ép buộc hành động — Bạn luôn có quyền dừng lại hoặc đổi chủ đề bất cứ lúc nào.',
  },
  {
    title: 'Quyền làm chủ sự thật: Verify & Repair',
    badge: 'Bước 4/5: Bộ nút Phản hồi',
    targetArea: 'Dưới khung chat (3 nút Đá quý)',
    icon: <ShieldCheck className="w-7 h-7 text-amber-300" />,
    content:
      'Sau mỗi phản chiếu của AI, BẠN LÀ NGƯỜI DUY NHẤT QUYẾT ĐỊNH ĐÚNG HAY SAI:\n• [ Right on ]: AI hiểu hoàn toàn chuẩn xác → Bắn pháo hoa 🎉, thăng cấp Clarity Score.\n• [ Partly right ]: AI chỉ đúng một phần → Bạn chia sẻ thêm điểm chưa khớp.\n• [ Not quite ] / [ ✦ Repair ]: AI hiểu sai → Bấm Repair để viết lại góc nhìn theo ý bạn.',
    actionHint:
      'Chỉ những Insight được bạn xác nhận [Right on] mới được ghi nhận vào Memory Center.',
    gameRule:
      'Khi bạn sửa (Repair), AI bắt buộc phải hủy bỏ suy luận cũ và học theo định nghĩa của bạn.',
  },
  {
    title: 'Thang đo Nhận thức & Trung tâm Ký ức',
    badge: 'Bước 5/5: Mục tiêu Phiên làm việc',
    targetArea: 'Thanh trên & Thanh dưới cùng',
    icon: <Gem className="w-7 h-7 text-purple-400" />,
    content:
      'Mỗi phiên làm việc (8–15 phút) giúp bạn chuyển hóa các nút thắt:\n⚪ UNCLEAR (Mơ hồ) → 🟡 EXPLORING (Khám phá) → 🔵 DEFINED (Rõ ràng) → 🟢 GROUNDED (Hành động).\n\n5 viên đá quý ở thanh trên sẽ phát sáng khi bạn thấu suốt vấn đề.',
    actionHint:
      'Bấm [Memory Center] ở góc dưới để xem, sửa, xóa các ký ức; hoặc bật [No Memory] để trò chuyện ẩn danh.',
    gameRule:
      'Bạn đã sẵn sàng! Hãy nhấn "Bắt đầu phiên làm việc" để bước vào The Living Map.',
  },
];

export const GuideTourModal: React.FC<GuideTourModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const isLast = currentStep === TOUR_STEPS.length - 1;
  const isFirst = currentStep === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-[#20242a] border border-amber-500/50 rounded-3xl w-full max-w-2xl shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="p-6 border-b border-stone-700/60 bg-[#1a1d22] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shadow-lg">
              <BookOpen className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif-title font-bold text-lg text-stone-100">
                  Hướng Dẫn Khám Phá Life Lab
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/25 text-amber-300 border border-amber-500/40">
                  Kịch bản V7
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Cẩm nang trải nghiệm bản đồ 3D The Living Map & AI Coaching
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-700/50 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Indicators */}
        <div className="px-6 py-3 bg-[#181a1f] border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2 w-full">
            {TOUR_STEPS.map((s, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`flex-1 h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentStep
                    ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)] scale-y-125'
                    : idx < currentStep
                    ? 'bg-amber-600/70'
                    : 'bg-stone-700/50 hover:bg-stone-600'
                }`}
                title={s.title}
              />
            ))}
          </div>
          <span className="text-[11px] text-amber-300/80 ml-4 font-mono font-bold shrink-0">
            {currentStep + 1}/{TOUR_STEPS.length}
          </span>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 select-text">
          {/* Step Header */}
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-[#282d35] border border-stone-700 shadow-inner shrink-0">
              {step.icon}
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                {step.badge} • <span className="text-stone-400 font-normal">Khu vực: {step.targetArea}</span>
              </span>
              <h3 className="text-xl font-serif-title font-semibold text-stone-100">
                {step.title}
              </h3>
            </div>
          </div>

          {/* Step Content */}
          <div className="p-4.5 rounded-2xl bg-[#16181c] border border-stone-800 text-stone-200 text-sm leading-relaxed whitespace-pre-line shadow-inner">
            {step.content}
          </div>

          {/* Action Instruction Box */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-200">
            <span className="font-bold shrink-0 text-amber-300">💡 Hướng dẫn thao tác:</span>
            <span>{step.actionHint}</span>
          </div>

          {/* Script Law Box */}
          <div className="p-3.5 rounded-xl bg-stone-800/60 border border-stone-700/70 flex items-start gap-2.5 text-xs text-stone-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong className="text-stone-200">Quy tắc kịch bản V7: </strong>
              {step.gameRule}
            </span>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-5 border-t border-stone-700/60 bg-[#1a1d22] flex items-center justify-between">
          <button
            onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 0))}
            disabled={isFirst}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-stone-300 bg-stone-700/60 hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="text-xs text-stone-400 hover:text-stone-200 px-3 py-2 cursor-pointer font-medium"
            >
              Bỏ qua hướng dẫn
            </button>

            {!isLast ? (
              <button
                onClick={() => setCurrentStep((prev) => Math.min(prev + 1, TOUR_STEPS.length - 1))}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-stone-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/30 active:scale-95 transition-all"
              >
                <span>Bước tiếp theo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-stone-950 bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/30 active:scale-95 transition-all animate-bounce"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Bắt đầu phiên làm việc</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
