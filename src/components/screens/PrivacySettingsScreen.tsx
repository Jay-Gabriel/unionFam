import React, { useState } from 'react';

export const PrivacySettingsScreen: React.FC<{
  onSavePreferences: (scope: string) => void;
  onDeleteAllData: () => void;
}> = ({ onSavePreferences, onDeleteAllData }) => {
  const [scope, setScope] = useState('card_only');
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#182D26] px-6 py-10 max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#254B3D]">Lựa chọn lưu trữ dữ liệu</h2>
        <p className="text-sm text-[#182D26]/70 mt-1">
          Bạn toàn quyền kiểm soát những gì được lưu lại trên máy chủ của UnionFam.
        </p>
      </div>

      <div className="p-6 bg-white rounded-2xl border border-[#BBC7BC] space-y-4 shadow-sm">
        <label className="flex items-start gap-3 cursor-pointer min-h-[44px]">
          <input
            type="radio"
            name="scope"
            value="card_only"
            checked={scope === 'card_only'}
            onChange={(e) => setScope(e.target.value)}
            className="mt-1 w-4 h-4 accent-[#254B3D]"
          />
          <div>
            <span className="font-semibold text-sm text-[#182D26]">Chỉ lưu Thẻ Quyết Định & Bước Thử</span>
            <p className="text-xs text-[#182D26]/70 mt-0.5 leading-relaxed">
              Không lưu lại nguyên văn các câu chat giữa bạn và AI. Chỉ lưu thẻ tóm tắt và nhật ký bước thử để tiếp tục hành trình.
            </p>
          </div>
        </label>

        <label className="flex items-start gap-3 cursor-pointer min-h-[44px]">
          <input
            type="radio"
            name="scope"
            value="card_and_transcript"
            checked={scope === 'card_and_transcript'}
            onChange={(e) => setScope(e.target.value)}
            className="mt-1 w-4 h-4 accent-[#254B3D]"
          />
          <div>
            <span className="font-semibold text-sm text-[#182D26]">Lưu cả nguyên văn hội thoại</span>
            <p className="text-xs text-[#182D26]/70 mt-0.5 leading-relaxed">
              Lưu toàn bộ tin nhắn để bạn có thể xem lại chính xác những gì đã trao đổi trong quá khứ.
            </p>
          </div>
        </label>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => onSavePreferences(scope)}
            className="px-6 py-2.5 bg-[#254B3D] text-white rounded-xl font-medium text-sm min-h-[44px]"
          >
            Lưu thiết lập
          </button>
        </div>
      </div>

      <div className="p-6 bg-red-50 rounded-2xl border border-red-200 space-y-3">
        <h3 className="font-bold text-red-800 text-sm">Vùng nguy hiểm</h3>
        <p className="text-xs text-red-700 leading-relaxed">
          Xóa toàn bộ các quyết định, bước thử và ghi nhận khỏi tài khoản của bạn. Hành động này không thể hoàn tác.
        </p>

        {!showConfirm ? (
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            className="px-4 py-2 border border-red-400 text-red-700 rounded-xl font-medium text-xs min-h-[44px]"
          >
            Xóa toàn bộ hành trình
          </button>
        ) : (
          <div className="p-4 bg-white rounded-xl border border-red-300 space-y-3">
            <p className="text-xs font-semibold text-red-800">Bạn có chắc chắn muốn xóa không?</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onDeleteAllData}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-medium min-h-[44px]"
              >
                Xác nhận xóa
              </button>
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-xs min-h-[44px]"
              >
                Hủy
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
