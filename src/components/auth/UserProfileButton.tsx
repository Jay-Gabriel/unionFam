import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { LogOut, Cloud, ShieldCheck, ChevronDown, Key } from 'lucide-react';
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
        className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-calm-lichen/30 text-xs font-medium text-calm-paper-white transition flex items-center gap-1.5 shadow-soft cursor-pointer hover:scale-105 active:scale-95 shrink-0 whitespace-nowrap"
        title="Đăng nhập tài khoản"
      >
        <span className="whitespace-nowrap">Đăng nhập</span>
      </button>
    );
  }

  const isKeyAuth = Boolean((user as any).user_metadata?.is_key_auth);
  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    (isKeyAuth ? 'Quản trị viên' : 'Thành viên');
  const email = isKeyAuth ? 'Phiên bảo mật Supabase' : (user.email || '');

  return (
    <div className="relative shrink-0 whitespace-nowrap">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="px-2.5 py-1 rounded-full bg-calm-moss/30 hover:bg-calm-moss/50 border border-calm-lichen/40 text-xs font-medium text-calm-paper-white transition flex items-center gap-1.5 shadow-soft cursor-pointer shrink-0 whitespace-nowrap"
      >
        {isKeyAuth ? (
          <div className="w-5 h-5 rounded-full bg-calm-deep-moss border border-calm-pollen/50 flex items-center justify-center font-bold text-[10px] text-calm-pollen shrink-0">
            <Key className="w-2.5 h-2.5 text-calm-pollen" />
          </div>
        ) : avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-5 h-5 rounded-full object-cover border border-calm-lichen/40 shrink-0"
          />
        ) : (
          <div className="w-5 h-5 rounded-full bg-calm-lichen/30 flex items-center justify-center font-bold text-[10px] text-calm-pollen shrink-0">
            {displayName.slice(0, 1).toUpperCase()}
          </div>
        )}

        <span className="max-w-[70px] sm:max-w-[110px] truncate hidden sm:inline whitespace-nowrap">
          {displayName}
        </span>
        <span
          className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"
          title="Đã kết nối Cloud Supabase"
        />
        <ChevronDown className="w-3 h-3 text-calm-fog shrink-0" />
      </button>

      {/* Profile Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-calm-forest-dusk/95 border border-calm-lichen/30 shadow-2xl p-4 text-calm-paper-white space-y-3 z-50 animate-fadeIn backdrop-blur-md">
          <div className="flex items-center gap-3 border-b border-white/10 pb-3">
            {isKeyAuth ? (
              <div className="w-10 h-10 rounded-full bg-calm-deep-moss border border-calm-pollen/50 flex items-center justify-center font-bold text-sm text-calm-pollen shrink-0">
                <Key className="w-4 h-4 text-calm-pollen" />
              </div>
            ) : avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-10 h-10 rounded-full object-cover border border-calm-lichen/40 shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-calm-lichen/30 flex items-center justify-center font-bold text-sm text-calm-pollen shrink-0">
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
              <Cloud className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">Đồng bộ Supabase Cloud: Sẵn sàng</span>
            </div>
            <div className="flex items-center gap-2 text-calm-lichen">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">
                {isKeyAuth ? 'Phiên xác thực Khóa bí mật' : 'Phiên đăng nhập Google OAuth'}
              </span>
            </div>
          </div>

          <div className="border-t border-white/10 pt-2 flex flex-col gap-1.5">
            <button
              onClick={() => {
                setShowDropdown(false);
                onOpenAuthModal();
              }}
              className="w-full py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-calm-paper-white text-xs font-medium transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Key className="w-3 h-3 text-calm-pollen" />
              <span>Đổi / Quản lý Khóa Supabase</span>
            </button>

            <button
              onClick={handleSignOut}
              disabled={loadingSignOut}
              className="w-full py-2 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-medium transition flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{loadingSignOut ? 'Đang thoát...' : 'Thoát phiên đăng nhập'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
