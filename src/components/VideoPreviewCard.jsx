import { useEffect, useState } from "react";
import { Download, Video, Headphones, Film, User, Eye, Heart } from "lucide-react";
import PlatformPill from "./PlatformPill.jsx";
import { PLATFORM_CONFIG } from "../config/platforms.js";
import { formatDuration, formatNumber } from "../utils/format.js";

export default function VideoPreviewCard({ info, onDownload }) {
  const [selectedFormat, setSelectedFormat] = useState(null);
  const cfg = PLATFORM_CONFIG[info.platform];

  useEffect(() => {
    if (info.formats?.length > 0) setSelectedFormat(info.formats[0]);
  }, [info]);

  const handleDownload = () => {
    if (!selectedFormat) return;
    onDownload(selectedFormat);
  };

  return (
    <div
      className="glass rounded-2xl overflow-hidden card-hover"
      style={{
        animation: "slide-up 0.4s cubic-bezier(0.16,1,0.3,1) forwards",
        borderColor: `${cfg.color}22`,
      }}
    >
      <div className="h-0.5" style={{ background: cfg.gradient }} />

      <div className="p-5 space-y-5">
        {/* Thumbnail + meta */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div
            className="relative flex-shrink-0 rounded-xl overflow-hidden w-full sm:w-40"
            style={{ aspectRatio: "16 / 10", background: "#1a1a28" }}
          >
            {info.thumbnail ? (
              <img
                src={info.thumbnail}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Film className="w-8 h-8 text-dark-300" />
              </div>
            )}
            {info.duration > 0 && (
              <div
                className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded text-xs font-mono font-semibold"
                style={{ background: "rgba(0,0,0,0.85)", color: "#fff" }}
              >
                {formatDuration(info.duration)}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-semibold text-sm leading-snug text-white line-clamp-2">
                {info.title}
              </h2>
              <PlatformPill platform={info.platform} className="shrink-0" />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-dark-200">
              <User className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{info.uploader}</span>
            </div>
            <div className="flex flex-wrap gap-3 text-xs">
              {info.viewCount > 0 && (
                <span className="flex items-center gap-1 text-dark-200">
                  <Eye className="w-3 h-3" />
                  {formatNumber(info.viewCount)} tayangan
                </span>
              )}
              {info.likeCount > 0 && (
                <span className="flex items-center gap-1 text-dark-200">
                  <Heart className="w-3 h-3" />
                  {formatNumber(info.likeCount)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="h-px" style={{ background: "rgba(255,255,255,0.06)" }} />

        {/* Format selection */}
        <fieldset className="space-y-2">
          <legend className="text-xs font-semibold text-dark-200 uppercase tracking-wider mb-2">
            Pilih Format &amp; Kualitas
          </legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {info.formats.map((fmt, idx) => {
              const isSelected =
                selectedFormat?.id === fmt.id ||
                selectedFormat?.label === fmt.label;
              const isAudio = fmt.type === "audio";
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedFormat(fmt)}
                  aria-pressed={isSelected}
                  className={`format-btn rounded-xl p-3 text-left transition-all ${isSelected ? "selected" : ""}`}
                >
                  <div className="flex items-start gap-2">
                    <div
                      className="mt-0.5 flex-shrink-0"
                      style={{ color: isSelected ? cfg.accent : "#5a5a80" }}
                    >
                      {isAudio ? (
                        <Headphones className="w-4 h-4" />
                      ) : (
                        <Video className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p
                        className="text-xs font-semibold leading-tight line-clamp-2"
                        style={{ color: isSelected ? cfg.accent : "#e0e0f0" }}
                      >
                        {fmt.label}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="text-xs text-dark-300 font-mono">
                          .{fmt.ext}
                        </span>
                        {fmt.sizeLabel && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded font-mono font-medium"
                            style={{
                              background: isSelected
                                ? `${cfg.color}25`
                                : "rgba(255,255,255,0.06)",
                              color: isSelected ? "#fff" : "#a0a0c0",
                            }}
                          >
                            {fmt.sizeLabel}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Download button — progress is shown by the browser, not in-page. */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleDownload}
            disabled={!selectedFormat}
            aria-label={`Unduh ${selectedFormat?.label || "video"}`}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm text-white btn-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Unduh {selectedFormat?.label || ""}</span>
            {selectedFormat?.sizeLabel && (
              <span className="text-xs font-mono opacity-80">
                ({selectedFormat.sizeLabel})
              </span>
            )}
          </button>

          <p className="text-center text-xs text-dark-300">
            Progress, pembatalan, dan lokasi file ditangani oleh browser.
          </p>
        </div>
      </div>
    </div>
  );
}
