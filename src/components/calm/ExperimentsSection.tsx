import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  CheckCircle2,
  Flame,
  ArrowRight,
  Sparkles,
  Edit3,
  RotateCcw,
  Clock,
  Compass
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  getActiveExperiment,
  saveActiveExperiment,
  toggleExperimentDay,
  updateExperimentEnergy,
  LifeExperiment
} from '../../services/experimentService';
import { CalmButton } from './CalmButton';

interface ExperimentsSectionProps {
  onStartChat: () => void;
}

export const ExperimentsSection: React.FC<ExperimentsSectionProps> = ({ onStartChat }) => {
  const [experiment, setExperiment] = useState<LifeExperiment>(getActiveExperiment);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  useEffect(() => {
    const active = getActiveExperiment();
    setExperiment(active);
    setEditTitle(active.title);
    setEditDesc(active.description);
  }, []);

  const handleToggleDay = (dayIndex: number) => {
    const updated = toggleExperimentDay(dayIndex);
    setExperiment({ ...updated });
    if (updated.days.filter(Boolean).length === 7) {
      confetti({ particleCount: 70, spread: 60 });
    }
  };

  const handleSaveEdit = () => {
    const updated: LifeExperiment = {
      ...experiment,
      title: editTitle.trim() || experiment.title,
      description: editDesc.trim() || experiment.description,
    };
    saveActiveExperiment(updated);
    setExperiment(updated);
    setIsEditing(false);
  };

  const handleResetCheckpoints = () => {
    const updated: LifeExperiment = {
      ...experiment,
      days: [false, false, false, false, false, false, false],
    };
    saveActiveExperiment(updated);
    setExperiment(updated);
  };

  const completedDays = experiment.days.filter(Boolean).length;
  const progressPercent = Math.round((completedDays / 7) * 100);

  return (
    <section id="experiments" className="w-full max-w-5xl mx-auto px-6 py-20 border-t border-calm-lichen/15">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-calm-deep-moss border border-calm-lichen/30 text-calm-lichen text-xs font-semibold tracking-widest uppercase">
          <FlaskConical className="w-3.5 h-3.5 text-calm-pollen" />
          <span>PHÒNG THÍ NGHIỆM ĐỜI SỐNG • 7-DAY LIFE EXPERIMENT</span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-calm-paper-white tracking-tight">
          Thử một bước nhỏ <span className="italic font-normal text-calm-warm-ivory">trong đời thực.</span>
        </h2>
        <p className="text-sm sm:text-base text-calm-fog/80 leading-relaxed font-light">
          Thay vì lo sợ chọn sai, hãy thiết kế một thử nghiệm vi mô 7 ngày an toàn, dễ đảo ngược để kiểm chứng trước khi cam kết nguồn lực lớn.
        </p>
      </div>

      {/* Main Experiment Card */}
      <div className="rounded-3xl p-8 sm:p-10 bg-calm-forest-dusk/90 border border-calm-lichen/30 shadow-2xl space-y-8">
        
        {/* Title & Edit Toggle */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-calm-lichen/15">
          <div className="space-y-1.5 flex-1">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-calm-lichen">
              BÀI TẬP THỬ NGHIỆM ĐANG CHẠY
            </span>
            {isEditing ? (
              <input
                type="text"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                className="w-full bg-calm-deep-moss border border-calm-lichen/40 rounded-xl px-3 py-2 text-lg text-calm-paper-white font-medium focus:outline-none focus:border-calm-lichen"
              />
            ) : (
              <h3 className="text-2xl sm:text-3xl font-serif text-calm-warm-ivory font-normal">
                {experiment.title}
              </h3>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 rounded-full bg-calm-moss text-white text-xs font-sans font-semibold hover:bg-calm-fern transition"
              >
                Lưu thay đổi
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-calm-deep-moss border border-calm-lichen/30 text-calm-fog text-xs hover:text-white hover:bg-calm-moss transition"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Chỉnh sửa</span>
              </button>
            )}
          </div>
        </div>

        {/* Description / Action */}
        <div className="space-y-2">
          <label className="text-xs font-mono uppercase tracking-wider text-calm-lichen">
            HÀNH ĐỘNG VI MÔ MỖI NGÀY:
          </label>
          {isEditing ? (
            <textarea
              value={editDesc}
              onChange={e => setEditDesc(e.target.value)}
              rows={3}
              className="w-full bg-calm-deep-moss border border-calm-lichen/40 rounded-xl p-3 text-sm text-calm-paper-white focus:outline-none focus:border-calm-lichen"
            />
          ) : (
            <p className="text-sm sm:text-base text-calm-fog/90 leading-relaxed font-light bg-calm-deep-moss/60 p-4 rounded-2xl border border-calm-lichen/15">
              {experiment.description}
            </p>
          )}
        </div>

        {/* 7 Days Checklist */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-calm-lichen">
              ĐIỂM DANH 7 NGÀY HÀNH ĐỘNG ({completedDays}/7 ngày • {progressPercent}%)
            </span>
            {completedDays > 0 && (
              <button
                onClick={handleResetCheckpoints}
                className="text-[11px] font-sans text-calm-fog/60 hover:text-calm-pollen flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Làm mới điểm danh</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-7 gap-2 sm:gap-3">
            {experiment.days.map((checked, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleToggleDay(idx)}
                className={`py-3 sm:py-4 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all duration-300 cursor-pointer ${
                  checked
                    ? 'bg-calm-moss border-calm-lichen text-white shadow-soft scale-105'
                    : 'bg-calm-deep-moss/70 border-calm-lichen/20 text-calm-fog/60 hover:border-calm-lichen/40 hover:text-white'
                }`}
              >
                <span className="text-[10px] sm:text-xs font-mono uppercase font-bold">
                  N{idx + 1}
                </span>
                <CheckCircle2 className={`w-4 h-4 sm:w-5 sm:h-5 ${checked ? 'text-calm-pollen' : 'opacity-30'}`} />
              </button>
            ))}
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-calm-deep-moss rounded-full overflow-hidden border border-calm-lichen/20 mt-2">
            <div
              className="h-full bg-gradient-to-r from-calm-moss via-calm-lichen to-calm-pollen transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Footer CTA */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-calm-lichen/15">
          <span className="text-xs text-calm-fog/70 font-mono">
            💡 Gợi ý: Nếu sau 7 ngày vẫn thấy bất an, bạn có thể chuyển hướng an toàn mà không hối tiếc.
          </span>
          <CalmButton
            variant="ghost"
            onClick={onStartChat}
            className="text-xs text-calm-lichen hover:text-white flex items-center gap-1.5"
          >
            <span>Trò chuyện để đổi bài tập khác</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </CalmButton>
        </div>

      </div>

    </section>
  );
};
