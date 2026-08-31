import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["vietnamese", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "UNIONFAM Life Lab — Hiểu mình → Chọn hướng → Trở thành",
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
    <html
      lang="vi"
      className={`${beVietnamPro.variable} font-sans text-calm-ink`}
      style={{ backgroundColor: '#263128' }}
    >
      <body
        className="min-h-screen bg-calm-deep-moss antialiased font-sans"
        style={{ backgroundColor: '#263128' }}
      >
        {children}
      </body>
    </html>
  );
}
