import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Cloud,
  Sparkles,
  CheckCircle2,
  Lock,
  Key,
  Mail,
  ArrowRight,
  RefreshCw,
  Sliders,
  Check
} from 'lucide-react';
import {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  getSupabaseConfig,
  saveSupabaseConfig,
  testSupabaseConnection
} from '../../lib/supabaseClient';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'config'>('login');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Email/Pass state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Supabase Config state
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const config = getSupabaseConfig();
      setSupabaseUrl(config.url);
      setSupabaseKey(config.key);
      setErrorMsg(null);
      setSuccessMsg(null);
      setConnectionStatus(null);
    }
  }, [isOpen]);

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
          setSuccessMsg('Đăng ký tài khoản thành công! Bạn có thể đăng nhập ngay.');
          setIsRegisterMode(false);
        }
      } else {
        const res = await signInWithEmail(email.trim(), password.trim());
        if (res.error) {
          setErrorMsg(res.error.message);
        } else {
          setSuccessMsg('Đăng nhập thành công!');
          setTimeout(() => onClose(), 1200);
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Lỗi xác thực email');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus(null);
    try {
      const res = await testSupabaseConnection();
      setConnectionStatus(res);
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveConfig = () => {
    saveSupabaseConfig(supabaseUrl, supabaseKey);
    setSuccessMsg('Đã lưu cấu hình Supabase URL & Key mới thành công!');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleResetConfig = () => {
    saveSupabaseConfig('', '');
    const config = getSupabaseConfig();
    setSupabaseUrl(config.url);
    setSupabaseKey(config.key);
    setSuccessMsg('Đã khôi phục Supabase Key về mặc định.');
    setTimeout(() => setSuccessMsg(null), 3000);
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
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-light text-calm-warm-ivory">
            Tài Khoản & Khóa Supabase
          </h2>
          <p className="text-xs text-calm-fog leading-relaxed font-light">
            Lưu giữ trọn vẹn hành trình, Bản đồ sống và Thử nghiệm của bạn.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-black/30 p-1 border border-white/10 text-xs font-medium">
          <button
            onClick={() => { setActiveTab('login'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`flex-1 py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'login'
                ? 'bg-calm-moss text-white font-semibold shadow-soft'
                : 'text-calm-fog hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Đăng nhập</span>
          </button>
          <button
            onClick={() => { setActiveTab('config'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`flex-1 py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'config'
                ? 'bg-calm-moss text-white font-semibold shadow-soft'
                : 'text-calm-fog hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-calm-pollen" />
            <span>Khóa Supabase</span>
          </button>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs text-center font-mono">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs text-center font-mono">
            {successMsg}
          </div>
        )}

        {/* TAB 1: LOGIN (GOOGLE & EMAIL) */}
        {activeTab === 'login' && (
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

        {/* TAB 2: SUPABASE KEY CONFIGURATION */}
        {activeTab === 'config' && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-calm-deep-moss/60 border border-calm-lichen/20 text-xs text-calm-fog space-y-1">
              <div className="font-semibold text-calm-warm-ivory flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-calm-pollen" />
                <span>Cấu hình Khóa Supabase Cá Nhân</span>
              </div>
              <p className="text-[11px] leading-relaxed text-calm-fog/80">
                Hệ thống đã kết nối sẵn với dự án Supabase. Nếu bạn có dự án Supabase riêng, bạn có thể dán URL và Anon Key tại đây để lưu trữ dữ liệu độc lập.
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
                placeholder="https://xyzcompany.supabase.co"
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-calm-lichen/30 text-xs text-white font-mono placeholder-stone-500 focus:outline-none focus:border-calm-pollen"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-calm-fog/80 mb-1">
                Supabase Anon / Publishable Key
              </label>
              <textarea
                rows={3}
                value={supabaseKey}
                onChange={e => setSupabaseKey(e.target.value)}
                placeholder="sb_publishable_... hoặc eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-calm-lichen/30 text-xs text-white font-mono placeholder-stone-500 focus:outline-none focus:border-calm-pollen resize-none"
              />
            </div>

            {/* Test Connection Result */}
            {connectionStatus && (
              <div
                className={`p-3 rounded-xl border text-xs font-mono ${
                  connectionStatus.success
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                }`}
              >
                {connectionStatus.message}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testingConnection}
                className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs text-calm-paper-white font-medium transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin text-calm-pollen' : ''}`} />
                <span>Kiểm tra kết nối</span>
              </button>

              <button
                type="button"
                onClick={handleSaveConfig}
                className="flex-1 py-2 rounded-xl bg-calm-moss hover:bg-calm-lichen/40 border border-calm-lichen/50 text-xs text-white font-medium transition flex items-center justify-center gap-1.5 cursor-pointer shadow-soft"
              >
                <Check className="w-3.5 h-3.5 text-calm-pollen" />
                <span>Lưu khóa mới</span>
              </button>
            </div>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={handleResetConfig}
                className="text-[11px] text-calm-fog/60 hover:text-calm-fog hover:underline cursor-pointer font-mono"
              >
                Khôi phục Key Supabase mặc định
              </button>
            </div>
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
