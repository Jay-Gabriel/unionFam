import React, { useState } from 'react';
import { Compass, Shield, User, Sparkles, Check, ArrowRight, LogIn } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onLoginSuccess: (userData: { name: string; email?: string; avatar?: string; focusArea: string; provider: 'google' | 'guest' }) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onLoginSuccess }) => {
  const [name, setName] = useState('');
  const [focusArea, setFocusArea] = useState('Sự nghiệp & Kiếm tiền');
  const [acceptedConsent, setAcceptedConsent] = useState(true);
  const [isLoggingInGoogle, setIsLoggingInGoogle] = useState(false);

  if (!isOpen) return null;

  // Handle Google OAuth Sign-in
  const handleGoogleLogin = () => {
    setIsLoggingInGoogle(true);
    setTimeout(() => {
      setIsLoggingInGoogle(false);
      onLoginSuccess({
        name: 'Jay (UnionFam Member)',
        email: 'jay@unionfam.vn',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        focusArea,
        provider: 'google',
      });
    }, 800);
  };

  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !acceptedConsent) return;
    onLoginSuccess({
      name: name.trim(),
      focusArea,
      provider: 'guest',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-[#20242a] border border-amber-500/40 rounded-3xl w-full max-w-lg shadow-[0_0_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col">
        {/* Header with Fantasy UnionFam Brand */}
        <div className="p-6 border-b border-stone-700/60 bg-[#191c21] flex flex-col items-center text-center relative">
          <div className="w-14 h-14 rounded-2xl bg-[#3d3224] border-2 border-amber-400 flex items-center justify-center shadow-xl mb-3">
            <svg className="w-8 h-8 text-amber-300 transform -rotate-45" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="12,2 15,10 22,12 15,14 12,22 9,14 2,12 9,10" />
            </svg>
          </div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif-title font-bold text-2xl text-stone-100 tracking-wide">
              Life Lab
            </h2>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              UnionFam Hub
            </span>
          </div>
          <p className="text-xs text-amber-300/90 font-medium mt-1">
            "Hãy kiếm tiền, nhưng trước tiên hãy biết tiền đang phục vụ cuộc đời nào."
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* 1. Google One-Click Login Button */}
          <div className="space-y-2">
            <button
              onClick={handleGoogleLogin}
              disabled={isLoggingInGoogle || !acceptedConsent}
              className="w-full bg-white hover:bg-stone-100 text-stone-800 font-semibold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all cursor-pointer disabled:opacity-50 active:scale-98 border border-stone-300"
            >
              {isLoggingInGoogle ? (
                <div className="w-5 h-5 border-2 border-stone-800 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>Đăng nhập với Google (UnionFam)</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-stone-700/60" />
            <span className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold">
              Hoặc đăng nhập Khách
            </span>
            <div className="flex-1 h-px bg-stone-700/60" />
          </div>

          {/* 2. Guest Login Form */}
          <form onSubmit={handleGuestSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>Tên của bạn:</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập tên của bạn..."
                className="w-full bg-[#16181c] border border-stone-700 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-inner"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-amber-400" />
                <span>Lĩnh vực quan tâm ban đầu:</span>
              </label>
              <select
                value={focusArea}
                onChange={(e) => setFocusArea(e.target.value)}
                className="w-full bg-[#16181c] border border-stone-700 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="Sự nghiệp & Kiếm tiền">🏰 Work & Money — Sự nghiệp & Áp lực kiếm tiền</option>
                <option value="Kỳ vọng gia đình & Xã hội">🌲 Relationships — Kỳ vọng của gia đình & Xã hội</option>
                <option value="Định hướng tương lai">🌫️ The Gap — Vượt qua khoảng trống bế tắc</option>
                <option value="Thiết kế cuộc sống lý tưởng">✨ Desired Difference — Xây dựng cuộc đời tự chủ</option>
              </select>
            </div>

            {/* V7 Consent Agreement Box */}
            <div className="p-3.5 rounded-2xl bg-[#171a1e] border border-stone-800 text-xs text-stone-300 space-y-2">
              <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                <Shield className="w-3.5 h-3.5" />
                <span>Quyền làm chủ dữ liệu (Kịch bản V7):</span>
              </div>
              <p className="text-[11px] text-stone-400 leading-relaxed">
                • AI chỉ là tấm gương phản chiếu, không phán xét.<br />
                • Bạn có quyền sửa (Repair), không lưu (No Memory) và dừng lại (Stop) bất kỳ lúc nào.
              </p>
              <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={acceptedConsent}
                  onChange={(e) => setAcceptedConsent(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
                <span className="text-[11px] text-stone-200 font-medium">
                  Tôi đồng ý với cam kết trải nghiệm của Life Lab
                </span>
              </label>
            </div>

            {/* Submit Guest Button */}
            <button
              type="submit"
              disabled={!name.trim() || !acceptedConsent}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 text-stone-950 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer active:scale-98 transition-all"
            >
              <span>Vào trải nghiệm trực tiếp</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
