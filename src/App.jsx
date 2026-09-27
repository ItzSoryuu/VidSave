import { useState, useEffect, useRef, useCallback } from "react";
import {
  Download,
  Link2,
  X,
  Search,
  Clock,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Video,
  Eye,
  Heart,
  User,
  Clipboard,
  RotateCcw,
  ChevronDown,
  Zap,
  Shield,
  Globe,
  Film,
  Headphones,
} from "lucide-react";
import axios from "axios";

// Custom SVG social icons (lucide-react doesn't have these)
function YoutubeIcon({ className = "w-5 h-5", style }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      style={style}
    >
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function InstagramIcon({ className = "w-5 h-5", style }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      style={style}
    >
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  );
}

// ─── UTILITIES ───────────────────────────────────────────────────────────────

function detectPlatform(url) {
  if (/youtube\.com|youtu\.be/i.test(url)) return "youtube";
  if (/instagram\.com/i.test(url)) return "instagram";
  if (/tiktok\.com/i.test(url)) return "tiktok";
  return null;
}

function formatDuration(seconds) {
  if (!seconds) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0)
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatNumber(n) {
  if (!n) return null;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "baru saja";
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  return `${Math.floor(h / 24)} hari lalu`;
}

// ─── PLATFORM CONFIG ─────────────────────────────────────────────────────────

const PLATFORM_CONFIG = {
  youtube: {
    name: "YouTube",
    color: "#ff0000",
    gradient: "linear-gradient(135deg, #ff0000, #cc0000)",
    glow: "rgba(255,0,0,0.3)",
    badge: "badge-yt",
    border: "neon-border-yt",
    textClass: "gradient-text-yt",
    glowClass: "glow-yt",
    accentBg: "rgba(255, 0, 0, 0.08)",
    accent: "#ff4444",
  },
  instagram: {
    name: "Instagram",
    color: "#e1306c",
    gradient: "linear-gradient(135deg, #fd1d1d, #e1306c, #833ab4)",
    glow: "rgba(225,48,108,0.3)",
    badge: "badge-ig",
    border: "neon-border-ig",
    textClass: "gradient-text-ig",
    glowClass: "glow-ig",
    accentBg: "rgba(225,48,108,0.08)",
    accent: "#e1306c",
  },
  tiktok: {
    name: "TikTok",
    color: "#00f2ea",
    gradient: "linear-gradient(135deg, #00f2ea, #ff0050)",
    glow: "rgba(0,242,234,0.3)",
    badge: "badge-tt",
    border: "neon-border-tt",
    textClass: "gradient-text-tt",
    glowClass: "glow-tt",
    accentBg: "rgba(0,242,234,0.08)",
    accent: "#00f2ea",
  },
};

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function TikTokIcon({ className = "w-5 h-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.19 8.19 0 004.79 1.53V6.75a4.85 4.85 0 01-1.02-.06z" />
    </svg>
  );
}

function PlatformIcon({ platform, className = "w-5 h-5" }) {
  if (platform === "youtube") return <YoutubeIcon className={className} />;
  if (platform === "instagram") return <InstagramIcon className={className} />;
  if (platform === "tiktok") return <TikTokIcon className={className} />;
  return <Globe className={className} />;
}

function BackgroundOrbs() {
  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 0 }}
    >
      {/* YouTube orb */}
      <div
        className="absolute rounded-full opacity-10"
        style={{
          width: 500,
          height: 500,
          top: "-10%",
          left: "-10%",
          background: "radial-gradient(circle, #ff0000 0%, transparent 70%)",
          filter: "blur(60px)",
          animation: "pulse-glow 4s ease-in-out infinite",
        }}
      />
      {/* Instagram orb */}
      <div
        className="absolute rounded-full opacity-10"
        style={{
          width: 600,
          height: 600,
          top: "30%",
          right: "-15%",
          background:
            "radial-gradient(circle, #833ab4 0%, #e1306c 50%, transparent 70%)",
          filter: "blur(80px)",
          animation: "pulse-glow 5s ease-in-out infinite 1s",
        }}
      />
      {/* TikTok orb */}
      <div
        className="absolute rounded-full opacity-10"
        style={{
          width: 400,
          height: 400,
          bottom: "10%",
          left: "20%",
          background: "radial-gradient(circle, #00f2ea 0%, transparent 70%)",
          filter: "blur(60px)",
          animation: "pulse-glow 3.5s ease-in-out infinite 0.5s",
        }}
      />
    </div>
  );
}

function PlatformPill({ platform }) {
  if (!platform) return null;
  const cfg = PLATFORM_CONFIG[platform];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${cfg.badge}`}
      style={{ animation: "fade-in 0.3s ease forwards" }}
    >
      <PlatformIcon platform={platform} className="w-3.5 h-3.5" />
      {cfg.name}
    </span>
  );
}

function SkeletonCard() {
  return (
    <div
      className="glass rounded-2xl p-5 space-y-4"
      style={{ animation: "fade-in 0.3s ease" }}
    >
      <div className="flex gap-4">
        <div
          className="skeleton rounded-xl flex-shrink-0"
          style={{ width: 160, height: 100 }}
        />
        <div className="flex-1 space-y-3">
          <div className="skeleton h-5 w-3/4" />
          <div className="skeleton h-4 w-1/2" />
          <div className="flex gap-2">
            <div className="skeleton h-6 w-20 rounded-full" />
            <div className="skeleton h-6 w-16 rounded-full" />
          </div>
        </div>
      </div>
      <div className="skeleton h-px w-full" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-12 rounded-xl" />
        ))}
      </div>
      <div className="skeleton h-11 rounded-xl w-full" />
    </div>
  );
}

function VideoPreviewCard({
  info,
  onDownload,
  downloadingFormat,
  downloadProgress,
}) {
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
        borderWidth: 1,
        borderStyle: "solid",
      }}
    >
      {/* Accent top bar */}
      <div className="h-0.5" style={{ background: cfg.gradient }} />

      <div className="p-5 space-y-5">
        {/* Thumbnail + meta */}
        <div className="flex gap-4">
          {/* Thumbnail */}
          <div
            className="relative flex-shrink-0 rounded-xl overflow-hidden"
            style={{ width: 160, height: 100, background: "#1a1a28" }}
          >
            {info.thumbnail ? (
              <img
                src={info.thumbnail}
                alt={info.title}
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
            {/* Duration badge */}
            {info.duration > 0 && (
              <div
                className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded text-xs font-mono font-semibold"
                style={{ background: "rgba(0,0,0,0.85)", color: "#fff" }}
              >
                {formatDuration(info.duration)}
              </div>
            )}
            {/* Platform badge overlay */}
            <div className="absolute top-1.5 left-1.5">
              <PlatformPill platform={info.platform} />
            </div>
          </div>

          {/* Meta */}
          <div className="flex-1 min-w-0 space-y-2">
            <h3 className="font-semibold text-sm leading-snug text-white line-clamp-2">
              {info.title}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-dark-200">
              <User className="w-3.5 h-3.5" />
              <span className="truncate">{info.uploader}</span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {info.viewCount > 0 && (
                <span className="flex items-center gap-1 text-dark-200">
                  <Eye className="w-3 h-3" />
                  {formatNumber(info.viewCount)}
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

        {/* Divider */}
        <div
          className="h-px"
          style={{ background: "rgba(255,255,255,0.06)" }}
        />

        {/* Format selection */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-dark-200 uppercase tracking-wider">
            Pilih Format & Kualitas
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {info.formats.map((fmt, idx) => {
              const isSelected =
                selectedFormat?.id === fmt.id ||
                selectedFormat?.label === fmt.label;
              const isAudio = fmt.type === "audio";
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedFormat(fmt)}
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
                        className="text-xs font-semibold leading-tight truncate"
                        style={{ color: isSelected ? cfg.accent : "#e0e0f0" }}
                      >
                        {fmt.label}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] text-dark-300 font-mono">
                          .{fmt.ext}
                        </span>
                        {fmt.sizeLabel && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium"
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
        </div>

        {/* Download button */}
        <div className="space-y-2">
          <button
            onClick={handleDownload}
            disabled={
              !selectedFormat || downloadingFormat === selectedFormat?.label
            }
            className="w-full relative overflow-hidden py-3 px-4 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-90 disabled:cursor-not-allowed"
            style={{
              background: downloadingFormat
                ? "rgba(20,20,35,0.95)"
                : cfg.gradient,
              boxShadow: downloadingFormat
                ? `0 0 20px ${cfg.glow}`
                : `0 4px 20px ${cfg.glow}`,
              border: downloadingFormat ? `1px solid ${cfg.accent}55` : "none",
            }}
          >
            {downloadingFormat === selectedFormat?.label ? (
              <div className="flex flex-col items-center gap-2 w-full">
                <div className="flex items-center justify-between w-full text-xs">
                  <span className="flex items-center gap-1.5 font-medium text-white">
                    <Loader2
                      className="w-3.5 h-3.5 animate-spin"
                      style={{ color: cfg.accent }}
                    />
                    Mengunduh {selectedFormat?.label}...
                  </span>
                  <span
                    className="font-mono text-xs font-bold"
                    style={{ color: cfg.accent }}
                  >
                    {downloadProgress?.total
                      ? `${(downloadProgress.received / (1024 * 1024)).toFixed(1)} MB / ${(downloadProgress.total / (1024 * 1024)).toFixed(1)} MB (${Math.min(100, Math.round((downloadProgress.received / downloadProgress.total) * 100))}%)`
                      : `${((downloadProgress?.received || 0) / (1024 * 1024)).toFixed(1)} MB`}
                  </span>
                </div>
                {/* Progress bar */}
                <div
                  className="w-full h-1.5 rounded-full overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.1)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-150"
                    style={{
                      background: cfg.gradient,
                      width: downloadProgress?.total
                        ? `${Math.min(100, Math.round((downloadProgress.received / downloadProgress.total) * 100))}%`
                        : `${Math.min(95, Math.round(((downloadProgress?.received || 0) / 1024 / 1024) * 10))}%`,
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Download className="w-4 h-4" />
                <span>Unduh {selectedFormat?.label || ""}</span>
                {selectedFormat?.sizeLabel && (
                  <span className="text-xs font-mono opacity-80">
                    ({selectedFormat.sizeLabel})
                  </span>
                )}
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function HistoryItem({ item, onReuse, onDelete }) {
  const cfg = PLATFORM_CONFIG[item.platform];
  return (
    <div
      className="glass-light rounded-xl p-3 flex items-center gap-3 group card-hover"
      style={{ animation: "fade-in 0.3s ease forwards" }}
    >
      {/* Thumb */}
      <div
        className="relative flex-shrink-0 rounded-lg overflow-hidden"
        style={{ width: 56, height: 36, background: "#1a1a28" }}
      >
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt={item.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Film className="w-4 h-4 text-dark-400" />
          </div>
        )}
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-white truncate">
          {item.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <PlatformPill platform={item.platform} />
          <span className="text-[10px] text-dark-300">
            {timeAgo(item.timestamp)}
          </span>
        </div>
      </div>
      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onReuse(item.url)}
          className="p-1.5 rounded-lg text-dark-200 hover:text-white hover:bg-white/10 transition-all"
          title="Gunakan lagi"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="p-1.5 rounded-lg text-dark-200 hover:text-red-400 hover:bg-red-500/10 transition-all"
          title="Hapus"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function StatsRow() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {[
        {
          icon: YoutubeIcon,
          label: "YouTube",
          desc: "1080p · 720p · 480p · MP3",
          color: "#ff0000",
          bg: "rgba(255,0,0,0.08)",
        },
        {
          icon: InstagramIcon,
          label: "Instagram",
          desc: "Reels · Posts · Stories",
          color: "#e1306c",
          bg: "rgba(225,48,108,0.08)",
        },
        {
          label: "TikTok",
          desc: "No Watermark · MP3",
          color: "#00f2ea",
          bg: "rgba(0,242,234,0.08)",
          isTikTok: true,
        },
      ].map((item, i) => (
        <div
          key={i}
          className="glass-light rounded-xl p-4 text-center card-hover"
          style={{
            borderColor: `${item.color}22`,
            borderWidth: 1,
            borderStyle: "solid",
          }}
        >
          <div className="flex justify-center mb-2">
            <div className="p-2 rounded-lg" style={{ background: item.bg }}>
              {item.isTikTok ? (
                <TikTokIcon className="w-5 h-5" style={{ color: item.color }} />
              ) : (
                <item.icon className="w-5 h-5" style={{ color: item.color }} />
              )}
            </div>
          </div>
          <p className="text-sm font-bold text-white">{item.label}</p>
          <p className="text-[10px] text-dark-300 mt-0.5">{item.desc}</p>
        </div>
      ))}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

const HISTORY_KEY = "vidsave_history";
const API_BASE = "/api";

export default function App() {
  const [url, setUrl] = useState("");
  const [platform, setPlatform] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [videoInfo, setVideoInfo] = useState(null);
  const [downloadingFormat, setDownloadingFormat] = useState(null);
  // { received: bytes, total: bytes|null, label: string }
  const [downloadProgress, setDownloadProgress] = useState(null);
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    } catch {
      return [];
    }
  });
  const [showHistory, setShowHistory] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [backendStatus, setBackendStatus] = useState(null); // null | 'ok' | 'offline'
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  // Save history
  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  // Check backend on mount
  useEffect(() => {
    axios
      .get(`${API_BASE}/health`)
      .then((res) => {
        setBackendStatus(res.data.status === "ok" ? "ok" : "offline");
      })
      .catch(() => {
        setBackendStatus("offline");
      });
  }, []);

  // Detect platform on URL change
  useEffect(() => {
    const detected = detectPlatform(url);
    setPlatform(detected);
    if (!url) {
      setVideoInfo(null);
      setError(null);
    }
  }, [url]);

  const showToast = useCallback((msg, duration = 3000) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), duration);
  }, []);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text.trim());
      inputRef.current?.focus();
    } catch {
      showToast("Tidak bisa mengakses clipboard. Paste manual.");
    }
  }, [showToast]);

  const handleReset = useCallback(() => {
    setUrl("");
    setVideoInfo(null);
    setError(null);
    setDownloadingFormat(null);
    inputRef.current?.focus();
  }, []);

  const handleFetch = useCallback(
    async (e) => {
      e?.preventDefault();
      const trimmed = url.trim();
      if (!trimmed) return;

      const detected = detectPlatform(trimmed);
      if (!detected) {
        setError(
          "URL tidak dikenali. Pastikan link dari YouTube, Instagram, atau TikTok.",
        );
        return;
      }

      setLoading(true);
      setError(null);
      setVideoInfo(null);

      try {
        const res = await axios.get(`${API_BASE}/info`, {
          params: { url: trimmed },
        });
        setVideoInfo(res.data);
      } catch (err) {
        const msg =
          err.response?.data?.error ||
          "Gagal mengambil info video. Periksa link dan coba lagi.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [url],
  );

  const handleDownload = useCallback(
    async (format) => {
      if (!videoInfo) return;

      // Cancel any ongoing download
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      setDownloadingFormat(format.label);
      setDownloadProgress({ received: 0, total: format.contentLength || null });

      const params = new URLSearchParams({
        url: videoInfo.originalUrl,
        platform: videoInfo.platform,
        formatSelector: format.formatSelector || "",
        directUrl: format.directUrl || "",
        type: format.type || "video",
        ext: format.ext || "mp4",
        title: videoInfo.title || "video",
      });

      const downloadUrl = `${API_BASE}/download?${params.toString()}`;

      try {
        const response = await fetch(downloadUrl, {
          signal: abortRef.current.signal,
        });
        if (!response.ok) throw new Error(`Server error ${response.status}`);

        const contentLength = response.headers.get("Content-Length");
        const total = contentLength
          ? parseInt(contentLength)
          : format.contentLength || null;

        const reader = response.body.getReader();
        const chunks = [];
        let received = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          received += value.length;
          setDownloadProgress({ received, total });
        }

        // Assemble blob and trigger save with compliant media type
        const mimeType = format.type === "audio" ? "audio/mpeg" : "video/mp4";
        const blob = new Blob(chunks, { type: mimeType });
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `${(videoInfo.title || "video").replace(/[^\w\s-]/g, "").trim()}.${format.ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);

        // Save to history
        setHistory((prev) => [
          {
            id: Date.now(),
            url: videoInfo.originalUrl,
            title: videoInfo.title,
            platform: videoInfo.platform,
            thumbnail: videoInfo.thumbnail,
            format: format.label,
            timestamp: Date.now(),
          },
          ...prev.slice(0, 19),
        ]);
        showToast(`Unduhan selesai — ${format.label}`);
      } catch (err) {
        if (err.name !== "AbortError") {
          showToast(`Unduhan gagal: ${err.message}`);
        }
      } finally {
        setDownloadingFormat(null);
        setDownloadProgress(null);
      }
    },
    [videoInfo, showToast],
  );

  const handleReuseUrl = useCallback((u) => {
    setUrl(u);
    setShowHistory(false);
    setVideoInfo(null);
    setError(null);
    inputRef.current?.focus();
  }, []);

  const handleDeleteHistory = useCallback((id) => {
    setHistory((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const handleClearHistory = useCallback(() => {
    setHistory([]);
    showToast("Riwayat dihapus.");
  }, [showToast]);

  return (
    <div
      className="relative min-h-screen"
      style={{ background: "#070709", fontFamily: "'Inter', sans-serif" }}
    >
      <BackgroundOrbs />

      {/* Toast */}
      {toastMsg && (
        <div
          className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-white shadow-xl"
          style={{
            background: "rgba(124,58,237,0.9)",
            backdropFilter: "blur(12px)",
            animation: "slide-up 0.3s cubic-bezier(0.16,1,0.3,1) forwards",
            boxShadow: "0 8px 32px rgba(124,58,237,0.4)",
          }}
        >
          <CheckCircle2 className="w-4 h-4" />
          {toastMsg}
        </div>
      )}

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-10 space-y-8">
        {/* ── HEADER ── */}
        <header className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <div
                className="flex items-center gap-3 px-5 py-2.5 glass rounded-2xl"
                style={{ border: "1px solid rgba(167,139,250,0.2)" }}
              >
                <div className="flex -space-x-1">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: "#ff0000" }}
                  >
                    <YoutubeIcon className="w-3 h-3 text-white" />
                  </div>
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{
                      background:
                        "linear-gradient(135deg,#fd1d1d,#e1306c,#833ab4)",
                    }}
                  >
                    <InstagramIcon className="w-3 h-3 text-white" />
                  </div>
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg,#00f2ea,#ff0050)",
                    }}
                  >
                    <TikTokIcon className="w-3 h-3 text-white" />
                  </div>
                </div>
                <span className="text-xs font-semibold text-dark-200">
                  3-in-1 Video Downloader
                </span>
              </div>
            </div>
          </div>

          <div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-none">
              Vid<span className="gradient-text-main">Save</span>
            </h1>
            <p className="mt-3 text-sm text-dark-200 max-w-sm mx-auto leading-relaxed">
              Download video dari YouTube, Instagram & TikTok — pilih kualitas,
              format, tanpa watermark.
            </p>
          </div>

          {/* Backend status warning */}
          {backendStatus === "offline" && (
            <div
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs text-yellow-400"
              style={{
                background: "rgba(234,179,8,0.08)",
                border: "1px solid rgba(234,179,8,0.2)",
              }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>
                Backend offline. Jalankan:{" "}
                <code className="font-mono">npm run dev:backend</code>
              </span>
            </div>
          )}
        </header>

        {/* ── SEARCH FORM ── */}
        <div
          className="glass rounded-2xl p-5 space-y-4"
          style={{ border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <form onSubmit={handleFetch} className="space-y-3">
            {/* URL Input */}
            <div className="relative">
              {/* Platform indicator */}
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                {platform ? (
                  <div style={{ color: PLATFORM_CONFIG[platform].accent }}>
                    <PlatformIcon platform={platform} className="w-5 h-5" />
                  </div>
                ) : (
                  <Link2 className="w-5 h-5 text-dark-400" />
                )}
              </div>
              <input
                ref={inputRef}
                id="url-input"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Tempel link YouTube, Instagram, atau TikTok..."
                className="input-field w-full rounded-xl pl-12 pr-4 py-3.5 text-sm"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
              {url && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-dark-400 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Detected platform badge */}
            {platform && (
              <div
                className="flex items-center gap-2 text-xs text-dark-200"
                style={{ animation: "fade-in 0.2s ease" }}
              >
                <Zap
                  className="w-3.5 h-3.5"
                  style={{ color: PLATFORM_CONFIG[platform].accent }}
                />
                <span>Terdeteksi: </span>
                <PlatformPill platform={platform} />
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handlePaste}
                id="btn-paste"
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium text-dark-200 glass-light hover:text-white transition-all flex-shrink-0"
                style={{ border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <Clipboard className="w-3.5 h-3.5" />
                Paste
              </button>
              <button
                type="submit"
                id="btn-fetch"
                disabled={!url.trim() || loading}
                className="btn-primary flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Mengambil Info...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Ambil Info Video
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* ── ERROR ── */}
        {error && (
          <div
            className="flex items-start gap-3 p-4 rounded-xl text-sm"
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              animation: "slide-up 0.3s ease forwards",
            }}
          >
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* ── LOADING SKELETON ── */}
        {loading && <SkeletonCard />}

        {/* ── VIDEO INFO CARD ── */}
        {!loading && videoInfo && (
          <VideoPreviewCard
            info={videoInfo}
            onDownload={handleDownload}
            downloadingFormat={downloadingFormat}
          />
        )}

        {/* ── PLATFORM CAPABILITIES ── */}
        {!videoInfo && !loading && <StatsRow />}

        {/* ── HISTORY ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowHistory((s) => !s)}
              id="btn-history-toggle"
              className="flex items-center gap-2 text-sm font-semibold text-dark-200 hover:text-white transition-colors"
            >
              <Clock className="w-4 h-4" />
              Riwayat Unduhan
              {history.length > 0 && (
                <span
                  className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                  style={{
                    background: "rgba(124,58,237,0.3)",
                    color: "#a78bfa",
                  }}
                >
                  {history.length}
                </span>
              )}
              <ChevronDown
                className={`w-4 h-4 transition-transform ${showHistory ? "rotate-180" : ""}`}
              />
            </button>
            {history.length > 0 && showHistory && (
              <button
                onClick={handleClearHistory}
                className="text-xs text-dark-300 hover:text-red-400 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                Hapus Semua
              </button>
            )}
          </div>

          {showHistory && (
            <div
              className="space-y-2"
              style={{ animation: "slide-up 0.3s ease forwards" }}
            >
              {history.length === 0 ? (
                <div className="text-center py-8 text-dark-400 text-sm">
                  Belum ada riwayat unduhan.
                </div>
              ) : (
                history.map((item) => (
                  <HistoryItem
                    key={item.id}
                    item={item}
                    onReuse={handleReuseUrl}
                    onDelete={handleDeleteHistory}
                  />
                ))
              )}
            </div>
          )}
        </div>

        {/* ── FOOTER ── */}
        <footer
          className="text-center pt-4 border-t"
          style={{ borderColor: "rgba(255,255,255,0.05)" }}
        >
          <div className="flex items-center justify-center gap-4 text-[11px] text-dark-400">
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3" /> Aman & Privat
            </span>
            <span className="w-px h-3 bg-dark-600" />
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3" /> Cepat
            </span>
            <span className="w-px h-3 bg-dark-600" />
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3" /> 3 Platform
            </span>
          </div>
          <p className="mt-2 text-[11px] text-dark-500">
            VidSave • Gunakan sesuai hak cipta yang berlaku
          </p>
        </footer>
      </div>
    </div>
  );
}
