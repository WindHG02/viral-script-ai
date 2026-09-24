"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Zap,
  Clapperboard,
  Camera,
  Play,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Flame,
  Layers,
  HelpCircle,
  Eye,
  Sliders,
  Film
} from "lucide-react";

interface PippitShowcaseProps {
  onSelectSample: (url: string) => void;
  onOpenPaywall: () => void;
  onOpenTemplates?: () => void;
}

export default function PippitShowcase({ onSelectSample, onOpenPaywall }: PippitShowcaseProps) {
  const [activeTab, setActiveTab] = useState<"ecommerce" | "tech" | "story" | "finance">("ecommerce");

  const niches = [
    {
      id: "ecommerce",
      label: "🛍️ Bán Hàng & UGC",
      hook: "Đừng vội mua máy cạo râu này nếu bạn chưa biết bí mật này...",
      retention: "87% xem hết 10s đầu",
      formula: "Vấn đề đau đầu -> Trải nghiệm giật mình -> Đưa giải pháp độc lạ",
      url: "https://www.youtube.com/shorts/jNQXAC9IVRw",
      badge: "Top Chuyển Đổi TikTok Shop",
      stats: "3.2M Views"
    },
    {
      id: "tech",
      label: "📱 Công Nghệ & Mẹo",
      hook: "90% người dùng iPhone không hề biết tính năng ẩn cứu cánh này!",
      retention: "92% giữ chân",
      formula: "Bắt bẻ hiểu lầm -> Hướng dẫn thao tác màn hình -> Call-to-action lưu lại",
      url: "https://www.youtube.com/shorts/XosQMUreys8",
      badge: "Viral Shorts",
      stats: "1.8M Views"
    },
    {
      id: "story",
      label: "🎭 Drama & Kể Chuyện",
      hook: "Tôi đã mất trắng 500 triệu chỉ vì tin vào lời hứa của người bạn thân...",
      retention: "84% xem tới cuối",
      formula: "Mở đầu sốc -> Nút thắt hồi hộp -> Bài học nhân sinh sâu sắc",
      url: "https://www.youtube.com/shorts/ApV9ldrQbnQ",
      badge: "Gây Tò Mò Cực Mạnh",
      stats: "4.5M Views"
    },
    {
      id: "finance",
      label: "💰 Kinh Doanh & Đầu Tư",
      hook: "Nếu có 10 triệu trong tay năm 2024, đây là cách biến nó thành tài sản...",
      retention: "79% lưu video",
      formula: "Thực trạng lạm phát -> Phân tích số liệu thực tế -> Lộ trình 3 bước",
      url: "https://www.youtube.com/shorts/dQw4w9WgXcQ",
      badge: "Tương Tác Tranh Luận Cao",
      stats: "950K Views"
    }
  ];

  const currentNiche = niches.find(n => n.id === activeTab) || niches[0];

  const features = [
    {
      icon: <Flame className="w-5 h-5 text-amber-400" />,
      title: "Giải Phẫu Tâm Lý Giữ Chân",
      desc: "Tự động phân tách Hook 3s đầu, kỹ thuật ngắt nhịp giữa video và lời chốt CTA kích thích tương tác."
    },
    {
      icon: <Clapperboard className="w-5 h-5 text-fuchsia-400" />,
      title: "Bảng Phân Cảnh Storyboard AI",
      desc: "Sinh chi tiết chỉ dẫn góc máy, hành động diễn xuất và prompt B-roll tiếng Anh chuẩn Midjourney/Runway."
    },
    {
      icon: <Camera className="w-5 h-5 text-indigo-400" />,
      title: "Máy Nhắc Chữ Studio",
      desc: "Teleprompter chuyên nghiệp ngay trên màn hình máy tính và điện thoại. Chỉnh tốc độ, cỡ chữ và lật gương."
    },
    {
      icon: <Sliders className="w-5 h-5 text-emerald-400" />,
      title: "4 Persona Giọng Điệu Đa Dạng",
      desc: "Tùy biến nhanh giữa phong cách UGC mộc mạc, chuyên gia đanh thép, kể chuyện hồi hộp hay hài hước giễu nhại."
    },
    {
      icon: <Zap className="w-5 h-5 text-cyan-400" />,
      title: "Cơ Chế Nhảy Model Thông Minh",
      desc: "Tự động luân chuyển giữa các bản Gemini Flash và Lite khi chạm hạn mức, đảm bảo ứng dụng không bao giờ gián đoạn."
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-rose-400" />,
      title: "Lưu Kịch Bản & Đồng Bộ Đám Mây",
      desc: "Quản lý toàn bộ lịch sử phân tích và kịch bản tái tạo an toàn trên Supabase, dễ dàng tra cứu lại mọi lúc."
    }
  ];

  const faqs = [
    {
      q: "ViralScript AI hỗ trợ phân tích những link video nào?",
      a: "Hệ thống hỗ trợ toàn bộ các định dạng video ngắn phổ biến nhất hiện nay: TikTok, YouTube Shorts và Facebook Reels / Instagram Reels."
    },
    {
      q: "Bảng phân cảnh Storyboard dùng để làm gì?",
      a: "Storyboard chia nhỏ kịch bản thành từng cảnh cụ thể kèm thời gian, chỉ dẫn góc quay và câu prompt tiếng Anh chi tiết để bạn đưa vào các công cụ AI video (như Midjourney, Runway, Pippit) tạo cảnh minh họa B-roll chuyên nghiệp."
    },
    {
      q: "Máy nhắc chữ (Teleprompter) hoạt động ra sao?",
      a: "Bạn chỉ cần bấm nút 'Bật Máy Nhắc Chữ', văn bản kịch bản sẽ tự động chạy cuộn theo tốc độ bạn chọn, hỗ trợ chế độ lật gương để dùng chung với gương phản chiếu của giá đỡ máy quay chuyên nghiệp."
    },
    {
      q: "Tôi có được dùng thử miễn phí không?",
      a: "Có! Mọi khách vãng lai đều được tặng ngay 2 lượt phân tích miễn phí. Khi tạo tài khoản, bạn nhận thêm 3 lượt mới mỗi ngày hoặc có thể nạp gói lẻ chỉ từ 5.000đ."
    }
  ];

  return (
    <div className="w-full mt-12 sm:mt-16 space-y-16 sm:space-y-24 animate-in fade-in duration-700">
      
      {/* ─── SECTION 1: INTERACTIVE USE-CASES SHOWCASE (PIPPIT STYLE) ─────────── */}
      <section className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-fuchsia-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 border-b border-slate-800 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 text-[11px] font-semibold mb-2">
              <Eye className="w-3 h-3" />
              <span>Khám Phá Kịch Bản Thực Chiến</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-100">
              Công Thức Triệu View Theo Từng Ngành Hàng
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Chọn ngành hàng bên dưới để xem cách AI mổ xẻ công thức giữ chân và bấm thử nghiệm ngay.
            </p>
          </div>

          {/* Niche Tabs */}
          <div className="flex flex-wrap gap-1.5 p-1 bg-slate-950/80 rounded-2xl border border-slate-800">
            {niches.map((niche) => (
              <button
                key={niche.id}
                onClick={() => setActiveTab(niche.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === niche.id
                    ? "bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white shadow-md shadow-fuchsia-600/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                {niche.label}
              </button>
            ))}
          </div>
        </div>

        {/* Niche Card Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-lg bg-amber-950/70 border border-amber-800/60 text-amber-300 text-xs font-bold flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                {currentNiche.badge}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                {currentNiche.stats}
              </span>
              <span className="text-xs text-indigo-300 font-medium">
                • {currentNiche.retention}
              </span>
            </div>

            {/* Hook mẫu — label rõ ràng là "Công Thức Ví Dụ" */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-fuchsia-400">
                  Công Thức Hook Mẫu (Ví Dụ):
                </span>
                <span className="text-[10px] text-slate-500 italic">— không phải nội dung video thật bên dưới</span>
              </div>
              <p className="text-sm sm:text-base font-semibold text-slate-100 italic">
                "{currentNiche.hook}"
              </p>
            </div>

            <div className="space-y-1.5 text-xs text-slate-300">
              <span className="font-semibold text-slate-400 text-[11px] uppercase tracking-wide">
                Logic Giữ Chân Khán Giả:
              </span>
              <p className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60 text-slate-300 leading-relaxed">
                {currentNiche.formula}
              </p>
            </div>
          </div>

          {/* Panel bên phải — video ví dụ thật */}
          <div className="lg:col-span-4 flex flex-col justify-center items-center p-5 bg-slate-950/80 rounded-2xl border border-slate-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-fuchsia-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-fuchsia-500/20">
              <Play className="w-5 h-5 text-white ml-0.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-200">Video Ví Dụ Thực Tế</h3>
              <p className="text-[11px] text-slate-400 mt-1 max-w-[200px] mx-auto leading-relaxed">
                AI sẽ phân tích nội dung <span className="text-amber-300 font-medium">thật</span> của video này — không phải hook mẫu bên trái.
              </p>
            </div>

            {/* Hiển thị link để user biết sẽ phân tích video nào */}
            <div className="w-full px-2 py-1.5 rounded-lg bg-slate-900/60 border border-slate-700/50">
              <p className="text-[10px] text-slate-500 truncate">
                🔗 {currentNiche.url.replace("https://www.youtube.com/shorts/", "yt/shorts/")}
              </p>
            </div>

            <button
              onClick={() => onSelectSample(currentNiche.url)}
              className="w-full py-2.5 px-4 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-fuchsia-600/30"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Phân Tích Video Ví Dụ Này</span>
            </button>

            <p className="text-[10px] text-slate-500 leading-relaxed">
              Hoặc dán link video <span className="text-fuchsia-400">của bạn</span> vào ô nhập bên trên để phân tích ngành {currentNiche.label.replace(/^[^\s]+ /, "")}.
            </p>
          </div>
        </div>
      </section>

      {/* ─── SECTION 2: 3-STEP PIPELINE (QUY TRÌNH SẢN XUẤT 3 BƯỚC) ─────────── */}
      <section className="text-center space-y-8">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-[11px] font-semibold">
            <Zap className="w-3 h-3" />
            <span>Quy Trình Siêu Tốc</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
            Từ Video Triệu View Đến Kịch Bản Quay Trong 3 Bước
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Không cần vò đầu bứt tai tìm ý tưởng. Nhân bản nhịp điệu của các video viral hàng đầu thế giới chỉ trong chớp mắt.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {/* Step 1 */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-fuchsia-800/60 transition group relative">
            <div className="text-3xl font-black text-slate-800 group-hover:text-fuchsia-500/30 transition mb-3">
              01
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-fuchsia-500" />
              Dán Link Video Gốc
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dán link video ngắn TikTok, Reels hoặc YouTube Shorts mà bạn thấy cuốn hút hoặc nhiều tương tác. Hệ thống tự động bóc tách âm thanh 16kHz siêu nét.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-indigo-800/60 transition group relative">
            <div className="text-3xl font-black text-slate-800 group-hover:text-indigo-500/30 transition mb-3">
              02
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              AI Giải Phẫu Cấu Trúc
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Mô hình nhận diện giọng nói Groq Whisper kết hợp Gemini phân tách chi tiết: Câu Hook giật tít, kỹ thuật giữ chân đoạn giữa và cách chốt chuyển đổi CTA.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-amber-800/60 transition group relative">
            <div className="text-3xl font-black text-slate-800 group-hover:text-amber-500/30 transition mb-3">
              03
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Tái Cấu Trúc & Bật Máy Quay
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Chọn ngành hàng và phong cách của bạn. Nhận ngay 3 kịch bản mới kèm Storyboard chi tiết góc máy, B-roll AI và bật Máy nhắc chữ Teleprompter quay luôn.
            </p>
          </div>
        </div>
      </section>

      {/* ─── SECTION 3: KEY CAPABILITIES (TÍNH NĂNG ĐẶC SẮC) ───────────────── */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-fuchsia-950/80 border border-fuchsia-700/60 text-fuchsia-300 text-[11px] font-semibold">
            <Clapperboard className="w-3 h-3" />
            <span>Bộ Công Cụ Toàn Diện</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
            Trang Bị Đầy Đủ Cho Nhà Sáng Tạo Triệu View
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Mọi tính năng được thiết kế bám sát nhu cầu sản xuất video ngắn hàng ngày, tối ưu hóa từ ý tưởng đến thành phẩm.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feat, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center">
                  {feat.icon}
                </div>
                <h3 className="text-sm font-bold text-slate-200">{feat.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── SECTION 4: COMPARISON BANNER (HIỆU SUẤT VƯỢT TRỘI) ─────────────── */}
      <section className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-900/40 rounded-3xl p-6 sm:p-10 text-center relative overflow-hidden">
        <div className="max-w-2xl mx-auto space-y-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
            Hiệu Suất Sáng Tạo Video
          </span>
          <h2 className="text-xl sm:text-3xl font-extrabold text-slate-100">
            Tiết Kiệm 90% Thời Gian Viết Kịch Bản Video Ngắn
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Thay vì tốn nửa ngày để tìm hook và sắp xếp câu từ, bạn chỉ cần 15 giây để nắm trọn vẹn công thức thành công của các video thịnh hành nhất.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => onSelectSample("https://www.youtube.com/shorts/XosQMUreys8")}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-fuchsia-600/30 transition flex items-center gap-2"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Dùng Thử Kịch Bản Mẫu Ngay</span>
            </button>
            <button
              onClick={onOpenPaywall}
              className="px-5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-bold text-xs transition flex items-center gap-2"
            >
              <span>Xem Các Gói Nạp Lượt</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </section>

      {/* ─── SECTION 5: FREQUENTLY ASKED QUESTIONS (FAQ) ───────────────────── */}
      <section className="space-y-6 max-w-3xl mx-auto">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-[11px] font-semibold">
            <HelpCircle className="w-3 h-3 text-slate-400" />
            <span>Giải Đáp Thắc Mắc</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100">
            Câu Hỏi Thường Gặp
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2 text-left"
            >
              <h3 className="text-xs sm:text-sm font-bold text-slate-200 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 shrink-0" />
                {faq.q}
              </h3>
              <p className="text-xs text-slate-400 pl-3.5 leading-relaxed">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-800/80 pt-8 pb-4 text-center text-xs text-slate-500 space-y-3">
        <div className="flex flex-wrap items-center justify-center gap-4 text-slate-400">
          <span>Hỗ trợ TikTok</span>
          <span>•</span>
          <span>YouTube Shorts</span>
          <span>•</span>
          <span>Instagram Reels</span>
          <span>•</span>
          <button onClick={onOpenPaywall} className="hover:text-fuchsia-400 transition underline underline-offset-4">
            Bảng Giá Gói Cước
          </button>
        </div>
        <p className="text-[11px] text-slate-600">
          © 2026 ViralScript AI Engine. Nền tảng phân tích và tái cấu trúc video ngắn triệu view.
        </p>
      </footer>

    </div>
  );
}
