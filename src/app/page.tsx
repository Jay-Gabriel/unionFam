import Link from 'next/link';
import { Sparkles, Compass, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between">
      {/* Top Header */}
      <header className="px-6 py-6 border-b border-slate-800 flex items-center justify-between max-w-6xl w-full mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold">
            L
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">UNIONFAM Life Lab</h1>
            <p className="text-[10px] text-slate-400">Understand → Choose → Become</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/auth"
            className="px-4 py-2 rounded-2xl text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            Đăng nhập
          </Link>
          <Link
            href="/auth"
            className="px-5 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold transition-all shadow-md shadow-indigo-900/50"
          >
            Bắt đầu ngay
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="px-6 py-16 max-w-4xl w-full mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-900/60 border border-indigo-700/50 text-indigo-300 text-xs font-semibold">
          <Sparkles size={15} />
          <span>Thiết kế cuộc sống cá nhân hóa cùng AI Conversation</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
          Bạn là nhà khoa học của <br />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
            chính cuộc đời mình
          </span>
        </h1>

        <p className="text-slate-300 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
          Life Lab giúp bạn thấu hiểu bản thân, đưa ra lựa chọn sáng suốt và từng bước thử nghiệm để kiến tạo cuộc sống mong ước mà không bị phán xét.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/app"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-950/60 flex items-center justify-center gap-2 transition-all"
          >
            <span>Khám phá Life Lab Dashboard</span>
            <ArrowRight size={18} />
          </Link>
          <Link
            href="/auth"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-colors"
          >
            Tạo tài khoản miễn phí
          </Link>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-12 text-left">
          <div className="p-5 rounded-3xl bg-slate-800/60 border border-slate-700/60 space-y-2">
            <ShieldCheck className="text-indigo-400" size={24} />
            <h3 className="font-bold text-slate-100 text-base">User Agency Gate</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Mọi phân tích do AI đề xuất đều cần bạn bấm xác nhận trước khi trở thành dữ liệu Life Map.
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-slate-800/60 border border-slate-700/60 space-y-2">
            <Compass className="text-purple-400" size={24} />
            <h3 className="font-bold text-slate-100 text-base">6-Dimension Life Design</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tổ chức toàn bộ mục tiêu, giá trị cốt lõi, ngày lý tưởng và câu hỏi lớn theo 6 lát cắt.
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-slate-800/60 border border-slate-700/60 space-y-2">
            <CheckCircle2 className="text-emerald-400" size={24} />
            <h3 className="font-bold text-slate-100 text-base">Life Lab Loop</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Vòng lặp 6 bước: Explore → Choose → Experiment → Experience → Reflection → Learning.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-6 border-t border-slate-800 text-center text-xs text-slate-500">
        © 2026 UNIONFAM Life Lab MVP. All rights reserved.
      </footer>
    </div>
  );
}
