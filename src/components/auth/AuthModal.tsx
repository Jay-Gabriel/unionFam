import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Sparkles,
  Key,
  Mail,
  Lock,
  ArrowRight,
  RefreshCw,
  Check,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  getSupabaseConfig,
  saveSupabaseConfig,
  testSupabaseConnection,
  loginWithSupabaseKey
} from '../../lib/supabaseClient';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'key' | 'google_email'>('key');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Supabase Config state (Defaulted to user's secret key)
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Email/Pass state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const config = getSupabaseConfig();
      setSupabaseUrl(config.url || 'https://omztupgdandovalnoope.supabase.co');
      setSupabaseKey(config.key || '');
      setErrorMsg(null);
      setSuccessMsg(null);
      setConnectionStatus(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleKeyLogin = () => {
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      setErrorMsg('Vui lòng cung cấp cả URL và Khóa Supabase.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      loginWithSupabaseKey(supabaseUrl.trim(), supabaseKey.trim());
      setSuccessMsg('Đăng nhập thành công với Khóa Supabase!');
      setTimeout(() => {
        setLoading(false);
        onClose();
      }, 700);
    } catch (e: any) {
      setErrorMsg(e?.message || 'Không thể lưu khóa Supabase');
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus(null);
    try {
      const res = await testSupabaseConnection(supabaseUrl, supabaseKey);
      setConnectionStatus(res);
    } finally {
      setTestingConnection(false);
    }
  };

  const handleResetConfig = () => {
    saveSupabaseConfig('', '');
    const config = getSupabaseConfig();
    setSupabaseUrl(config.url);
    setSupabaseKey(config.key);
    setConnectionStatus(null);
    setSuccessMsg('Đã khôi phục cài đặt mặc định.');
    setTimeout(() => setSuccessMsg(null), 2500);
  };

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

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ Email và Mật khẩu.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (isRegisterMode) {
        const res = await signUpWithEmail(email.trim(), password.trim());
        if (res.error) {
          setErrorMsg(res.error.message);
        } else {
          setSuccessMsg('Đăng ký thành công! Bạn có thể đăng nhập ngay.');
          setIsRegisterMode(false);
        }
      } else {
        const res = await signInWithEmail(email.trim(), password.trim());
        if (res.error) {
          setErrorMsg(res.error.message);
        } else {
          setSuccessMsg('Đăng nhập thành công!');
          setTimeout(() => onClose(), 1000);
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Lỗi xác thực email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-calm-forest-dusk/95 border border-calm-lichen/30 rounded-3xl p-6 sm:p-7 text-calm-paper-white shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-calm-fog hover:text-white transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand & Title */}
        <div className="text-center space-y-1.5 pt-1">
          <div className="inline-flex w-11 h-11 rounded-2xl bg-calm-deep-moss border border-calm-lichen/40 items-center justify-center text-calm-pollen shadow-soft mx-auto">
            <Key className="w-5 h-5 animate-pulse" />
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-light text-calm-warm-ivory">
            Đăng Nhập & Khóa Supabase
          </h2>
          <p className="text-xs text-calm-fog leading-relaxed font-light">
            Đồng bộ an toàn dữ liệu Life Map, Thử nghiệm và Đúc kết cá nhân.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-black/30 p-1 border border-white/10 text-xs font-medium">
          <button
            onClick={() => { setActiveTab('key'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`flex-1 py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'key'
                ? 'bg-calm-moss text-white font-semibold shadow-soft'
                : 'text-calm-fog hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-calm-pollen" />
            <span>Khóa Supabase</span>
          </button>
          <button
            onClick={() => { setActiveTab('google_email'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`flex-1 py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'google_email'
                ? 'bg-calm-moss text-white font-semibold shadow-soft'
                : 'text-calm-fog hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Google & Email</span>
          </button>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs text-center font-mono">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs text-center font-mono flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* TAB 1: SUPABASE KEY LOGIN */}
        {activeTab === 'key' && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-calm-deep-moss/70 border border-calm-lichen/20 text-xs text-calm-fog space-y-1">
              <div className="font-semibold text-calm-warm-ivory flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-calm-pollen" />
                <span>Đăng nhập trực tiếp bằng Khóa Supabase</span>
              </div>
              <p className="text-[11px] leading-relaxed text-calm-fog/85">
                Nhập hoặc dán Khóa Bí Mật (Secret Key) hoặc Khóa Công Khai (Anon Key) của dự án Supabase để kích hoạt kết nối đám mây.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-calm-fog/80 mb-1">
                Supabase Project URL
              </label>
              <input
                type="text"
                value={supabaseUrl}
                onChange={e => setSupabaseUrl(e.target.value)}
                placeholder="https://omztupgdandovalnoope.supabase.co"
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-calm-lichen/30 text-xs text-white font-mono placeholder-stone-500 focus:outline-none focus:border-calm-pollen"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-calm-fog/80 mb-1">
                Supabase Secret Key / Anon Key
              </label>
              <textarea
                rows={3}
                value={supabaseKey}
                onChange={e => setSupabaseKey(e.target.value)}
                placeholder="sb_secret_... hoặc sb_publishable_..."
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-calm-lichen/30 text-xs text-white font-mono placeholder-stone-500 focus:outline-none focus:border-calm-pollen resize-none"
              />
            </div>

            {/* Test Connection Result */}
            {connectionStatus && (
              <div
                className={`p-3 rounded-xl border text-xs font-mono flex items-start gap-2 ${
                  connectionStatus.success
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                }`}
              >
                {connectionStatus.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                )}
                <span>{connectionStatus.message}</span>
              </div>
            )}

            {/* Primary Action Button */}
            <button
              type="button"
              onClick={handleKeyLogin}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-calm-moss hover:bg-calm-lichen/40 border border-calm-lichen/50 text-white font-medium text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-soft hover:scale-[1.01] active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Key className="w-4 h-4 text-calm-pollen" />
                  <span>Đăng nhập & Kích hoạt Khóa</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Utility Row: Test & Reset */}
            <div className="flex items-center gap-2 pt-1 text-xs font-mono">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testingConnection}
                className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-calm-fog hover:text-white transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${testingConnection ? 'animate-spin text-calm-pollen' : ''}`} />
                <span>Thử kết nối</span>
              </button>

              <button
                type="button"
                onClick={handleResetConfig}
                className="py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-calm-fog/70 hover:text-calm-fog transition cursor-pointer"
              >
                Mặc định
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: GOOGLE & EMAIL */}
        {activeTab === 'google_email' && (
          <div className="space-y-4">
            {/* Google OAuth Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-stone-100 text-stone-900 font-medium text-xs sm:text-sm transition shadow-lg flex items-center justify-center gap-3 cursor-pointer hover:scale-[1.01] active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-stone-800 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
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

            {/* Divider */}
            <div className="flex items-center gap-3 my-2 text-xs text-calm-fog/40 font-mono">
              <div className="flex-1 h-[1px] bg-white/10" />
              <span>hoặc đăng nhập bằng email</span>
              <div className="flex-1 h-[1px] bg-white/10" />
            </div>

            {/* Email & Password Form */}
            <form onSubmit={handleEmailAuth} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono text-calm-fog/70 mb-1">
                  Địa chỉ Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-calm-fog/50" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="ban@example.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-black/40 border border-calm-lichen/30 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-calm-pollen"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-calm-fog/70 mb-1">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-calm-fog/50" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-black/40 border border-calm-lichen/30 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-calm-pollen"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-calm-moss hover:bg-calm-lichen/30 border border-calm-lichen/50 text-white font-medium text-xs transition shadow-soft flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{isRegisterMode ? 'Đăng ký tài khoản' : 'Đăng nhập bằng Email'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(!isRegisterMode)}
                  className="text-xs text-calm-pollen hover:underline cursor-pointer font-mono"
                >
                  {isRegisterMode ? 'Đã có tài khoản? Đăng nhập ngay' : 'Chưa có tài khoản? Đăng ký mới'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Security badge */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-calm-fog/60 font-mono pt-1 border-t border-white/10">
          <ShieldCheck className="w-3.5 h-3.5 text-calm-lichen" />
          <span>Mã hóa bảo vệ tiêu chuẩn OAuth 2.0 & Supabase Auth</span>
        </div>

      </div>
    </div>
  );
};
