import React, { useState } from 'react';
import { Sparkles, CheckCircle2, Target, Calendar, X, Rocket } from 'lucide-react';

interface LifeExperimentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAcceptExperiment: (experiment: { title: string; hypothesis: string; action: string; duration: string }) => void;
  currentFocusLabel: string;
}

export const LifeExperimentModal: React.FC<LifeExperimentModalProps> = ({
  isOpen,
  onClose,
  onAcceptExperiment,
  currentFocusLabel,
}) => {
  const [experimentTitle, setExperimentTitle] = useState('Thử nghiệm 3 ngày: Tạm dừng 10 giây trước khi tiêu tiền vì áp lực');
  const [hypothesis, setHypothesis] = useState('Nếu tôi dừng lại 10 giây và tự hỏi "Khoản chi này đang phục vụ mục tiêu nào?", tôi sẽ giảm bớt cảm giác chi tiêu theo quán tính xã hội.');
  const [action, setAction] = useState('Ghi lại vào sổ tay mỗi khi từ chối một khoản chi không cần thiết và quan sát cảm xúc nhẹ nhõm.');
  const [duration, setDuration] = useState('3 ngày');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAcceptExperiment({
      title: experimentTitle,
      hypothesis,
      action,
      duration,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-[#22262c] border border-amber-500/50 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-stone-700/60 bg-[#1a1d22] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-md">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif-title font-bold text-base text-stone-100">
                Thiết lập Life Experiment (Thử nghiệm Cuộc sống)
              </h2>
              <p className="text-xs text-stone-400">
                Biến nhận thức thành một hành động nhỏ để tự rút ra bài học thực tế
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 select-text">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-amber-400" />
              <span>Tên thử nghiệm:</span>
            </label>
            <input
              type="text"
              value={experimentTitle}
              onChange={(e) => setExperimentTitle(e.target.value)}
              className="w-full bg-[#181a1f] border border-stone-700 rounded-xl p-2.5 text-xs text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Giả thuyết của bạn (Điều bạn kỳ vọng kiểm chứng):</span>
            </label>
            <textarea
              rows={2}
              value={hypothesis}
              onChange={(e) => setHypothesis(e.target.value)}
              className="w-full bg-[#181a1f] border border-stone-700 rounded-xl p-2.5 text-xs text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Hành động thực tế nhỏ trong tuần này:</span>
            </label>
            <textarea
              rows={2}
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full bg-[#181a1f] border border-stone-700 rounded-xl p-2.5 text-xs text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Thời gian thử nghiệm:</span>
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full bg-[#181a1f] border border-stone-700 rounded-xl p-2 text-xs text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="3 ngày">3 ngày (Quick Check-in)</option>
              <option value="1 tuần">1 tuần (Thử nghiệm thói quen)</option>
              <option value="2 tuần">2 tuần (Quan sát thay đổi)</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="bg-stone-700 hover:bg-stone-600 text-stone-300 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Để sau
            </button>
            <button
              type="submit"
              className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95 transition-all"
            >
              <Rocket className="w-3.5 h-3.5" />
              <span>Đồng ý & Bắt đầu thử nghiệm</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
