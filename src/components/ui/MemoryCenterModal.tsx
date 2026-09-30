import React, { useState } from 'react';
import { MemoryItem } from '../../types';
import { X, CheckCircle, Trash2, Shield, Plus } from 'lucide-react';

interface MemoryCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  memories: MemoryItem[];
  onUpdateMemories: (updated: MemoryItem[]) => void;
}

export const MemoryCenterModal: React.FC<MemoryCenterModalProps> = ({
  isOpen,
  onClose,
  memories,
  onUpdateMemories,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen) return null;

  const handleDelete = (id: string) => {
    onUpdateMemories(memories.filter((m) => m.id !== id));
  };

  const handleToggleVerify = (id: string) => {
    onUpdateMemories(
      memories.map((m) => (m.id === id ? { ...m, verified: !m.verified } : m))
    );
  };

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newContent) return;

    const newItem: MemoryItem = {
      id: `mem_${Date.now()}`,
      type: 'CONFIRMED_INSIGHT',
      title: newTitle,
      content: newContent,
      verified: true,
      date: 'Hôm nay',
    };

    onUpdateMemories([newItem, ...memories]);
    setNewTitle('');
    setNewContent('');
    setIsAdding(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-[#24282e] border border-stone-700/80 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-stone-700/60 flex items-center justify-between bg-[#1e2226]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif-title font-semibold text-lg text-stone-100">
                Memory Center (Trung tâm Ký ức)
              </h2>
              <p className="text-xs text-stone-400">
                Chỉ những insight bạn xác nhận mới được ghi nhận vào Living Map
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-700/50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Danh sách ký ức đã lưu ({memories.length})
            </span>
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="text-xs font-medium text-amber-300 hover:text-amber-200 flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/30 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAdding ? 'Hủy' : 'Thêm ký ức'}</span>
            </button>
          </div>

          {/* Add form */}
          {isAdding && (
            <form onSubmit={handleAddMemory} className="bg-[#1b1e22] p-4 rounded-xl border border-amber-500/30 space-y-3">
              <input
                type="text"
                placeholder="Tiêu đề nhận thức / chia sẻ..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-[#282d33] border border-stone-700 rounded-lg px-3 py-1.5 text-xs text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <textarea
                placeholder="Nội dung chi tiết bạn muốn Life Lab ghi nhớ..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={2}
                className="w-full bg-[#282d33] border border-stone-700 rounded-lg px-3 py-1.5 text-xs text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-500 text-stone-900 font-semibold text-xs px-3 py-1.5 rounded-lg cursor-pointer"
                >
                  Lưu ký ức
                </button>
              </div>
            </form>
          )}

          {/* Memories List */}
          <div className="space-y-3">
            {memories.map((item) => (
              <div
                key={item.id}
                className="bg-[#1b1e22] border border-stone-700/60 p-4 rounded-xl flex items-start justify-between gap-4 group hover:border-stone-500/50 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-sm ${
                        item.type === 'CONFIRMED_INSIGHT'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                      }`}
                    >
                      {item.type === 'CONFIRMED_INSIGHT' ? 'Xác nhận' : 'Chia sẻ'}
                    </span>
                    <span className="font-semibold text-sm text-stone-200">{item.title}</span>
                    <span className="text-[10px] text-stone-400">{item.date}</span>
                  </div>
                  <p className="text-xs text-stone-300 leading-relaxed">{item.content}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleVerify(item.id)}
                    title={item.verified ? 'Đã xác nhận' : 'Chưa xác nhận'}
                    className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                      item.verified
                        ? 'text-emerald-400 bg-emerald-500/10'
                        : 'text-stone-400 hover:text-stone-300'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    title="Xóa ký ức này"
                    className="p-1.5 rounded-lg text-stone-400 hover:text-red-400 hover:bg-red-500/10 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stone-700/60 bg-[#1e2226] flex justify-end">
          <button
            onClick={onClose}
            className="bg-stone-700 hover:bg-stone-600 text-stone-200 px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
