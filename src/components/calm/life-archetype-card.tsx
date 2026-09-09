'use client';

import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Download,
  Share2,
  Check,
  Compass,
  Flame,
  Shield,
  Eye,
  Heart,
  Lightbulb,
  X,
  RefreshCw,
  Zap,
} from 'lucide-react';

export interface ArchetypeProfile {
  id: string;
  name: string;
  subtitle: string;
  energyFrequency: string;
  quote: string;
  blindspots: string[];
  coreValues: string[];
  superpower: string;
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
    glow: string;
  };
}

export const ARCHETYPES: Record<string, ArchetypeProfile> = {
  creator: {
    id: 'creator',
    name: 'Người Kiến Tạo Đang Chữa Lành',
    subtitle: 'THE RESTORING ARCHITECT',
    energyFrequency: '432 Hz · Tần Số Tái Sinh',
    quote: 'Bạn sinh ra để xây dựng những điều vĩ đại, nhưng đôi khi quên mất bản thân mình cũng cần được chăm sóc như một kiệt tác.',
    blindspots: [
      'Ám ảnh về sự hoàn hảo khiến bạn trì hoãn niềm vui hiện tại',
      'Thường ôm đồm trách nhiệm của người khác vì nghĩ mình làm tốt hơn',
      'Dễ kiệt sức vì nhầm lẫn giữa sự bận rộn và giá trị sống',
    ],
    coreValues: ['Kiến tạo giá trị', 'Độc lập tư duy', 'Chân thành'],
    superpower: 'Biến những ý niệm trừu tượng thành hiện thực vững chắc',
    colorScheme: {
      primary: '#1c2e24',
      secondary: '#2e4738',
      accent: '#eed596',
      glow: 'rgba(238, 213, 150, 0.35)',
    },
  },
  dreamer: {
    id: 'dreamer',
    name: 'Kẻ Mộng Mơ Tĩnh Lặng',
    subtitle: 'THE MINDFUL VISIONARY',
    energyFrequency: '528 Hz · Tần Số Khai Mở',
    quote: 'Tâm trí bạn là một vũ trụ bao la. Khi đôi chân chạm đất vững vàng, mọi giấc mơ của bạn sẽ bắt đầu nở hoa.',
    blindspots: [
      'Dễ chìm đắm trong viễn cảnh tương lai mà quên bước nhỏ của hôm nay',
      'Nhạy cảm với năng lượng tiêu cực từ môi trường xung quanh',
      'Thường tự trách bản thân khi không đạt được kỳ vọng lý tưởng',
    ],
    coreValues: ['Tự do nội tâm', 'Cảm xúc sâu sắc', 'Sáng tạo vô hạn'],
    superpower: 'Trực giác nhạy bén và khả năng nhìn thấy vẻ đẹp trong những điều nhỏ bé',
    colorScheme: {
      primary: '#1a292c',
      secondary: '#243e43',
      accent: '#a5d8d0',
      glow: 'rgba(165, 216, 208, 0.35)',
    },
  },
  seeker: {
    id: 'seeker',
    name: 'Chiến Binh Tìm Lại Bản Thể',
    subtitle: 'THE SOUL SEEKER',
    energyFrequency: '639 Hz · Tần Số Kết Nối',
    quote: 'Bạn đã chiến đấu rất kiên cường cho thế giới bên ngoài. Giờ là lúc quay về lắng nghe và ôm lấy đứa trẻ bên trong bạn.',
    blindspots: [
      'Khó mở lòng bộc lộ sự yếu đuối vì sợ bị xem là kém cỏi',
      'Định nghĩa giá trị bản thân qua thành tích và sự công nhận',
      'Thiếu kiên nhẫn với quá trình phục hồi cảm xúc của chính mình',
    ],
    coreValues: ['Dũng khí', 'Chân thật', 'Tiến bộ mỗi ngày'],
    superpower: 'Nghị lực kiên cường vượt qua nghịch cảnh và truyền cảm hứng',
    colorScheme: {
      primary: '#2b231d',
      secondary: '#45352a',
      accent: '#e5b382',
      glow: 'rgba(229, 179, 130, 0.35)',
    },
  },
  guardian: {
    id: 'guardian',
    name: 'Kẻ Gìn Giữ Bình Yên',
    subtitle: 'THE PEACE GUARDIAN',
    energyFrequency: '432 Hz · Tần Số An Trú',
    quote: 'Sự bình yên của bạn là một pháo đài vững chắc. Hãy nhớ rằng việc từ chối người khác đôi khi là cách duy nhất để đồng ý với chính mình.',
    blindspots: [
      'Sợ xung đột nên thường né tránh việc nói ra nhu cầu thật',
      'Dễ hy sinh mong muốn của bản thân để làm hài lòng số đông',
      'Khó chấp nhận những thay đổi đột ngột làm xáo trộn nhịp điệu',
    ],
    coreValues: ['Hài hòa', 'Tử tế', 'Bền bỉ'],
    superpower: 'Tạo ra bầu không khí an lành và cảm giác an toàn cho mọi người',
    colorScheme: {
      primary: '#1d2a20',
      secondary: '#2a3d2e',
      accent: '#b9c6a5',
      glow: 'rgba(185, 198, 165, 0.35)',
    },
  },
};

interface LifeArchetypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  archetypeKey?: string;
}

export function LifeArchetypeCardModal({
  isOpen,
  onClose,
  archetypeKey = 'creator',
}: LifeArchetypeModalProps) {
  const [selectedKey, setSelectedKey] = useState<string>(archetypeKey);
  const [copied, setCopied] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const cardCanvasRef = useRef<HTMLDivElement>(null);

  const archetype = ARCHETYPES[selectedKey] || ARCHETYPES.creator;
  const cardId = `LIFELAB-${Math.abs(selectedKey.split('').reduce((acc, char) => acc + char.charCodeAt(0), 1000)).toString().padStart(6, '0')}`;

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/app/archetype?type=${selectedKey}`;
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  };

  const handleDownloadStoryImage = async () => {
    setIsGeneratingImage(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');

      // 1. Background deep sanctuary gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1920);
      bgGrad.addColorStop(0, '#0c1a12');
      bgGrad.addColorStop(0.35, '#16291d');
      bgGrad.addColorStop(0.7, '#0f1d14');
      bgGrad.addColorStop(1, '#08120c');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1080, 1920);

      // 2. Ambient glows
      const glowTop = ctx.createRadialGradient(850, 250, 20, 850, 250, 600);
      glowTop.addColorStop(0, archetype.colorScheme.glow);
      glowTop.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glowTop;
      ctx.fillRect(0, 0, 1080, 1920);

      const glowBottom = ctx.createRadialGradient(250, 1650, 20, 250, 1650, 500);
      glowBottom.addColorStop(0, 'rgba(185, 198, 165, 0.2)');
      glowBottom.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glowBottom;
      ctx.fillRect(0, 0, 1080, 1920);

      // 3. Card Frame border with double rounded outline
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 3;
      ctx.strokeRect(60, 60, 960, 1800);

      ctx.strokeStyle = 'rgba(238, 213, 150, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(76, 76, 928, 1768);

      // 4. Header: Brand & Identity
      ctx.textAlign = 'center';
      ctx.fillStyle = '#b9c6a5';
      ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('✦ CĂN CƯỚC TÂM LÝ · LIFE LAB SANCTUARY ✦', 540, 140);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '20px monospace';
      ctx.fillText(`MÃ ĐỘC BẢN: #${cardId}`, 540, 180);

      // 5. Archetype Title Badge
      ctx.fillStyle = '#eed596';
      ctx.font = 'bold 52px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(archetype.name, 540, 310);

      ctx.fillStyle = '#b9c6a5';
      ctx.font = '600 24px monospace';
      ctx.fillText(archetype.subtitle, 540, 360);

      // Frequency Pill
      ctx.fillStyle = 'rgba(238, 213, 150, 0.15)';
      ctx.beginPath();
      ctx.roundRect(340, 400, 400, 48, 24);
      ctx.fill();
      ctx.strokeStyle = 'rgba(238, 213, 150, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#eed596';
      ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(`⚡ ${archetype.energyFrequency}`, 540, 432);

      // 6. Quote Card
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.roundRect(110, 485, 860, 160, 24);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.stroke();

      ctx.fillStyle = '#f5f5f0';
      ctx.font = 'italic 24px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(`“${archetype.quote.slice(0, 52)}...`, 540, 555);
      ctx.fillText(`${archetype.quote.slice(52)}”`, 540, 600);

      // 7. Section: 3 Điểm Mù (Blindspots)
      ctx.textAlign = 'left';
      ctx.fillStyle = '#eed596';
      ctx.font = 'bold 30px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('👁️ 3 ĐIỂM MÙ TÂM LÝ LỚN NHẤT:', 120, 710);

      archetype.blindspots.forEach((spot, idx) => {
        const y = 770 + idx * 110;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.beginPath();
        ctx.roundRect(110, y, 860, 85, 18);
        ctx.fill();

        ctx.fillStyle = '#e7bbb5';
        ctx.font = 'bold 24px monospace';
        ctx.fillText(`0${idx + 1}`, 140, y + 52);

        ctx.fillStyle = '#f0f4ec';
        ctx.font = '22px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText(spot.length > 56 ? `${spot.slice(0, 54)}...` : spot, 195, y + 50);
      });

      // 8. Section: Siêu Năng Lực & Giá Trị
      ctx.fillStyle = '#b9c6a5';
      ctx.font = 'bold 30px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('✨ SIÊU NĂNG LỰC TIỀM ẨN:', 120, 1160);

      ctx.fillStyle = 'rgba(185, 198, 165, 0.12)';
      ctx.beginPath();
      ctx.roundRect(110, 1195, 860, 95, 20);
      ctx.fill();
      ctx.strokeStyle = 'rgba(185, 198, 165, 0.3)';
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 23px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(archetype.superpower, 140, 1252);

      // 9. Core Values Pills
      ctx.fillStyle = '#eed596';
      ctx.font = 'bold 30px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('💎 3 GIÁ TRỊ CỐT LÕI:', 120, 1360);

      archetype.coreValues.forEach((val, idx) => {
        const x = 110 + idx * 295;
        ctx.fillStyle = 'rgba(238, 213, 150, 0.15)';
        ctx.beginPath();
        ctx.roundRect(x, 1395, 270, 75, 18);
        ctx.fill();
        ctx.strokeStyle = 'rgba(238, 213, 150, 0.35)';
        ctx.stroke();

        ctx.fillStyle = '#eed596';
        ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(val, x + 135, 1442);
      });

      // 10. Footer / Watermark
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '20px monospace';
      ctx.fillText('KHÁM PHÁ CĂN CƯỚC TÂM HỒN TẠI:', 540, 1640);

      ctx.fillStyle = '#eed596';
      ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('unionfam.com', 540, 1690);

      ctx.fillStyle = '#b9c6a5';
      ctx.font = '18px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('Lắng nghe không phán xét · Khoảng lặng chữa lành của riêng bạn', 540, 1735);

      // Trigger Download
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `UnionFam-Can-Cuoc-Tam-Ly-${archetype.id}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate image', err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="relative flex flex-col lg:flex-row max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-[36px] border border-calm-lichen/30 bg-gradient-to-b from-[#1c2a20]/95 via-[#142017]/98 to-[#0c140e]/98 text-calm-paper-white shadow-[0_25px_70px_rgba(0,0,0,0.6)]"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-20 grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
          >
            <X size={20} />
          </button>

          {/* Left Column: Interactive 9:16 Card Preview */}
          <div className="flex-1 p-5 sm:p-7 flex flex-col items-center justify-center bg-black/30 border-b lg:border-b-0 lg:border-r border-white/10">
            <div className="mb-3 text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-calm-pollen/40 bg-calm-pollen/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-calm-pollen">
                <Sparkles size={13} /> Thẻ Căn Cước Tâm Lý 9:16
              </span>
            </div>

            {/* Visual Card 9:16 Mockup */}
            <div
              ref={cardCanvasRef}
              className="relative w-full max-w-[320px] aspect-[9/16] rounded-[28px] border-2 border-calm-lichen/40 bg-gradient-to-b from-[#1b2b20] via-[#152319] to-[#0d1610] p-5 flex flex-col justify-between overflow-hidden shadow-[0_15px_45px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.15)] group"
            >
              {/* Star / Glow particles background */}
              <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-calm-pollen/20 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-calm-lichen/20 blur-2xl" />

              {/* Card Top */}
              <div className="relative z-10 space-y-2">
                <div className="flex items-center justify-between text-[9px] font-mono tracking-widest text-calm-lichen uppercase">
                  <span>UnionFam LifeLab</span>
                  <span>#{cardId}</span>
                </div>
                <div className="pt-2">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-calm-lichen/80">Nguyên mẫu của bạn</p>
                  <h3 className="text-xl font-bold tracking-tight text-calm-pollen leading-tight">{archetype.name}</h3>
                  <p className="text-[9.5px] font-mono tracking-wider text-calm-fog/80">{archetype.subtitle}</p>
                </div>
                <div className="inline-flex items-center gap-1 rounded-full border border-calm-pollen/30 bg-calm-pollen/10 px-2.5 py-0.5 text-[9.5px] font-semibold text-calm-pollen">
                  <Zap size={10} /> {archetype.energyFrequency}
                </div>
              </div>

              {/* Card Mid: Blindspots & Superpower */}
              <div className="relative z-10 space-y-2.5 my-2">
                <div className="rounded-xl border border-white/10 bg-black/40 p-2.5 text-[11px] italic text-calm-warm-ivory/90 leading-relaxed">
                  “{archetype.quote}”
                </div>
                <div className="space-y-1">
                  <p className="text-[9.5px] font-bold uppercase tracking-wider text-calm-lichen">3 Điểm mù lớn nhất:</p>
                  {archetype.blindspots.map((spot, i) => (
                    <p key={i} className="text-[10px] leading-tight text-calm-fog/95 flex items-start gap-1">
                      <span className="text-calm-pollen shrink-0 font-mono">0{i+1}.</span> {spot}
                    </p>
                  ))}
                </div>
              </div>

              {/* Card Bottom: Core values & Brand Watermark */}
              <div className="relative z-10 pt-2 border-t border-white/10 space-y-2">
                <div className="flex flex-wrap gap-1">
                  {archetype.coreValues.map((val, i) => (
                    <span key={i} className="rounded-full bg-calm-pollen/15 border border-calm-pollen/30 px-2 py-0.5 text-[9px] font-medium text-calm-pollen">
                      {val}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between text-[9px] text-calm-fog/60 pt-1">
                  <span>Khám phá tại: <strong>unionfam.com</strong></span>
                  <span>✦ 2026</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Archetype Selector & Viral Actions */}
          <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between space-y-6 overflow-y-auto">
            <div className="space-y-5">
              <div>
                <h3 className="text-2xl font-bold tracking-tight text-white">Căn Cước Tâm Lý Của Bạn</h3>
                <p className="text-xs text-calm-fog leading-relaxed mt-1">
                  Được đúc kết tự động từ những trăn trở, giá trị và câu trả lời thật lòng của bạn cùng AI LifeLab.
                </p>
              </div>

              {/* Archetype Selector Tabs */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-calm-lichen uppercase tracking-wider">
                  Khám phá các nguyên mẫu:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(ARCHETYPES).map(([key, arch]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedKey(key)}
                      className={`p-2.5 rounded-2xl border text-left text-xs transition-all ${
                        selectedKey === key
                          ? 'border-calm-pollen bg-calm-pollen/20 text-white font-bold shadow-[0_0_15px_rgba(238,213,150,0.25)]'
                          : 'border-white/10 bg-white/5 text-calm-fog hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <p className="truncate font-medium">{arch.name}</p>
                      <p className="text-[10px] text-calm-lichen/70 truncate">{arch.subtitle}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Core summary details */}
              <div className="space-y-3 rounded-2xl border border-white/10 bg-black/25 p-4 text-xs">
                <p className="text-calm-warm-ivory flex items-center gap-1.5 font-semibold">
                  <Sparkles size={14} className="text-calm-pollen shrink-0" />
                  <strong>Siêu năng lực:</strong> {archetype.superpower}
                </p>
                <p className="text-calm-fog flex items-center gap-1.5">
                  <Shield size={14} className="text-calm-lichen shrink-0" />
                  <strong>Mã bảo chứng:</strong> #{cardId}
                </p>
              </div>
            </div>

            {/* Action Buttons: 1-Click Story Download & Share */}
            <div className="space-y-2.5 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={handleDownloadStoryImage}
                disabled={isGeneratingImage}
                className="w-full flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-calm-pollen via-[#f7e4b5] to-calm-pollen px-6 py-3.5 text-sm font-bold text-calm-deep-moss shadow-[0_6px_22px_rgba(238,213,150,0.4)] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
              >
                {isGeneratingImage ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Đang xuất ảnh Story chất lượng cao…</span>
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    <span>Tải ảnh Story 9:16 để đăng Instagram / Facebook</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-xs font-semibold text-calm-paper-white transition hover:bg-white/15 active:scale-95"
              >
                {copied ? (
                  <>
                    <Check size={14} className="text-emerald-400" />
                    <span className="text-emerald-300">Đã sao chép link thẻ căn cước!</span>
                  </>
                ) : (
                  <>
                    <Share2 size={14} />
                    <span>Sao chép liên kết chia sẻ cho bạn bè</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
