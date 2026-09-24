"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  X,
  History,
  Trash2,
  ExternalLink,
  PlayCircle,
  Loader2,
  Search,
  Sparkles,
  Calendar,
  AlertCircle
} from "lucide-react";

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAnalysis: (analysis: any) => void;
  userId?: string;
}

export default function HistoryModal({
  isOpen,
  onClose,
  onSelectAnalysis,
  userId,
}: HistoryModalProps) {
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen && userId) {
      fetchHistory();
    }
  }, [isOpen, userId]);

  const fetchHistory = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const { data, error } = await supabase
        .from("analyses")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAnalyses(data || []);
    } catch (err: any) {
      console.error("Lỗi khi tải lịch sử:", err);
      setErrorMsg(err.message || "Không thể tải danh sách kịch bản.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Bạn có chắc chắn muốn xóa bản phân tích này khỏi lịch sử?")) return;

    setDeletingId(id);
    try {
      const { error } = await supabase.from("analyses").delete().eq("id", id);
      if (error) throw error;
      setAnalyses((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      alert("Lỗi khi xóa: " + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleChoose = (row: any) => {
    const formattedData = {
      status: "success",
      analysis_id: row.id,
      video_metadata: {
        title: row.hook_analysis?.topic || row.video_url,
        duration: 60,
        platform: row.video_platform || "short_video",
        url: row.video_url,
      },
      transcript: row.transcript_data || { full_text: "", segments: [] },
      script_analysis: {
        hook: row.hook_analysis || {},
        body: row.body_analysis || {},
        cta: row.cta_analysis || {},
        summary: row.hook_analysis?.summary || "",
      },
    };

    onSelectAnalysis(formattedData);
    onClose();
  };

  if (!isOpen) return null;

  const filteredAnalyses = analyses.filter((item) => {
    const textToMatch = `${item.video_url} ${item.video_platform} ${
      item.hook_analysis?.quote || ""
    } ${item.hook_analysis?.pattern || ""}`.toLowerCase();
    return textToMatch.includes(searchQuery.toLowerCase());
  });

  const formatTimestamp = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return `${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} - ${d.toLocaleDateString("vi-VN")}`;
    } catch {
      return dateStr;
    }
  };

  const getPlatformBadge = (platform?: string) => {
    const p = (platform || "").toLowerCase();
    if (p.includes("youtube")) {
      return (
        <span className="px-2 py-0.5 rounded-md bg-red-950/70 border border-red-800/60 text-red-400 text-[10px] font-semibold">
          YouTube Shorts
        </span>
      );
    }
    if (p.includes("tiktok")) {
      return (
        <span className="px-2 py-0.5 rounded-md bg-cyan-950/70 border border-cyan-800/60 text-cyan-400 text-[10px] font-semibold">
          TikTok
        </span>
      );
    }
    if (p.includes("reels") || p.includes("instagram")) {
      return (
        <span className="px-2 py-0.5 rounded-md bg-fuchsia-950/70 border border-fuchsia-800/60 text-fuchsia-400 text-[10px] font-semibold">
          Reels
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-semibold">
        Shorts
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl relative text-slate-100 overflow-hidden">
        {/* HEADER */}
        <div className="p-5 sm:p-6 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-fuchsia-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-fuchsia-500/20">
              <History className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight">Lịch Sử Phân Tích Kịch Bản</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Các video đã được giải phẫu và lưu trong cơ sở dữ liệu của bạn
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SEARCH BAR */}
        <div className="px-5 sm:px-6 pt-4 pb-2">
          <div className="flex items-center gap-2.5 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl focus-within:border-fuchsia-500/80 transition">
            <Search className="w-4 h-4 text-slate-500 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo link, nền tảng hoặc từ khóa kịch bản..."
              className="w-full bg-transparent text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none"
            />
          </div>
        </div>

        {/* ERROR NOTIFICATION */}
        {errorMsg && (
          <div className="mx-5 sm:mx-6 mt-2 p-3 rounded-xl bg-red-950/40 border border-red-800/60 flex items-center gap-2 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* CONTENT LIST */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3.5 scrollbar-thin">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400 text-xs">
              <Loader2 className="w-6 h-6 animate-spin text-fuchsia-500" />
              <span>Đang tải danh sách kịch bản...</span>
            </div>
          ) : filteredAnalyses.length === 0 ? (
            <div className="py-16 text-center text-slate-500 space-y-2">
              <Sparkles className="w-8 h-8 mx-auto text-slate-600 mb-1" />
              <p className="text-sm font-semibold text-slate-400">
                {analyses.length === 0
                  ? "Bạn chưa có kịch bản nào được lưu"
                  : "Không tìm thấy kết quả phù hợp với từ khóa"}
              </p>
              <p className="text-xs text-slate-500">
                {analyses.length === 0
                  ? "Hãy dán đường link video vào thanh công cụ để bóc tách kịch bản đầu tiên."
                  : "Thử tìm kiếm với một từ khóa khác."}
              </p>
            </div>
          ) : (
            filteredAnalyses.map((item) => (
              <div
                key={item.id}
                onClick={() => handleChoose(item)}
                className="group p-4 bg-slate-950/70 hover:bg-slate-800/60 border border-slate-800/80 hover:border-fuchsia-600/60 rounded-2xl transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md"
              >
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2">
                    {getPlatformBadge(item.video_platform)}
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>{formatTimestamp(item.created_at)}</span>
                    </div>
                  </div>

                  <div className="text-xs sm:text-sm font-semibold text-slate-200 truncate group-hover:text-fuchsia-300 transition">
                    {item.hook_analysis?.quote
                      ? `"${item.hook_analysis.quote}"`
                      : item.video_url}
                  </div>

                  {item.hook_analysis?.pattern && (
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <span className="text-amber-400 font-medium">Công thức:</span>
                      <span>{item.hook_analysis.pattern}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleChoose(item);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-fuchsia-950/70 hover:bg-fuchsia-900 border border-fuchsia-800/60 text-fuchsia-300 hover:text-white text-xs font-semibold transition flex items-center gap-1.5"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>Mở Kịch Bản</span>
                  </button>

                  <button
                    type="button"
                    disabled={deletingId === item.id}
                    onClick={(e) => handleDelete(item.id, e)}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-red-950/60 border border-slate-800 hover:border-red-800/60 text-slate-400 hover:text-red-400 transition disabled:opacity-50"
                    title="Xóa kịch bản"
                  >
                    {deletingId === item.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
