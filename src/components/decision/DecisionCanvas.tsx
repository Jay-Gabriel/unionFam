import React, { useState } from 'react';
import {
  Compass,
  ShieldAlert,
  Sparkles,
  Layers,
  FlaskConical,
  HelpCircle,
  Calendar,
  Edit3,
  Check,
  RefreshCw,
  BookmarkCheck,
  ArrowRight,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DecisionCardData, DecisionOption } from '../../types/decisionCard';
import { CORE_PROBLEM_SCENARIOS, ProblemScenario } from '../../services/decisionService';
import { createExperimentFromSession } from '../../services/experimentService';

interface DecisionCanvasProps {
  card: DecisionCardData;
  onUpdateCard: (updated: DecisionCardData) => void;
  onRefreshFromChat?: () => void;
  onSelectScenario?: (scenario: ProblemScenario) => void;
  isExtracting?: boolean;
  userMessageCount: number;
  onGoToExperiments?: () => void;
  onSaveToMemories?: () => void;
}

export const DecisionCanvas: React.FC<DecisionCanvasProps> = ({
  card,
  onUpdateCard,
  onRefreshFromChat,
  onSelectScenario,
  isExtracting = false,
  userMessageCount,
  onGoToExperiments,
  onSaveToMemories,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Draft state for inline editing
  const [draftQuestion, setDraftQuestion] = useState(card.decisionQuestion);
  const [draftCriteria, setDraftCriteria] = useState(card.criteria.join('\n'));
  const [draftConstraints, setDraftConstraints] = useState(card.hardConstraints.join('\n'));
  const [draftOptions, setDraftOptions] = useState<DecisionOption[]>([...card.options]);
  const [draftUncertainty, setDraftUncertainty] = useState(card.uncertainties[0]?.question || '');
  const [draftExpAction, setDraftExpAction] = useState(card.experiment?.action || '');
  const [draftReviewDate, setDraftReviewDate] = useState(card.reviewDate || '');

  // Synchronize drafts when card prop changes and not currently editing
  React.useEffect(() => {
    if (!isEditing) {
      setDraftQuestion(card.decisionQuestion);
      setDraftCriteria(card.criteria.join('\n'));
      setDraftConstraints(card.hardConstraints.join('\n'));
      setDraftOptions([...card.options]);
      setDraftUncertainty(card.uncertainties[0]?.question || '');
      setDraftExpAction(card.experiment?.action || '');
      setDraftReviewDate(card.reviewDate || '');
    }
  }, [card, isEditing]);

  const handleStartEditing = () => {
    setDraftQuestion(card.decisionQuestion);
    setDraftCriteria(card.criteria.join('\n'));
    setDraftConstraints(card.hardConstraints.join('\n'));
    setDraftOptions([...card.options]);
    setDraftUncertainty(card.uncertainties[0]?.question || '');
    setDraftExpAction(card.experiment?.action || '');
    setDraftReviewDate(card.reviewDate || '');
    setIsEditing(true);
  };

  const handleSaveEditing = () => {
    const updated: DecisionCardData = {
      ...card,
      decisionQuestion: draftQuestion.trim() || card.decisionQuestion,
      criteria: draftCriteria
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean),
      hardConstraints: draftConstraints
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean),
      options: draftOptions,
      uncertainties: draftUncertainty.trim()
        ? [
            {
              id: 'unc_1',
              question: draftUncertainty.trim(),
              verificationMethod: card.uncertainties[0]?.verificationMethod || 'Quan sát phản ứng thực tế trong 3-5 ngày',
              stopRule: card.uncertainties[0]?.stopRule || 'Dừng lại nếu cảm xúc kiệt quệ',
            },
          ]
        : card.uncertainties,
      experiment: draftExpAction.trim()
        ? {
            learningQuestion: card.experiment?.learningQuestion || 'Bước thử nghiệm này mang lại cảm giác gì?',
            action: draftExpAction.trim(),
            durationDays: 7,
            observations: card.experiment?.observations || 'Ghi lại năng lượng mỗi tối',
          }
        : card.experiment,
      reviewDate: draftReviewDate.trim() || card.reviewDate,
      status: 'USER_REVIEW',
      version: card.version + 1,
      updatedAt: new Date().toISOString(),
    };

    onUpdateCard(updated);
    setIsEditing(false);
  };

  const handleCreateExperimentAction = () => {
    const expText = card.experiment?.action || card.decisionQuestion;
    createExperimentFromSession(
      `Thử nghiệm 7 ngày: ${card.title}`,
      expText
    );
    try {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
    } catch {}
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 3000);
    if (onGoToExperiments) {
      setTimeout(() => onGoToExperiments(), 1200);
    }
  };

  return (
    <div className="flex flex-col h-full bg-calm-forest-dusk/95 border border-calm-lichen/25 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl transition-all">
      {/* Studio Header */}
      <div className="p-4 sm:p-5 border-b border-calm-lichen/20 bg-calm-deep-moss/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-calm-moss/30 border border-calm-lichen/40 flex items-center justify-center text-calm-pollen shadow-inner">
            <Compass className="w-5 h-5 text-calm-pollen animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-semibold text-sm sm:text-base text-calm-warm-ivory tracking-wide">
                THẺ QUYẾT ĐỊNH
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono tracking-wider font-semibold uppercase bg-calm-moss/60 border border-calm-lichen/40 text-calm-pollen flex items-center gap-1 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-calm-pollen animate-pulse" />
                <span>LIVE STUDIO</span>
              </span>
            </div>
            <p className="text-[11px] text-calm-fog/70 font-sans mt-0.5">
              Đúc kết 7 mục chuẩn hóa • Tự động kết tinh theo dòng đối thoại
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 text-xs">
          {onRefreshFromChat && (
            <button
              type="button"
              onClick={onRefreshFromChat}
              disabled={isExtracting}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-calm-lichen/20 text-calm-fog hover:text-white transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              title="Đúc kết lại Thẻ Quyết Định từ các tin nhắn vừa trao đổi"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-calm-pollen ${isExtracting ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Làm mới từ chat</span>
            </button>
          )}

          {isEditing ? (
            <button
              type="button"
              onClick={handleSaveEditing}
              className="px-3.5 py-1.5 rounded-xl bg-calm-moss hover:bg-calm-fern border border-calm-lichen/40 text-white font-semibold transition flex items-center gap-1.5 shadow-soft cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Lưu thay đổi</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartEditing}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-calm-lichen/20 text-calm-fog hover:text-white transition flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-calm-lichen" />
              <span>Chỉnh sửa</span>
            </button>
          )}
        </div>
      </div>

      {/* Scenario Quick Starters Banner */}
      {onSelectScenario && (
        <div className="px-4 py-2.5 bg-calm-deep-moss/40 border-b border-calm-lichen/15 flex items-center gap-2 overflow-x-auto scrollbar-none text-xs">
          <span className="text-[10px] font-mono uppercase text-calm-lichen/70 shrink-0 font-semibold">
            Áp mẫu tình huống:
          </span>
          {CORE_PROBLEM_SCENARIOS.map(sc => (
            <button
              key={sc.id}
              type="button"
              onClick={() => onSelectScenario(sc)}
              className="px-2.5 py-1 rounded-lg bg-calm-forest-dusk/80 hover:bg-calm-moss/40 border border-calm-lichen/20 text-calm-fog hover:text-white text-[11px] whitespace-nowrap transition cursor-pointer shrink-0 flex items-center gap-1"
            >
              <span className="text-calm-pollen font-mono font-bold text-[9px]">{sc.badge}</span>
              <span>· {sc.title.split(' ')[0]} {sc.title.split(' ')[1]}...</span>
            </button>
          ))}
        </div>
      )}

      {/* Main 7 Blocks Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 scroll-smooth">
        
        {/* BLOCK 1: Nan đề cốt lõi / Câu hỏi quyết định */}
        <div className="p-4 sm:p-5 rounded-2xl bg-calm-deep-moss/70 border border-calm-lichen/30 shadow-md space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono uppercase font-semibold text-calm-pollen tracking-wider flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-calm-pollen" />
              1. Nan đề cốt lõi (Tôi đang quyết định điều gì?)
            </span>
            <span className="text-[10px] font-mono text-calm-fog/60">TRỌNG TÂM</span>
          </div>

          {isEditing ? (
            <textarea
              value={draftQuestion}
              onChange={e => setDraftQuestion(e.target.value)}
              rows={2}
              className="w-full bg-calm-forest-dusk border border-calm-lichen/40 rounded-xl p-3 text-sm text-calm-warm-ivory focus:outline-none focus:border-calm-pollen"
              placeholder="Nhập câu hỏi cốt lõi bạn đang muốn tìm lời giải..."
            />
          ) : (
            <p className="font-serif text-base sm:text-lg text-calm-warm-ivory leading-relaxed italic font-normal">
              &quot;{card.decisionQuestion || 'Đang lắng nghe để kết tinh nan đề cốt lõi của bạn...'}&quot;
            </p>
          )}
        </div>

        {/* 2-Column Subgrid: Block 2 (Ranh giới đỏ) & Block 3 (Tiêu chí ưu tiên) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* BLOCK 2: Ranh giới đỏ (Hard Constraints - Không thể thỏa hiệp) */}
          <div className="p-4 rounded-2xl bg-rose-950/25 border border-rose-500/30 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono uppercase font-semibold text-rose-300 tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                2. Ranh giới đỏ (Giới hạn tối thiểu)
              </span>
              <span className="text-[10px] font-mono text-rose-300/60 font-semibold">KHÔNG NHƯỢNG BỘ</span>
            </div>

            {isEditing ? (
              <textarea
                value={draftConstraints}
                onChange={e => setDraftConstraints(e.target.value)}
                rows={3}
                className="w-full bg-calm-forest-dusk border border-rose-500/40 rounded-xl p-2.5 text-xs text-rose-100 focus:outline-none focus:border-rose-400"
                placeholder="Mỗi dòng là một ranh giới (ví dụ: Không làm quá 20h đêm)..."
              />
            ) : (
              <div className="space-y-1.5">
                {card.hardConstraints && card.hardConstraints.length > 0 ? (
                  card.hardConstraints.map((item, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-1.5 rounded-xl bg-rose-950/40 border border-rose-500/20 text-rose-200 text-xs flex items-start gap-2 leading-relaxed"
                    >
                      <span className="text-rose-400 font-mono font-bold shrink-0 mt-0.5">•</span>
                      <span>{item}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-calm-fog/60 italic">Chưa xác lập ranh giới đỏ.</p>
                )}
              </div>
            )}
          </div>

          {/* BLOCK 3: Tiêu chí ưu tiên (Key Criteria) */}
          <div className="p-4 rounded-2xl bg-calm-deep-moss/70 border border-calm-lichen/25 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono uppercase font-semibold text-calm-lichen tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-calm-lichen" />
                3. Tiêu chí ưu tiên (Điều quan trọng)
              </span>
              <span className="text-[10px] font-mono text-calm-fog/60 font-semibold">ƯU TIÊN</span>
            </div>

            {isEditing ? (
              <textarea
                value={draftCriteria}
                onChange={e => setDraftCriteria(e.target.value)}
                rows={3}
                className="w-full bg-calm-forest-dusk border border-calm-lichen/40 rounded-xl p-2.5 text-xs text-calm-paper-white focus:outline-none focus:border-calm-lichen"
                placeholder="Mỗi dòng là một tiêu chí quan trọng nhất..."
              />
            ) : (
              <div className="space-y-1.5">
                {card.criteria && card.criteria.length > 0 ? (
                  card.criteria.map((crit, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-1.5 rounded-xl bg-calm-forest-dusk/80 border border-calm-lichen/20 text-calm-fog text-xs flex items-start gap-2 leading-relaxed"
                    >
                      <span className="w-4 h-4 rounded-full bg-calm-moss/60 text-calm-pollen font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{crit}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-calm-fog/60 italic">Chưa có tiêu chí.</p>
                )}
              </div>
            )}
          </div>

        </div>

        {/* BLOCK 4: Các hướng đang cân nhắc (Options A / B / C) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-calm-deep-moss/60 border border-calm-lichen/25 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono uppercase font-semibold text-calm-warm-ivory tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-calm-pollen" />
              4. Các hướng đi đang cân nhắc (So sánh A / B / C)
            </span>
            <span className="text-[10px] font-mono text-calm-fog/60 font-semibold">TÙY CHỌN</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {card.options.map((opt, idx) => {
              const letter = String.fromCharCode(65 + idx); // A, B, C
              return (
                <div
                  key={opt.id || idx}
                  className="p-3.5 rounded-xl bg-calm-forest-dusk/90 border border-calm-lichen/20 space-y-2 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="w-5 h-5 rounded-md bg-calm-moss/80 border border-calm-lichen/40 text-calm-pollen font-mono font-bold text-xs flex items-center justify-center">
                        {letter}
                      </span>
                      <h4 className="font-medium text-xs text-calm-warm-ivory leading-tight line-clamp-1">
                        {opt.name}
                      </h4>
                    </div>
                    {opt.description && (
                      <p className="text-[11px] text-calm-fog/80 leading-relaxed font-light">
                        {opt.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* BLOCK 5: Thử nghiệm vi mô 7 ngày (Micro-experiment) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-950/30 via-calm-deep-moss to-amber-950/20 border border-amber-500/35 shadow-lg space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono uppercase font-semibold text-amber-300 tracking-wider flex items-center gap-1.5">
              <FlaskConical className="w-4 h-4 text-amber-400" />
              5. Thử nghiệm vi mô 7 ngày (Bước thử an toàn & dễ đảo ngược)
            </span>
            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono text-[10px] font-semibold">
              7 NGÀY
            </span>
          </div>

          {isEditing ? (
            <textarea
              value={draftExpAction}
              onChange={e => setDraftExpAction(e.target.value)}
              rows={2}
              className="w-full bg-calm-forest-dusk border border-amber-500/40 rounded-xl p-3 text-xs text-amber-100 focus:outline-none focus:border-amber-400"
              placeholder="Hành động rất nhỏ bạn có thể thử ngay trong 1 tuần..."
            />
          ) : (
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-calm-forest-dusk/90 border border-amber-400/25">
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400/90 block mb-1">
                  Vi hành động thực tế:
                </span>
                <p className="text-xs sm:text-sm text-calm-warm-ivory leading-relaxed font-medium">
                  {card.experiment?.action || 'Đang chuẩn bị đề xuất thử nghiệm phù hợp...'}
                </p>
              </div>

              {card.experiment?.learningQuestion && (
                <p className="text-[11px] text-calm-fog/80 italic">
                  💡 Câu hỏi kiểm chứng: {card.experiment.learningQuestion}
                </p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-calm-fog/70 font-sans">
              Kiểm chứng cảm xúc thực tế trước khi đưa ra quyết định lớn.
            </span>
            <button
              type="button"
              onClick={handleCreateExperimentAction}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/35 border border-amber-400/40 text-amber-200 text-xs font-semibold transition flex items-center gap-1.5 shadow-sm cursor-pointer hover:scale-105"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />
              <span>{copiedSuccess ? 'Đã đưa vào Thử nghiệm!' : 'Kích hoạt thử nghiệm 7 ngày'}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* 2-Column Subgrid: Block 6 (Điều chưa biết) & Block 7 (Ngày nhìn lại) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* BLOCK 6: Điều chưa biết cần kiểm chứng (Uncertainties) */}
          <div className="p-4 rounded-2xl bg-calm-deep-moss/70 border border-calm-lichen/25 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono uppercase font-semibold text-calm-pollen tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-calm-pollen" />
                6. Điều chưa biết cần kiểm chứng
              </span>
              <span className="text-[10px] font-mono text-calm-fog/60 font-semibold">ẨN SỐ</span>
            </div>

            {isEditing ? (
              <textarea
                value={draftUncertainty}
                onChange={e => setDraftUncertainty(e.target.value)}
                rows={2}
                className="w-full bg-calm-forest-dusk border border-calm-lichen/40 rounded-xl p-2.5 text-xs text-calm-paper-white focus:outline-none focus:border-calm-pollen"
                placeholder="Câu hỏi lớn nhất bạn chưa chắc chắn..."
              />
            ) : (
              <div className="space-y-1.5">
                {card.uncertainties && card.uncertainties.length > 0 ? (
                  card.uncertainties.map((unc, idx) => (
                    <div
                      key={unc.id || idx}
                      className="p-2.5 rounded-xl bg-calm-forest-dusk/70 border border-calm-lichen/20 text-xs text-calm-fog leading-relaxed"
                    >
                      <p className="font-medium text-calm-warm-ivory">{unc.question}</p>
                      {unc.verificationMethod && (
                        <p className="text-[11px] text-calm-fog/70 mt-1">
                          ↳ Cách kiểm chứng: {unc.verificationMethod}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-calm-fog/60 italic">Chưa ghi nhận ẩn số.</p>
                )}
              </div>
            )}
          </div>

          {/* BLOCK 7: Ngày nhìn lại & Đánh giá (Review Date) */}
          <div className="p-4 rounded-2xl bg-calm-deep-moss/70 border border-calm-lichen/25 shadow-sm space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-mono uppercase font-semibold text-calm-lichen tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-calm-lichen" />
                  7. Ngày nhìn lại & Đánh giá
                </span>
                <span className="text-[10px] font-mono text-calm-fog/60 font-semibold">CỘT MỐC</span>
              </div>

              {isEditing ? (
                <input
                  type="text"
                  value={draftReviewDate}
                  onChange={e => setDraftReviewDate(e.target.value)}
                  className="w-full bg-calm-forest-dusk border border-calm-lichen/40 rounded-xl p-2.5 text-xs text-calm-paper-white focus:outline-none focus:border-calm-lichen"
                  placeholder="Ví dụ: 15/11/2026..."
                />
              ) : (
                <div className="p-3 rounded-xl bg-calm-forest-dusk/80 border border-calm-lichen/20 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-serif font-medium text-calm-warm-ivory block">
                      {card.reviewDate || 'Sau 7 ngày trải nghiệm'}
                    </span>
                    <span className="text-[10px] text-calm-fog/70 font-sans">
                      Nhìn lại để điều chỉnh nhẹ nhàng, không tự trách móc.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {onSaveToMemories && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onSaveToMemories}
                  className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-calm-lichen/20 text-calm-fog hover:text-white text-xs font-sans transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <BookmarkCheck className="w-3.5 h-3.5 text-calm-lichen" />
                  <span>Lưu toàn bộ đúc kết vào Kho Bộ Nhớ</span>
                </button>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Studio Footer Status Bar */}
      <div className="px-5 py-2.5 bg-calm-deep-moss/90 border-t border-calm-lichen/15 flex items-center justify-between text-[11px] font-mono text-calm-fog/70">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-calm-lichen" />
          <span>Phiên bản: V8.7.5 • Thẻ #{card.version || 1}</span>
        </div>
        <div>
          <span>{userMessageCount} lượt trao đổi đã đồng bộ</span>
        </div>
      </div>
    </div>
  );
};
