"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Video,
  History,
  LogOut,
  LogIn,
  Crown,
  BookOpen,
  Zap,
  Activity,
  MessageSquare,
  MessageCircle,
  Cookie,
  Sun,
  Moon,
  Monitor,
  ChevronDown,
  CheckCircle2,
  X
} from "lucide-react";

interface NavbarProps {
  user?: any;
  credits?: number;
  maxCredits?: number;
  tier?: string;
  onOpenAuth?: () => void;
  onOpenHistory?: () => void;
  onOpenPaywall?: () => void;
  onOpenTemplates?: () => void;
  onResetHome?: () => void;
  onSignOut?: () => void;
}

export default function Navbar({
  user,
  credits = 3,
  maxCredits = 3,
  tier = "free",
  onOpenAuth,
  onOpenHistory,
  onOpenPaywall,
  onOpenTemplates,
  onResetHome,
  onSignOut,
}: NavbarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeTheme, setActiveTheme] = useState<"light" | "dark" | "system">("system");
  const [toastMsg, setToastMsg] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const userInitial = (
    user?.user_metadata?.full_name ||
    user?.email ||
    "U"
  )[0].toUpperCase();

  const userDisplayName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Người dùng";

  const userEmail = user?.email || "user@viralscript.ai";

  // Tự động đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const handleManageCookies = () => {
    localStorage.removeItem("viral_guest_uses");
    setIsDropdownOpen(false);
    triggerToast("Đã dọn dẹp bộ nhớ đệm cache và cookies của phiên!");
  };

  const handleProvideFeedback = () => {
    setIsDropdownOpen(false);
    const feedback = window.prompt("Nhập ý kiến đóng góp của bạn về ViralScript AI:");
    if (feedback) {
      triggerToast("Cảm ơn bạn đã gửi đóng góp phản hồi quý giá!");
    }
  };

  const handleChatSupport = () => {
    setIsDropdownOpen(false);
    triggerToast("Đội ngũ hỗ trợ: Zalo / Hotline 0834.490.939 (Hỗ trợ 24/7)");
  };

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between relative">
        
        {/* LOGO - BẤM VÀO ĐỂ LOAD VỀ TRANG CHỦ BAN ĐẦU */}
        <button
          type="button"
          onClick={onResetHome}
          className="flex items-center gap-2.5 text-left group focus:outline-none hover:opacity-90 transition active:scale-95 cursor-pointer"
          title="Bấm để trở về trang chủ ban đầu"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-fuchsia-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-fuchsia-500/20 shrink-0 group-hover:scale-105 transition">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-fuchsia-400 via-indigo-300 to-white bg-clip-text text-transparent group-hover:brightness-110 transition">
                ViralScript AI
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-fuchsia-950/80 border border-fuchsia-800/50 text-fuchsia-300 font-semibold">
                v1.0 Pro
              </span>
            </div>
          </div>
        </button>

        {/* CENTER QUICK NAV */}
        <div className="hidden md:flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={onOpenTemplates}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition font-medium"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Thư Viện Mẫu Triệu View</span>
          </button>
          <button
            type="button"
            onClick={onOpenPaywall}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition font-medium"
          >
            <Crown className="w-3.5 h-3.5 text-fuchsia-400" />
            <span>Bảng Giá Gói</span>
          </button>
        </div>

        {/* RIGHT ACTIONS */}
        <div className="flex items-center gap-2.5 sm:gap-3 text-xs">
          {user ? (
            <>
              {/* LƯỢT PHÂN TÍCH HOẶC GÓI PRO */}
              {tier === "pro" ? (
                <button
                  type="button"
                  onClick={onOpenPaywall}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/50 text-amber-300 font-bold hover:scale-105 transition"
                  title="Tài khoản Pro không giới hạn"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>PRO VIP</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenPaywall}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/40 hover:bg-amber-900/50 border border-amber-900/60 hover:border-amber-700 text-amber-300 font-medium transition active:scale-95"
                  title="Bấm để nạp thêm lượt script"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{credits} lượt hôm nay</span>
                  <span className="text-[10px] text-amber-400/90 font-bold underline ml-0.5">+ Nạp</span>
                </button>
              )}

              {/* NÚT LỊCH SỬ */}
              <button
                type="button"
                onClick={onOpenHistory}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 font-semibold transition active:scale-95"
              >
                <History className="w-3.5 h-3.5 text-fuchsia-400" />
                <span className="hidden sm:inline">Lịch Sử Kịch Bản</span>
                <span className="sm:hidden">Lịch Sử</span>
              </button>

              {/* USER PROFILE VỚI MENU DROPDOWN CHỨC NĂNG */}
              <div className="relative pl-1 border-l border-slate-800" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 transition active:scale-95 cursor-pointer text-left"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-fuchsia-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {userInitial}
                  </div>
                  <span className="hidden sm:inline text-xs text-slate-200 max-w-[130px] truncate font-medium">
                    {userDisplayName}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {/* KHUNG POPUP MENU CHỨC NĂNG (CHUẨN THEO ẢNH USER GỬI) */}
                {isDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl z-50 p-2 text-slate-200 animate-in fade-in zoom-in-95 duration-150">
                    
                    {/* Header thông tin người dùng & Theme toggle */}
                    <div className="p-2.5 border-b border-neutral-800/80">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-slate-100 uppercase tracking-tight truncate max-w-[150px]">
                          {userDisplayName}
                        </span>

                        {/* Theme Icons Switcher */}
                        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-neutral-900 border border-neutral-800">
                          <button
                            type="button"
                            onClick={() => setActiveTheme("light")}
                            className={`p-1 rounded ${activeTheme === "light" ? "text-amber-400 bg-neutral-800" : "text-neutral-500 hover:text-neutral-300"}`}
                            title="Chế độ Sáng"
                          >
                            <Sun className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTheme("dark")}
                            className={`p-1 rounded ${activeTheme === "dark" ? "text-indigo-400 bg-neutral-800" : "text-neutral-500 hover:text-neutral-300"}`}
                            title="Chế độ Tối"
                          >
                            <Moon className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTheme("system")}
                            className={`p-1 rounded ${activeTheme === "system" ? "text-fuchsia-400 bg-neutral-800" : "text-neutral-500 hover:text-neutral-300"}`}
                            title="Hệ thống"
                          >
                            <Monitor className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="text-[11px] text-neutral-400 truncate">
                        {userEmail}
                      </div>
                    </div>

                    {/* Danh sách chức năng */}
                    <div className="py-1.5 space-y-0.5">
                      {/* Upgrade */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          onOpenPaywall?.();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-neutral-900 hover:text-amber-300 transition text-left group"
                      >
                        <Zap className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
                        <span className="font-medium">Nâng cấp gói (Upgrade)</span>
                      </button>

                      {/* Status */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          triggerToast(tier === "pro" ? "Tài khoản PRO VIP: Không giới hạn phân tích!" : `Hạn mức: Còn ${credits}/${maxCredits} lượt phân tích kịch bản hôm nay.`);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-neutral-900 hover:text-emerald-300 transition text-left group"
                      >
                        <Activity className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
                        <span className="font-medium">Trạng thái (Status)</span>
                        <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">
                          {tier === "pro" ? "PRO" : `${credits} lượt`}
                        </span>
                      </button>

                      {/* Chat with us */}
                      <button
                        type="button"
                        onClick={handleChatSupport}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-neutral-900 hover:text-indigo-300 transition text-left group"
                      >
                        <MessageSquare className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition" />
                        <span className="font-medium">Chat with us (Hỗ trợ)</span>
                      </button>

                      {/* Provide Feedback */}
                      <button
                        type="button"
                        onClick={handleProvideFeedback}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-neutral-900 hover:text-cyan-300 transition text-left group"
                      >
                        <MessageCircle className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition" />
                        <span className="font-medium">Provide Feedback (Góp ý)</span>
                      </button>

                      {/* Manage Cookies */}
                      <button
                        type="button"
                        onClick={handleManageCookies}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-neutral-900 hover:text-amber-400 transition text-left group"
                      >
                        <Cookie className="w-4 h-4 text-amber-500 group-hover:scale-110 transition" />
                        <span className="font-medium">Manage Cookies (Xóa cache)</span>
                      </button>
                    </div>

                    {/* Divider & Log out */}
                    <div className="pt-1.5 border-t border-neutral-800/80">
                      <button
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          onSignOut?.();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-950/40 hover:text-red-300 transition text-left font-medium group"
                      >
                        <LogOut className="w-4 h-4 group-hover:translate-x-0.5 transition" />
                        <span>Log out (Đăng xuất)</span>
                      </button>
                    </div>

                  </div>
                )}
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="px-4 py-2 bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-fuchsia-600/20 transition flex items-center gap-2 active:scale-95 text-xs sm:text-sm"
            >
              <LogIn className="w-4 h-4" />
              <span>Đăng Nhập / Đăng Ký</span>
            </button>
          )}
        </div>
      </div>

      {/* THÔNG BÁO TOAST NHANH */}
      {toastMsg && (
        <div className="absolute top-16 right-4 sm:right-8 bg-slate-900 border border-slate-700 text-slate-100 px-4 py-2 rounded-xl shadow-2xl text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2 z-50">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}
    </header>
  );
}
