import React, { useState } from 'react';
import { X, Award, ShieldAlert, Sparkles, BookOpen, CheckCircle2, RotateCcw, Plus, Feather, Flame, HeartHandshake } from 'lucide-react';

interface WisdomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToArches: () => void;
}

interface WisdomItem {
  id: string;
  category: 'core_value' | 'boundary' | 'insight';
  title: string;
  reflection: string;
  kintsugiRepaired?: boolean;
  repairedNote?: string;
  date: string;
}

export const WisdomModal: React.FC<WisdomModalProps> = ({
  isOpen,
  onClose,
  onBackToArches,
}) => {
  const [activeTab, setActiveTab] = useState<'gems' | 'memories' | 'kintsugi'>('gems');
  
  // 5 Clarity Dimensions state
  const [gems, setGems] = useState([
    { id: 1, name: 'Tỉnh Thức', subtitle: 'Awareness', color: 'from-amber-400 to-amber-600', unlocked: false, desc: 'Nhìn nhận thực tế cuộc sống và công việc mà không tự phán xét.' },
    { id: 2, name: 'Nhận Diện Khoảng Cách', subtitle: 'The Gap', color: 'from-rose-400 to-rose-600', unlocked: false, desc: 'Thấy rõ ranh giới giữa áp lực kỳ vọng và nhu cầu nội tại.' },
    { id: 3, name: 'Vùng Đệm An Tâm', subtitle: 'Safe Haven', color: 'from-emerald-400 to-emerald-600', unlocked: false, desc: 'Tạo khoảng lặng bình tâm để đưa ra quyết định vững chãi.' },
    { id: 4, name: 'Ý Nghĩa Thực Sự', subtitle: 'Core Purpose', color: 'from-cyan-400 to-blue-600', unlocked: false, desc: 'Định hình rõ điều bản thân thực sự trân trọng lúc này.' },
    { id: 5, name: 'Tự Do Lựa Chọn', subtitle: 'Sovereignty', color: 'from-purple-400 to-indigo-600', unlocked: false, desc: 'Tự do bước tiếp theo nhịp sống riêng, không bị cuốn theo người khác.' },
  ]);

  // Saved Insights / Memories (Initialized empty - requires real session consent)
  const [memories, setMemories] = useState<WisdomItem[]>([]);

  // Kintsugi Form
  const [newTitle, setNewTitle] = useState('');
  const [newReflection, setNewReflection] = useState('');
  const [kintsugiEditId, setKintsugiEditId] = useState<string | null>(null);
  const [kintsugiNote, setKintsugiNote] = useState('');

  if (!isOpen) return null;

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newReflection.trim()) return;

    const newItem: WisdomItem = {
      id: Date.now().toString(),
      category: 'insight',
      title: newTitle.trim(),
      reflection: newReflection.trim(),
      date: 'Vừa xong',
    };

    setMemories([newItem, ...memories]);
    setNewTitle('');
    setNewReflection('');
  };

  const handleApplyKintsugi = (id: string) => {
    if (!kintsugiNote.trim()) return;
    setMemories(memories.map(m => {
      if (m.id === id) {
        return {
          ...m,
          kintsugiRepaired: true,
          repairedNote: kintsugiNote.trim(),
        };
      }
      return m;
    }));
    setKintsugiEditId(null);
    setKintsugiNote('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/85 backdrop-blur-xl animate-fadeIn">
      {/* Container */}
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-amber-300/40 bg-gradient-to-b from-[#221738]/95 via-[#181329]/95 to-[#0b0816]/98 shadow-[0_0_60px_rgba(234,179,8,0.25)] overflow-hidden text-stone-100">
        
        {/* Top Glow & Header */}
        <div className="relative border-b border-amber-400/20 px-6 py-5 flex items-center justify-between bg-stone-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 shadow-[0_0_15px_rgba(234,179,8,0.4)]">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] tracking-[0.25em] font-cinzel text-amber-300 uppercase font-semibold">
                  CỔNG THỨ BA • LIFE LAB
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] bg-amber-400/10 text-amber-200 border border-amber-400/30">
                  WISDOM SANCTUARY
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-serif text-amber-100 tracking-wide">
                Đền Đài Bài Học & Kintsugi Trí Tuệ
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onBackToArches}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-400/30 text-amber-200/80 hover:text-amber-100 hover:bg-amber-400/10 text-xs font-serif transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Về 3 Cổng Vòm</span>
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-stone-800/60 hover:bg-stone-700/80 border border-amber-200/20 text-stone-300 hover:text-white flex items-center justify-center transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 px-6 bg-stone-900/20">
          <button
            onClick={() => setActiveTab('gems')}
            className={`py-3.5 px-4 font-serif text-sm border-b-2 flex items-center gap-2 transition ${
              activeTab === 'gems'
                ? 'border-amber-400 text-amber-300 font-medium'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>5 Viên Ngọc Clarity</span>
          </button>

          <button
            onClick={() => setActiveTab('memories')}
            className={`py-3.5 px-4 font-serif text-sm border-b-2 flex items-center gap-2 transition ${
              activeTab === 'memories'
                ? 'border-amber-400 text-amber-300 font-medium'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Kho Lưu Nhận Thức ({memories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('kintsugi')}
            className={`py-3.5 px-4 font-serif text-sm border-b-2 flex items-center gap-2 transition ${
              activeTab === 'kintsugi'
                ? 'border-amber-400 text-amber-300 font-medium'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Hàn Gắn Kintsugi</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: 5 CLARITY GEMS */}
          {activeTab === 'gems' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-transparent p-5 rounded-2xl border border-amber-300/20">
                <h3 className="font-serif text-lg text-amber-200 mb-1 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Hành trình 5 Tầng Tinh Luyện
                </h3>
                <p className="text-stone-300 text-xs sm:text-sm font-sans leading-relaxed">
                  Trong Life Lab, trí tuệ tài chính không đo bằng tài khoản nhiều hay ít, mà đo bằng mức độ sáng rõ của 5 viên ngọc này trong tâm thức bạn.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {gems.map(gem => (
                  <div
                    key={gem.id}
                    className={`relative p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                      gem.unlocked
                        ? 'bg-stone-900/60 border-amber-400/40 shadow-[0_0_20px_rgba(245,158,11,0.15)] hover:border-amber-300 hover:-translate-y-1'
                        : 'bg-stone-950/40 border-stone-800 opacity-60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-mono tracking-widest text-amber-400/80 uppercase">
                          GEM #{gem.id}
                        </span>
                        {gem.unlocked ? (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> Đã Khai Mở
                          </span>
                        ) : (
                          <span className="text-[10px] text-stone-500 bg-stone-800/60 px-2 py-0.5 rounded-full">
                            Đang Thử Thách
                          </span>
                        )}
                      </div>

                      {/* Gem Symbol Orb */}
                      <div className="w-14 h-14 rounded-2xl mx-auto my-3 bg-gradient-to-br flex items-center justify-center p-0.5 shadow-lg group">
                        <div className={`w-full h-full rounded-2xl bg-gradient-to-br ${gem.color} flex items-center justify-center shadow-[inset_0_0_12px_rgba(255,255,255,0.4)] ${gem.unlocked ? 'animate-pulse' : 'grayscale'}`}>
                          <Award className="w-7 h-7 text-stone-950/80 drop-shadow" />
                        </div>
                      </div>

                      <h4 className="text-center font-serif text-base text-stone-100 mt-2 font-medium">
                        {gem.name}
                      </h4>
                      <p className="text-center text-[11px] font-sans text-amber-300/70 tracking-wider mb-2">
                        {gem.subtitle}
                      </p>
                      <p className="text-stone-300 text-xs text-center font-sans leading-relaxed">
                        {gem.desc}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/5 text-center">
                      <span className="text-[10px] text-stone-400 font-sans">
                        {gem.unlocked ? 'Đã hòa nhập vào lối sống' : 'Cần hoàn thành 7 ngày thí nghiệm'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: MEMORIES & RECORDED INSIGHTS */}
          {activeTab === 'memories' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Add Quick Insight Form */}
              <form onSubmit={handleAddMemory} className="bg-stone-900/50 p-5 rounded-2xl border border-amber-400/20 space-y-3">
                <div className="flex items-center gap-2 text-amber-300 font-serif text-sm">
                  <Feather className="w-4 h-4" />
                  <span>Khắc Ghi Bài Học Mới Vào Ký Ức Đền Đài</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="Tên bài học hoặc chân lý nhận ra..."
                    className="sm:col-span-1 bg-stone-950/70 border border-stone-700/60 rounded-xl px-3 py-2 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-400"
                  />
                  <input
                    type="text"
                    value={newReflection}
                    onChange={e => setNewReflection(e.target.value)}
                    placeholder="Cảm nhận chi tiết và quyết định tương lai..."
                    className="sm:col-span-2 bg-stone-950/70 border border-stone-700/60 rounded-xl px-3 py-2 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-serif text-xs font-semibold rounded-xl flex items-center gap-1.5 transition shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Lưu Vào Bộ Nhớ</span>
                  </button>
                </div>
              </form>

              {/* Memory List */}
              <div className="space-y-3">
                {memories.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-stone-900/30 border border-white/5 space-y-3">
                    <p className="font-serif text-sm text-stone-300">
                      Chưa có đúc kết nào được lưu.
                    </p>
                    <p className="text-xs text-stone-400 font-sans max-w-md mx-auto leading-relaxed">
                      Life Lab không tạo sẵn dữ liệu cá nhân giả định. Sau khi bạn hoàn thành phiên đối thoại đầu tiên và đồng ý cấp quyền lưu nhớ (Memory Permission), các đúc kết của bạn sẽ hiển thị tại đây.
                    </p>
                  </div>
                ) : (
                  memories.map(item => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      item.kintsugiRepaired
                        ? 'bg-amber-950/20 border-amber-400/40 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                        : 'bg-stone-900/40 border-stone-800 hover:border-amber-300/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-serif text-sm font-medium text-amber-200">
                          {item.title}
                        </span>
                        {item.kintsugiRepaired && (
                          <span className="text-[10px] bg-amber-400/10 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/30 flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" /> Kintsugi Repaired
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-stone-400 font-mono">
                        {item.date}
                      </span>
                    </div>

                    <p className="text-stone-300 text-xs font-sans leading-relaxed">
                      "{item.reflection}"
                    </p>

                    {item.repairedNote && (
                      <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border-l-2 border-amber-400 text-amber-200/90 text-xs font-sans">
                        <span className="font-semibold text-amber-300 block mb-0.5">Vết nứt dát vàng:</span>
                        {item.repairedNote}
                      </div>
                    )}
                  </div>
                )))}
              </div>
            </div>
          )}

          {/* TAB 3: KINTSUGI REPAIR */}
          {activeTab === 'kintsugi' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-stone-900/60 p-5 rounded-2xl border border-amber-400/30 flex flex-col md:flex-row gap-5 items-center">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-400/50 flex-shrink-0 flex items-center justify-center text-amber-300 shadow-[0_0_20px_rgba(234,179,8,0.3)]">
                  <HeartHandshake className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-serif text-lg text-amber-200 mb-1">
                    Triết Lý Kintsugi: Khi Vết Nứt Trở Thành Vẻ Đẹp
                  </h3>
                  <p className="text-stone-300 text-xs sm:text-sm font-sans leading-relaxed">
                    Trong nghệ thuật gốm Nhật Bản, khi một chiếc chén vỡ, người thợ không vứt đi mà dùng vàng ròng để hàn gắn lại. Tại Life Lab, mọi sai lầm chi tiêu, mọi hiểu lầm của AI hay những khoảnh khắc bối rối đều được đón nhận. Bạn có thể hiệu chỉnh lại định nghĩa để trí tuệ của mình thêm vững chãi.
                  </p>
                </div>
              </div>

              {/* Selector to Repair */}
              <div className="space-y-4">
                <h4 className="text-xs uppercase font-mono tracking-widest text-amber-300/80">
                  Chọn một ghi chép cần dát vàng (hiệu chỉnh định nghĩa):
                </h4>

                <div className="space-y-3">
                  {memories.map(item => (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-stone-900/40 border border-stone-800 hover:border-amber-400/40 transition"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-serif text-sm text-stone-200 font-medium">
                          {item.title}
                        </span>
                        <button
                          onClick={() => {
                            setKintsugiEditId(item.id);
                            setKintsugiNote(item.repairedNote || '');
                          }}
                          className="px-3 py-1 rounded-lg text-xs bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 transition flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Dát vàng / Chỉnh sửa</span>
                        </button>
                      </div>

                      <p className="text-stone-400 text-xs font-sans">
                        {item.reflection}
                      </p>

                      {kintsugiEditId === item.id && (
                        <div className="mt-4 pt-3 border-t border-amber-400/20 space-y-3 animate-fadeIn">
                          <label className="text-xs text-amber-300 font-serif block">
                            Nhập định nghĩa mới hoặc bài học hiệu chỉnh (để AI và bạn ghi nhớ vĩnh viễn):
                          </label>
                          <textarea
                            value={kintsugiNote}
                            onChange={e => setKintsugiNote(e.target.value)}
                            placeholder="Ví dụ: Lần tới tôi không né tránh mà sẽ bình thản chia nhỏ khoản dự phòng..."
                            rows={3}
                            className="w-full bg-stone-950/80 border border-amber-400/40 rounded-xl p-3 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-300"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setKintsugiEditId(null)}
                              className="px-3 py-1.5 rounded-xl text-xs text-stone-400 hover:text-stone-200"
                            >
                              Hủy
                            </button>
                            <button
                              onClick={() => handleApplyKintsugi(item.id)}
                              className="px-4 py-1.5 rounded-xl text-xs bg-amber-400 text-stone-950 font-serif font-semibold hover:bg-amber-300 transition"
                            >
                              Xác Nhận Dát Vàng
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-stone-900/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-400 font-sans">
          <span>Life Lab Blueprint V8.7.2 • Memory & Reflection Engine</span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-300/40 text-amber-200 font-serif transition"
          >
            Đóng Đền Đài
          </button>
        </div>

      </div>
    </div>
  );
};
