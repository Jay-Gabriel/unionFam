import { createClient, SupabaseClient } from '@supabase/supabase-js';

const env = (import.meta as any).env || {};

const supabaseUrl: string =
  env.VITE_SUPABASE_URL ||
  env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://gaiegowhwyzksmiylbqi.supabase.co';

const supabaseAnonKey: string =
  env.VITE_SUPABASE_ANON_KEY ||
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_LrXV6H2rUOjxxS_UwVTHQQ_lesDqO1G';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/**
 * Đăng nhập bằng tài khoản Google thông qua Supabase OAuth
 */
export const signInWithGoogle = async () => {
  if (!supabase) {
    alert('Chưa cấu hình Supabase URL hoặc Publishable Key.');
    return { data: null, error: new Error('Supabase chưa cấu hình') };
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
 * Đăng xuất tài khoản
 */
export const signOut = async () => {
  if (!supabase) return { error: null };
  return await supabase.auth.signOut();
};
