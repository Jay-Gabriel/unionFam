import React, { useState, useEffect } from 'react';
import {
  X,
  Edit3,
  Check,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Calendar,
  AlertCircle,
  HelpCircle,
  Layers,
  ArrowRight,
  BookmarkCheck,
  FlaskConical
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  DecisionCardData,
  GranularMemoryPermissions,
  DecisionOption
} from '../../types/decisionCard';
import {
  getActiveDecisionCard,
  saveActiveDecisionCard,
  saveDecisionCardWithPermissions
} from '../../services/decisionService';

interface DecisionCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToExperiment?: () => void;
}

export const DecisionCardModal: React.FC<DecisionCardModalProps> = ({
  isOpen,
  onClose,
  onGoToExperiment,
}) => {
  const [card, setCard] = useState<DecisionCardData>(getActiveDecisionCard);
  const [editingSection, setEditingSection] = useState<string | null>(null);

  // Editable drafts
  const [editQuestion, setEditQuestion] = useState('');
  const [editCriteria, setEditCriteria] = useState('');
  const [editConstraints, setEditConstraints] = useState('');
  const [editOptions, setEditOptions] = useState<DecisionOption[]>([]);
  const [editUncertainty, setEditUncertainty] = useState('');
  const [editExperiment, setEditExperiment] = useState('');
  const [editReviewDate, setEditReviewDate] = useState('');

  // Granular Memory Permission Dialog state
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissions, setPermissions] = useState<GranularMemoryPermissions>({
    openDecision: true,
    criteriaAndLimits: true,
    uncertainties: true,
    experimentStep: true,
    reviewDate: true,
    noMemory: false,
  });

  const [receipt, setReceipt] = useState<{
    savedFields: string[];
    omittedFields: string[];
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const active = getActiveDecisionCard();
      setCard(active);
      setEditQuestion(active.decisionQuestion);
      setEditCriteria(active.criteria.join('\n'));
      setEditConstraints(active.hardConstraints.join('\n'));
      setEditOptions([...active.options]);
      setEditUncertainty(
        active.uncertainties[0]?.question || ''
      );
      setEditExperiment(active.experiment?.action || '');
      setEditReviewDate(active.reviewDate || '27/10/2026');
      setEditingSection(null);
      setShowPermissionModal(false);
      setReceipt(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveSection = (section: string) => {
    let updated = { ...card };
    if (section === 'question') {
      updated.decisionQuestion = editQuestion.trim();
    } else if (section === 'criteria') {
      updated.criteria = editCriteria
        .split('\n')
        .map(s => s.trim().replace(/^[•\-\*]\s*/, ''))
        .filter(Boolean);
    } else if (section === 'constraints') {
      updated.hardConstraints = editConstraints
        .split('\n')
        .map(s => s.trim().replace(/^[•\-\*]\s*/, ''))
        .filter(Boolean);
    } else if (section === 'uncertainty') {
      updated.uncertainties = [
        {
          id: 'unc_1',
          question: editUncertainty.trim(),
          verificationMethod: 'Trao đổi hoặc kiểm chứng thực tế trong 1 tuần tới.',
        },
      ];
    } else if (section === 'experiment') {
      updated.experiment = {
        learningQuestion: 'Khi tôi bắt đầu bước này, thực tế diễn ra thế nào?',
        action: editExperiment.trim(),
        durationDays: 7,
      };
    } else if (section === 'reviewDate') {
      updated.reviewDate = editReviewDate.trim();
    }

    updated.status = 'USER_REVIEW';
    updated.version = card.version + 1;
    saveActiveDecisionCard(updated);
    setCard(updated);
    setEditingSection(null);
  };

  const handleToggleNoMemory = () => {
    const nextVal = !permissions.noMemory;
    if (nextVal) {
      setPermissions({
        openDecision: false,
        criteriaAndLimits: false,
        uncertainties: false,
        experimentStep: false,
        reviewDate: false,
        noMemory: true,
      });
    } else {
      setPermissions({
        openDecision: true,
        criteriaAndLimits: true,
        uncertainties: true,
        experimentStep: true,
        reviewDate: true,
        noMemory: false,
      });
    }
  };

  const handleToggleField = (field: keyof Omit<GranularMemoryPermissions, 'noMemory'>) => {
    setPermissions(prev => {
      const next = { ...prev, [field]: !prev[field], noMemory: false };
      return next;
    });
  };

  const handleConfirmPermissions = async () => {
    const res = await saveDecisionCardWithPermissions(card, permissions);
    setReceipt(res);
    setShowPermissionModal(false);
    confetti({ particleCount: 60, spread: 70 });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#111425]/95 border border-amber-300/40 rounded-3xl shadow-[0_0_60px_rgba(245,158,11,0.25)] flex flex-col overflow-hidden text-stone-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-amber-400/20 flex items-center justify-between bg-stone-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] tracking-[0.2em] font-mono text-amber-300 uppercase font-semibold">
                  DECISION CARD
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] bg-amber-400/10 text-amber-200 border border-amber-400/30">
                  {card.status === 'CONFIRMED' ? 'ĐÃ XÁC NHẬN' : 'BẢN NHÁP'}
                </span>
              </div>
              <h3 className="font-serif text-sm sm:text-base text-stone-100">
                Phiếu Định Hình Quyết Định (Decision Mode V1.0)
              </h3>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800/60 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 font-sans text-xs">
          
          {/* Receipt banner if confirmed */}
          {receipt && (
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-400/40 text-emerald-200 space-y-2 animate-fadeIn">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                <span>Biên nhận quyền lưu trữ (Receipt)</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Đã ghi nhận Decision Card an toàn theo đúng lựa chọn của bạn:
              </p>
              <div className="text-[11px] space-y-1">
                <p>✅ <strong>Đã lưu:</strong> {receipt.savedFields.length > 0 ? receipt.savedFields.join(', ') : 'Không'}</p>
                {receipt.omittedFields.length > 0 && (
                  <p className="text-stone-400">🛡️ <strong>Không lưu:</strong> {receipt.omittedFields.join(', ')}</p>
                )}
              </div>
              {onGoToExperiment && (
                <button
                  onClick={() => {
                    onClose();
                    onGoToExperiment();
                  }}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 text-xs font-serif transition"
                >
                  <FlaskConical className="w-3.5 h-3.5" />
                  <span>Mở Cổng 2 để xem Bước Thử 7 Ngày</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {/* Section 1: Tôi đang quyết định điều gì? */}
          <div className="p-4 rounded-2xl bg-stone-900/50 border border-stone-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-serif text-amber-300 font-semibold flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Tôi đang quyết định điều gì?</span>
              </span>
              <button
                onClick={() => setEditingSection(editingSection === 'question' ? null : 'question')}
                className="text-stone-400 hover:text-amber-300 text-[11px] flex items-center gap-1 transition"
              >
                <Edit3 className="w-3 h-3" />
                <span>{editingSection === 'question' ? 'Hủy' : '[Sửa]'}</span>
              </button>
            </div>

            {editingSection === 'question' ? (
              <div className="space-y-2 pt-1">
                <textarea
                  value={editQuestion}
                  onChange={e => setEditQuestion(e.target.value)}
                  rows={2}
                  className="w-full bg-stone-950 border border-amber-400/50 rounded-xl p-2.5 text-xs text-stone-100 focus:outline-none"
                />
                <button
                  onClick={() => handleSaveSection('question')}
                  className="px-3 py-1 bg-amber-400 text-stone-950 font-semibold rounded-lg text-xs"
                >
                  Lưu
                </button>
              </div>
            ) : (
              <p className="text-stone-200 text-sm font-serif leading-relaxed">
                {card.decisionQuestion}
              </p>
            )}
          </div>

          {/* Section 2: Điều quan trọng với tôi */}
          <div className="p-4 rounded-2xl bg-stone-900/50 border border-stone-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-serif text-amber-300 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Điều quan trọng với tôi</span>
              </span>
              <button
                onClick={() => setEditingSection(editingSection === 'criteria' ? null : 'criteria')}
                className="text-stone-400 hover:text-amber-300 text-[11px] flex items-center gap-1 transition"
              >
                <Edit3 className="w-3 h-3" />
                <span>{editingSection === 'criteria' ? 'Hủy' : '[Sửa]'}</span>
              </button>
            </div>

            {editingSection === 'criteria' ? (
              <div className="space-y-2 pt-1">
                <p className="text-[10px] text-stone-400">Mỗi dòng là một tiêu chí quan trọng:</p>
                <textarea
                  value={editCriteria}
                  onChange={e => setEditCriteria(e.target.value)}
                  rows={3}
                  className="w-full bg-stone-950 border border-amber-400/50 rounded-xl p-2.5 text-xs text-stone-100 focus:outline-none"
                />
                <button
                  onClick={() => handleSaveSection('criteria')}
                  className="px-3 py-1 bg-amber-400 text-stone-950 font-semibold rounded-lg text-xs"
                >
                  Lưu
                </button>
              </div>
            ) : (
              <ul className="space-y-1 text-stone-300">
                {card.criteria.map((c, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-amber-400">•</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Section 3: Giới hạn (Hard constraints) */}
          <div className="p-4 rounded-2xl bg-stone-900/50 border border-stone-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-serif text-amber-300 font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>Giới hạn (Ranh giới không thể vi phạm)</span>
              </span>
              <button
                onClick={() => setEditingSection(editingSection === 'constraints' ? null : 'constraints')}
                className="text-stone-400 hover:text-amber-300 text-[11px] flex items-center gap-1 transition"
              >
                <Edit3 className="w-3 h-3" />
                <span>{editingSection === 'constraints' ? 'Hủy' : '[Sửa]'}</span>
              </button>
            </div>

            {editingSection === 'constraints' ? (
              <div className="space-y-2 pt-1">
                <p className="text-[10px] text-stone-400">Mỗi dòng là một giới hạn đỏ:</p>
                <textarea
                  value={editConstraints}
                  onChange={e => setEditConstraints(e.target.value)}
                  rows={3}
                  className="w-full bg-stone-950 border border-amber-400/50 rounded-xl p-2.5 text-xs text-stone-100 focus:outline-none"
                />
                <button
                  onClick={() => handleSaveSection('constraints')}
                  className="px-3 py-1 bg-amber-400 text-stone-950 font-semibold rounded-lg text-xs"
                >
                  Lưu
                </button>
              </div>
            ) : (
              <ul className="space-y-1 text-rose-200/90">
                {card.hardConstraints.map((l, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-rose-400">•</span>
                    <span>{l}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Section 4: Các hướng đang cân nhắc */}
          <div className="p-4 rounded-2xl bg-stone-900/50 border border-stone-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-serif text-amber-300 font-semibold">
                Các hướng đang cân nhắc (Options)
              </span>
            </div>

            <div className="space-y-2 pt-1">
              {card.options.map((opt, i) => (
                <div key={opt.id} className="p-2.5 rounded-xl bg-stone-950/60 border border-stone-800">
                  <p className="font-semibold text-stone-200">
                    {i + 1}. {opt.name}
                  </p>
                  {opt.description && (
                    <p className="text-stone-400 text-[11px] mt-0.5">{opt.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Điều còn chưa biết */}
          <div className="p-4 rounded-2xl bg-stone-900/50 border border-stone-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-serif text-amber-300 font-semibold">
                Điều còn chưa biết (Uncertainty)
              </span>
              <button
                onClick={() => setEditingSection(editingSection === 'uncertainty' ? null : 'uncertainty')}
                className="text-stone-400 hover:text-amber-300 text-[11px] flex items-center gap-1 transition"
              >
                <Edit3 className="w-3 h-3" />
                <span>{editingSection === 'uncertainty' ? 'Hủy' : '[Sửa]'}</span>
              </button>
            </div>

            {editingSection === 'uncertainty' ? (
              <div className="space-y-2 pt-1">
                <input
                  type="text"
                  value={editUncertainty}
                  onChange={e => setEditUncertainty(e.target.value)}
                  className="w-full bg-stone-950 border border-amber-400/50 rounded-xl p-2.5 text-xs text-stone-100 focus:outline-none"
                />
                <button
                  onClick={() => handleSaveSection('uncertainty')}
                  className="px-3 py-1 bg-amber-400 text-stone-950 font-semibold rounded-lg text-xs"
                >
                  Lưu
                </button>
              </div>
            ) : (
              <p className="text-stone-300 leading-relaxed">
                {card.uncertainties[0]?.question || 'Chưa ghi nhận điều bất định.'}
              </p>
            )}
          </div>

          {/* Section 6: Bước thử */}
          <div className="p-4 rounded-2xl bg-stone-900/50 border border-stone-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-serif text-amber-300 font-semibold">
                Bước thử (Thực nghiệm nhỏ có thể đảo ngược)
              </span>
              <button
                onClick={() => setEditingSection(editingSection === 'experiment' ? null : 'experiment')}
                className="text-stone-400 hover:text-amber-300 text-[11px] flex items-center gap-1 transition"
              >
                <Edit3 className="w-3 h-3" />
                <span>{editingSection === 'experiment' ? 'Hủy' : '[Sửa]'}</span>
              </button>
            </div>

            {editingSection === 'experiment' ? (
              <div className="space-y-2 pt-1">
                <textarea
                  value={editExperiment}
                  onChange={e => setEditExperiment(e.target.value)}
                  rows={2}
                  className="w-full bg-stone-950 border border-amber-400/50 rounded-xl p-2.5 text-xs text-stone-100 focus:outline-none"
                />
                <button
                  onClick={() => handleSaveSection('experiment')}
                  className="px-3 py-1 bg-amber-400 text-stone-950 font-semibold rounded-lg text-xs"
                >
                  Lưu
                </button>
              </div>
            ) : (
              <p className="text-stone-300 leading-relaxed">
                {card.experiment?.action || 'Chưa có bước thử.'}
              </p>
            )}
          </div>

          {/* Section 7: Nhìn lại */}
          <div className="p-4 rounded-2xl bg-stone-900/50 border border-stone-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-serif text-amber-300 font-semibold flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Nhìn lại: {card.reviewDate || '27/10/2026'}</span>
              </span>
              <button
                onClick={() => setEditingSection(editingSection === 'reviewDate' ? null : 'reviewDate')}
                className="text-stone-400 hover:text-amber-300 text-[11px] flex items-center gap-1 transition"
              >
                <Edit3 className="w-3 h-3" />
                <span>{editingSection === 'reviewDate' ? 'Hủy' : '[Sửa]'}</span>
              </button>
            </div>

            {editingSection === 'reviewDate' && (
              <div className="space-y-2 pt-1">
                <input
                  type="text"
                  value={editReviewDate}
                  onChange={e => setEditReviewDate(e.target.value)}
                  placeholder="DD/MM/YYYY"
                  className="w-full bg-stone-950 border border-amber-400/50 rounded-xl p-2 text-xs text-stone-100 focus:outline-none"
                />
                <button
                  onClick={() => handleSaveSection('reviewDate')}
                  className="px-3 py-1 bg-amber-400 text-stone-950 font-semibold rounded-lg text-xs"
                >
                  Lưu
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Footer Actions: [Cần sửa] [Xác nhận nội dung] */}
        <div className="p-4 bg-stone-950 border-t border-amber-400/20 flex items-center justify-between">
          <button
            onClick={() => setEditingSection('question')}
            className="px-4 py-2 rounded-xl text-stone-400 hover:text-stone-200 text-xs font-serif transition cursor-pointer"
          >
            [Cần sửa]
          </button>

          <button
            onClick={() => setShowPermissionModal(true)}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-serif font-bold text-xs uppercase tracking-wider shadow-lg transition-all active:scale-95 cursor-pointer flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>[Xác nhận nội dung]</span>
          </button>
        </div>

        {/* Granular Memory Permission Dialog */}
        {showPermissionModal && (
          <div className="absolute inset-0 bg-stone-950/95 backdrop-blur-xl p-6 flex flex-col justify-between z-30 animate-fadeIn">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-amber-300 font-serif text-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Quyền Lưu Trữ Bộ Nhớ (Granular Memory Permission)</span>
              </div>
              <p className="text-stone-300 text-xs leading-relaxed">
                Sau khi xác nhận: <strong>Bạn muốn Life Lab lưu phần nào?</strong>
              </p>

              <div className="space-y-2.5 pt-2">
                <label className="flex items-center gap-3 p-3 rounded-xl bg-stone-900/60 border border-stone-800 cursor-pointer hover:border-amber-400/40 transition">
                  <input
                    type="checkbox"
                    checked={permissions.openDecision}
                    onChange={() => handleToggleField('openDecision')}
                    className="accent-amber-400 w-4 h-4 rounded"
                  />
                  <span className="text-xs text-stone-200">Quyết định đang mở</span>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl bg-stone-900/60 border border-stone-800 cursor-pointer hover:border-amber-400/40 transition">
                  <input
                    type="checkbox"
                    checked={permissions.criteriaAndLimits}
                    onChange={() => handleToggleField('criteriaAndLimits')}
                    className="accent-amber-400 w-4 h-4 rounded"
                  />
                  <span className="text-xs text-stone-200">Tiêu chí và giới hạn</span>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl bg-stone-900/60 border border-stone-800 cursor-pointer hover:border-amber-400/40 transition">
                  <input
                    type="checkbox"
                    checked={permissions.uncertainties}
                    onChange={() => handleToggleField('uncertainties')}
                    className="accent-amber-400 w-4 h-4 rounded"
                  />
                  <span className="text-xs text-stone-200">Điều còn chưa biết</span>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl bg-stone-900/60 border border-stone-800 cursor-pointer hover:border-amber-400/40 transition">
                  <input
                    type="checkbox"
                    checked={permissions.experimentStep}
                    onChange={() => handleToggleField('experimentStep')}
                    className="accent-amber-400 w-4 h-4 rounded"
                  />
                  <span className="text-xs text-stone-200">Bước thử (Đồng bộ sang Cổng 2)</span>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl bg-stone-900/60 border border-stone-800 cursor-pointer hover:border-amber-400/40 transition">
                  <input
                    type="checkbox"
                    checked={permissions.reviewDate}
                    onChange={() => handleToggleField('reviewDate')}
                    className="accent-amber-400 w-4 h-4 rounded"
                  />
                  <span className="text-xs text-stone-200">Ngày nhìn lại</span>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 cursor-pointer hover:border-rose-400/50 transition">
                  <input
                    type="checkbox"
                    checked={permissions.noMemory}
                    onChange={handleToggleNoMemory}
                    className="accent-rose-400 w-4 h-4 rounded"
                  />
                  <span className="text-xs text-rose-300 font-medium">Không lưu gì (No Memory - Phiên kết thúc không ghi nhận)</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-800">
              <button
                onClick={() => setShowPermissionModal(false)}
                className="px-4 py-2 text-xs text-stone-400 hover:text-stone-200 cursor-pointer"
              >
                Quay lại
              </button>

              <button
                onClick={handleConfirmPermissions}
                className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-serif font-bold text-xs uppercase transition cursor-pointer"
              >
                [Xác nhận lựa chọn]
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
