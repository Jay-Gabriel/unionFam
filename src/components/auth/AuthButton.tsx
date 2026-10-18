import React, { useState, useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { LogIn, LogOut, User as UserIcon, Cloud, Check, ChevronDown } from 'lucide-react';
import { getCurrentUser, onAuthStateChange } from '../../services/supabaseService';
import { signInWithGoogle, signOut, isSupabaseConfigured } from '../../lib/supabaseClient';

interface AuthButtonProps {
  compact?: boolean;
  className?: string;
}

export const AuthButton: React.FC<AuthButtonProps> = ({ compact = false, className = '' }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    getCurrentUser().then(setUser);
    const unsubscribe = onAuthStateChange((newUser) => {
      setUser(newUser);
    });
    return () => unsubscribe();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogin = async () => {
    try {
      setLoading(true);
      const { error } = await signInWithGoogle();
      if (error) {
        console.error('Google Sign-In Error:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      await signOut();
      setUser(null);
      setShowDropdown(false);
    } finally {
      setLoading(false);
    }
  };

  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Tài khoản';

  if (!user) {
    return (
      <button
        onClick={handleLogin}
        disabled={loading}
        title="Đăng nhập Google để lưu trữ cuộc trò chuyện và đúc kết"
        className={`group relative inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium text-amber-200/90 bg-stone-900/60 hover:bg-stone-800/80 border border-amber-400/30 hover:border-amber-400/60 backdrop-blur-md transition-all shadow-[0_0_12px_rgba(245,158,11,0.15)] hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:scale-[1.02] cursor-pointer ${className}`}
      >
        {/* Google G icon */}
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
          <path
            fill="#EA4335"
            d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.4l3.7 2.9C6.5 7.4 9 5 12 5z"
          />
          <path
            fill="#4285F4"
            d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
          />
          <path
            fill="#FBBC05"
            d="M5.6 14.7c-.2-.7-.4-1.5-.4-2.7 0-1.1.2-1.9.4-2.7L1.9 6.4C.7 8.8 0 10.8 0 12c0 1.2.7 3.2 1.9 5.6l3.7-2.9z"
          />
          <path
            fill="#34A853"
            d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.3L1.9 16C3.7 19.8 7.5 23 12 23z"
          />
        </svg>
        <span className="tracking-wide">
          {loading ? 'Đang kết nối...' : compact ? 'Google' : 'Đăng nhập Google'}
        </span>
      </button>
    );
  }

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium text-stone-200 bg-stone-900/70 hover:bg-stone-800/90 border border-emerald-400/40 hover:border-emerald-400/70 backdrop-blur-md transition-all shadow-[0_0_12px_rgba(16,185,129,0.15)] cursor-pointer"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={displayName} className="w-5 h-5 rounded-full object-cover border border-emerald-400/50" />
        ) : (
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[10px] font-bold">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="max-w-[110px] truncate text-stone-200">{displayName}</span>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Đã đồng bộ Cloud" />
        <ChevronDown className="w-3 h-3 text-stone-400 group-hover:text-stone-200 transition-transform" />
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl bg-stone-900/95 border border-stone-800 backdrop-blur-xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center gap-2.5 pb-2.5 border-b border-stone-800/80">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-8 h-8 rounded-full border border-stone-700" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-stone-200 truncate">{displayName}</p>
              <p className="text-[10px] text-stone-400 truncate">{user.email}</p>
            </div>
          </div>

          <div className="py-2.5 text-[11px] text-stone-400 flex items-center gap-2">
            <Cloud className="w-3.5 h-3.5 text-emerald-400" />
            <span>Lưu hội thoại & đúc kết qua tài khoản</span>
          </div>

          <button
            onClick={handleLogout}
            disabled={loading}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-rose-300/80 hover:text-rose-200 hover:bg-rose-950/40 transition-colors cursor-pointer text-left"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Đăng xuất</span>
          </button>
        </div>
      )}
    </div>
  );
};
