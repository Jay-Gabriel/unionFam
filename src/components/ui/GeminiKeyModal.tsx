import React, { useState } from 'react';
import { KeyRound, Check, X, Zap, ShieldAlert, Sparkles, ExternalLink } from 'lucide-react';

interface GeminiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveKey: (key: string) => void;
  currentKey: string;
}

export const GeminiKeyModal: React.FC<GeminiKeyModalProps> = ({
  isOpen,
  onClose,
  onSaveKey,
  currentKey,
}) => {
  const [keyInput, setKeyInput] = useState(currentKey);
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveKey(keyInput.trim());
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-[#20242a] border border-amber-500/50 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-stone-700/60 bg-[#191c21] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-md">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif-title font-bold text-base text-stone-100">
                Cấu hình Google Gemini API Key
              </h2>
              <p className="text-xs text-stone-400">
                Kích hoạt mô hình Gemini 2.5 Flash thông minh theo thời gian thực
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4 select-text">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-300 flex items-center justify-between">
              <span>Google Gemini API Key:</span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-amber-400 hover:underline flex items-center gap-0.5"
              >
                <span>Lấy key miễn phí</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </label>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-[#16181c] border border-stone-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-inner font-mono"
            />
          </div>

          <div className="p-3 rounded-xl bg-[#181a1f] border border-stone-800 text-[11px] text-stone-300 space-y-1">
            <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
              <Zap className="w-3.5 h-3.5" />
              <span>Trạng thái kết nối:</span>
            </div>
            <p className="text-stone-400">
              {keyInput.trim()
                ? '✅ Đã nạp Key — Hệ thống sẽ gọi trực tiếp Google Gemini 2.5 Flash để phản chiếu tâm lý chuyên sâu.'
                : '⚡ Chưa có Key — Hệ thống đang sử dụng Bộ não Offline UnionFam Blueprint 7.0 Consulting.'}
            </p>
          </div>

          {/* Action */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="bg-stone-700 hover:bg-stone-600 text-stone-300 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="submit"
              className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95 transition-all"
            >
              {isSaved ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              <span>{isSaved ? 'Đã lưu!' : 'Lưu & Kích hoạt'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
