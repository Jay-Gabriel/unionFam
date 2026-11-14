import { createClient, SupabaseClient } from '@supabase/supabase-js';

const env = (import.meta as any).env || {};

const DEFAULT_URL =
  env.VITE_SUPABASE_URL ||
  env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://omztupgdandovalnoope.supabase.co';

const DEFAULT_KEY =
  env.VITE_SUPABASE_ANON_KEY ||
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

export const getSupabaseConfig = () => {
  return { url: DEFAULT_URL, key: DEFAULT_KEY, isCustom: false };
};

const initClient = (): SupabaseClient | null => {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) return null;
  try {
    return createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
    return null;
  }
};

export let supabase: SupabaseClient | null = initClient();

export const isSupabaseConfigured = Boolean(supabase);

/**
 * Kiểm tra kết nối tới Supabase
 */
export const testSupabaseConnection = async (): Promise<{ success: boolean; message: string }> => {
  if (!supabase) {
    return { success: false, message: 'Chưa cấu hình Supabase URL hoặc Publishable Key.' };
  }
  try {
    const { error } = await supabase.auth.getSession();
    if (error) {
      return { success: false, message: `Lỗi kết nối: ${error.message}` };
    }
    return { success: true, message: 'Kết nối Supabase thành công! Dự án hoạt động bình thường.' };
  } catch (e: any) {
    return { success: false, message: e?.message || 'Không thể kết nối đến máy chủ Supabase' };
  }
};

/**
 * Đăng nhập bằng Google OAuth
 */
export const signInWithGoogle = async () => {
  if (!supabase) {
    return { data: null, error: new Error('Chưa cấu hình Supabase URL hoặc Publishable Key.') };
  }

  const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
  return await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
};

/**
 * Đăng nhập bằng Email & Mật khẩu
 */
export const signInWithEmail = async (email: string, pass: string) => {
  if (!supabase) {
    return { data: null, error: new Error('Chưa cấu hình Supabase URL hoặc Publishable Key.') };
  }
  return await supabase.auth.signInWithPassword({
    email,
    password: pass,
  });
};

/**
 * Đăng ký tài khoản mới bằng Email & Mật khẩu
 */
export const signUpWithEmail = async (email: string, pass: string) => {
  if (!supabase) {
    return { data: null, error: new Error('Chưa cấu hình Supabase URL hoặc Publishable Key.') };
  }
  return await supabase.auth.signUp({
    email,
    password: pass,
  });
};

/**
 * Đăng xuất tài khoản
 */
export const signOut = async () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('unionfam_key_auth');
    localStorage.removeItem('unionfam_supabase_url');
    localStorage.removeItem('unionfam_supabase_anon_key');
  }
  if (!supabase) return { error: null };
  return await supabase.auth.signOut();
};
