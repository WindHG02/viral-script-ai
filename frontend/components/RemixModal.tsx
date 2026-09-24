"use client";

import React, { useState } from "react";
import {
  X,
  Sparkles,
  Copy,
  Check,
  Wand2,
  Loader2,
  Film,
  Clapperboard,
  MonitorPlay,
  FileText,
  Clock,
  Camera,
  Layers,
} from "lucide-react";
import TeleprompterModal from "./TeleprompterModal";
import { apiFetch } from "@/lib/api";

interface RemixModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisData: any;
  analysisId?: string;
  userId?: string;
  accessToken?: string;
}

export default function RemixModal({
  isOpen,
  onClose,
  analysisData,
  analysisId,
  userId,
  accessToken,
}: RemixModalProps) {
  const [niche, setNiche] = useState("");
  const [persona, setPersona] = useState("ugc");
  const [loading, setLoading] = useState(false);
  const [remixedResult, setRemixedResult] = useState<any>(null);
  const [savedToDb, setSavedToDb] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedPromptKey, setCopiedPromptKey] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [viewModes, setViewModes] = useState<Record<number, "script" | "storyboard">>({});
  const [teleprompterData, setTeleprompterData] = useState<{
    title: string;
    text: string;
  } | null>(null);

  if (!isOpen) return null;

  const quickNiches = [
    "Bán ốp lưng & phụ kiện iPhone",
    "Khóa học tiếng Anh giao tiếp",
    "Mỹ phẩm & Chăm sóc da mụn",
    "Đồ gia dụng thông minh",
    "Môi giới phòng trọ sinh viên",
  ];

  const personas = [
    {
      id: "ugc",
      name: "🌟 UGC Reviewer",
      desc: "Chân thực, gần gũi, mở hộp / trải nghiệm",
    },
    {
      id: "expert",
      name: "⚡ Chuyên gia bóc phốt",
      desc: "Sắc bén, đanh thép, phản biện lầm tưởng",
    },
    {
      id: "storyteller",
      name: "🎭 Kể chuyện drama",
      desc: "Kịch tính, hồi hộp, bất ngờ",
    },
    {
      id: "humor",
      name: "🤣 Hài hước / Bắt trend",
      desc: "Hóm hỉnh, giễu nhại, vui nhộn",
    },
  ];

  const handleRemix = async (targetTopic: string) => {
    const finalTopic = targetTopic.trim();
    if (!finalTopic) return;

    setLoading(true);
    setErrorMsg("");
    setRemixedResult(null);
    setSavedToDb(false);
    setViewModes({});

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      const res = await apiFetch("/remix", {
        method: "POST",
        headers,
        body: JSON.stringify({
          analysis_data: analysisData,
          target_niche: finalTopic,
          persona: persona,
          analysis_id: analysisId,
          user_id: userId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Không thể tạo script mới");

      setRemixedResult(data.data);
      if (data.saved_to_db) {
        setSavedToDb(true);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyPrompt = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPromptKey(key);
    setTimeout(() => setCopiedPromptKey(null), 2000);
  };

  const toggleViewMode = (idx: number, mode: "script" | "storyboard") => {
    setViewModes((prev) => ({
      ...prev,
      [idx]: mode,
    }));
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl sm:max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
          {/* Modal Header */}
          <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/70">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-fuchsia-600/20 border border-fuchsia-500/40 flex items-center justify-center">
                <Wand2 className="w-4 h-4 text-fuchsia-400" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-100 flex items-center gap-2">
                  <span>Tạo Script & Storyboard Video</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Tái cấu trúc kịch bản triệu view kèm Bảng phân cảnh và Máy nhắc chữ
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
            {/* Input Topic */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nhập chủ đề / ngành hàng của bạn:
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRemix(niche)}
                  placeholder="Ví dụ: Bán nước hoa, Review đồ gia dụng, Khóa học ngoại ngữ..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-fuchsia-500 transition"
                />
                <button
                  onClick={() => handleRemix(niche)}
                  disabled={loading || !niche.trim()}
                  className="px-5 py-2.5 bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-1.5 shrink-0"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span>{loading ? "Đang đạo diễn kịch bản..." : "Tạo 3 Script & Storyboard"}</span>
                </button>
              </div>

              {/* Creator Persona Selector */}
              <div className="mt-3">
                <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                  Chọn phong cách diễn xuất (Creator Persona):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {personas.map((p) => {
                    const isSelected = persona === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPersona(p.id)}
                        className={`p-2 rounded-xl text-left border transition text-xs flex flex-col justify-between ${
                          isSelected
                            ? "bg-fuchsia-950/60 border-fuchsia-500 text-fuchsia-200 shadow-sm"
                            : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
                        }`}
                      >
                        <span className="font-bold text-[11px] sm:text-xs truncate block">
                          {p.name}
                        </span>
                        <span className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                          {p.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Suggestions */}
              <div className="flex flex-wrap items-center gap-1.5 mt-3">
                <span className="text-[11px] text-slate-500 mr-1">Gợi ý nhanh:</span>
                {quickNiches.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setNiche(item);
                      handleRemix(item);
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/70 hover:bg-fuchsia-950 hover:text-fuchsia-300 border border-slate-700/60 transition text-slate-300"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-xs text-red-300">
                {errorMsg}
              </div>
            )}

            {/* Results List */}
            {remixedResult && remixedResult.scripts && (
              <div className="space-y-4 pt-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-bold text-xs sm:text-sm text-fuchsia-400 flex items-center gap-1.5">
                    <span>🎯 3 Kịch bản Storyboard Cho: "{remixedResult.target_niche}"</span>
                  </h4>
                  {savedToDb && (
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 font-medium">
                      ✓ Đã lưu Database
                    </span>
                  )}
                </div>

                {remixedResult.scripts.map((script: any, idx: number) => {
                  const currentMode = viewModes[idx] || "script";
                  const hasStoryboard = Array.isArray(script.storyboard) && script.storyboard.length > 0;

                  return (
                    <div
                      key={idx}
                      className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-slate-700/80 space-y-3 transition"
                    >
                      {/* Script Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs sm:text-sm text-indigo-400 uppercase tracking-wide">
                              {script.version}
                            </span>
                            {script.estimated_duration && (
                              <span className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                                <Clock className="w-3 h-3 text-slate-500" />
                                {script.estimated_duration}
                              </span>
                            )}
                          </div>
                          {script.tone_style && (
                            <p className="text-[11px] text-slate-400 italic mt-0.5">
                              {script.tone_style}
                            </p>
                          )}
                        </div>

                        {/* Top Action Buttons */}
                        <div className="flex items-center gap-1.5">
                          {/* View Toggle */}
                          {hasStoryboard && (
                            <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                              <button
                                onClick={() => toggleViewMode(idx, "script")}
                                className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 ${
                                  currentMode === "script"
                                    ? "bg-indigo-600 text-white font-medium"
                                    : "text-slate-400 hover:text-slate-200"
                                }`}
                              >
                                <FileText className="w-3 h-3" />
                                <span>Lời thoại</span>
                              </button>
                              <button
                                onClick={() => toggleViewMode(idx, "storyboard")}
                                className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 ${
                                  currentMode === "storyboard"
                                    ? "bg-fuchsia-600 text-white font-medium"
                                    : "text-slate-400 hover:text-slate-200"
                                }`}
                              >
                                <Clapperboard className="w-3 h-3" />
                                <span>Storyboard ({script.storyboard.length})</span>
                              </button>
                            </div>
                          )}

                          {/* Teleprompter Button */}
                          <button
                            onClick={() =>
                              setTeleprompterData({
                                title: `${script.version} - ${remixedResult.target_niche}`,
                                text: script.full_script || script.body || script.hook,
                              })
                            }
                            title="Mở máy nhắc chữ để nhìn camera quay"
                            className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/80 px-2.5 py-1 rounded-lg transition"
                          >
                            <MonitorPlay className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Máy nhắc chữ</span>
                          </button>

                          {/* Copy Full Script Button */}
                          <button
                            onClick={() => handleCopy(script.full_script || script.body, idx)}
                            className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg transition"
                          >
                            {copiedIndex === idx ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400 font-medium">Đã chép</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Sao chép</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Content: Script View */}
                      {currentMode === "script" && (
                        <div className="space-y-2.5 text-xs">
                          <div>
                            <span className="font-semibold text-amber-400">🔥 Câu Hook (3s): </span>
                            <span className="text-slate-200">{script.hook}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-indigo-400">🎬 Kịch bản hoàn chỉnh (Cầm đọc quay): </span>
                            <p className="text-slate-300 whitespace-pre-line mt-1 bg-slate-900/70 p-3.5 rounded-xl border border-slate-800/80 leading-relaxed font-mono text-[11px] sm:text-xs">
                              {script.full_script || script.body}
                            </p>
                          </div>
                          <div>
                            <span className="font-semibold text-emerald-400">🎯 Câu CTA: </span>
                            <span className="text-slate-200">{script.cta}</span>
                          </div>
                        </div>
                      )}

                      {/* Content: Storyboard View */}
                      {currentMode === "storyboard" && hasStoryboard && (
                        <div className="space-y-3 pt-1">
                          <div className="grid grid-cols-1 gap-2.5">
                            {script.storyboard.map((scene: any, scIdx: number) => {
                              const promptKey = `s${idx}_sc${scIdx}`;
                              const isPromptCopied = copiedPromptKey === promptKey;

                              // Phân biệt màu sắc từng giai đoạn
                              const isHook = scene.stage?.toLowerCase() === "hook";
                              const isCTA = scene.stage?.toLowerCase() === "cta";

                              return (
                                <div
                                  key={scIdx}
                                  className="p-3 sm:p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs"
                                >
                                  {/* Scene Header */}
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                                        Cảnh #{scene.scene || scIdx + 1}
                                      </span>
                                      <span
                                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                          isHook
                                            ? "bg-amber-950 text-amber-300 border border-amber-800/60"
                                            : isCTA
                                            ? "bg-emerald-950 text-emerald-300 border border-emerald-800/60"
                                            : "bg-blue-950 text-blue-300 border border-blue-800/60"
                                        }`}
                                      >
                                        {scene.stage || "Body"}
                                      </span>
                                      {scene.time && (
                                        <span className="text-[11px] font-mono text-slate-400">
                                          ⏱ {scene.time}
                                        </span>
                                      )}
                                    </div>

                                    {scene.text_overlay && (
                                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-fuchsia-950/70 border border-fuchsia-800/50 text-fuchsia-300 font-bold truncate max-w-[200px]">
                                        Chữ màn hình: "{scene.text_overlay}"
                                      </span>
                                    )}
                                  </div>

                                  {/* Voiceover */}
                                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
                                    <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">
                                      🗣️ Lời thoại cần đọc:
                                    </span>
                                    <p className="text-slate-100 font-medium text-xs leading-relaxed">
                                      {scene.voiceover}
                                    </p>
                                  </div>

                                  {/* Visual Direction / Camera Action */}
                                  <div className="flex items-start gap-2 text-slate-300 bg-slate-950/30 p-2 rounded-lg">
                                    <Camera className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                    <div>
                                      <span className="font-semibold text-amber-400 text-[11px]">
                                        Góc máy & Diễn xuất:{" "}
                                      </span>
                                      <span className="text-[11px] text-slate-300">
                                        {scene.visual_action}
                                      </span>
                                    </div>
                                  </div>

                                  {/* AI B-Roll Prompt */}
                                  {scene.b_roll_prompt && (
                                    <div className="bg-indigo-950/30 border border-indigo-900/40 p-2 rounded-lg flex items-center justify-between gap-2">
                                      <div className="flex items-start gap-1.5 min-w-0">
                                        <Film className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                                        <div className="truncate">
                                          <span className="font-semibold text-indigo-300 text-[10px] uppercase">
                                            AI B-Roll Prompt (Pippit / Midjourney):{" "}
                                          </span>
                                          <span className="text-[10px] font-mono text-indigo-200">
                                            {scene.b_roll_prompt}
                                          </span>
                                        </div>
                                      </div>
                                      <button
                                        onClick={() =>
                                          handleCopyPrompt(scene.b_roll_prompt, promptKey)
                                        }
                                        title="Chép prompt tiếng Anh để đưa vào AI sinh video"
                                        className="text-[10px] px-2 py-1 rounded bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 font-medium shrink-0 flex items-center gap-1 transition"
                                      >
                                        {isPromptCopied ? (
                                          <>
                                            <Check className="w-3 h-3 text-emerald-400" />
                                            <span>Đã chép</span>
                                          </>
                                        ) : (
                                          <>
                                            <Copy className="w-3 h-3" />
                                            <span>Chép Prompt</span>
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Teleprompter Modal */}
      {teleprompterData && (
        <TeleprompterModal
          isOpen={Boolean(teleprompterData)}
          onClose={() => setTeleprompterData(null)}
          title={teleprompterData.title}
          scriptText={teleprompterData.text}
        />
      )}
    </>
  );
}
