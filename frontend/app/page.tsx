"use client";

import React, { useState, useRef, useEffect } from "react";
import Navbar from "@/components/Navbar";
import VideoPlayer from "@/components/VideoPlayer";
import ScriptBreakdown from "@/components/ScriptBreakdown";
import RemixModal from "@/components/RemixModal";
import AuthModal from "@/components/AuthModal";
import HistoryModal from "@/components/HistoryModal";
import PaywallModal from "@/components/PaywallModal";
import PippitShowcase from "@/components/PippitShowcase";
import TemplatesModal from "@/components/TemplatesModal";
import FeedbackModal from "@/components/FeedbackModal";
import ChatBot from "@/components/ChatBot";
import { apiFetch } from "@/lib/api";
import { supabase } from "@/lib/supabaseClient";
import { Sparkles, Link as LinkIcon, Loader2, AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";


export default function Home() {
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [savedToast, setSavedToast] = useState("");

  // Quản lý trạng thái người dùng & lượt dùng
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [userCredits, setUserCredits] = useState<number>(3);
  const [maxCredits, setMaxCredits] = useState<number>(3);
  const [userTier, setUserTier] = useState<string>("free");
  const [guestCount, setGuestCount] = useState<number>(0);

  // Quản lý các Modal
  const [isRemixOpen, setIsRemixOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);


  const playerRef = useRef<any>(null);

  // Đồng bộ số lượt của người dùng từ Supabase & tự động hồi phục 3 lượt mỗi ngày
  const refreshUserProfile = async (userId: string) => {
    try {
      const todayStr = new Date().toISOString().split("T")[0]; // Định dạng YYYY-MM-DD theo giờ hiện tại

      const { data, error } = await supabase
        .from("profiles")
        .select("daily_credits, subscription_tier, last_reset_date")
        .eq("id", userId)
        .single();

      if (data && !error) {
        let credits = data.daily_credits ?? 3;
        const tier = data.subscription_tier ?? "free";
        const lastReset = data.last_reset_date;

        // Nếu bước sang ngày mới và là tài khoản Free: tự động nạp lại 3 lượt miễn phí
        if (tier !== "pro" && (!lastReset || String(lastReset) < todayStr)) {
          credits = 3;
          try {
            await supabase
              .from("profiles")
              .update({ daily_credits: 3, last_reset_date: todayStr })
              .eq("id", userId);
          } catch (updateErr) {
            console.warn("Không thể đồng bộ ngày reset lên Supabase:", updateErr);
          }
        }

        setUserCredits(credits);
        setUserTier(tier);
        // Pro tier không giới hạn; free tier lấy max(credits hiện tại, 3) làm mốc ban đầu
        setMaxCredits(tier === "pro" ? 9999 : Math.max(credits, 3));
      }
    } catch (err) {
      console.error("Lỗi khi đọc profile:", err);
    }
  };


  useEffect(() => {
    // 1. Kiểm tra số lượt khách vãng lai đã dùng trong localStorage
    const storedGuest = localStorage.getItem("viral_guest_uses");
    if (storedGuest) {
      setGuestCount(parseInt(storedGuest, 10) || 0);
    }

    // 2. Lấy phiên làm việc hiện tại
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        refreshUserProfile(session.user.id);
      }
    });

    // 3. Lắng nghe thay đổi trạng thái Auth (Đăng nhập, Đăng xuất, Token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        refreshUserProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserCredits(3);
    setUserTier("free");
  };

  const sampleLinks = [
    { label: "Mẹo iPhone (Duy Thẩm)", url: "https://www.youtube.com/shorts/XosQMUreys8" },
    { label: "Mẹo công nghệ", url: "https://www.youtube.com/shorts/ApV9ldrQbnQ" },
  ];

  // Khởi tạo hoặc đọc guest_id duy nhất cho trình duyệt khách vãng lai
  const getOrCreateGuestId = () => {
    if (typeof window === "undefined") return "";
    let gid = localStorage.getItem("viral_guest_id");
    if (!gid) {
      gid = "guest_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now();
      localStorage.setItem("viral_guest_id", gid);
    }
    return gid;
  };

  const handleAnalyze = async (targetUrl?: string) => {
    const urlToUse = (targetUrl || videoUrl).trim();
    if (!urlToUse) {
      setErrorMsg("Vui lòng dán đường link video (TikTok, YouTube Shorts, Reels)");
      return;
    }

    // ─── KIỂM TRA HẠN MỨC GUEST TRƯỚC KHI GỌI SERVER ──────────────────────
    if (!user) {
      const currentGuest = parseInt(localStorage.getItem("viral_guest_uses") || "0", 10);
      if (currentGuest >= 2) {
        setErrorMsg(
          "Bạn đã dùng hết 2 lượt trải nghiệm miễn phí cho khách. Vui lòng đăng nhập hoặc đăng ký tài khoản để nhận tiếp 3 lượt phân tích kịch bản mỗi ngày!"
        );
        setIsAuthOpen(true);
        return;
      }
    }

    setLoading(true);
    setErrorMsg("");
    setSavedToast("");
    setAnalysisResult(null);

    setLoadingStep("1/3 Đang kéo luồng âm thanh ngầm & nén 16kHz WAV...");

    try {
      setTimeout(() => {
        setLoadingStep("2/3 Đang gửi sang Groq Whisper nhận diện lời thoại...");
      }, 3500);

      setTimeout(() => {
        setLoadingStep("3/3 Gemini đang giải phẫu cấu trúc Hook, Body, CTA...");
      }, 7000);

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const guestId = !user ? getOrCreateGuestId() : null;

      const res = await apiFetch("/analyze", {
        method: "POST",
        headers,
        body: JSON.stringify({
          video_url: urlToUse,
          user_id: user?.id || null,
          guest_id: guestId,
        }),
      });

      const data = await res.json();

      // Bắt các mã lỗi hạn mức từ backend
      if (res.status === 402) {
        // Hết lượt trong ngày -> mở PaywallModal
        setErrorMsg(data.detail || "Tài khoản của bạn đã hết lượt phân tích hôm nay.");
        setIsPaywallOpen(true);
        return;
      }

      if (res.status === 403) {
        // Hết lượt khách -> mở AuthModal
        setErrorMsg(data.detail || "Bạn đã dùng hết lượt trải nghiệm cho khách.");
        setIsAuthOpen(true);
        return;
      }

      if (!res.ok) {
        throw new Error(data.detail || "Không thể phân tích video này.");
      }

      setAnalysisResult(data);

      // Cập nhật số lượt dùng
      if (!user) {
        const nextGuest = (parseInt(localStorage.getItem("viral_guest_uses") || "0", 10) || 0) + 1;
        localStorage.setItem("viral_guest_uses", String(nextGuest));
        setGuestCount(nextGuest);
      } else {
        if (data.remaining_credits !== undefined && data.remaining_credits !== null) {
          const remaining = data.remaining_credits;
          setUserCredits(remaining);
          // Cập nhật maxCredits nếu người dùng đã nạp thêm lượt (remaining > maxCredits cũ)
          if (data.user_tier === "pro") {
            setMaxCredits(9999);
          } else if (remaining > maxCredits) {
            setMaxCredits(remaining);
          }
        }
        if (data.user_tier) {
          setUserTier(data.user_tier);
        }
      }

      if (data.saved_to_db) {
        setSavedToast("Đã lưu kịch bản vào cơ sở dữ liệu Supabase của bạn.");
        setTimeout(() => setSavedToast(""), 4500);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi kết nối tới máy chủ Backend (http://localhost:8000)");
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  };

  const handleSeek = (seconds: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(seconds, "seconds");
    }
  };

  const handleSelectFromHistory = (pastAnalysis: any) => {
    setAnalysisResult(pastAnalysis);
    setVideoUrl(pastAnalysis.video_metadata?.url || "");
    setErrorMsg("");
  };

  const handleResetHome = () => {
    setAnalysisResult(null);
    setVideoUrl("");
    setErrorMsg("");
    setSavedToast("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="min-h-screen flex flex-col bg-slate-950 text-slate-100 pb-16">
      <Navbar
        user={user}
        credits={userCredits}
        maxCredits={maxCredits}
        tier={userTier}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenPaywall={() => setIsPaywallOpen(true)}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onOpenFeedback={() => setIsFeedbackOpen(true)}
        onResetHome={handleResetHome}
        onSignOut={handleSignOut}
      />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 w-full flex-1 flex flex-col pt-6 sm:pt-10">
        {/* HERO SECTION */}
        <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-10 space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-fuchsia-950/60 border border-fuchsia-800/60 text-fuchsia-300 text-xs font-semibold shadow-inner">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Reverse-Engineering Short-form Videos</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            Phân Tích Script Triệu View & <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-fuchsia-400 via-indigo-300 to-amber-300 bg-clip-text text-transparent">
              Tái Cấu Trúc Cho Video Của Bạn
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Dán link TikTok, Reels hoặc YouTube Shorts. AI bóc tách công thức tâm lý 3 giây đầu,
            điểm giữ chân và tạo 3 kịch bản mới cho video của bạn trong 15 giây.
          </p>

          {/* INPUT BAR */}
          <div className="pt-2 max-w-2xl mx-auto w-full">
            <div className="flex flex-col sm:flex-row gap-2 p-1.5 bg-slate-900/90 border border-slate-800/90 rounded-2xl sm:rounded-3xl shadow-2xl focus-within:border-fuchsia-500/80 transition-all">
              <div className="flex items-center gap-2.5 px-3.5 flex-1 py-1 sm:py-0">
                <LinkIcon className="w-4 h-4 text-slate-500 shrink-0" />
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                  placeholder="Dán link video ngắn (TikTok, YouTube Shorts, Reels)..."
                  className="w-full bg-transparent text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none py-2"
                />
              </div>

              <button
                onClick={() => handleAnalyze()}
                disabled={loading || !videoUrl.trim() || (!!user && userCredits <= 0 && userTier !== "pro")}
                className="px-6 py-3 bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm rounded-xl sm:rounded-2xl shadow-lg shadow-fuchsia-600/30 transition flex items-center justify-center gap-2 shrink-0 active:scale-95"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{loading ? "Đang xử lý..." : userCredits <= 0 && !!user && userTier !== "pro" ? "Hết lượt — Nạp thêm" : "Phân Tích Script"}</span>
              </button>
            </div>

            {/* Quick Sample Links & Quota Info */}
            <div className="flex flex-wrap items-center justify-between gap-2 mt-3 text-xs px-1">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 text-[11px]">Thử nhanh:</span>
                {sampleLinks.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setVideoUrl(item.url);
                      handleAnalyze(item.url);
                    }}
                    className="px-2 py-0.5 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-fuchsia-700/80 text-slate-300 hover:text-fuchsia-300 transition text-[11px]"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Thông báo hạn mức trực quan */}
              {!user ? (
                <div className="text-[11px] text-amber-400/90 font-medium">
                  Khách: còn{" "}
                  <span className="font-bold underline">{Math.max(0, 2 - guestCount)}</span>/2
                  lượt thử
                </div>
              ) : userTier === "pro" ? (
                <div className="text-[11px] text-amber-300 font-bold">⭐ Tài khoản Pro VIP</div>
              ) : (
                <div className={`text-[11px] font-medium ${userCredits <= 0 ? "text-red-400" : "text-slate-400"}`}>
                  Còn <span className={`font-bold ${userCredits <= 0 ? "text-red-400" : "text-amber-300"}`}>{Math.max(0, userCredits)}</span>/{maxCredits} lượt hôm nay
                  {userCredits <= 0 && (
                    <button onClick={() => setIsPaywallOpen(true)} className="ml-1.5 text-fuchsia-400 underline hover:text-fuchsia-300 transition">Nạp thêm</button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* LOADING STATE NOTIFICATION */}
          {loading && (
            <div className="mt-4 p-4 rounded-2xl bg-fuchsia-950/20 border border-fuchsia-900/40 max-w-lg mx-auto flex items-center justify-center gap-3 text-xs text-fuchsia-300 animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin shrink-0 text-fuchsia-400" />
              <span className="font-medium">{loadingStep}</span>
            </div>
          )}

          {/* ERROR ALERT */}
          {errorMsg && (
            <div className="mt-4 p-3 rounded-2xl bg-red-950/40 border border-red-800/60 max-w-lg mx-auto flex items-center gap-2 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* SAVED TO DB TOAST */}
          {savedToast && (
            <div className="mt-4 p-3 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 max-w-lg mx-auto flex items-center justify-center gap-2 text-xs text-emerald-300 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{savedToast}</span>
            </div>
          )}
        </div>

        {/* RESULTS SECTION */}
        {analysisResult && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch flex-1 animate-in fade-in duration-500 pb-8">
            {/* CỘT TRÁI: VIDEO PLAYER */}
            <div className="lg:col-span-5 h-full flex flex-col">
              <VideoPlayer
                ref={playerRef}
                url={analysisResult.video_metadata?.url}
                title={analysisResult.video_metadata?.title}
                duration={analysisResult.video_metadata?.duration}
                platform={analysisResult.video_metadata?.platform}
              />
            </div>

            {/* CỘT PHẢI: GIẢI PHẪU KỊCH BẢN */}
            <div className="lg:col-span-7 h-full flex flex-col">
              <ScriptBreakdown
                analysis={analysisResult.script_analysis}
                transcript={analysisResult.transcript}
                onSeek={handleSeek}
                onOpenRemix={() => setIsRemixOpen(true)}
              />
            </div>
          </div>
        )}

        {/* GIỚI THIỆU TÍNH NĂNG VÀ KHÁM PHÁ THEO NGÀNH HÀNG (PHONG CÁCH PIPPIT.AI) */}
        {!analysisResult && (
          <PippitShowcase
            onSelectSample={(url) => {
              setVideoUrl(url);
              handleAnalyze(url);
            }}
            onOpenPaywall={() => setIsPaywallOpen(true)}
            onOpenTemplates={() => setIsTemplatesOpen(true)}
          />
        )}
      </div>

      {/* MODAL TẠO SCRIPT CHO VIDEO CỦA BẠN */}
      {analysisResult && (
        <RemixModal
          isOpen={isRemixOpen}
          onClose={() => setIsRemixOpen(false)}
          analysisData={analysisResult.script_analysis}
          analysisId={analysisResult.analysis_id}
          userId={user?.id}
          accessToken={session?.access_token}
        />
      )}

      {/* MODAL THƯ VIỆN MẪU KỊCH BẢN TRIỆU VIEW */}
      <TemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onUseTemplate={(hookText) => {
          // Đóng modal, cuộn về input bar, hiển thị toast hướng dẫn
          setIsTemplatesOpen(false);
          setSavedToast("✅ Đã chép hook mẫu! Giờ dán link video của bạn vào ô nhập bên trên để AI phân tích theo công thức này.");
          setTimeout(() => setSavedToast(""), 5000);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />

      {/* MODAL ĐĂNG NHẬP / ĐĂNG KÝ */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(u) => {
          setUser(u);
          refreshUserProfile(u.id);
        }}
      />

      {/* MODAL LỊCH SỬ KỊCH BẢN */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectAnalysis={handleSelectFromHistory}
        userId={user?.id}
      />

      {/* MODAL BẢNG GIÁ & NẠP LƯỢT VNPAY (NGUYỄN LÊ BẢO PHONG) */}
      <PaywallModal
        isOpen={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
        userId={user?.id}
        accessToken={session?.access_token}
        onPaymentSuccess={(credits, tier) => {
          setUserCredits(credits);
          setUserTier(tier);
          setMaxCredits(tier === "pro" ? 9999 : credits);
        }}
      />

      {/* MODAL ĐÁNH GIÁ PHẢN HỒI */}
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        userId={user?.id}
        userEmail={user?.email}
        accessToken={session?.access_token}
      />

      {/* CHATBOT NỔI GÓC PHẢI — hỗ trợ người dùng 24/7 */}
      <ChatBot userId={user?.id} />
    </main>
  );
}
