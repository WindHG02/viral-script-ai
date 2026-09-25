"use client";

import React, { useState } from "react";
import { X, Star, Send, CheckCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  userEmail?: string;
  accessToken?: string;
}

export default function FeedbackModal({
  isOpen,
  onClose,
  userId,
  userEmail,
  accessToken,
}: FeedbackModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState(userEmail || "");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleClose = () => {
    // Reset state khi đóng
    setRating(0);
    setHoverRating(0);
    setMessage("");
    setEmail(userEmail || "");
    setError("");
    setSubmitted(false);
    onClose();
  };

  const handleSubmit = async () => {
    setError("");

    if (rating === 0) {
      setError("Vui lòng chọn số sao đánh giá.");
      return;
    }
    const trimmed = message.trim();
    if (trimmed.length < 5) {
      setError("Nội dung đánh giá quá ngắn. Nhập tối thiểu 5 ký tự.");
      return;
    }

    setLoading(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

      const res = await apiFetch("/feedback", {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: trimmed,
          rating,
          email: !userId ? email : undefined, // Chỉ gửi email nếu là khách
          user_id: userId || undefined,
          page_context: "navbar_feedback",
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.detail || "Gửi phản hồi thất bại. Vui lòng thử lại!");
      }

      setSubmitted(true);

    } catch (e: any) {
      setError(e?.message || "Gửi thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const starLabels = ["", "Rất tệ", "Tệ", "Bình thường", "Tốt", "Xuất sắc"];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-100">Gửi Đánh Giá</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Ý kiến của bạn giúp ViralScript AI phát triển tốt hơn mỗi ngày.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          /* Trạng thái thành công */
          <div className="p-8 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-100">Cảm ơn bạn!</p>
              <p className="text-sm text-slate-400 mt-1">
                Đánh giá của bạn đã được ghi nhận. Chúng tôi sẽ đọc từng phản hồi để cải thiện sản phẩm.
              </p>
            </div>
            <button
              onClick={handleClose}
              className="mt-2 px-6 py-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-sm font-bold transition"
            >
              Đóng
            </button>
          </div>
        ) : (
          /* Form đánh giá */
          <div className="p-5 space-y-4">
            {/* Đánh giá sao */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                Mức độ hài lòng của bạn: *
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        star <= (hoverRating || rating)
                          ? "text-amber-400 fill-amber-400"
                          : "text-slate-700"
                      }`}
                    />
                  </button>
                ))}
                {(hoverRating || rating) > 0 && (
                  <span className="text-xs text-amber-300 font-medium ml-1">
                    {starLabels[hoverRating || rating]}
                  </span>
                )}
              </div>
            </div>

            {/* Nội dung */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Nội dung đánh giá: *
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Chia sẻ trải nghiệm của bạn, tính năng muốn thêm, hoặc vấn đề gặp phải..."
                rows={4}
                maxLength={2000}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-fuchsia-700 transition resize-none"
              />
              <p className="text-[10px] text-slate-600 text-right mt-0.5">{message.length}/2000</p>
            </div>

            {/* Email — chỉ hiện khi khách chưa đăng nhập */}
            {!userId && (
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Email của bạn (để chúng tôi phản hồi lại nếu cần):
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@gmail.com"
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-fuchsia-700 transition"
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="text-xs text-red-400 bg-red-950/30 border border-red-900/40 px-3 py-2 rounded-xl">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? "Đang gửi..." : "Gửi Đánh Giá"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
