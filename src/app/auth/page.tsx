'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, ArrowRight, ShieldAlert, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const EMAIL_AUTH_ENABLED = process.env.NEXT_PUBLIC_ENABLE_EMAIL_AUTH === 'true';
const GOOGLE_AUTH_ENABLED = process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH === 'true';
const UI_PREVIEW_ENABLED = process.env.NODE_ENV !== 'production';

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams?.get('returnUrl') || '/onboarding';

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const routeError = searchParams?.get('error');
  const configurationMessage =
    routeError === 'config'
      ? 'Hệ thống đăng nhập chưa được cấu hình trên máy chủ. Vui lòng thử lại sau.'
      : routeError === 'service'
        ? 'Dịch vụ đăng nhập đang tạm gián đoạn. Vui lòng thử lại sau.'
        : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const supabase = createClient();

      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?returnUrl=${encodeURIComponent(returnUrl)}`,
          },
        });
        if (error) throw error;
        if (!data.session) {
          setErrorMsg('Tài khoản đã tạo. Hãy kiểm tra email để xác nhận rồi đăng nhập.');
          setIsLoading(false);
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }

      // Fallbacks removed per security requirements

      router.push(returnUrl);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Đăng nhập không thành công');
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?returnUrl=${encodeURIComponent(returnUrl)}`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err?.message || 'Đăng nhập Google thất bại');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white mx-auto flex items-center justify-center font-bold text-xl shadow-md shadow-indigo-200">
          L
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {isSignUp ? 'Tạo tài khoản Life Lab' : 'Đăng nhập Life Lab'}
        </h1>
        <p className="text-xs text-slate-500">Understand → Choose → Become</p>
      </div>

      {(errorMsg || configurationMessage) && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-semibold text-rose-700 flex items-center gap-2">
          <ShieldAlert size={16} />
          <span>{errorMsg || configurationMessage}</span>
        </div>
      )}

      {UI_PREVIEW_ENABLED && (
        <button
          type="button"
          onClick={() => router.push('/app')}
          className="w-full rounded-2xl border border-emerald-300 bg-emerald-100 px-4 py-3 text-sm font-bold text-emerald-800 transition-colors hover:bg-emerald-200"
        >
          Vào xem giao diện (Local Preview)
        </button>
      )}

      {GOOGLE_AUTH_ENABLED && (
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={isLoading}
          className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 rounded-2xl border border-slate-200 font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px]">
              <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.06H12v3.9h5.38a4.6 4.6 0 0 1-2 3.02v2.53h3.24c1.9-1.75 2.98-4.32 2.98-7.39Z" />
              <path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.38l-3.24-2.53c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.13H3.06v2.6A10 10 0 0 0 12 22Z" />
              <path fill="#FBBC05" d="M6.41 13.92A6.02 6.02 0 0 1 6.1 12c0-.67.11-1.31.31-1.92v-2.6H3.06A10 10 0 0 0 2 12c0 1.61.38 3.14 1.06 4.52l3.35-2.6Z" />
              <path fill="#EA4335" d="M12 5.95c1.47 0 2.79.51 3.83 1.5l2.87-2.88A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.94 5.48l3.35 2.6A5.99 5.99 0 0 1 12 5.95Z" />
            </svg>
          )}
          <span>Tiếp tục với Google</span>
        </button>
      )}

      {!EMAIL_AUTH_ENABLED && (
        <p className="rounded-2xl bg-slate-50 px-4 py-3 text-center text-xs leading-relaxed text-slate-500">
          Email đang tạm tắt. Google sẽ xuất hiện sau khi provider được cấu hình.
        </p>
      )}

      {EMAIL_AUTH_ENABLED && (
        <>
          <div className="relative flex items-center justify-center my-4">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[11px] text-slate-400 font-medium absolute">
              hoặc dùng email
            </span>
          </div>

          {/* Email & Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs md:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700">Mật khẩu</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs md:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs md:text-sm rounded-2xl shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-1.5"
        >
          <span>{isLoading ? 'Đang xử lý...' : isSignUp ? 'Đăng ký' : 'Đăng nhập'}</span>
          <ArrowRight size={16} />
        </button>
          </form>

          <div className="text-center pt-2">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs text-indigo-600 hover:underline font-semibold"
            >
              {isSignUp ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký ngay'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function AuthPage() {
  return (
    <div className="legacy-calm-page min-h-screen bg-calm-deep-moss flex items-center justify-center p-4">
      <Suspense fallback={<Loader2 className="animate-spin text-indigo-600" size={32} />}>
        <AuthForm />
      </Suspense>
    </div>
  );
}
