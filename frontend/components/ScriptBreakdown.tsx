"use client";

import React, { useState } from "react";
import { Sparkles, Flame, Eye, Target, Copy, Check, Play, FileText, BarChart3 } from "lucide-react";

interface ScriptBreakdownProps {
  analysis: any;
  transcript: {
    full_text: string;
    segments: Array<{ id: number; start: number; end: number; text: string }>;
  };
  onSeek: (seconds: number) => void;
  onOpenRemix: () => void;
}

export default function ScriptBreakdown({
  analysis,
  transcript,
  onSeek,
  onOpenRemix,
}: ScriptBreakdownProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"analysis" | "transcript">("analysis");

  const hook = analysis?.hook || {};
  const body = analysis?.body || {};
  const cta = analysis?.cta || {};

  const handleCopyTranscript = () => {
    navigator.clipboard.writeText(transcript?.full_text || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col h-full justify-between transition-all hover:border-slate-700/80">
      {/* Header & Tabs */}
      <div className="pb-3 border-b border-slate-800/80 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-100 flex items-center gap-2">
              <span>Phân Tích Script Chi Tiết</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{analysis?.summary}</p>
          </div>

          <button
            onClick={onOpenRemix}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-fuchsia-600/20 transition shrink-0 active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tạo Script Cho Video Của Bạn</span>
          </button>
        </div>

        {/* Tab chuyển đổi mượt mà */}
        <div className="flex p-1 bg-slate-950/80 border border-slate-800/80 rounded-xl text-xs font-medium w-full sm:w-fit">
          <button
            onClick={() => setActiveTab("analysis")}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === "analysis"
                ? "bg-fuchsia-600 text-white shadow-md shadow-fuchsia-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Cấu trúc tâm lý</span>
          </button>
          <button
            onClick={() => setActiveTab("transcript")}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === "transcript"
                ? "bg-fuchsia-600 text-white shadow-md shadow-fuchsia-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Lời thoại ({transcript?.segments?.length || 0})</span>
          </button>
        </div>
      </div>

      {/* Khu vực nội dung cuộn mượt mà */}
      <div className="flex-1 overflow-y-auto mt-3 pr-1.5 space-y-3.5 max-h-[460px] sm:max-h-[520px] lg:max-h-[560px]">
        {activeTab === "analysis" ? (
          <>
            {/* 1. KHỐI HOOK (3s đầu) */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-950/20 border border-amber-800/40 relative overflow-hidden group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs uppercase tracking-wide">
                  <Flame className="w-4 h-4" />
                  <span>1. Mồi câu giữ chân (Hook 0-3s)</span>
                </div>
                {hook.time_range && (
                  <button
                    onClick={() => onSeek(0)}
                    className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-amber-900/40 text-amber-300 border border-amber-700/50 hover:bg-amber-800/60 transition"
                  >
                    <Play className="w-2.5 h-2.5" />
                    <span>{hook.time_range}</span>
                  </button>
                )}
              </div>

              <blockquote className="text-xs sm:text-sm font-semibold text-slate-100 italic border-l-2 border-amber-500 pl-3 py-1 my-2 bg-amber-950/30 rounded-r-lg">
                "{hook.text || "Chưa trích xuất được câu hook"}"
              </blockquote>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2.5 pt-2 border-t border-amber-900/30 text-xs">
                <div>
                  <span className="text-slate-400">Kiểu mồi câu: </span>
                  <span className="text-amber-300 font-medium">{hook.hook_type || "Gây tò mò"}</span>
                </div>
                <div>
                  <span className="text-slate-400">Lý do hiệu quả: </span>
                  <span className="text-slate-200">{hook.why_it_works}</span>
                </div>
              </div>
            </div>

            {/* 2. KHỐI BODY (Giữ chân người xem) */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-indigo-950/20 border border-indigo-800/40">
              <div className="flex items-center gap-1.5 text-indigo-400 font-bold text-xs uppercase tracking-wide mb-2">
                <Eye className="w-4 h-4" />
                <span>2. Kỹ thuật giữ chân (Body & Retention)</span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Chiến thuật níu chân người lướt:</span>
                  <ul className="mt-1.5 space-y-1.5">
                    {body.retention_tactics?.map((tactic: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                        <span className="text-indigo-400 font-bold shrink-0">#{idx + 1}</span>
                        <span className="leading-relaxed">{tactic}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-1.5">
                  <span className="text-slate-400 font-medium">Thông điệp cốt lõi truyền tải:</span>
                  <ul className="mt-1.5 space-y-1">
                    {body.key_takeaways?.map((item: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-1.5 text-slate-300">
                        <span className="text-indigo-400">▪</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* 3. KHỐI CTA (Chốt hạ) */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-950/20 border border-emerald-800/40">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs uppercase tracking-wide mb-2">
                <Target className="w-4 h-4" />
                <span>3. Kêu gọi hành động (CTA)</span>
              </div>

              <blockquote className="text-xs sm:text-sm font-semibold text-slate-100 italic border-l-2 border-emerald-500 pl-3 py-1 my-2 bg-emerald-950/30 rounded-r-lg">
                "{cta.text || "Không có lời kêu gọi cụ thể"}"
              </blockquote>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2.5 pt-2 border-t border-emerald-900/30 text-xs">
                <div>
                  <span className="text-slate-400">Loại kêu gọi: </span>
                  <span className="text-emerald-300 font-medium">{cta.cta_type || "Mở tương tác"}</span>
                </div>
                <div>
                  <span className="text-slate-400">Đánh giá hiệu quả: </span>
                  <span className="text-slate-200">{cta.effectiveness}</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* TAB TRANSCRIPT CÓ CLICK-TO-SYNC */
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-2 text-xs text-slate-400">
              <span>Bấm vào mốc giây để tua video tới câu tương ứng:</span>
              <button
                onClick={handleCopyTranscript}
                className="flex items-center gap-1 text-slate-300 hover:text-white bg-slate-800 px-2.5 py-1 rounded-lg transition"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? "Đã chép" : "Sao chép toàn bộ"}</span>
              </button>
            </div>

            {transcript?.segments?.map((seg) => (
              <div
                key={seg.id}
                onClick={() => onSeek(seg.start)}
                className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-fuchsia-500/60 hover:bg-slate-900/90 cursor-pointer transition group"
              >
                <button className="text-[11px] font-mono px-2 py-0.5 rounded bg-fuchsia-950/80 border border-fuchsia-800 text-fuchsia-300 group-hover:bg-fuchsia-600 group-hover:text-white transition shrink-0">
                  {seg.start}s
                </button>
                <p className="text-xs text-slate-200 group-hover:text-white leading-relaxed">{seg.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
