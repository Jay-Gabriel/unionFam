import React, { useState, useEffect } from 'react';
import {
  X,
  FlaskConical,
  CheckCircle2,
  Flame,
  ArrowRight,
  Sparkles,
  Edit3,
  Check,
  RotateCcw,
  BookOpen
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  getActiveExperiment,
  saveActiveExperiment,
  toggleExperimentDay,
  updateExperimentEnergy,
  updateExperimentGap,
  LifeExperiment
} from '../../services/experimentService';
import { saveMemoryToCloud } from '../../services/supabaseService';

interface ExperimentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToWisdom: () => void;
}

export const ExperimentModal: React.FC<ExperimentModalProps> = ({
  isOpen,
  onClose,
  onGoToWisdom,
}) => {
  const [experiment, setExperiment] = useState<LifeExperiment>(getActiveExperiment);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  // Gap editing state
  const [isEditingGap, setIsEditingGap] = useState(false);
  const [editExternal, setEditExternal] = useState('');
  const [editInternal, setEditInternal] = useState('');

  // Reload active experiment when modal opens
  useEffect(() => {
    if (isOpen) {
      const active = getActiveExperiment();
      setExperiment(active);
      setEditTitle(active.title);
      setEditDesc(active.description);
      setEditExternal(active.externalExpectation);
      setEditInternal(active.internalNeed);
      setIsEditing(false);
      setIsEditingGap(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const checkedCount = experiment.days.filter(Boolean).length;
  const progressPct = Math.round((checkedCount / 7) * 100);

  const handleToggleDay = (idx: number) => {
    const updated = toggleExperimentDay(idx);
    setExperiment(updated);

    // Bắn pháo hoa khi hoàn thành ngày thứ 7
    if (updated.days[idx] && (idx + 1) === 7) {
      confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#34d399', '#f59e0b', '#38bdf8', '#fbbf24'],
      });
    }
  };

  const handleEnergyChange = (level: number) => {
    const updated = updateExperimentEnergy(level);
    setExperiment(updated);
  };

  const handleSaveEdit = () => {
    if (!editTitle.trim()) return;
    const updated: LifeExperiment = {
      ...experiment,
      title: editTitle.trim(),
      description: editDesc.trim(),
    };
    saveActiveExperiment(updated);
    setExperiment(updated);
    setIsEditing(false);
  };

  const handleSaveGap = () => {
    const updated = updateExperimentGap(editExternal, editInternal);
    setExperiment(updated);
    setIsEditingGap(false);
  };

  // Chuyển kết quả thử nghiệm thành đúc kết tại Cổng 3 (Wisdom Sanctuary)
  const handleExportToWisdom = () => {
    const memoryTitle = `Thực Nghiệm: ${experiment.title}`;
    const memoryReflection = `Đã hoàn thành ${checkedCount}/7 ngày kiểm chứng vi mô (Sinh khí: ${experiment.energyLevel}/10). Mô tả: "${experiment.description}". Nhận thức về khoảng cách: Bên ngoài (${experiment.externalExpectation}) vs Bên trong (${experiment.internalNeed}).`;

    saveMemoryToCloud({
      id: Date.now().toString(),
      category: 'insight',
      title: memoryTitle,
      reflection: memoryReflection,
      date: 'Vừa xong',
    });

    confetti({ particleCount: 50, spread: 60 });
    onGoToWisdom();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl h-[88vh] bg-[#12162a]/95 border border-amber-300/40 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.35)] flex flex-col overflow-hidden text-stone-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-amber-300/20 flex items-center justify-between bg-[#191e38]/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-300/50 flex items-center justify-center text-amber-300 shadow-md">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] tracking-[0.25em] font-cinzel text-amber-300 uppercase font-semibold">
                  CỔNG THỨ HAI • LIFE LAB
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] bg-amber-400/10 text-amber-200 border border-amber-400/30">
                  7-DAY EXPERIMENT
                </span>
              </div>
              <h2 className="font-serif text-sm sm:text-base font-bold text-amber-100 tracking-wider">
                Phòng Thí Nghiệm Đời Sống (Micro Experiment)
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-stone-800/60 hover:bg-stone-700/80 text-stone-300 hover:text-white border border-stone-700 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6">
          
          {/* Card 1: Active Experiment Linked From Portal 1 */}
          <div className="bg-[#191e3b]/90 border border-amber-300/30 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold tracking-wider uppercase border border-amber-300/40">
                  {experiment.source === 'ai_session' ? '✨ Nhận thức từ Cổng 1' : 'Thử nghiệm kích hoạt'}
                </span>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-stone-400 hover:text-amber-200 text-xs flex items-center gap-1 transition"
                  title="Chỉnh sửa hành động thử nghiệm"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditing ? 'Hủy sửa' : 'Tùy chỉnh'}</span>
                </button>
              </div>

              <span className="text-xs text-amber-200 font-mono font-bold">
                Tiến độ: {progressPct}% ({checkedCount}/7 ngày)
              </span>
            </div>

            {isEditing ? (
              <div className="space-y-3 pt-2">
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full bg-stone-900 border border-amber-400/50 rounded-xl px-3 py-2 text-sm text-amber-100 focus:outline-none focus:border-amber-300"
                  placeholder="Tiêu đề thử nghiệm vi mô..."
                />
                <textarea
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  rows={2}
                  className="w-full bg-stone-900 border border-amber-400/50 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-300"
                  placeholder="Mô tả hành động bạn sẽ thực hiện trong 1–3 ngày tới..."
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 rounded-lg text-xs text-stone-400 hover:text-stone-200"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-4 py-1.5 rounded-lg text-xs bg-amber-400 text-stone-950 font-semibold hover:bg-amber-300 flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Lưu thử nghiệm</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-amber-100">
                  {experiment.title}
                </h3>
                <p className="text-sm text-stone-300 leading-relaxed font-sans">
                  {experiment.description}
                </p>
              </>
            )}

            {/* 7-Day Check-in Grid (State Persisted) */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-amber-300/80 font-serif font-semibold">
                  ĐIỂM DANH HÀNH VI 7 NGÀY:
                </p>
                <span className="text-[11px] text-stone-400">
                  (Dữ liệu tự động lưu trữ cho các phiên sau)
                </span>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {experiment.days.map((checked, i) => (
                  <button
                    key={i}
                    onClick={() => handleToggleDay(i)}
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

          {/* Card 2: Energy & Autonomy Scale (Q6 Energy Slider) */}
          <div className="bg-[#191e3b]/90 border border-amber-300/30 rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                <span className="font-serif text-xs font-bold text-amber-200 uppercase tracking-wider">
                  Thước Đo Năng Lượng & Quyền Tự Chủ (Q6 Scale)
                </span>
              </div>
              <span className="text-base font-bold text-amber-300 font-mono">
                {experiment.energyLevel.toFixed(1)} / 10
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
              value={experiment.energyLevel}
              onChange={(e) => handleEnergyChange(parseFloat(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>

          {/* Card 3: The Gap Analysis Card */}
          <div className="bg-[#191e3b]/90 border border-amber-300/30 rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-serif text-xs text-amber-300 uppercase tracking-widest font-semibold block">
                ✦ Khoảng Cách Thực Tế (02. The Gap)
              </span>
              <button
                onClick={() => setIsEditingGap(!isEditingGap)}
                className="text-stone-400 hover:text-amber-200 text-xs flex items-center gap-1 transition"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditingGap ? 'Hủy' : 'Hiệu chỉnh'}</span>
              </button>
            </div>

            {isEditingGap ? (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-[11px] text-red-300 font-semibold block mb-1">Kỳ vọng bên ngoài (Áp lực):</label>
                  <input
                    type="text"
                    value={editExternal}
                    onChange={e => setEditExternal(e.target.value)}
                    className="w-full bg-stone-900 border border-red-500/40 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-emerald-300 font-semibold block mb-1">Nhu cầu bên trong (Bản chất):</label>
                  <input
                    type="text"
                    value={editInternal}
                    onChange={e => setEditInternal(e.target.value)}
                    className="w-full bg-stone-900 border border-emerald-500/40 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setIsEditingGap(false)} className="px-3 py-1.5 text-xs text-stone-400">Hủy</button>
                  <button onClick={handleSaveGap} className="px-4 py-1.5 text-xs bg-amber-400 text-stone-950 font-semibold rounded-lg">Lưu khoảng cách</button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                <div className="p-3 bg-red-950/20 border border-red-500/30 rounded-xl">
                  <span className="text-red-300 font-bold block mb-1">Kỳ Vọng Bên Ngoài (Áp lực):</span>
                  <p className="text-stone-300 leading-relaxed">{experiment.externalExpectation}</p>
                </div>
                <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl">
                  <span className="text-emerald-300 font-bold block mb-1">Nhu Cầu Bên Trong (Bản chất):</span>
                  <p className="text-stone-300 leading-relaxed">{experiment.internalNeed}</p>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer Navigation: Flow into Cổng 3 */}
        <div className="p-4 bg-[#14182e] border-t border-amber-300/20 flex items-center justify-between flex-wrap gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs text-stone-400 hover:text-stone-200 cursor-pointer"
          >
            Đóng
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportToWisdom}
              title="Lưu kết quả thử nghiệm này vào Đền Đài Trí Tuệ (Cổng 3) làm bài học dài hạn"
              className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-200 text-xs font-serif flex items-center gap-1.5 border border-amber-400/30 transition cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Chuyển thành Đúc Kết</span>
            </button>

            <button
              onClick={onGoToWisdom}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
            >
              <span>Sang Cổng 3 (Rút Bài Học)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
