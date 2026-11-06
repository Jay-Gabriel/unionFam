/**
 * Mindful Radio Audio Engine (Web Audio API)
 * Tạo âm thanh thư giãn, tần số tĩnh tâm trực tiếp từ Web Audio API không phụ thuộc file ngoài
 */

export interface RadioStation {
  id: string;
  name: string;
  subtitle: string;
  frequencyText: string;
  category: 'frequency' | 'nature' | 'focus';
}

export const RADIO_STATIONS: RadioStation[] = [
  {
    id: 'freq_174',
    name: 'Tần Số Tĩnh Tâm 174Hz',
    subtitle: 'Xoa dịu căng thẳng, cảm giác an toàn và thư giãn thể chất',
    frequencyText: '174 Hz Solfeggio',
    category: 'frequency',
  },
  {
    id: 'freq_432',
    name: 'Sóng Dao Động 432Hz',
    subtitle: 'Cân bằng tâm trí, hòa nhịp cùng nhịp thở tự nhiên',
    frequencyText: '432 Hz Harmonic',
    category: 'frequency',
  },
  {
    id: 'rain_nature',
    name: 'Mưa Rừng Yên Tĩnh',
    subtitle: 'Tiếng mưa rơi êm đềm rửa trôi những âu lo và áp lực',
    frequencyText: 'Pink Noise • Ambient Rain',
    category: 'nature',
  },
  {
    id: 'zen_bowl',
    name: 'Chuông Xoay Thiền Định',
    subtitle: 'Âm hưởng chuông Tây Tạng ngân vang mở rộng không gian tĩnh lặng',
    frequencyText: 'Binaural Drone • Zen Chimes',
    category: 'focus',
  },
  {
    id: 'wind_breeze',
    name: 'Gió Ngàn Đồi Núi',
    subtitle: 'Hơi thở của gió mây phóng khoáng giữa không gian bao la',
    frequencyText: 'Lowpass Wind • Calming Flow',
    category: 'nature',
  },
];

class MindfulRadioEngine {
  private ctx: AudioContext | null = null;
  private currentStationId: string | null = null;
  private isPlaying: boolean = false;
  private volume: number = 0.3; // 0.0 to 1.0
  private masterGain: GainNode | null = null;
  private activeNodes: (AudioNode | number)[] = [];
  private timerIds: number[] = [];

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getCurrentStation(): string | null {
    return this.currentStationId;
  }

  public stop() {
    this.timerIds.forEach(id => window.clearTimeout(id));
    this.timerIds = [];

    this.activeNodes.forEach(node => {
      if (typeof node === 'object' && node !== null) {
        try {
          if ('stop' in node && typeof (node as any).stop === 'function') {
            (node as any).stop();
          }
          if ('disconnect' in node && typeof (node as any).disconnect === 'function') {
            (node as any).disconnect();
          }
        } catch {}
      }
    });
    this.activeNodes = [];
    this.isPlaying = false;
  }

  public playStation(stationId: string) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.stop();
    this.currentStationId = stationId;
    this.isPlaying = true;

    switch (stationId) {
      case 'freq_174':
        this.buildFrequencySynth(174, 528);
        break;
      case 'freq_432':
        this.buildFrequencySynth(432, 216);
        break;
      case 'rain_nature':
        this.buildRainSynth();
        break;
      case 'zen_bowl':
        this.buildZenBowlSynth();
        break;
      case 'wind_breeze':
        this.buildWindSynth();
        break;
      default:
        this.buildFrequencySynth(432, 216);
        break;
    }
  }

  private buildFrequencySynth(baseFreq: number, subFreq: number) {
    if (!this.ctx || !this.masterGain) return;

    // Primary warm sine wave
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
    gain1.gain.setValueAtTime(0.08, this.ctx.currentTime);

    // Warm sub-harmonic
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(subFreq / 2, this.ctx.currentTime);
    gain2.gain.setValueAtTime(0.04, this.ctx.currentTime);

    // Subtle gentle tremolo LFO (0.1Hz)
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime);
    lfoGain.gain.setValueAtTime(0.02, this.ctx.currentTime);
    lfo.connect(gain1.gain);

    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(this.masterGain);
    gain2.connect(this.masterGain);

    osc1.start();
    osc2.start();
    lfo.start();

    this.activeNodes.push(osc1, osc2, lfo, gain1, gain2, lfoGain);
  }

  private buildRainSynth() {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.04;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    whiteNoise.start();
    this.activeNodes.push(whiteNoise, filter, gain);
  }

  private buildZenBowlSynth() {
    if (!this.ctx || !this.masterGain) return;

    // Harmonic singing bowl frequencies
    const freqs = [216, 432, 648, 864];
    freqs.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx!.currentTime);

      const amp = 0.06 / (idx + 1);
      gain.gain.setValueAtTime(amp, this.ctx!.currentTime);

      // Slow breathing drone
      const lfo = this.ctx!.createOscillator();
      const lfoGain = this.ctx!.createGain();
      lfo.frequency.setValueAtTime(0.08 + idx * 0.03, this.ctx!.currentTime);
      lfoGain.gain.setValueAtTime(amp * 0.4, this.ctx!.currentTime);
      lfo.connect(gain.gain);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start();
      lfo.start();
      this.activeNodes.push(osc, gain, lfo, lfoGain);
    });
  }

  private buildWindSynth() {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(320, this.ctx.currentTime);
    filter.Q.setValueAtTime(3.0, this.ctx.currentTime);

    // Filter frequency modulation (wind swell)
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.15, this.ctx.currentTime);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(140, this.ctx.currentTime);
    lfo.connect(filter.frequency);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start();
    lfo.start();
    this.activeNodes.push(noise, filter, lfo, lfoGain, gain);
  }
}

export const radioEngine = new MindfulRadioEngine();
