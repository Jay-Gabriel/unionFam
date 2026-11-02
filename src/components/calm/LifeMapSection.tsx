import React, { useState } from 'react';
import {
  Sparkles,
  Heart,
  Sun,
  ListOrdered,
  Scale,
  HelpCircle,
  ArrowRight,
  Compass,
  CheckCircle2,
  Leaf
} from 'lucide-react';
import { CalmCard } from './CalmCard';

const dimensions = [
  {
    id: 'my_life',
    code: '1. ĐỜI SỐNG MONG MUỐN',
    title: 'Cuộc đời tôi muốn sống',
    desc: 'Bức tranh tổng thể về nhịp sống, trạng thái tinh thần và cảm giác bình an mà bạn khao khát.',
    icon: Sparkles,
    badgeColor: 'text-calm-pollen bg-calm-pollen/15 border-calm-pollen/30',
  },
  {
    id: 'what_matters',
    code: '2. ĐIỀU QUAN TRỌNG',
    title: 'Điều thực sự quan trọng',
    desc: 'Những giá trị cốt lõi không thể thỏa hiệp: sức khỏe, thời gian riêng, sự kết nối sâu sắc.',
    icon: Heart,
    badgeColor: 'text-rose-300 bg-rose-500/15 border-rose-400/30',
  },
  {
    id: 'my_ideal_day',
    code: '3. NGÀY LÝ TƯỞNG',
    title: 'Một ngày lý tưởng',
    desc: 'Một ngày bình thường nhưng trọn vẹn: buổi sáng thảnh thơi, công việc có ý nghĩa, buổi tối nhẹ nhõm.',
    icon: Sun,
    badgeColor: 'text-amber-300 bg-amber-500/15 border-amber-400/30',
  },
  {
    id: 'what_it_takes',
    code: '4. ĐIỀU CẦN CÓ',
    title: 'Tôi cần gì để sống cuộc đời đó',
    desc: 'Những nguồn lực thực tế: tài chính tối thiểu, kỹ năng, ranh giới rõ ràng với công việc.',
    icon: ListOrdered,
    badgeColor: 'text-calm-lichen bg-calm-lichen/15 border-calm-lichen/30',
  },
  {
    id: 'my_trade_offs',
    code: '5. ĐIỀU ĐÁNH ĐỔI',
    title: 'Tôi đang lựa chọn & từ bỏ điều gì',
    desc: 'Nhìn thẳng vào những cái giá phải trả để không bị mắc kẹt giữa hai dòng nước.',
    icon: Scale,
    badgeColor: 'text-indigo-300 bg-indigo-500/15 border-indigo-400/30',
  },
  {
    id: 'the_question',
    code: '6. CÂU HỎI TIẾP THEO',
    title: 'Câu hỏi tiếp theo để khám phá',
    desc: 'Câu hỏi ngẫm nghĩ bạn mang theo để quan sát cuộc sống thay vì vội vã đưa ra quyết định.',
    icon: HelpCircle,
    badgeColor: 'text-teal-300 bg-teal-500/15 border-teal-400/30',
  },
];

interface LifeMapSectionProps {
  onStartChatWithTopic?: (topic: string) => void;
}

export const LifeMapSection: React.FC<LifeMapSectionProps> = ({ onStartChatWithTopic }) => {
  const [selectedDim, setSelectedDim] = useState<string | null>(null);

  return (
    <section id="life-map" className="w-full max-w-6xl mx-auto px-6 py-20">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-calm-deep-moss border border-calm-lichen/30 text-calm-lichen text-xs font-semibold tracking-widest uppercase">
          <Compass className="w-3.5 h-3.5 text-calm-lichen" />
          <span>BẢN ĐỒ 6 CHIỀU SỐNG • LIVING LIFE MAP</span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-calm-paper-white tracking-tight">
          Nhìn rõ bức tranh cuộc sống <span className="italic font-normal text-calm-warm-ivory">đa chiều.</span>
        </h2>
        <p className="text-sm sm:text-base text-calm-fog/80 leading-relaxed font-light">
          Không phải một bài kiểm tra tính điểm. Đây là 6 lát cắt giúp bạn tách bạch những áp lực bên ngoài và lắng nghe điều thực sự quan trọng từ bên trong.
        </p>
      </div>

      {/* Grid of 6 Dimensions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dimensions.map(dim => {
          const Icon = dim.icon;
          const isSelected = selectedDim === dim.id;

          return (
            <div
              key={dim.id}
              onClick={() => setSelectedDim(isSelected ? null : dim.id)}
              className={`rounded-3xl p-6 transition-all duration-300 cursor-pointer border flex flex-col justify-between ${
                isSelected
                  ? 'bg-calm-deep-moss border-calm-lichen/60 shadow-lg scale-[1.02]'
                  : 'bg-calm-forest-dusk/70 border-calm-lichen/20 hover:border-calm-lichen/40 hover:bg-calm-deep-moss/60'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${dim.badgeColor}`}>
                    {dim.code}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-calm-lichen">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <h3 className="text-xl font-medium text-calm-warm-ivory">
                  {dim.title}
                </h3>

                <p className="text-xs sm:text-sm text-calm-fog/80 leading-relaxed font-light">
                  {dim.desc}
                </p>
              </div>

              {onStartChatWithTopic && (
                <div className="pt-6 mt-4 border-t border-calm-lichen/15 flex items-center justify-between text-xs font-sans text-calm-lichen hover:text-calm-pollen">
                  <span>Trò chuyện về chiều sống này</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}
      </div>

    </section>
  );
};
