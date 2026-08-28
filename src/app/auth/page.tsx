'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, ArrowRight, ShieldAlert, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams?.get('returnUrl') || '/onboarding';

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?returnUrl=${encodeURIComponent(returnUrl)}`,
          },
        });
        if (error) throw error;
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
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?returnUrl=${encodeURIComponent(returnUrl)}`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      // Fallbacks removed per security requirements
      setErrorMsg(err?.message || 'Đăng nhập Google thất bại');
      router.push(returnUrl);
      router.refresh();
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

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-semibold text-rose-700 flex items-center gap-2">
          <ShieldAlert size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Fast Test Login Button */}
      <button
        type="button"
        onClick={async () => {
          setIsLoading(true);
          setErrorMsg('');
          
          // Generate a fresh email each time to bypass local rate limits
          const uniqueId = Math.floor(Math.random() * 100000);
          const testEmail = `tester_${uniqueId}@gmail.com`;
          const testPass = 'Password123!';
          
          // Simply sign up (which auto-logins since confirmations are off)
          const { error: signUpErr } = await supabase.auth.signUp({
            email: testEmail,
            password: testPass,
          });
          
          if (signUpErr) {
            setErrorMsg('Lỗi: ' + signUpErr.message);
            setIsLoading(false);
            return;
          }
          
          router.push(returnUrl || '/app');
          router.refresh();
        }}
        disabled={isLoading}
        className="w-full py-3 px-4 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-2xl border border-emerald-300 font-bold text-sm flex items-center justify-center transition-colors"
      >
        🚀 Đăng nhập nhanh (Test Mode)
      </button>

      <div className="relative flex items-center justify-center my-4">
        <div className="border-t border-slate-200 w-full" />
        <span className="bg-white px-3 text-[11px] text-slate-400 font-medium absolute">hoặc tự nhập</span>
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
    </div>
  );
}

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Suspense fallback={<Loader2 className="animate-spin text-indigo-600" size={32} />}>
        <AuthForm />
      </Suspense>
    </div>
  );
}
