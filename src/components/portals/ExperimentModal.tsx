import React, { useState } from 'react';
import { X, FlaskConical, CheckCircle2, Flame, ArrowRight, Sparkles, Plus } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ExperimentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToWisdom: () => void;
}

export const ExperimentModal: React.FC<ExperimentModalProps> = ({ isOpen, onClose, onGoToWisdom }) => {
  const [days, setDays] = useState<boolean[]>([false, false, false, false, false, false, false]);
  const [energyLevel, setEnergyLevel] = useState<number>(5.0);
  const [experimentTitle, setExperimentTitle] = useState('Bước Thử Nhỏ Đời Sống (Micro Experiment)');
  const [experimentDesc, setExperimentDesc] = useState(
    'Thực hiện một hành động nhỏ trong 1–3 ngày tới để quan sát cảm giác và nhịp sống của bạn sau phiên đối thoại.'
  );

  if (!isOpen) return null;

  const checkedCount = days.filter(Boolean).length;
  const progressPct = Math.round((checkedCount / 7) * 100);

  const toggleDay = (idx: number) => {
    const next = [...days];
    next[idx] = !next[idx];
    setDays(next);
    if (!days[idx] && (idx + 1) === 7) {
      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#34d399', '#f59e0b', '#38bdf8'],
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl h-[88vh] bg-[#12162a]/95 border border-amber-300/40 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.35)] flex flex-col overflow-hidden text-stone-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-amber-300/20 flex items-center justify-between bg-[#191e38]/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-300/50 flex items-center justify-center text-amber-300 shadow-md">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-cinzel text-sm sm:text-base font-bold text-amber-200 tracking-wider">
                CỔNG 2 · PHÒNG THÍ NGHIỆM CUỘC ĐỜI
              </h2>
              <p className="text-[11px] text-amber-100/60 font-sans">
                Chuyển hóa nhận thức thành 7 ngày hành động kiểm chứng vi mô
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-stone-800/60 hover:bg-red-500/20 text-stone-300 hover:text-red-300 border border-stone-700 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6">
          
          {/* Card: Current Experiment */}
          <div className="bg-[#191e3b]/90 border border-amber-300/30 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold tracking-wider uppercase border border-amber-300/40">
                Thử nghiệm đang kích hoạt
              </span>
              <span className="text-xs text-amber-200 font-mono font-bold">
                Tiến độ: {progressPct}% ({checkedCount}/7 ngày)
              </span>
            </div>

            <h3 className="font-playfair text-xl sm:text-2xl font-bold text-amber-100 gold-glow-text">
              {experimentTitle}
            </h3>
            <p className="text-sm text-stone-300 leading-relaxed font-sans">
              {experimentDesc}
            </p>

            {/* 7-Day Check-in Grid */}
            <div className="pt-2">
              <p className="text-xs text-amber-300/80 mb-2 font-cinzel font-semibold">
                ĐIỂM DANH HÀNH VI 7 NGÀY:
              </p>
              <div className="grid grid-cols-7 gap-2">
                {days.map((checked, i) => (
                  <button
                    key={i}
                    onClick={() => toggleDay(i)}
                    className={`py-3 px-1 rounded-xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 ${
                      checked
                        ? 'bg-amber-500 text-stone-950 border-amber-400 font-bold shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                        : 'bg-black/30 border-stone-700 text-stone-400 hover:border-amber-300/50'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-sans">Ngày {i + 1}</span>
                    <CheckCircle2 className={`w-4 h-4 ${checked ? 'text-stone-950' : 'text-stone-600'}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Energy & Autonomy Scale (Q6 Energy Slider) */}
          <div className="bg-[#191e3b]/90 border border-amber-300/30 rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                <span className="font-cinzel text-xs font-bold text-amber-200 uppercase tracking-wider">
                  Thước Đo Năng Lượng & Quyền Tự Chủ (Q6 Scale)
                </span>
              </div>
              <span className="text-base font-bold text-amber-300 font-mono">
                {energyLevel} / 10
              </span>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed">
              Bạn cảm nhận mức độ làm chủ cuộc đời và năng lượng sinh khí của mình hôm nay đang ở thang điểm nào?
            </p>
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={energyLevel}
              onChange={(e) => setEnergyLevel(parseFloat(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>

          {/* The Gap Analysis Card */}
          <div className="bg-[#191e3b]/90 border border-amber-300/30 rounded-2xl p-5 shadow-lg space-y-2">
            <span className="font-cinzel text-xs text-amber-300 uppercase tracking-widest font-semibold block">
              ✦ Khoảng Cách Thực Tế (02. The Gap)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-3 bg-red-950/20 border border-red-500/30 rounded-xl">
                <span className="text-red-300 font-bold block mb-1">Kỳ Vọng Bên Ngoài (Áp lực):</span>
                <p className="text-stone-300">Phải luôn bận rộn, chứng tỏ thành công tài chính, làm hài lòng tất cả mọi người.</p>
              </div>
              <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl">
                <span className="text-emerald-300 font-bold block mb-1">Nhu Cầu Bên Trong (Bản chất):</span>
                <p className="text-stone-300">Cần sự bình an, không gian tĩnh lặng để suy ngẫm, được sống đúng với giá trị của mình.</p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Navigation */}
        <div className="p-4 bg-[#14182e] border-t border-amber-300/20 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs text-stone-400 hover:text-stone-200 cursor-pointer"
          >
            Quay lại cổng
          </button>
          <button
            onClick={onGoToWisdom}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
          >
            <span>Sang Cổng 3 (Rút Bài Học)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
