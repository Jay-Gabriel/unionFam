import React, { useState } from 'react';
import { X, AlertTriangle, ShieldAlert, CheckCircle2, Send, HelpCircle } from 'lucide-react';
import { submitIncidentReport, IncidentReport } from '../../services/betaTelemetryService';

interface IncidentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  contextSnippet?: string;
}

export const IncidentReportModal: React.FC<IncidentReportModalProps> = ({
  isOpen,
  onClose,
  contextSnippet,
}) => {
  const [type, setType] = useState<IncidentReport['type']>('wrong_task');
  const [severity, setSeverity] = useState<IncidentReport['severity']>('medium');
  const [description, setDescription] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    submitIncidentReport(type, severity, description, contextSnippet);
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setDescription('');
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#0e1222] border border-amber-300/40 rounded-3xl p-6 text-stone-200 shadow-[0_0_50px_rgba(234,179,8,0.25)] space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-300">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-widest text-amber-300 uppercase block">
                LIMITED BETA (30–50 USERS)
              </span>
              <h3 className="font-serif text-base font-bold text-stone-100">
                Báo Cáo Sự Cố / Phản Hồi Lỗi
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-stone-400 hover:text-stone-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400 mx-auto flex items-center justify-center text-emerald-300 animate-bounce">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="font-serif text-sm font-semibold text-emerald-200">
              Đã ghi nhận báo cáo thành công!
            </p>
            <p className="text-xs text-stone-400">
              Cảm ơn bạn đã hỗ trợ đội ngũ hoàn thiện chất lượng Life Lab trong đợt thử nghiệm giới hạn.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Incident Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-stone-400">
                1. Loại sự cố phát sinh
              </label>
              <select
                value={type}
                onChange={e => setType(e.target.value as IncidentReport['type'])}
                className="w-full bg-stone-900/90 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-400"
              >
                <option value="wrong_task">Wrong task (Hiểu nhầm ý định / làm sai yêu cầu)</option>
                <option value="critical_failure">Critical failure (Lỗi nghiêm trọng / đơ ứng dụng)</option>
                <option value="stop_ignored">User stop ignored (Người dùng bảo dừng nhưng AI vẫn nói tiếp)</option>
                <option value="repair_recurrence">Repair recurrence (Đã đính chính nhưng AI vẫn lặp lại lỗi cũ)</option>
                <option value="privacy_issue">Privacy & Memory issue (Lưu dữ liệu khi chưa được phép)</option>
                <option value="other_bug">Other bug (Lỗi giao diện hoặc chức năng khác)</option>
              </select>
            </div>

            {/* Severity */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-stone-400">
                2. Mức độ ảnh hưởng
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['low', 'medium', 'high', 'critical'] as const).map(sev => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setSeverity(sev)}
                    className={`py-1.5 text-xs font-serif rounded-lg border uppercase transition text-center ${
                      severity === sev
                        ? sev === 'critical'
                          ? 'bg-rose-500/30 border-rose-400 text-rose-200 font-bold'
                          : 'bg-amber-400/20 border-amber-300 text-amber-200 font-bold'
                        : 'bg-stone-900 border-stone-800 text-stone-400 hover:bg-stone-800'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-stone-400">
                3. Mô tả ngắn gọn điều bạn gặp phải
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Ví dụ: AI lặp lại câu hỏi cũ dù mình đã trả lời ở lượt trước..."
                className="w-full bg-stone-900/90 border border-stone-700 rounded-xl p-3 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-400 resize-none"
              />
            </div>

            {contextSnippet && (
              <div className="p-2.5 rounded-xl bg-stone-950/60 border border-white/5 text-[11px] text-stone-400 space-y-1">
                <span className="font-mono text-[9px] uppercase tracking-wider text-amber-300/80 block">
                  Đính kèm bối cảnh tin nhắn gần nhất:
                </span>
                <p className="line-clamp-2 italic text-stone-300">"{contextSnippet}"</p>
              </div>
            )}

            {/* Submit button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-stone-400 hover:text-stone-200"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={!description.trim()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-serif font-semibold text-xs transition shadow-md disabled:opacity-40 flex items-center gap-2 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Gửi Báo Cáo</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
