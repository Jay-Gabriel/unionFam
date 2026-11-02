import React from 'react';
import { Sparkles, MessageCircle, Compass, FlaskConical, BookmarkCheck, ArrowRight, ShieldCheck } from 'lucide-react';
import { CalmCard } from './CalmCard';
import { CalmButton } from './CalmButton';

interface HowItWorksSectionProps {
  onStartChat: () => void;
}

export const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({ onStartChat }) => {
  const steps = [
    {
      num: '01',
      title: 'Lắng nghe & Thấu cảm',
      desc: 'Bắt đầu từ một điều đang chiếm nhiều suy nghĩ nhất. AI lắng nghe trọn vẹn, không phán xét, không ép đưa ra quyết định vội vã.',
      icon: MessageCircle,
    },
    {
      num: '02',
      title: 'Định hình nan đề & Đánh đổi',
      desc: 'Gọi tên thế lưỡng nan (Trade-offs) và ranh giới đỏ. Bạn luôn được hỏi xin phép trước khi xem xét các phương án khả thi.',
      icon: Compass,
    },
    {
      num: '03',
      title: 'Thẻ Quyết Định (Decision Card)',
      desc: 'Tự động bóc tách 7 mục chuẩn hóa (tiêu chí, ranh giới đỏ, phương án, điều chưa biết) thành văn bản để bạn xem và sửa đổi trực tiếp.',
      icon: BookmarkCheck,
    },
    {
      num: '04',
      title: 'Thử nghiệm vi mô 7 ngày',
      desc: 'Một bước thử rất nhỏ, an toàn và dễ đảo ngược trong đời thực để kiểm chứng cảm xúc trước khi thực hiện những quyết định lớn.',
      icon: FlaskConical,
    },
  ];

  return (
    <section id="how-it-works" className="w-full max-w-6xl mx-auto px-6 py-20 border-t border-calm-lichen/15">
      
      {/* Title */}
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-calm-deep-moss border border-calm-lichen/30 text-calm-lichen text-xs font-semibold tracking-widest uppercase">
          <Sparkles className="w-3.5 h-3.5 text-calm-pollen" />
          <span>TIẾN TRÌNH 4 BƯỚC • HOW IT WORKS</span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-calm-paper-white tracking-tight">
          Cách Life Lab đồng hành <span className="italic font-normal text-calm-warm-ivory">cùng bạn.</span>
        </h2>
        <p className="text-sm sm:text-base text-calm-fog/80 leading-relaxed font-light">
          Tôn trọng nhịp điệu tự nhiên của bạn. AI chỉ là tấm gương phản chiếu, người quyết định duy nhất luôn là chính bạn.
        </p>
      </div>

      {/* 4 Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map(step => {
          const Icon = step.icon;
          return (
            <div
              key={step.num}
              className="rounded-3xl p-6 bg-calm-forest-dusk/70 border border-calm-lichen/20 hover:border-calm-lichen/40 transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-serif font-light text-calm-pollen">
                    {step.num}
                  </span>
                  <div className="w-9 h-9 rounded-full bg-calm-deep-moss border border-calm-lichen/30 flex items-center justify-center text-calm-lichen">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <h3 className="text-lg font-medium text-calm-warm-ivory">
                  {step.title}
                </h3>

                <p className="text-xs sm:text-sm text-calm-fog/80 leading-relaxed font-light">
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ethos Callout Banner */}
      <div className="mt-14 rounded-3xl p-8 sm:p-10 bg-gradient-to-r from-calm-deep-moss via-calm-forest-dusk to-calm-deep-moss border border-calm-lichen/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2 max-w-2xl text-center md:text-left">
          <span className="text-xs font-mono font-semibold uppercase tracking-widest text-calm-lichen">
            NGUYÊN TẮC BẢO MẬT & TỰ CHỦ
          </span>
          <h3 className="text-2xl sm:text-3xl font-light text-calm-paper-white">
            AI gợi mở. <span className="italic font-normal text-calm-warm-ivory">Bạn là người quyết định.</span>
          </h3>
          <p className="text-xs sm:text-sm text-calm-fog/80 leading-relaxed font-light">
            Không áp đặt, không giảng đạo. Mọi dữ liệu chỉ được lưu trữ khi bạn bật cấp phép rõ ràng hoặc hoàn tất phiên dưới chế độ Không lưu (No Memory).
          </p>
        </div>

        <CalmButton
          variant="primary"
          onClick={onStartChat}
          className="whitespace-nowrap px-8 py-4 shadow-lg hover:scale-105"
        >
          <span>Bắt đầu trò chuyện ngay</span>
          <ArrowRight className="w-4 h-4 ml-2" />
        </CalmButton>
      </div>

    </section>
  );
};
