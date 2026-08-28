import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UNIONFAM Life Lab — Understand → Choose → Become",
  description: "Xây dựng thiết kế cuộc sống cá nhân hóa cùng AI Conversation Engine, Life Design Map và Micro-Experiments.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
