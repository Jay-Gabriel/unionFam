import React, { useState } from 'react';
import { Tilt3DCard } from '../ui/Tilt3DCard';

export const ExperimentDesignScreen: React.FC<{ onStartExperiment: (data: any) => void }> = ({
  onStartExperiment,
}) => {
  const [learningQuestion, setLearningQuestion] = useState(
    'Quản lý có chấp nhận điều chỉnh việc ngoài giờ không?',
  );
  const [action, setAction] = useState('Trao đổi một lần về giới hạn nhận việc sau 18h');
  const [durationDays, setDurationDays] = useState<1 | 3 | 7>(3);
  const [observations, setObservations] = useState('Ghi lại phản hồi và biểu cảm của quản lý');
  const [stopRule, setStopRule] = useState(
    'Nếu thấy bị đe dọa hoặc không an toàn thì dừng ngay',
  );

  const isValid =
    learningQuestion.trim() && action.trim() && observations.trim() && stopRule.trim();

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#182D26] px-6 py-10 max-w-2xl mx-auto space-y-6">
      <Tilt3DCard
        intensity={4}
        className="p-5 rounded-3xl bg-[#E8EDE5]/70 border border-[#BBC7BC] flex items-center gap-4"
      >
        <div className="w-14 h-14 rounded-2xl bg-white border border-[#BBC7BC] flex items-center justify-center shrink-0">
          <img
            src="/assets/3d/icon-3d-experiment.png"
            alt="Thiết kế bước thử"
            className="w-10 h-10 object-contain leaf-float"
          />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[#254B3D]">Thiết kế bước thử nhỏ</h2>
          <p className="text-sm text-[#182D26]/75 mt-1">
            Chọn một hành động nhỏ có thể đảo ngược được để kiểm chứng điều còn chưa rõ trước khi ra quyết định lớn.
          </p>
        </div>
      </Tilt3DCard>

      <div className="space-y-4 bg-white p-6 rounded-2xl border border-[#BBC7BC] shadow-xs">
        <div>
          <label className="text-xs font-semibold text-[#182D26]/70">
            1. Bạn muốn biết thêm điều gì? * (Tối đa 300 ký tự)
          </label>
          <input
            type="text"
            maxLength={300}
            value={learningQuestion}
            onChange={(e) => setLearningQuestion(e.target.value)}
            className="w-full mt-1 p-2.5 rounded-xl border border-[#BBC7BC] text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-[#182D26]/70">
            2. Bạn sẽ thử làm gì? * (Tối đa 500 ký tự)
          </label>
          <input
            type="text"
            maxLength={500}
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="w-full mt-1 p-2.5 rounded-xl border border-[#BBC7BC] text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-[#182D26]/70">
            3. Thử trong bao lâu? (Ngày) *
          </label>
          <select
            value={durationDays}
            onChange={(e) => setDurationDays(Number(e.target.value) as any)}
            className="w-full mt-1 p-2.5 rounded-xl border border-[#BBC7BC] bg-white text-sm min-h-[44px]"
          >
            <option value={1}>1 ngày</option>
            <option value={3}>3 ngày (Mặc định)</option>
            <option value={7}>7 ngày</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-[#182D26]/70">
            4. Bạn sẽ ghi nhận điều gì? * (Tối đa 300 ký tự)
          </label>
          <input
            type="text"
            maxLength={300}
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            className="w-full mt-1 p-2.5 rounded-xl border border-[#BBC7BC] text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-[#182D26]/70">
            5. Khi nào nên dừng hoặc điều chỉnh? * (Tối đa 300 ký tự)
          </label>
          <input
            type="text"
            maxLength={300}
            value={stopRule}
            onChange={(e) => setStopRule(e.target.value)}
            className="w-full mt-1 p-2.5 rounded-xl border border-[#BBC7BC] text-sm"
          />
        </div>
      </div>

      <button
        type="button"
        disabled={!isValid}
        onClick={() =>
          onStartExperiment({ learningQuestion, action, durationDays, observations, stopRule })
        }
        className="w-full min-h-[44px] py-3.5 bg-[#254B3D] hover:bg-[#182D26] text-[#F7F5EF] font-medium rounded-full disabled:opacity-40 shadow-sm cursor-pointer"
      >
        Bắt đầu bước thử
      </button>
    </div>
  );
};
