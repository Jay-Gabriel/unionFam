import { createClient, SupabaseClient } from '@supabase/supabase-js';

const env = (import.meta as any).env || {};

export const KEY_AUTH_EVENT = 'unionfam_key_auth_changed';

const DEFAULT_URL =
  env.VITE_SUPABASE_URL ||
  env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://omztupgdandovalnoope.supabase.co';

const DEFAULT_KEY =
  env.VITE_SUPABASE_SECRET_KEY ||
  env.VITE_SUPABASE_ANON_KEY ||
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

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

export const isKeyAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('unionfam_key_auth') === 'true';
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
 * Đăng nhập trực tiếp bằng Khóa Supabase (Secret Key / Publishable Key)
 */
export const loginWithSupabaseKey = (url: string, key: string) => {
  if (typeof window !== 'undefined') {
    saveSupabaseConfig(url, key);
    localStorage.setItem('unionfam_key_auth', 'true');
    window.dispatchEvent(new Event(KEY_AUTH_EVENT));
  }
};

/**
 * Đăng xuất phiên đăng nhập bằng Khóa
 */
export const logoutKeyAuth = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('unionfam_key_auth');
    window.dispatchEvent(new Event(KEY_AUTH_EVENT));
  }
};

/**
 * Kiểm tra kết nối tới Supabase
 */
export const testSupabaseConnection = async (
  customUrl?: string,
  customKey?: string
): Promise<{ success: boolean; message: string }> => {
  const urlToTest = customUrl?.trim() || getSupabaseConfig().url;
  const keyToTest = customKey?.trim() || getSupabaseConfig().key;
  if (!urlToTest || !keyToTest) {
    return { success: false, message: 'Vui lòng cung cấp cả Supabase URL và Supabase Key.' };
  }
  try {
    const testClient = createClient(urlToTest, keyToTest);
    const { error } = await testClient.auth.getSession();
    if (error) {
      return { success: false, message: `Lỗi kết nối: ${error.message}` };
    }
    return { success: true, message: 'Kết nối Supabase thành công! Khóa và dự án hoạt động bình thường.' };
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
 * Đăng xuất tài khoản (cả Supabase Auth lẫn Key Auth)
 */
export const signOut = async () => {
  logoutKeyAuth();
  if (!supabase) return { error: null };
  return await supabase.auth.signOut();
};
