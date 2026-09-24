"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  X,
  Mail,
  Lock,
  User,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Info
} from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: (user: any) => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showResendBtn, setShowResendBtn] = useState(false);

  if (!isOpen) return null;

  const handleResetForm = () => {
    setErrorMsg("");
    setSuccessMsg("");
    setShowResendBtn(false);
  };

  const validateEmail = (mail: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setShowResendBtn(false);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setErrorMsg("Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }

    if (!validateEmail(cleanEmail)) {
      setErrorMsg("Định dạng email không hợp lệ (Ví dụ: tenban@gmail.com).");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Mật khẩu phải chứa ít nhất 6 ký tự.");
      return;
    }

    if (tab === "signup" && password !== confirmPassword) {
      setErrorMsg("Mật khẩu xác nhận không khớp với mật khẩu đã nhập.");
      return;
    }

    setLoading(true);

    try {
      if (tab === "signin") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            throw new Error("Email hoặc mật khẩu không chính xác.");
          } else if (error.message.includes("Email not confirmed")) {
            setShowResendBtn(true);
            throw new Error(
              "Tài khoản chưa được xác thực qua email. Hãy kiểm tra hộp thư (cả hòm thư Rác/Spam) hoặc bấm nút gửi lại liên kết bên dưới."
            );
          }
          throw error;
        }

        if (data?.user) {
          onAuthSuccess?.(data.user);
          onClose();
        }
      } else {
        // Tab Đăng ký (Sign Up)
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: fullName.trim() || cleanEmail.split("@")[0],
            },
          },
        });

        if (error) {
          if (error.message.includes("User already registered")) {
            throw new Error("Email này đã được đăng ký. Bạn hãy chuyển sang tab Đăng Nhập.");
          }
          throw error;
        }

        if (data?.session) {
          // Trường hợp đã tắt 'Confirm email' trong Supabase -> Đăng nhập tức thì
          onAuthSuccess?.(data.user);
          onClose();
        } else if (data?.user) {
          // Trường hợp Supabase đang bật 'Confirm email'
          setShowResendBtn(true);
          setSuccessMsg(
            "Đăng ký tài khoản thành công! Supabase đã gửi một email xác thực đến " +
              cleanEmail +
              ". Bạn vui lòng mở hòm thư và bấm vào liên kết kích hoạt trước khi đăng nhập."
          );
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Đã xảy ra lỗi trong quá trình xác thực.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMsg("Vui lòng điền email của bạn để gửi lại mã xác thực.");
      return;
    }

    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: cleanEmail,
      });
      if (error) throw error;
      setSuccessMsg("Đã gửi lại email xác thực thành công. Bạn hãy kiểm tra lại hộp thư.");
    } catch (err: any) {
      setErrorMsg(err.message || "Không thể gửi lại email xác thực.");
    } finally {
      setResending(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    setShowResendBtn(false);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });

      if (error) {
        if (
          error.message.includes("Unsupported provider") ||
          error.message.includes("provider is not enabled") ||
          error.message.includes("validation_failed")
        ) {
          throw new Error(
            "Chức năng đăng nhập Google chưa được kích hoạt trong trang quản trị Supabase (Authentication -> Providers -> Google). Bạn hãy dùng biểu mẫu Đăng ký bằng Email & Mật khẩu bên trên để sử dụng được ngay!"
          );
        }
        throw error;
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Không thể khởi động đăng nhập Google.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-5 sm:p-7 shadow-2xl relative text-slate-100 max-h-[92vh] overflow-y-auto scrollbar-thin">
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tiêu đề & Logo */}
        <div className="text-center mb-5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-fuchsia-600 to-indigo-600 flex items-center justify-center mx-auto mb-2.5 shadow-lg shadow-fuchsia-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            {tab === "signin" ? "Chào Mừng Trở Lại" : "Tạo Tài Khoản Mới"}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {tab === "signin"
              ? "Đăng nhập để xem lịch sử kịch bản và đồng bộ dữ liệu"
              : "Đăng ký nhận ngay 3 lượt phân tích kịch bản mỗi ngày"}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-slate-950/80 border border-slate-800/80 rounded-xl mb-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setTab("signin");
              handleResetForm();
            }}
            className={`py-2 rounded-lg transition ${
              tab === "signin"
                ? "bg-fuchsia-600 text-white shadow-md shadow-fuchsia-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Đăng Nhập
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("signup");
              handleResetForm();
            }}
            className={`py-2 rounded-lg transition ${
              tab === "signup"
                ? "bg-fuchsia-600 text-white shadow-md shadow-fuchsia-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Đăng Ký
          </button>
        </div>

        {/* Thông báo lỗi / Thành công */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-800/60 flex items-start gap-2.5 text-xs text-red-300 leading-relaxed">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            <div className="space-y-1.5 flex-1">
              <span>{errorMsg}</span>
              {showResendBtn && (
                <div>
                  <button
                    type="button"
                    onClick={handleResendEmail}
                    disabled={resending}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-900/60 hover:bg-red-800 text-white font-semibold text-[11px] transition"
                  >
                    {resending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                    <span>Gửi lại email xác thực</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-start gap-2.5 text-xs text-emerald-300 leading-relaxed">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Biểu mẫu đăng nhập / đăng ký */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {tab === "signup" && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                Họ và Tên
              </label>
              <div className="flex items-center gap-2.5 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl focus-within:border-fuchsia-500 transition">
                <User className="w-4 h-4 text-slate-500 shrink-0" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full bg-transparent text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1 uppercase tracking-wider">
              Email
            </label>
            <div className="flex items-center gap-2.5 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl focus-within:border-fuchsia-500 transition">
              <Mail className="w-4 h-4 text-slate-500 shrink-0" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full bg-transparent text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1 uppercase tracking-wider">
              Mật Khẩu
            </label>
            <div className="flex items-center gap-2.5 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl focus-within:border-fuchsia-500 transition">
              <Lock className="w-4 h-4 text-slate-500 shrink-0" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ít nhất 6 ký tự"
                required
                className="w-full bg-transparent text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none"
              />
            </div>
          </div>

          {tab === "signup" && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                Nhập Lại Mật Khẩu
              </label>
              <div className="flex items-center gap-2.5 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl focus-within:border-fuchsia-500 transition">
                <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Xác nhận lại mật khẩu"
                  required
                  className="w-full bg-transparent text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-fuchsia-600/30 transition flex items-center justify-center gap-2 active:scale-98"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            <span>{loading ? "Đang xử lý..." : tab === "signin" ? "Đăng Nhập" : "Tạo Tài Khoản"}</span>
          </button>
        </form>

        {/* Phân cách Hoặc */}
        <div className="relative my-4 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800"></div>
          </div>
          <span className="relative px-3 bg-slate-900 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
            Hoặc tiếp tục với
          </span>
        </div>

        {/* Nút đăng nhập Google */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full py-2.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-2.5 transition active:scale-98"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>Tài khoản Google</span>
        </button>

        {/* Hướng dẫn cấu hình Supabase */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1 leading-relaxed">
          <div className="flex items-start gap-1.5 text-slate-400">
            <Info className="w-3.5 h-3.5 text-fuchsia-400 shrink-0 mt-0.5" />
            <span>
              Mẹo: Bạn có thể tắt <b>Confirm email</b> trong trang Supabase (<i>Authentication → Providers → Email</i>) để đăng ký xong là đăng nhập được ngay mà không cần mở hòm thư.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
