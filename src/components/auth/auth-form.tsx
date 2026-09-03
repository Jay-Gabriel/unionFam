'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Loader2, Lock, Mail, ShieldAlert, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const EMAIL_AUTH_ENABLED = process.env.NEXT_PUBLIC_ENABLE_EMAIL_AUTH === 'true';
const GOOGLE_AUTH_ENABLED = process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH === 'true';
const UI_PREVIEW_ENABLED = process.env.NODE_ENV !== 'production';

type AuthMode = 'member' | 'admin';

function safeReturnUrl(value: string | null, fallback: string) {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : fallback;
}

function friendlyAuthError(error: unknown, mode: AuthMode) {
  if (mode === 'admin') {
    return 'Email hoặc mật khẩu quản trị viên không đúng.';
  }

  return error instanceof Error && error.message
    ? error.message
    : 'Đăng nhập không thành công.';
}

export function AuthForm({ mode = 'member' }: { mode?: AuthMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAdmin = mode === 'admin';
  const returnUrl = safeReturnUrl(searchParams?.get('returnUrl') ?? null, isAdmin ? '/admin' : '/onboarding');

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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const supabase = createClient();

      if (!isAdmin && isSignUp) {
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
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }

      if (isAdmin) {
        const response = await fetch('/api/auth/me', { cache: 'no-store' });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || result?.data?.role !== 'admin') {
          await supabase.auth.signOut();
          throw new Error('ADMIN_ROLE_REQUIRED');
        }
      }

      router.push(returnUrl);
      router.refresh();
    } catch (error) {
      setErrorMsg(friendlyAuthError(error, mode));
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?returnUrl=${encodeURIComponent(returnUrl)}`,
        },
      });
      if (error) throw error;
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Đăng nhập Google thất bại.');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6 rounded-3xl border border-white/10 bg-calm-forest-dusk/90 p-8 shadow-2xl backdrop-blur">
      <div className="space-y-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-calm-lichen text-calm-deep-moss font-bold text-xl shadow-md">
          {isAdmin ? <ShieldCheck size={22} /> : 'L'}
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-calm-paper-white">
          {isAdmin ? 'Đăng nhập quản trị viên' : isSignUp ? 'Tạo tài khoản Life Lab' : 'Đăng nhập Life Lab'}
        </h1>
        <p className="text-xs text-calm-fog/70">
          {isAdmin ? 'Khu vực quản trị · dùng email và mật khẩu riêng' : 'Hiểu mình → Chọn hướng → Trở thành'}
        </p>
      </div>

      {(errorMsg || configurationMessage) && (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-300/40 bg-rose-100/90 p-3 text-xs font-semibold text-rose-800">
          <ShieldAlert size={16} />
          <span>{errorMsg || configurationMessage}</span>
        </div>
      )}

      {!isAdmin && UI_PREVIEW_ENABLED && (
        <button
          type="button"
          onClick={() => router.push('/app')}
          className="w-full rounded-2xl border border-calm-lichen/50 bg-calm-lichen/20 px-4 py-3 text-sm font-bold text-calm-lichen transition-colors hover:bg-calm-lichen/30"
        >
          Vào xem giao diện (xem thử nội bộ)
        </button>
      )}

      {!isAdmin && GOOGLE_AUTH_ENABLED && (
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold text-calm-paper-white transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? <Loader2 className="animate-spin" size={18} /> : <span aria-hidden="true">G</span>}
          <span>Tiếp tục với Google</span>
        </button>
      )}

      {isAdmin && (
        <p className="rounded-2xl border border-calm-lichen/20 bg-calm-lichen/10 px-4 py-3 text-center text-xs leading-relaxed text-calm-fog/70">
          Tài khoản này phải được cấp role <strong className="text-calm-paper-white">admin</strong> trong Supabase. Tài khoản thành viên sẽ không thể vào khu vực quản trị.
        </p>
      )}

      {!isAdmin && !EMAIL_AUTH_ENABLED && !GOOGLE_AUTH_ENABLED && (
        <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-xs leading-relaxed text-calm-fog/70">
          Đăng nhập bằng email đang tạm tắt. Google sẽ xuất hiện sau khi được cấu hình.
        </p>
      )}

      {(isAdmin || EMAIL_AUTH_ENABLED) && (
        <>
          {!isAdmin && (
            <div className="relative my-4 flex items-center justify-center">
              <div className="w-full border-t border-white/10" />
              <span className="absolute bg-calm-forest-dusk px-3 text-[11px] font-medium text-calm-fog/70">hoặc dùng email</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-calm-paper-white" htmlFor="auth-email">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-calm-fog/70" size={16} />
                <input
                  id="auth-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@example.com"
                  className="w-full rounded-2xl border border-white/15 bg-white/10 py-2.5 pl-10 pr-4 text-xs text-calm-paper-white outline-none transition-all placeholder:text-calm-fog/60 focus:border-calm-lichen/70 focus:ring-2 focus:ring-calm-lichen/20 md:text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-calm-paper-white" htmlFor="auth-password">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-calm-fog/70" size={16} />
                <input
                  id="auth-password"
                  type="password"
                  required
                  autoComplete={isAdmin ? 'current-password' : isSignUp ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-white/15 bg-white/10 py-2.5 pl-10 pr-4 text-xs text-calm-paper-white outline-none transition-all placeholder:text-calm-fog/60 focus:border-calm-lichen/70 focus:ring-2 focus:ring-calm-lichen/20 md:text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-calm-lichen py-3 text-xs font-bold text-calm-deep-moss shadow-md transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 md:text-sm"
            >
              <span>{isLoading ? 'Đang xác thực…' : isAdmin ? 'Vào khu vực quản trị' : isSignUp ? 'Đăng ký' : 'Đăng nhập'}</span>
              {isLoading ? <Loader2 className="animate-spin" size={16} /> : <ArrowRight size={16} />}
            </button>
          </form>

          {!isAdmin && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setIsSignUp((value) => !value)}
                className="text-xs font-semibold text-calm-lichen hover:underline"
              >
                {isSignUp ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký ngay'}
              </button>
            </div>
          )}
        </>
      )}

      {!isAdmin && (
        <div className="border-t border-white/10 pt-4 text-center">
          <Link
            href={`/auth/admin?returnUrl=${encodeURIComponent(returnUrl)}`}
            className="text-xs font-semibold text-calm-fog/70 underline-offset-4 transition hover:text-calm-paper-white hover:underline"
          >
            Đăng nhập quản trị viên
          </Link>
        </div>
      )}

      {isAdmin && (
        <div className="border-t border-white/10 pt-4 text-center">
          <Link href="/auth" className="text-xs font-semibold text-calm-fog/70 underline-offset-4 transition hover:text-calm-paper-white hover:underline">
            ← Quay lại đăng nhập người dùng
          </Link>
        </div>
      )}
    </div>
  );
}
