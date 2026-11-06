import React, { useState } from 'react';
import { X, ShieldCheck, Cloud, Sparkles, CheckCircle2, Lock } from 'lucide-react';
import { signInWithGoogle } from '../../lib/supabaseClient';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await signInWithGoogle();
      if (res.error) {
        setErrorMsg(res.error.message || 'Không thể kết nối Google OAuth');
      }
    } catch (e: any) {
      setErrorMsg(e?.message || 'Đã có lỗi xảy ra khi xác thực');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-calm-forest-dusk/95 border border-calm-lichen/30 rounded-3xl p-6 sm:p-8 text-calm-paper-white shadow-2xl space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-calm-fog hover:text-white transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand & Title */}
        <div className="text-center space-y-2 pt-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-calm-deep-moss border border-calm-lichen/40 items-center justify-center text-calm-pollen shadow-soft mx-auto">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-2xl font-serif font-light text-calm-warm-ivory">
            Đăng nhập tài khoản
          </h2>
          <p className="text-sm text-calm-fog leading-relaxed font-light">
            Lưu giữ trọn vẹn hành trình, Bản đồ sống và Thử nghiệm của bạn trên mọi thiết bị.
          </p>
        </div>

        {/* Benefits checklist */}
        <div className="space-y-3 py-2 bg-calm-deep-moss/50 border border-calm-lichen/20 rounded-2xl p-4 text-xs text-calm-paper-white/90">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-calm-lichen flex-shrink-0" />
            <span>Tự động đồng bộ các phiên trò chuyện AI & Thẻ Quyết Định</span>
          </div>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-calm-lichen flex-shrink-0" />
            <span>Theo dõi tiến độ Thử nghiệm 7 ngày liên tục</span>
          </div>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-calm-lichen flex-shrink-0" />
            <span>Bảo mật riêng tư 100%, không chia sẻ cho bên thứ ba</span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs text-center font-mono">
            {errorMsg}
          </div>
        )}

        {/* Google OAuth Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-3.5 px-5 rounded-2xl bg-white hover:bg-stone-100 text-stone-900 font-medium text-sm transition shadow-lg flex items-center justify-center gap-3 cursor-pointer hover:scale-[1.02] active:scale-95 disabled:opacity-50"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-stone-800 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              {/* Google SVG Logo */}
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
              <span>Tiếp tục với Google</span>
            </>
          )}
        </button>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-calm-fog/70 font-mono">
          <Lock className="w-3.5 h-3.5 text-calm-lichen" />
          <span>Mã hóa bảo vệ tiêu chuẩn OAuth 2.0</span>
        </div>

      </div>
    </div>
  );
};
