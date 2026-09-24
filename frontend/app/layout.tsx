import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ViralScript AI - Giải Phẫu & Tái Cấu Trúc Kịch Bản Video Triệu View",
  description: "Bóc tách công thức tâm lý video viral (TikTok, Reels, Shorts) và tạo kịch bản mới theo ngành hàng trong 15 giây.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="antialiased bg-slate-950 text-slate-100">{children}</body>
    </html>
  );
}
