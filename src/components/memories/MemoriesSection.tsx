import React, { useState, useEffect } from 'react';
import {
  BookmarkCheck,
  Sparkles,
  Heart,
  Shield,
  Lightbulb,
  Calendar,
  Cloud,
  CheckCircle2,
  Plus,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { loadMemoriesFromCloud, saveMemoryToCloud, SyncedMemory } from '../../services/supabaseService';
import { CalmButton } from '../calm/CalmButton';
import { CalmCard } from '../calm/CalmCard';

interface MemoriesSectionProps {
  onStartChat: () => void;
}

export const MemoriesSection: React.FC<MemoriesSectionProps> = ({ onStartChat }) => {
  const [memories, setMemories] = useState<SyncedMemory[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'core_value' | 'boundary' | 'insight'>('all');

  useEffect(() => {
    fetchMemories();
  }, []);

  const fetchMemories = async () => {
    setLoading(true);
    try {
      const data = await loadMemoriesFromCloud();
      setMemories(data);
    } finally {
      setLoading(false);
    }
  };

  const filtered = memories.filter(m => selectedFilter === 'all' || m.category === selectedFilter);

  const getCategoryBadge = (cat: SyncedMemory['category']) => {
    switch (cat) {
      case 'core_value':
        return { label: 'GIÁ TRỊ CỐT LÕI', color: 'text-amber-300 bg-amber-500/15 border-amber-400/30', icon: Heart };
      case 'boundary':
        return { label: 'RANH GIỚI BẢO TOÀN', color: 'text-rose-300 bg-rose-500/15 border-rose-400/30', icon: Shield };
      case 'insight':
      default:
        return { label: 'ĐÚC KẾT SÁNG RÕ', color: 'text-calm-lichen bg-calm-lichen/15 border-calm-lichen/30', icon: Lightbulb };
    }
  };

  return (
    <section className="py-20 max-w-[1280px] mx-auto px-6 relative z-10 space-y-12">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 border-b border-white/10 pb-8">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-calm-deep-moss border border-calm-lichen/30 text-calm-pollen text-xs font-mono font-semibold uppercase">
            <BookmarkCheck className="w-3.5 h-3.5" />
            <span>KHO ĐÚC KẾT & MINH TRIẾT SỐNG</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-light tracking-tight text-calm-paper-white">
            Nhìn lại những điều{' '}
            <span className="font-normal italic text-calm-warm-ivory">bạn đã nhận ra.</span>
          </h2>
          <p className="text-calm-fog text-sm sm:text-base leading-relaxed font-light">
            Mọi hiểu biết sâu sắc sau các phiên trò chuyện cùng AI hoặc bài học từ thử nghiệm thực tế đều được lưu giữ trang trọng tại đây.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchMemories}
            disabled={loading}
            className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-calm-fog hover:text-white transition cursor-pointer"
            title="Làm mới đúc kết"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-calm-pollen' : ''}`} />
          </button>
          <CalmButton variant="primary" onClick={onStartChat} className="text-xs px-5 py-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-calm-pollen" />
            <span>Trò chuyện để đúc kết mới</span>
          </CalmButton>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs font-medium font-mono">
        <button
          onClick={() => setSelectedFilter('all')}
          className={`px-4 py-2 rounded-full border transition cursor-pointer ${
            selectedFilter === 'all'
              ? 'bg-calm-pollen/20 border-calm-pollen text-calm-pollen'
              : 'border-white/10 text-calm-fog hover:bg-white/5 hover:text-white'
          }`}
        >
          Tất cả ({memories.length})
        </button>
        <button
          onClick={() => setSelectedFilter('core_value')}
          className={`px-4 py-2 rounded-full border transition cursor-pointer ${
            selectedFilter === 'core_value'
              ? 'bg-amber-400/20 border-amber-400 text-amber-300'
              : 'border-white/10 text-calm-fog hover:bg-white/5 hover:text-white'
          }`}
        >
          Giá trị cốt lõi
        </button>
        <button
          onClick={() => setSelectedFilter('boundary')}
          className={`px-4 py-2 rounded-full border transition cursor-pointer ${
            selectedFilter === 'boundary'
              ? 'bg-rose-400/20 border-rose-400 text-rose-300'
              : 'border-white/10 text-calm-fog hover:bg-white/5 hover:text-white'
          }`}
        >
          Ranh giới cá nhân
        </button>
        <button
          onClick={() => setSelectedFilter('insight')}
          className={`px-4 py-2 rounded-full border transition cursor-pointer ${
            selectedFilter === 'insight'
              ? 'bg-calm-lichen/20 border-calm-lichen text-calm-lichen'
              : 'border-white/10 text-calm-fog hover:bg-white/5 hover:text-white'
          }`}
        >
          Đúc kết sáng rõ
        </button>
      </div>

      {/* Grid of Memory Cards */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => {
            const badge = getCategoryBadge(item.category);
            const Icon = badge.icon;
            return (
              <CalmCard
                key={item.id}
                variant="glass"
                className="p-6 space-y-4 hover:border-calm-lichen/50 transition relative group"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border ${badge.color}`}>
                    <Icon className="w-3 h-3" />
                    <span>{badge.label}</span>
                  </span>
                  <span className="text-[11px] font-mono text-calm-fog/70 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {item.date}
                  </span>
                </div>

                <h3 className="text-lg font-serif font-medium text-calm-warm-ivory leading-snug">
                  {item.title}
                </h3>

                <p className="text-xs sm:text-sm text-calm-fog/90 leading-relaxed font-light">
                  {item.reflection}
                </p>

                {item.kintsugiRepaired && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-400/25 text-[11px] text-amber-200 space-y-1">
                    <div className="font-semibold flex items-center gap-1.5 text-calm-pollen">
                      <span>✨ Gắn liền Kintsugi:</span>
                    </div>
                    <div>{item.repairedNote || 'Vết nứt được hàn gắn bằng sự thấu hiểu.'}</div>
                  </div>
                )}
              </CalmCard>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 px-4 rounded-3xl bg-calm-deep-moss/40 border border-calm-lichen/20 space-y-4">
          <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-calm-fog">
            <FolderOpen className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-medium text-calm-paper-white">
            Chưa có đúc kết nào được lưu trong mục này
          </h3>
          <p className="text-xs sm:text-sm text-calm-fog max-w-md mx-auto leading-relaxed">
            Khi trò chuyện cùng Trợ lý AI và chốt lại Thẻ Quyết Định hoặc bài học, bạn có thể bấm lưu để những nhận thức quý giá xuất hiện tại đây.
          </p>
          <CalmButton variant="primary" onClick={onStartChat} className="text-xs px-6 py-3 cursor-pointer">
            Bắt đầu trò chuyện ngay
          </CalmButton>
        </div>
      )}

    </section>
  );
};
