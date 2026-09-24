"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Play, Pause, RotateCcw, ZoomIn, ZoomOut, FlipHorizontal, Maximize2, Minimize2 } from "lucide-react";

interface TeleprompterModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  scriptText: string;
}

export default function TeleprompterModal({
  isOpen,
  onClose,
  title,
  scriptText,
}: TeleprompterModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(30); // pixels per second
  const [fontSize, setFontSize] = useState(36); // in px
  const [isMirrored, setIsMirrored] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // Lắng nghe phím tắt: Space để Play/Pause, Esc để thoát
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.code === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Vòng lặp cuộn chữ mượt mà bằng requestAnimationFrame
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      lastTimeRef.current = null;
      return;
    }

    const scrollStep = (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
      }
      const delta = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      if (containerRef.current) {
        containerRef.current.scrollTop += speed * delta;
        // Dừng khi đã cuộn hết bài
        if (
          containerRef.current.scrollTop + containerRef.current.clientHeight >=
          containerRef.current.scrollHeight - 5
        ) {
          setIsPlaying(false);
          return;
        }
      }

      animationFrameId.current = requestAnimationFrame(scrollStep);
    };

    animationFrameId.current = requestAnimationFrame(scrollStep);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isPlaying, speed]);

  const handleReset = () => {
    setIsPlaying(false);
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col overflow-hidden animate-in fade-in duration-200">
      {/* Top Bar - Controls */}
      <div className="bg-slate-950/90 border-b border-slate-800/80 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 select-none">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-bold text-xs sm:text-sm text-slate-200 truncate max-w-[200px] sm:max-w-md">
            Máy nhắc chữ: {title}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Play/Pause Button */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-4 py-1.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition ${
              isPlaying
                ? "bg-amber-600 hover:bg-amber-500 text-white"
                : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40"
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
            <span>{isPlaying ? "Tạm dừng (Space)" : "Bắt đầu (Space)"}</span>
          </button>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            title="Cuộn lại từ đầu"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Speed Slider */}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">Tốc độ:</span>
            <input
              type="range"
              min="10"
              max="90"
              step="5"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-20 accent-emerald-500 cursor-pointer"
            />
            <span className="text-xs font-mono text-emerald-400 w-7 text-right">{speed}</span>
          </div>

          {/* Font Size Buttons */}
          <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setFontSize((prev) => Math.max(20, prev - 4))}
              title="Giảm cỡ chữ"
              className="p-1 hover:text-white text-slate-400"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono text-slate-300 w-5 text-center">{fontSize}</span>
            <button
              onClick={() => setFontSize((prev) => Math.min(64, prev + 4))}
              title="Tăng cỡ chữ"
              className="p-1 hover:text-white text-slate-400"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mirror Flip Toggle */}
          <button
            onClick={() => setIsMirrored(!isMirrored)}
            title="Lật gương chữ (dành cho kính phản chiếu)"
            className={`p-2 rounded-xl border transition ${
              isMirrored
                ? "bg-fuchsia-600/30 border-fuchsia-500 text-fuchsia-300"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <FlipHorizontal className="w-4 h-4" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            title="Toàn màn hình"
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            title="Đóng máy nhắc chữ (Esc)"
            className="p-2 rounded-xl bg-red-950/60 hover:bg-red-900/80 border border-red-800 text-red-300 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center Reading Focus Bar Indicator */}
      <div className="absolute top-1/2 left-0 right-0 h-16 -translate-y-1/2 border-y border-emerald-500/20 bg-emerald-500/5 pointer-events-none z-10 flex items-center justify-between px-6">
        <span className="text-[10px] text-emerald-400/60 uppercase font-mono tracking-widest hidden sm:inline">
          ▶ Điểm nhìn mắt (Camera Focus)
        </span>
        <span className="text-[10px] text-emerald-400/60 uppercase font-mono tracking-widest hidden sm:inline">
          ◀
        </span>
      </div>

      {/* Teleprompter Scrollable Text Container */}
      <div
        ref={containerRef}
        className={`flex-1 overflow-y-auto px-6 sm:px-16 md:px-32 py-[40vh] transition-transform duration-100 ${
          isMirrored ? "-scale-x-100" : ""
        }`}
        style={{ scrollBehavior: "auto" }}
      >
        <div
          className="max-w-4xl mx-auto font-semibold leading-relaxed tracking-wide text-slate-100 whitespace-pre-line text-center select-none"
          style={{ fontSize: `${fontSize}px`, lineHeight: 1.5 }}
        >
          {scriptText}
        </div>
      </div>

      {/* Bottom Hint */}
      <div className="bg-slate-950/80 border-t border-slate-900 py-2 px-4 text-center text-slate-500 text-[11px] select-none">
        Bấm phím <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">Space</kbd> để Bắt đầu/Tạm dừng • Phím <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">Esc</kbd> để thoát
      </div>
    </div>
  );
}
