"use client";

import React, { useState } from "react";
import {
  X,
  Sparkles,
  Flame,
  Copy,
  Check,
  Zap,
  ArrowRight,
  BookOpen,
  Filter,
  Info
} from "lucide-react";

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Gọi khi user chọn "Dùng Công Thức Này" — truyền hook text để app có thể hiển thị hướng dẫn */
  onUseTemplate: (hookText: string) => void;
}

export default function TemplatesModal({ isOpen, onClose, onUseTemplate }: TemplatesModalProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [usedId, setUsedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  if (!isOpen) return null;

  const categories = [
    { id: "all", label: "Tất Cả" },
    { id: "ugc", label: "🛍️ Bán Hàng & UGC" },
    { id: "tech", label: "📱 Công Nghệ" },
    { id: "mindset", label: "💡 Tư Duy & Tài Chính" },
    { id: "food", label: "🍔 Ẩm Thực & F&B" },
  ];

  // Đây là bộ công thức kịch bản — FRAMEWORK thuần túy, không gắn link video cụ thể
  // User dùng công thức này để phân tích video của họ và remix theo cấu trúc
  const templates = [
    {
      id: "ugc_1",
      category: "ugc",
      title: "Công Thức 'Đừng Mua Nếu Chưa Biết...'",
      hook: "Đừng vội mua cái nồi chiên không dầu này nếu bạn chưa biết 3 sự thật này...",
      body: "Chỉ ra 1 nhược điểm nhỏ để tạo uy tín → Liệt kê 2 tính năng vượt trội giải quyết triệt để vấn đề → Trải nghiệm thực tế khi nấu nướng trong 5 phút.",
      cta: "Bấm vào góc trái giỏ hàng bên dưới để săn mã giảm 40% chỉ có hôm nay.",
      views: "2.4M",
      retention: "88%",
      tip: "Dán link video bán hàng TikTok của bạn → AI bóc tách công thức → Remix sang sản phẩm khác."
    },
    {
      id: "tech_1",
      category: "tech",
      title: "Công Thức '99% Mọi Người Đều Đang Dùng Sai...'",
      hook: "99% người dùng iPhone đang sạc pin sai cách mà không hề hay biết!",
      body: "Lật tẩy thói quen sạc qua đêm gây chai pin → Giải thích cơ chế ngắt dòng bằng đồ họa màn hình → Bật mí cài đặt ẩn để kéo dài tuổi thọ pin gấp đôi.",
      cta: "Lưu video lại và gửi ngay cho bạn bè dùng iPhone để họ không làm hỏng máy nhé!",
      views: "4.1M",
      retention: "93%",
      tip: "Dán link Shorts mẹo công nghệ → AI học nhịp điệu → Viết kịch bản tương tự cho ứng dụng hoặc thiết bị khác."
    },
    {
      id: "mindset_1",
      category: "mindset",
      title: "Công Thức 'Bài Học Cay Đắng / Mất Mát Lớn'",
      hook: "Năm 23 tuổi, tôi kiếm được 1 tỷ đầu tiên và mất trắng sau đúng 3 tháng...",
      body: "Kể về cái bẫy tự mãn và đầu tư thiếu hiểu biết → Nút thắt khi tài khoản về số 0 và gia đình áp lực → 3 nguyên tắc sinh tồn bắt buộc phải nhớ.",
      cta: "Bạn có đang mắc phải sai lầm thứ 2 không? Để lại bình luận chúng ta cùng bàn nhé.",
      views: "1.9M",
      retention: "85%",
      tip: "Dán link video kể chuyện tài chính → AI học cấu trúc drama → Remix thành câu chuyện ngành của bạn."
    },
    {
      id: "food_1",
      category: "food",
      title: "Công Thức 'Quán Ẩn Nấp Ngõ Hẻm Cực Đỉnh'",
      hook: "Một quán ăn nằm sâu trong hẻm cụt nhưng khách phải xếp hàng từ 5 giờ sáng!",
      body: "Cận cảnh chảo nước dùng sôi sùng sục và khói bốc nghi ngút → Phỏng vấn nhanh bác chủ quán 30 năm gia truyền → Thử miếng đầu tiên kèm tiếng giòn rụm ASMR.",
      cta: "Địa chỉ chi tiết mình để ở phần mô tả, nhớ đi sớm không là hết chỗ nhé!",
      views: "3.5M",
      retention: "90%",
      tip: "Dán link food review TikTok → AI học cách dựng cảnh ASMR → Remix cho quán của bạn."
    },
    {
      id: "ugc_2",
      category: "ugc",
      title: "Công Thức 'So Sánh Đồ Rẻ vs Đồ Đắt'",
      hook: "Liệu cây son 50k trên TikTok Shop có ăn đứt cây son 800k của hãng lớn?",
      body: "Thử nghiệm bôi 2 bên môi → Test độ lì bằng ly nước và giấy ăn → Đưa ra nhận xét công tâm về chất son và độ bám màu.",
      cta: "Link mua cả 2 cây mình ghim sẵn ở giỏ hàng, bạn thích màu nào hơn?",
      views: "2.8M",
      retention: "87%",
      tip: "Dán link video so sánh sản phẩm → AI học kỹ thuật review → Remix sang danh mục sản phẩm của bạn."
    }
  ];

  const filtered = selectedCategory === "all"
    ? templates
    : templates.filter(t => t.category === selectedCategory);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleUseTemplate = (tpl: typeof templates[0]) => {
    // Copy hook vào clipboard để user có thể tham khảo
    navigator.clipboard.writeText(tpl.hook).catch(() => {});
    setUsedId(tpl.id);
    setTimeout(() => setUsedId(null), 2500);
    // Đóng modal và thông báo cho page biết user đang dùng công thức này
    onUseTemplate(tpl.hook);
    setTimeout(() => onClose(), 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-fuchsia-600 flex items-center justify-center shadow-md shadow-amber-500/20">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-1.5">
                <span>Thư Viện Kịch Bản Triệu View</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-950 border border-amber-800/80 text-amber-300">
                  Công Thức Mẫu
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Học cấu trúc Hook-Body-CTA — dán link video <span className="text-fuchsia-400 font-medium">của bạn</span> để AI phân tích theo công thức này.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info banner */}
        <div className="px-4 py-2.5 bg-indigo-950/40 border-b border-indigo-900/50 flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-indigo-300 leading-relaxed">
            Đây là <strong>công thức kịch bản mẫu</strong> — không phải video thật. Bấm <strong>"Dùng Công Thức Này"</strong> để copy hook mẫu, sau đó dán link video thực của bạn vào ô phân tích để AI bóc tách và viết lại theo công thức này.
          </p>
        </div>

        {/* Categories Bar */}
        <div className="p-3 border-b border-slate-800/80 bg-slate-900/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0 ml-1 mr-1" />
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === c.id
                  ? "bg-fuchsia-600 text-white shadow-sm shadow-fuchsia-600/30"
                  : "bg-slate-950/80 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Templates List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {filtered.map((tpl) => (
            <div
              key={tpl.id}
              className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400 shrink-0" />
                  {tpl.title}
                </h3>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-emerald-400 font-medium">🔥 {tpl.views} views</span>
                  <span className="text-indigo-400 font-medium">• {tpl.retention} retention</span>
                </div>
              </div>

              {/* Hook text */}
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs">
                <span className="text-fuchsia-400 font-bold block mb-1 text-[10px] uppercase">
                  Hook 3s Đầu:
                </span>
                <p className="text-slate-200 font-medium italic">"{tpl.hook}"</p>
              </div>

              {/* Formula & CTA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-slate-900/40 border border-slate-800/50">
                  <span className="text-slate-400 text-[10px] font-bold block mb-0.5">Nhịp Kể Thân Bài:</span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">{tpl.body}</p>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/40 border border-slate-800/50">
                  <span className="text-slate-400 text-[10px] font-bold block mb-0.5">Lời Chốt Kêu Gọi (CTA):</span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">{tpl.cta}</p>
                </div>
              </div>

              {/* Usage tip */}
              <div className="flex items-start gap-1.5 p-2 rounded-lg bg-amber-950/20 border border-amber-900/30">
                <Sparkles className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-300/80 leading-relaxed">{tpl.tip}</p>
              </div>

              {/* Actions */}
              <div className="pt-1 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleCopy(tpl.id, `Hook: ${tpl.hook}\n\nBody: ${tpl.body}\n\nCTA: ${tpl.cta}`)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-800 transition"
                >
                  {copiedId === tpl.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Chép Mẫu Này</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleUseTemplate(tpl)}
                  className="px-3 py-1.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-fuchsia-600/30 transition"
                >
                  {usedId === tpl.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>Đã chép hook!</span>
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>Dùng Công Thức Này</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-center text-xs text-slate-500">
          💡 Bấm "Dùng Công Thức Này" → Hook mẫu được chép → Đóng cửa sổ → Dán link video thực của bạn vào ô nhập để phân tích.
        </div>
      </div>
    </div>
  );
}
