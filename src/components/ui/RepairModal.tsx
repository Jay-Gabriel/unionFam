import React, { useState } from 'react';
import { X, Sparkles, Check } from 'lucide-react';

interface RepairModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitRepair: (repairText: string) => void;
  currentHypothesis?: string;
}

export const RepairModal: React.FC<RepairModalProps> = ({
  isOpen,
  onClose,
  onSubmitRepair,
  currentHypothesis = 'Có vẻ bạn đang cảm thấy mục tiêu kiếm tiền hiện tại chưa thực sự phục vụ một bức tranh cuộc sống mà bạn mong muốn?',
}) => {
  const [correctedText, setCorrectedText] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctedText.trim()) return;
    onSubmitRepair(correctedText.trim());
    setCorrectedText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-[#24282e] border border-stone-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-stone-700/60 flex items-center justify-between bg-[#1e2226]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif-title font-semibold text-base text-stone-100">
                Repair AI Interpretation
              </h2>
              <p className="text-xs text-stone-400">
                Hiệu chỉnh lại cách hiểu của AI nếu chưa chính xác với trải nghiệm của bạn
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-700/50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-300">
              Diễn giải hiện tại của AI:
            </label>
            <div className="p-3 rounded-xl bg-[#1b1e22] border border-stone-700/60 text-xs text-stone-300 italic">
              "{currentHypothesis}"
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-300">
              Điều bạn muốn đính chính hoặc bổ sung:
            </label>
            <textarea
              rows={3}
              value={correctedText}
              onChange={(e) => setCorrectedText(e.target.value)}
              placeholder="Ví dụ: Thật ra không phải tôi không thích kiếm tiền, mà là do môi trường làm việc hiện tại không còn cho tôi cơ hội học hỏi..."
              className="w-full bg-[#1b1e22] border border-stone-700 rounded-xl p-3 text-xs text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-stone-700 hover:bg-stone-600 text-stone-300 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!correctedText.trim()}
              className="bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-stone-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Cập nhật diễn giải</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
