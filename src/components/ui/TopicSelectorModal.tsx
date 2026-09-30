import React from 'react';
import { MapNode } from '../../types';
import { X, Compass, ChevronRight } from 'lucide-react';

interface TopicSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: MapNode[];
  onSelectTopic: (node: MapNode) => void;
  currentNodeId: string;
}

export const TopicSelectorModal: React.FC<TopicSelectorModalProps> = ({
  isOpen,
  onClose,
  nodes,
  onSelectTopic,
  currentNodeId,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-[#24282e] border border-stone-700/80 rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-stone-700/60 flex items-center justify-between bg-[#1e2226]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif-title font-semibold text-base text-stone-100">
                Change Topic (Chuyển đổi trọng tâm)
              </h2>
              <p className="text-xs text-stone-400">
                Chọn một địa danh trên The Living Map để bắt đầu cuộc trò chuyện mới
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

        {/* List of nodes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {nodes.map((node) => {
            const isCurrent = node.id === currentNodeId;
            return (
              <button
                key={node.id}
                onClick={() => {
                  onSelectTopic(node);
                  onClose();
                }}
                className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-amber-500/10 border-amber-500/50 text-amber-200'
                    : 'bg-[#1b1e22] border-stone-700/60 text-stone-300 hover:border-stone-500 hover:bg-[#22272e]'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-serif-title font-semibold text-sm text-stone-100">
                      {node.label}
                    </span>
                    {node.subtitle && (
                      <span className="text-[11px] text-stone-400">— {node.subtitle}</span>
                    )}
                  </div>
                  <p className="text-xs text-stone-400 mt-1 line-clamp-1">{node.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-sm ${
                      node.status === 'GROUNDED'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : node.status === 'DEFINED'
                        ? 'bg-sky-500/20 text-sky-400'
                        : node.status === 'EXPLORING'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-stone-600/30 text-stone-400'
                    }`}
                  >
                    {node.status}
                  </span>
                  <ChevronRight className="w-4 h-4 text-stone-500" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
