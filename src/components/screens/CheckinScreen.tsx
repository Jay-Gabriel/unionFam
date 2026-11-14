import React, { useState } from 'react';

export const CheckinScreen: React.FC<{ onSubmitCheckin: (data: any) => void }> = ({ onSubmitCheckin }) => {
  const [status, setStatus] = useState<'TRIED' | 'NOT_TRIED' | 'ADJUSTED'>('TRIED');
  const [note, setNote] = useState('');
  const [energy, setEnergy] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#182D26] px-6 py-10 max-w-xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#254B3D]">Ghi nhận hôm nay</h2>
        <p className="text-sm text-[#182D26]/70 mt-1">
          Dành một phút nhìn lại những gì bạn đã trải nghiệm thực tế hôm nay.
        </p>
      </div>

      <div className="p-6 bg-white rounded-2xl border border-[#BBC7BC] space-y-5">
        <div>
          <label className="text-xs font-semibold text-[#182D26]/70">Hôm nay bạn đã thử chưa?</label>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {(['TRIED', 'NOT_TRIED', 'ADJUSTED'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`py-2 px-3 rounded-xl border text-sm min-h-[44px] font-medium transition ${
                  status === s
                    ? 'bg-[#254B3D] text-[#F7F5EF] border-[#254B3D]'
                    : 'border-[#BBC7BC] bg-white text-[#182D26]'
                }`}
              >
                {s === 'TRIED' ? 'Đã thử' : s === 'NOT_TRIED' ? 'Chưa thử' : 'Đã điều chỉnh'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-[#182D26]/70">
              Điều gì đã xảy ra? {status !== 'NOT_TRIED' && '*'}
            </label>
            <span className="text-xs text-[#182D26]/60">{note.length}/1000 ký tự</span>
          </div>
          <textarea
            rows={4}
            maxLength={1000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Điều gì đã xảy ra?"
            className="w-full mt-1.5 p-3 rounded-xl border border-[#BBC7BC] text-sm focus:outline-[#254B3D]"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-[#182D26]/70">
            Mức năng lượng hôm nay (1-10, tùy chọn):
          </label>
          <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setEnergy(energy === num ? null : num)}
                className={`min-w-[36px] min-h-[36px] rounded-lg border text-xs font-medium ${
                  energy === num
                    ? 'bg-[#254B3D] text-white border-[#254B3D]'
                    : 'border-[#BBC7BC] bg-white text-[#182D26]'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onSubmitCheckin({ status, note, energy })}
        className="w-full min-h-[44px] py-3.5 bg-[#254B3D] text-[#F7F5EF] font-medium rounded-full shadow-sm"
      >
        Lưu ghi nhận
      </button>
    </div>
  );
};
