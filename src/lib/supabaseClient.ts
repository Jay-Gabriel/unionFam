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
  'sb_publishable_sUE23Twkd3pf69wX8QFXQg_UraKAF7K';

export const getSupabaseConfig = () => {
  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem('unionfam_supabase_url');
    const customKey = localStorage.getItem('unionfam_supabase_anon_key');
    if (customUrl && customKey) {
      return { url: customUrl.trim(), key: customKey.trim(), isCustom: true };
    }
  }
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
 * Lưu cấu hình Supabase tùy chỉnh và làm mới client
 */
export const saveSupabaseConfig = (url: string, key: string) => {
  if (typeof window !== 'undefined') {
    if (url.trim() && key.trim()) {
      localStorage.setItem('unionfam_supabase_url', url.trim());
      localStorage.setItem('unionfam_supabase_anon_key', key.trim());
    } else {
      localStorage.removeItem('unionfam_supabase_url');
      localStorage.removeItem('unionfam_supabase_anon_key');
    }
    supabase = initClient();
  }
};

/**
 * Kiểm tra kết nối tới Supabase
 */
export const testSupabaseConnection = async (): Promise<{ success: boolean; message: string }> => {
  if (!supabase) {
    return { success: false, message: 'Chưa khởi tạo được Supabase client. Vui lòng kiểm tra lại URL và Key.' };
  }
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      return { success: false, message: `Lỗi xác thực: ${error.message}` };
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
    return { data: null, error: new Error('Chưa cấu hình Supabase URL hoặc Key.') };
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
    return { data: null, error: new Error('Chưa cấu hình Supabase URL hoặc Key.') };
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
  if (!supabase) return { error: null };
  return await supabase.auth.signOut();
};
