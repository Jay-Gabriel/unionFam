import React, { useState, useEffect } from 'react';
import { Radio, X, Volume2, VolumeX, Play, Pause, Sparkles, Music, Waves, Wind, CloudRain, Disc } from 'lucide-react';
import { RADIO_STATIONS, RadioStation, radioEngine } from '../../services/radioService';

interface MindfulRadioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MindfulRadioModal: React.FC<MindfulRadioModalProps> = ({ isOpen, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(radioEngine.getIsPlaying());
  const [currentStation, setCurrentStation] = useState<string>(radioEngine.getCurrentStation() || 'freq_432');
  const [volume, setVolume] = useState<number>(radioEngine.getVolume());

  useEffect(() => {
    setIsPlaying(radioEngine.getIsPlaying());
    if (radioEngine.getCurrentStation()) {
      setCurrentStation(radioEngine.getCurrentStation()!);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTogglePlay = () => {
    if (isPlaying) {
      radioEngine.stop();
      setIsPlaying(false);
    } else {
      radioEngine.playStation(currentStation);
      setIsPlaying(true);
    }
  };

  const handleSelectStation = (id: string) => {
    setCurrentStation(id);
    radioEngine.playStation(id);
    setIsPlaying(true);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    radioEngine.setVolume(val);
  };

  const getStationIcon = (cat: string) => {
    switch (cat) {
      case 'frequency':
        return <Waves className="w-4 h-4 text-calm-pollen" />;
      case 'nature':
        return <CloudRain className="w-4 h-4 text-teal-300" />;
      case 'focus':
        return <Disc className="w-4 h-4 text-indigo-300" />;
      default:
        return <Music className="w-4 h-4 text-calm-lichen" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-calm-forest-dusk/95 border border-calm-lichen/30 rounded-3xl p-6 text-calm-paper-white shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-calm-deep-moss border border-calm-lichen/40 flex items-center justify-center text-calm-lichen">
              <Radio className="w-5 h-5 animate-pulse text-calm-pollen" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-semibold text-calm-warm-ivory">
                Đài Radio Tâm Trí · Mindful Radio
              </h2>
              <p className="text-xs text-calm-fog font-light">
                5 tần số dao động và âm thanh tự nhiên nuôi dưỡng sự sáng rõ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-calm-fog hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Active Player Bar */}
        <div className="p-4 rounded-2xl bg-calm-deep-moss/70 border border-calm-lichen/20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleTogglePlay}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition shadow-lg cursor-pointer ${
                isPlaying
                  ? 'bg-calm-pollen text-stone-900 hover:scale-105'
                  : 'bg-calm-lichen/30 text-calm-paper-white hover:bg-calm-lichen/50'
              }`}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>
            <div>
              <div className="text-xs font-mono text-calm-pollen flex items-center gap-1.5 font-semibold">
                {isPlaying && <span className="w-2 h-2 rounded-full bg-calm-pollen animate-ping" />}
                {isPlaying ? 'ĐANG PHÁT TRỰC TIẾP' : 'TẠM DỪNG'}
              </div>
              <div className="text-sm font-medium text-calm-paper-white">
                {RADIO_STATIONS.find(s => s.id === currentStation)?.name}
              </div>
            </div>
          </div>

          {/* Equalizer animation when playing */}
          {isPlaying && (
            <div className="flex items-end gap-1 h-6 pr-2">
              <span className="w-1 bg-calm-pollen rounded-full animate-bounce h-4" />
              <span className="w-1 bg-calm-lichen rounded-full animate-bounce h-6 delay-75" />
              <span className="w-1 bg-calm-pollen rounded-full animate-bounce h-3 delay-150" />
              <span className="w-1 bg-calm-lichen rounded-full animate-bounce h-5 delay-100" />
            </div>
          )}
        </div>

        {/* Station List */}
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {RADIO_STATIONS.map((station) => {
            const isCurrent = station.id === currentStation;
            return (
              <button
                key={station.id}
                onClick={() => handleSelectStation(station.id)}
                className={`w-full text-left p-3.5 rounded-xl border transition flex items-center justify-between gap-3 cursor-pointer ${
                  isCurrent
                    ? 'bg-calm-moss/30 border-calm-lichen/50 text-calm-warm-ivory shadow-soft'
                    : 'bg-white/5 border-white/5 text-calm-fog hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-black/30 flex items-center justify-center">
                    {getStationIcon(station.category)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-calm-paper-white flex items-center gap-2">
                      <span>{station.name}</span>
                      {isCurrent && isPlaying && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-calm-pollen/20 text-calm-pollen border border-calm-pollen/30 font-mono">
                          Live
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-calm-fog/80 line-clamp-1 font-light">
                      {station.subtitle}
                    </div>
                  </div>
                </div>
                <div className="text-[11px] font-mono text-calm-lichen/80 whitespace-nowrap">
                  {station.frequencyText}
                </div>
              </button>
            );
          })}
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-3 pt-2 border-t border-white/10">
          <button
            onClick={() => {
              const next = volume > 0 ? 0 : 0.3;
              setVolume(next);
              radioEngine.setVolume(next);
            }}
            className="text-calm-fog hover:text-white transition cursor-pointer"
          >
            {volume === 0 ? <VolumeX className="w-4 h-4 text-rose-300" /> : <Volume2 className="w-4 h-4 text-calm-lichen" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={handleVolumeChange}
            className="w-full accent-calm-pollen h-1.5 bg-white/10 rounded-lg cursor-pointer"
          />
          <span className="text-xs font-mono text-calm-fog w-10 text-right">
            {Math.round(volume * 100)}%
          </span>
        </div>

      </div>
    </div>
  );
};
