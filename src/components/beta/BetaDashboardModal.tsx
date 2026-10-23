import React, { useState } from 'react';
import {
  X,
  Activity,
  ShieldCheck,
  Smile,
  Server,
  ToggleLeft,
  ToggleRight,
  Users,
  CheckCircle2,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import {
  getBetaTelemetryMetrics,
  getIncidentReports,
  BetaMetrics
} from '../../services/betaTelemetryService';
import {
  getBetaRuntimeFlags,
  setBetaRuntimeFlags
} from '../../config/betaFlags';

interface BetaDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BetaDashboardModal: React.FC<BetaDashboardModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [metrics, setMetrics] = useState<BetaMetrics>(getBetaTelemetryMetrics);
  const [flags, setFlags] = useState(getBetaRuntimeFlags);
  const incidents = getIncidentReports();

  if (!isOpen) return null;

  const handleToggleMemory = () => {
    const nextVal = !flags.enableMemory;
    setBetaRuntimeFlags({ enableMemory: nextVal });
    setFlags(getBetaRuntimeFlags());
  };

  const handleToggleDecisionMode = () => {
    const nextVal = !flags.enableDecisionMode;
    setBetaRuntimeFlags({ enableDecisionMode: nextVal });
    setFlags(getBetaRuntimeFlags());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl h-[90vh] bg-[#0c1020] border border-amber-300/40 rounded-3xl p-5 sm:p-7 text-stone-200 shadow-[0_0_60px_rgba(234,179,8,0.25)] flex flex-col overflow-hidden space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-amber-300">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono tracking-widest text-amber-300 uppercase font-semibold">
                  LIMITED BETA TELEMETRY
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  COHORT: {flags.cohortCount}/50 USERS
                </span>
              </div>
              <h2 className="font-serif text-base sm:text-lg font-bold text-stone-100">
                Dashboard Giám Sát Tối Thiểu (Quality & Safety Operations)
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-stone-400 hover:text-stone-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Control Bar: Feature Flags (Tắt/Bật Memory & Decision Mode) */}
        <div className="p-4 rounded-2xl bg-[#141930] border border-amber-300/20 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-300" />
            <span className="text-xs font-serif text-stone-300">
              Quy mô thử nghiệm: <strong className="text-amber-200">{flags.cohortCount} người</strong> / trần 50
            </span>
          </div>

          <div className="flex items-center gap-5">
            {/* Toggle Memory */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-sans text-stone-300">Bộ nhớ (Memory):</span>
              <button
                type="button"
                onClick={handleToggleMemory}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium transition ${
                  flags.enableMemory
                    ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300'
                    : 'bg-rose-500/20 border border-rose-400/40 text-rose-300'
                }`}
              >
                {flags.enableMemory ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4 text-rose-400" />}
                <span>{flags.enableMemory ? 'BẬT (ACTIVE)' : 'TẮT (DISABLED)'}</span>
              </button>
            </div>

            {/* Toggle Decision Mode */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-sans text-stone-300">Chế độ Quyết định:</span>
              <button
                type="button"
                onClick={handleToggleDecisionMode}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium transition ${
                  flags.enableDecisionMode
                    ? 'bg-amber-500/20 border border-amber-400/40 text-amber-300'
                    : 'bg-stone-800 border border-stone-700 text-stone-400'
                }`}
              >
                {flags.enableDecisionMode ? <ToggleRight className="w-4 h-4 text-amber-400" /> : <ToggleLeft className="w-4 h-4 text-stone-500" />}
                <span>{flags.enableDecisionMode ? 'BẬT (ACTIVE)' : 'TẮT (DISABLED)'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Metrics Content */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Pillar 1: Chất Lượng (Quality) */}
            <div className="p-4 rounded-2xl bg-stone-900/80 border border-white/10 space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Activity className="w-4 h-4" />
                  <span className="font-serif text-xs font-bold uppercase tracking-wider">
                    1. Chất Lượng (Quality)
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400">HEALTHY</span>
              </div>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-white/5">
                  <span className="text-stone-400">State transition pass:</span>
                  <span className="font-mono text-stone-100 font-semibold">{metrics.quality.stateTransitionPassRate}%</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-white/5">
                  <span className="text-stone-400">Intent fidelity:</span>
                  <span className="font-mono text-stone-100 font-semibold">{metrics.quality.intentFidelity}%</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-white/5">
                  <span className="text-stone-400">Wrong task:</span>
                  <span className="font-mono text-amber-300 font-semibold">{metrics.quality.wrongTaskCount} incident</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-white/5">
                  <span className="text-stone-400">Reflection-only rate:</span>
                  <span className="font-mono text-stone-100">{metrics.quality.reflectionOnlyRate}%</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-white/5">
                  <span className="text-stone-400">Repair recurrence:</span>
                  <span className="font-mono text-amber-300">{metrics.quality.repairRecurrenceCount}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-stone-400">Decision Card correctness:</span>
                  <span className="font-mono text-emerald-300 font-semibold">{metrics.quality.decisionCardCorrectness}%</span>
                </div>
              </div>
            </div>

            {/* Pillar 2: Safety & Privacy */}
            <div className="p-4 rounded-2xl bg-stone-900/80 border border-white/10 space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div className="flex items-center gap-2 text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="font-serif text-xs font-bold uppercase tracking-wider">
                    2. Safety & Privacy
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400">0 CRITICAL</span>
              </div>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-white/5">
                  <span className="text-stone-400">Critical fail:</span>
                  <span className="font-mono text-emerald-400 font-bold">{metrics.safetyAndPrivacy.criticalFailures}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-white/5">
                  <span className="text-stone-400">User stop ignored:</span>
                  <span className="font-mono text-emerald-400 font-bold">{metrics.safetyAndPrivacy.stopIgnoredCount}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-white/5">
                  <span className="text-stone-400">Unauthorized write:</span>
                  <span className="font-mono text-emerald-400 font-bold">{metrics.safetyAndPrivacy.unauthorizedWrites}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-white/5">
                  <span className="text-stone-400">Delete/revoke completion:</span>
                  <span className="font-mono text-stone-100 font-semibold">{metrics.safetyAndPrivacy.deleteRevokeCompletion}%</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-white/5">
                  <span className="text-stone-400">Cross-user incident:</span>
                  <span className="font-mono text-emerald-400 font-bold">{metrics.safetyAndPrivacy.crossUserIncidents}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-stone-400">Safety fallback count:</span>
                  <span className="font-mono text-stone-100">{metrics.safetyAndPrivacy.safetyFallbackCount}</span>
                </div>
              </div>
            </div>

            {/* Pillar 3: Trải Nghiệm (Experience) */}
            <div className="p-4 rounded-2xl bg-stone-900/80 border border-white/10 space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div className="flex items-center gap-2 text-amber-400">
                  <Smile className="w-4 h-4" />
                  <span className="font-serif text-xs font-bold uppercase tracking-wider">
                    3. Trải Nghiệm (Experience)
                  </span>
                </div>
                <span className="text-[10px] font-mono text-amber-300">4.8 / 5.0</span>
              </div>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-white/5">
                  <span className="text-stone-400">Perceived understanding:</span>
                  <span className="font-mono text-amber-300 font-semibold">{metrics.experience.perceivedUnderstanding} / 5</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-white/5">
                  <span className="text-stone-400">Usefulness score:</span>
                  <span className="font-mono text-amber-300 font-semibold">{metrics.experience.usefulnessScore} / 5</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-white/5">
                  <span className="text-stone-400">Không khó chịu (Comfort):</span>
                  <span className="font-mono text-emerald-300 font-semibold">{metrics.experience.comfortRate}%</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-white/5">
                  <span className="text-stone-400">Decision clarity:</span>
                  <span className="font-mono text-stone-100">{metrics.experience.decisionClarityRate}%</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-white/5">
                  <span className="text-stone-400">Trust in memory:</span>
                  <span className="font-mono text-stone-100">{metrics.experience.trustInMemoryRate}%</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-stone-400">Return intent (D7 return):</span>
                  <span className="font-mono text-indigo-300 font-semibold">{metrics.experience.returnIntentD7}%</span>
                </div>
              </div>
            </div>

            {/* Pillar 4: Vận Hành (Operations) */}
            <div className="p-4 rounded-2xl bg-stone-900/80 border border-white/10 space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div className="flex items-center gap-2 text-cyan-400">
                  <Server className="w-4 h-4" />
                  <span className="font-serif text-xs font-bold uppercase tracking-wider">
                    4. Vận Hành (Operations)
                  </span>
                </div>
                <span className="text-[10px] font-mono text-cyan-300">P95: 1.35s</span>
              </div>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-white/5">
                  <span className="text-stone-400">Schema success rate:</span>
                  <span className="font-mono text-stone-100 font-semibold">{metrics.operations.schemaSuccessRate}%</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-white/5">
                  <span className="text-stone-400">P50 / P95 Latency:</span>
                  <span className="font-mono text-stone-100">{metrics.operations.p50LatencyMs}ms / {metrics.operations.p95LatencyMs}ms</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-white/5">
                  <span className="text-stone-400">Timeout / Retry:</span>
                  <span className="font-mono text-stone-100">{metrics.operations.timeoutCount} / {metrics.operations.retryCount}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-white/5">
                  <span className="text-stone-400">Fallback count:</span>
                  <span className="font-mono text-stone-100">{metrics.operations.fallbackCount}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-stone-400">Cost / session (Gemini API):</span>
                  <span className="font-mono text-emerald-300 font-bold">${metrics.operations.costPerSessionUsd}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Incidents Log */}
          <div className="p-4 rounded-2xl bg-stone-900/80 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-serif text-xs font-bold uppercase tracking-wider text-stone-300">
                Nhật Ký Sự Cố Gần Nhất (Incidents Reported)
              </span>
              <span className="text-[10px] font-mono text-stone-400">
                {incidents.length} báo cáo
              </span>
            </div>

            {incidents.length === 0 ? (
              <p className="text-xs text-stone-500 py-3 text-center italic">
                Chưa có sự cố nào được ghi nhận từ cohort beta.
              </p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {incidents.map(inc => (
                  <div
                    key={inc.id}
                    className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-xs flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] uppercase font-bold text-amber-300">
                          {inc.type}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/5 text-stone-400">
                          {inc.severity}
                        </span>
                        <span className="text-[10px] text-stone-500">
                          {new Date(inc.reportedAt).toLocaleTimeString('vi-VN')}
                        </span>
                      </div>
                      <p className="text-stone-200 mt-1">{inc.description}</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-300/30 whitespace-nowrap">
                      {inc.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
