"use client";

import React, { forwardRef, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { PlayCircle, Clock, ExternalLink } from "lucide-react";

// Tải ReactPlayer độc quyền phía Client để triệt tiêu lỗi SSR Hydration
const ReactPlayer = dynamic(() => import("react-player"), { ssr: false });

interface VideoPlayerProps {
  url: string;
  title?: string;
  duration?: number;
  platform?: string;
}

const VideoPlayer = forwardRef<any, VideoPlayerProps>(({ url, title, duration, platform }, ref) => {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col h-full justify-between transition-all hover:border-slate-700/80">
      <div>
        {/* Header thẻ video */}
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <PlayCircle className="w-4 h-4 sm:w-5 sm:h-5 text-fuchsia-400" />
            <h3 className="font-bold text-xs sm:text-sm text-slate-200 uppercase tracking-wide">Video Gốc</h3>
          </div>
          {platform && (
            <span className="text-[11px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full bg-slate-800/90 border border-slate-700 text-fuchsia-300">
              {platform}
            </span>
          )}
        </div>

        {/* Khung phát video co giãn cân đối */}
        <div className="relative w-full aspect-[9/16] max-h-[420px] sm:max-h-[480px] lg:max-h-[520px] mx-auto bg-black/95 rounded-2xl overflow-hidden shadow-inner border border-slate-800/60 flex items-center justify-center">
          {hasMounted ? (
            <ReactPlayer
              ref={ref}
              url={url}
              controls={true}
              width="100%"
              height="100%"
              playing={false}
              pip={true}
              config={{
                file: {
                  attributes: {
                    controlsList: "nodownload",
                  },
                },
              }}
            />
          ) : (
            <div className="text-slate-500 text-xs animate-pulse">Đang nạp trình phát...</div>
          )}
        </div>
      </div>

      {/* Thông tin video */}
      <div className="mt-4 pt-3 border-t border-slate-800/60 space-y-2">
        <h4 className="text-xs sm:text-sm font-semibold text-slate-200 line-clamp-2 leading-snug">
          {title || "Video không có tiêu đề"}
        </h4>
        <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Thời lượng: {duration ? `${duration}s` : "Chưa rõ"}</span>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-fuchsia-400 hover:text-fuchsia-300 font-medium transition"
          >
            <span>Mở link gốc</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
});

VideoPlayer.displayName = "VideoPlayer";
export default VideoPlayer;
