"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  Zap,
  Clock,
  ArrowRight,
  Loader2,
  AlertCircle,
  Crown
} from "lucide-react";
import { apiFetch } from "@/lib/api";

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  accessToken?: string;
  onPaymentSuccess?: (credits: number, tier: string) => void;
}

export default function PaywallModal({
  isOpen,
  onClose,
  userId,
  accessToken,
  onPaymentSuccess,
}: PaywallModalProps) {
  const [step, setStep] = useState<"select_plan" | "checkout" | "success">("select_plan");
  const [selectedPlan, setSelectedPlan] = useState<"single_5k" | "pack_20k" | "pro_monthly_99k">("pack_20k");
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(900); // 15 phút

  useEffect(() => {
    if (!isOpen) {
      setStep("select_plan");
      setErrorMsg("");
      setOrderDetails(null);
      setTimeLeft(900);
    }
  }, [isOpen]);

  // Bộ đếm ngược thời gian thanh toán 15 phút
  useEffect(() => {
    if (step !== "checkout") return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [step]);

  if (!isOpen) return null;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCreateOrder = async (plan: "single_5k" | "pack_20k" | "pro_monthly_99k") => {
    if (!userId) {
      setErrorMsg("Vui lòng đăng nhập tài khoản trước khi nạp lượt.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

      const res = await apiFetch("/payment/create-order", {
        method: "POST",
        headers,
        body: JSON.stringify({
          user_id: userId,
          plan_type: plan,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Không thể tạo đơn hàng.");

      setOrderDetails(data);
      setStep("checkout");
      setTimeLeft(900);
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi tạo đơn hàng.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!orderDetails?.order_code || !userId) return;

    setConfirming(true);
    setErrorMsg("");

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

      const res = await apiFetch("/payment/confirm-order", {
        method: "POST",
        headers,
        body: JSON.stringify({
          user_id: userId,
          order_code: orderDetails.order_code,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Chưa thể kích hoạt đơn hàng.");

      onPaymentSuccess?.(data.credits, data.tier);
      setStep("success");
    } catch (err: any) {
      setErrorMsg(err.message || "Xác nhận thất bại. Vui lòng thử lại hoặc đối chiếu nội dung chuyển khoản.");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-5 sm:p-7 shadow-2xl relative text-slate-100 max-h-[92vh] overflow-y-auto scrollbar-thin">
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ─── BƯỚC 1: CHỌN GÓI CƯỚC ─────────────────────────────────────────── */}
        {step === "select_plan" && (
          <div className="space-y-5">
            <div className="text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/70 border border-amber-800/60 text-amber-300 text-xs font-semibold mb-2">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>Nâng Cấp Lượt Phân Tích Kịch Bản</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                Chọn Gói Sử Dụng Cho Bạn
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Mở rộng giới hạn bóc tách công thức triệu view và tái tạo kịch bản không ngắt quãng.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 flex items-center gap-2 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* DANH SÁCH GÓI */}
            <div className="space-y-3">
              {/* Gói lẻ 5k */}
              <div
                onClick={() => setSelectedPlan("single_5k")}
                className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                  selectedPlan === "single_5k"
                    ? "bg-fuchsia-950/30 border-fuchsia-500 shadow-lg shadow-fuchsia-500/10"
                    : "bg-slate-950/70 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-200">Gói Lẻ 1 Video</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Thêm 1 lượt script video ngay lập tức
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-extrabold text-white">5.000đ</span>
                  <span className="text-[11px] block text-slate-500">/ 1 lượt</span>
                </div>
              </div>

              {/* Combo 5 video (20k) */}
              <div
                onClick={() => setSelectedPlan("pack_20k")}
                className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between relative ${
                  selectedPlan === "pack_20k"
                    ? "bg-indigo-950/40 border-indigo-500 shadow-lg shadow-indigo-500/20"
                    : "bg-slate-950/70 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-[10px] font-black uppercase">
                  Tiết kiệm 20%
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-200">Combo 5 Video</span>
                    <span className="px-2 py-0.5 rounded-md bg-indigo-950/80 border border-indigo-800/60 text-indigo-300 text-[10px] font-semibold">
                      Phổ biến nhất
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Cộng 5 lượt phân tích (chỉ 4.000đ/kịch bản)
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-extrabold text-indigo-300">20.000đ</span>
                  <span className="text-[11px] block text-slate-500">/ 5 lượt</span>
                </div>
              </div>

              {/* Gói tháng 99k */}
              <div
                onClick={() => setSelectedPlan("pro_monthly_99k")}
                className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between relative ${
                  selectedPlan === "pro_monthly_99k"
                    ? "bg-gradient-to-br from-fuchsia-950/40 via-purple-950/30 to-indigo-950/40 border-fuchsia-500 shadow-xl shadow-fuchsia-500/20"
                    : "bg-slate-950/70 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white text-[10px] font-black uppercase tracking-wider">
                  Pro Creator
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-fuchsia-300">Gói Tháng Không Giới Hạn</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Thoải mái script video mỗi ngày, lưu lịch sử vĩnh viễn
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-extrabold text-amber-300">99.000đ</span>
                  <span className="text-[11px] block text-slate-500">/ 30 ngày</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleCreateOrder(selectedPlan)}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-fuchsia-600/30 transition flex items-center justify-center gap-2 active:scale-98"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>{loading ? "Đang tạo mã thanh toán..." : "Tiếp Tục Thanh Toán"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Ràng buộc an toàn */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Thanh toán chuyển thẳng vào ví VNPAY chính chủ dự án. Bảo mật tuyệt đối, không thu thập thẻ tín dụng.
              </span>
            </div>
          </div>
        )}

        {/* ─── BƯỚC 2: THANH TOÁN QUA MÃ VNPAY QR ─────────────────────────────── */}
        {step === "checkout" && orderDetails && (
          <div className="space-y-4">
            <div className="text-center">
              <span className="text-xs px-2.5 py-1 rounded-full bg-fuchsia-950/80 border border-fuchsia-800/60 text-fuchsia-300 font-semibold">
                Đơn hàng: {orderDetails.order_code}
              </span>
              <h3 className="text-lg sm:text-xl font-bold mt-2">Quét Mã QR Để Hoàn Tất</h3>
              <div className="flex items-center justify-center gap-1.5 text-xs text-amber-400 mt-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Mã giao dịch có hiệu lực trong {formatTimer(timeLeft)}</span>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 flex items-center gap-2 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* KHUNG HIỂN THỊ MÃ QR VNPAY */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col items-center">
              <div className="bg-white p-2.5 rounded-2xl shadow-xl border border-slate-200 w-48 sm:w-56 mb-3">
                <img
                  src={orderDetails.qr_image || "/vnpay_qr.png"}
                  alt="Mã QR VNPAY Nguyễn Lê Bảo Phong"
                  className="w-full h-auto rounded-xl object-contain"
                />
              </div>
              <span className="text-[11px] text-slate-400">
                Mở app Ngân hàng hoặc Ví VNPAY để quét mã
              </span>
            </div>

            {/* CHI TIẾT CHUYỂN KHOẢN KÈM NÚT COPY */}
            <div className="bg-slate-950 border border-slate-800/90 rounded-2xl p-3.5 space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400">Đơn vị nhận:</span>
                <span className="font-semibold text-slate-200">Ví điện tử VNPAY</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400">Chủ ví:</span>
                <span className="font-bold text-slate-100 uppercase">{orderDetails.account_name}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400">Số ví / Số điện thoại:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-slate-100">{orderDetails.account_no}</span>
                  <button
                    onClick={() => handleCopy(orderDetails.account_no, "account_no")}
                    className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    title="Sao chép số ví"
                  >
                    {copiedField === "account_no" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400">Số tiền cần chuyển:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-extrabold text-amber-300 text-sm">
                    {Number(orderDetails.amount).toLocaleString("vi-VN")} đ
                  </span>
                  <button
                    onClick={() => handleCopy(String(orderDetails.amount), "amount")}
                    className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    title="Sao chép số tiền"
                  >
                    {copiedField === "amount" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Nội dung chuyển tiền:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-fuchsia-300 bg-fuchsia-950/80 px-2 py-0.5 rounded border border-fuchsia-800/60">
                    {orderDetails.transfer_content}
                  </span>
                  <button
                    onClick={() => handleCopy(orderDetails.transfer_content, "content")}
                    className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    title="Sao chép nội dung"
                  >
                    {copiedField === "content" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* NÚT XÁC NHẬN */}
            <div className="space-y-2 pt-1">
              <button
                onClick={handleConfirmPayment}
                disabled={confirming}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 active:scale-98"
              >
                {confirming ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{confirming ? "Đang đối soát giao dịch..." : "Tôi Đã Chuyển Tiền Thành Công"}</span>
              </button>

              <button
                onClick={() => setStep("select_plan")}
                className="w-full py-2 rounded-xl text-slate-400 hover:text-slate-200 text-xs transition"
              >
                ← Quay lại chọn gói khác
              </button>
            </div>
          </div>
        )}

        {/* ─── BƯỚC 3: KÍCH HOẠT THÀNH CÔNG ───────────────────────────────────── */}
        {step === "success" && (
          <div className="py-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white">
              Nạp Lượt Thành Công!
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
              Tài khoản của bạn đã được cập nhật số lượt mới. Bạn có thể tiếp tục giải phẫu video ngay bây giờ.
            </p>

            <button
              onClick={onClose}
              className="px-8 py-3 bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg transition"
            >
              Bắt Đầu Phân Tích Video
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
