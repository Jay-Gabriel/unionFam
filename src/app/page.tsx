import React from 'react';
import { GlassPillNav } from '@/components/calm/glass-pill-nav';
import { LivingBackdrop } from '@/components/calm/living-backdrop';
import { CalmButton } from '@/components/calm/calm-button';
import { CalmCard } from '@/components/calm/calm-card';

export default function LandingPage() {
  const navItems = [
    { label: 'Khám phá', href: '#explore' },
    { label: 'Cách hoạt động', href: '#how-it-works' },
    { label: 'Triết lý', href: '#ethos' },
  ];

  return (
    <>
      <GlassPillNav items={navItems} cta={{ label: 'Đăng nhập', href: '/auth' }} />
      <LivingBackdrop>
        <main className="min-h-screen flex flex-col md:flex-row items-center justify-center max-w-[1440px] mx-auto px-6 py-24 md:py-32 gap-12 md:gap-24 relative z-10">

          {/* Left Column: Hero Copy */}
          <div className="flex-1 space-y-8 max-w-2xl text-calm-paper-white z-20 pt-16 md:pt-0">
            <div className="text-calm-lichen text-sm font-semibold tracking-widest uppercase mb-4">
              MỘT KHÔNG GIAN ĐỂ TRỞ VỀ VỚI CHÍNH MÌNH
            </div>

            <h1 className="text-5xl md:text-[5.5rem] font-light leading-[1.05] tracking-tight">
              Bước vào khoảng sống của <span className="font-normal italic text-calm-warm-ivory">riêng bạn.</span>
            </h1>

            <p className="text-lg md:text-xl text-calm-fog/90 leading-relaxed font-light max-w-xl">
              Life Lab giúp bạn lắng nghe điều mình thật sự muốn, nhìn rõ các lựa chọn và thử nghiệm một cuộc sống phù hợp hơn — theo nhịp của chính bạn.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-6">
              <CalmButton variant="primary" href="/app" className="w-full sm:w-auto text-base px-8 py-4">
                Bắt đầu khám phá
              </CalmButton>
              <CalmButton variant="ghost" href="#how-it-works" className="w-full sm:w-auto text-calm-paper-white hover:bg-calm-paper-white/10 hover:text-white">
                Life Lab hoạt động thế nào?
              </CalmButton>
            </div>
          </div>

          {/* Right Column: Floating Ethos Cards */}
          <div className="flex-1 w-full max-w-md space-y-6 relative z-20 mt-12 md:mt-0">
            <CalmCard variant="ivory" className="relative text-calm-ink">
              <h3 className="text-xl font-medium mb-3">AI gợi mở. Bạn quyết định.</h3>
              <p className="text-calm-muted-ink text-sm leading-relaxed">
                Mọi phân tích do AI đề xuất đều cần bạn tự tay xác nhận trước khi trở thành dữ liệu Life Map của riêng bạn.
              </p>
            </CalmCard>

            <CalmCard variant="glass" className="relative md:ml-12 border-calm-fog/20 text-calm-paper-white backdrop-blur-md bg-calm-forest-dusk/40">
              <h3 className="text-lg font-medium mb-2 text-calm-lichen">Khoảng lặng hôm nay</h3>
              <p className="font-light text-[15px] leading-relaxed italic">
                &quot;Điều gì đang lấy đi nhiều năng lượng nhất của bạn lúc này mà bạn chưa từng gọi tên?&quot;
              </p>
            </CalmCard>

            <div className="pt-6 flex justify-end gap-6 text-calm-fog/70 text-sm font-medium">
              <span>6 chiều sống</span>
              <span>•</span>
              <span>1 hành trình của riêng bạn</span>
            </div>
          </div>

        </main>
      </LivingBackdrop>
    </>
  );
}
