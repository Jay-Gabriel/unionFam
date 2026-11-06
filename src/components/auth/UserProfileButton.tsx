import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { LogOut, Cloud, CloudOff, UserCheck, ShieldCheck, ChevronDown, Sparkles } from 'lucide-react';
import { getCurrentUser, onAuthStateChange } from '../../services/supabaseService';
import { signOut } from '../../lib/supabaseClient';

interface UserProfileButtonProps {
  onOpenAuthModal: () => void;
}

export const UserProfileButton: React.FC<UserProfileButtonProps> = ({ onOpenAuthModal }) => {
  const [user, setUser] = useState<User | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingSignOut, setLoadingSignOut] = useState(false);

  useEffect(() => {
    getCurrentUser().then(setUser);
    const unsubscribe = onAuthStateChange((newUser) => {
      setUser(newUser);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    setLoadingSignOut(true);
    try {
      await signOut();
      setUser(null);
      setShowDropdown(false);
    } finally {
      setLoadingSignOut(false);
    }
  };

  if (!user) {
    return (
      <button
        onClick={onOpenAuthModal}
        className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-calm-lichen/30 text-xs font-medium text-calm-paper-white transition flex items-center gap-1.5 shadow-soft cursor-pointer hover:scale-105 active:scale-95"
        title="Đăng nhập tài khoản Google để đồng bộ dữ liệu"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
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
        <span className="hidden sm:inline">Đăng nhập</span>
      </button>
    );
  }

  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
  const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Thành viên';
  const email = user.email || '';

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="px-2 py-1 rounded-full bg-calm-moss/30 hover:bg-calm-moss/50 border border-calm-lichen/40 text-xs font-medium text-calm-paper-white transition flex items-center gap-2 shadow-soft cursor-pointer"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-6 h-6 rounded-full object-cover border border-calm-lichen/40"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-calm-lichen/30 flex items-center justify-center font-bold text-[10px] text-calm-pollen">
            {displayName.slice(0, 1).toUpperCase()}
          </div>
        )}
        <span className="max-w-[80px] sm:max-w-[120px] truncate hidden sm:inline">
          {displayName}
        </span>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Đã kết nối Cloud Supabase" />
        <ChevronDown className="w-3 h-3 text-calm-fog" />
      </button>

      {/* Profile Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-calm-forest-dusk/95 border border-calm-lichen/30 shadow-2xl p-4 text-calm-paper-white space-y-3 z-50 animate-fadeIn backdrop-blur-md">
          <div className="flex items-center gap-3 border-b border-white/10 pb-3">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-10 h-10 rounded-full object-cover border border-calm-lichen/40"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-calm-lichen/30 flex items-center justify-center font-bold text-sm text-calm-pollen">
                {displayName.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="overflow-hidden">
              <div className="text-sm font-semibold truncate text-calm-warm-ivory">{displayName}</div>
              <div className="text-xs text-calm-fog truncate font-mono">{email}</div>
            </div>
          </div>

          <div className="text-xs space-y-1.5 py-1 text-calm-fog/90">
            <div className="flex items-center gap-2 text-emerald-300">
              <Cloud className="w-3.5 h-3.5" />
              <span>Đồng bộ Supabase Cloud: Sẵn sàng</span>
            </div>
            <div className="flex items-center gap-2 text-calm-lichen">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Phiên đăng nhập bảo mật</span>
            </div>
          </div>

          <div className="border-t border-white/10 pt-2">
            <button
              onClick={handleSignOut}
              disabled={loadingSignOut}
              className="w-full py-2 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-medium transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{loadingSignOut ? 'Đang đăng xuất...' : 'Đăng xuất tài khoản'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
