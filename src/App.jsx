import { useState, useEffect, useRef, useCallback } from "react";
import {
  Link2,
  X,
  Search,
  Clock,
  Trash2,
  AlertCircle,
  Loader2,
  Clipboard,
  ChevronDown,
  Zap,
  Shield,
  Globe,
  CheckCircle2,
} from "lucide-react";
import axios from "axios";
import BackgroundOrbs from "./components/BackgroundOrbs.jsx";
import PlatformPill from "./components/PlatformPill.jsx";
import SkeletonCard from "./components/SkeletonCard.jsx";
import VideoPreviewCard from "./components/VideoPreviewCard.jsx";
import HistoryItem from "./components/HistoryItem.jsx";
import StatsRow from "./components/StatsRow.jsx";
import { PlatformIcon } from "./components/icons.jsx";
import { PLATFORM_CONFIG, detectPlatform } from "./config/platforms.js";

const HISTORY_KEY = "vidsave_history";
const HISTORY_LIMIT = 20;
const API_BASE = "/api";

export default function App() {
  const [url, setUrl] = useState("");
  const [platform, setPlatform] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [videoInfo, setVideoInfo] = useState(null);
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
  // Format label queued by "Ambil ulang" in history, consumed when info reloads.
  const [autoFormat, setAutoFormat] = useState(null);

  const inputRef = useRef(null);
  const toastTimerRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    axios
      .get(`${API_BASE}/health`)
      .then((res) => setBackendStatus(res.data.status === "ok" ? "ok" : "offline"))
      .catch(() => setBackendStatus("offline"));
  }, []);

  useEffect(() => {
    return () => clearTimeout(toastTimerRef.current);
  }, []);

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
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMsg(null), duration);
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
    inputRef.current?.focus();
  }, []);

  const fetchInfo = useCallback(async (target) => {
    const trimmed = target.trim();
    if (!trimmed) return;

    if (!detectPlatform(trimmed)) {
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
      setError(
        err.response?.data?.error ||
          "Gagal mengambil info video. Periksa link dan coba lagi.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFetch = useCallback(
    (e) => {
      e?.preventDefault();
      fetchInfo(url);
    },
    [fetchInfo, url],
  );

  // Hand the file to the browser's own download manager. No fetch, no polling
  // and no Blob: the browser streams it to disk while showing its own progress,
  // which also means cancel/resume come for free.
  const handleDownload = useCallback(
    (format) => {
      if (!videoInfo) return;

      const params = new URLSearchParams({
        url: videoInfo.originalUrl,
        platform: videoInfo.platform,
        formatSelector: format.formatSelector || "",
        directUrl: format.directUrl || "",
        type: format.type || "video",
        ext: format.ext || "mp4",
        title: videoInfo.title || "video",
      });

      const a = document.createElement("a");
      a.href = `${API_BASE}/download?${params.toString()}`;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

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
        ...prev.slice(0, HISTORY_LIMIT - 1),
      ]);
      showToast(
        "Unduhan dimulai — pantau progress di browser (Ctrl+J / notifikasi HP).",
        5000,
      );
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

  const handleRedownload = useCallback(
    (item) => {
      handleReuseUrl(item.url);
      setAutoFormat(item.format);
    },
    [handleReuseUrl],
  );

  // "Ambil ulang" from history: once the fresh info lands, restart the same format.
  useEffect(() => {
    if (!autoFormat || !videoInfo) return;
    const match = videoInfo.formats?.find(
      (f) => f.label === autoFormat || f.id === autoFormat,
    );
    setAutoFormat(null);
    if (match) handleDownload(match);
  }, [autoFormat, videoInfo, handleDownload]);

  const handleDeleteHistory = useCallback((id) => {
    setHistory((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const handleClearHistory = useCallback(() => {
    setHistory([]);
    showToast("Riwayat dihapus.");
  }, [showToast]);

  return (
    <div className="relative min-h-screen flex flex-col" style={{ background: "#070709" }}>
      <BackgroundOrbs />

      {toastMsg && (
        <div
          role="status"
          aria-live="polite"
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

      <div className="relative z-10 w-full max-w-3xl mx-auto px-4 py-10 space-y-8 flex-1 flex flex-col">
        {/* ── HEADER ── */}
        <header className="text-center space-y-4">
          <div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-none">
              Vid<span className="gradient-text-main">Save</span>
            </h1>
            <p className="mt-3 text-sm text-dark-200 max-w-sm mx-auto leading-relaxed">
              Download video dari YouTube, Instagram &amp; TikTok — pilih kualitas,
              format, tanpa watermark.
            </p>
            <div className="mt-4 flex justify-center">
              <div className="flex items-center gap-3 px-4 py-2 glass-pill rounded-full">
                <div className="flex -space-x-1">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-[#070709]" style={{ background: "#ff0000" }}>
                    <PlatformIcon platform="youtube" className="w-3 h-3 text-white" />
                  </div>
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-[#070709]"
                    style={{ background: "linear-gradient(135deg,#fd1d1d,#e1306c,#833ab4)" }}
                  >
                    <PlatformIcon platform="instagram" className="w-3 h-3 text-white" />
                  </div>
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-[#070709]"
                    style={{ background: "linear-gradient(135deg,#00f2ea,#ff0050)" }}
                  >
                    <PlatformIcon platform="tiktok" className="w-3 h-3 text-white" />
                  </div>
                </div>
                <span className="text-xs font-semibold text-dark-200">
                  3-in-1 Video Downloader
                </span>
              </div>
            </div>
          </div>

          {backendStatus === "offline" && (
            <div
              role="status"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs text-yellow-400 mx-auto"
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
        <div className="glass rounded-2xl p-5">
          <form onSubmit={handleFetch} className="space-y-3">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                {platform ? (
                  <div style={{ color: PLATFORM_CONFIG[platform].accent }}>
                    <PlatformIcon platform={platform} className="w-5 h-5" />
                  </div>
                ) : (
                  <Link2 className="w-5 h-5 text-dark-400" />
                )}
              </div>
              <label htmlFor="url-input" className="sr-only">
                Link video YouTube, Instagram, atau TikTok
              </label>
              <input
                ref={inputRef}
                id="url-input"
                type="text"
                inputMode="url"
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg text-dark-400 hover:text-white hover:bg-white/10 transition-all"
                  aria-label="Hapus link"
                  title="Hapus link"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

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

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handlePaste}
                id="btn-paste"
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium text-dark-200 surface hover:text-white transition-all flex-shrink-0"
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

        {error && (
          <div
            role="alert"
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

        {loading && <SkeletonCard />}

        {!loading && videoInfo && (
          <VideoPreviewCard info={videoInfo} onDownload={handleDownload} />
        )}

        {!videoInfo && !loading && <StatsRow />}

        {/* ── HISTORY ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowHistory((s) => !s)}
              id="btn-history-toggle"
              aria-expanded={showHistory}
              aria-controls="history-list"
              className="flex items-center gap-2 text-sm font-semibold text-dark-200 hover:text-white transition-colors"
            >
              <Clock className="w-4 h-4" />
              Riwayat Unduhan
              {history.length > 0 && (
                <span
                  className="px-1.5 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: "rgba(124,58,237,0.3)", color: "#c4b5fd" }}
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
                type="button"
                onClick={handleClearHistory}
                className="text-xs text-dark-300 hover:text-red-400 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                Hapus Semua
              </button>
            )}
          </div>

          {showHistory && (
            <ul
              id="history-list"
              className="space-y-2"
              style={{ animation: "slide-up 0.3s ease forwards" }}
            >
              {history.length === 0 ? (
                <li className="text-center py-8 text-dark-300 text-sm surface rounded-xl">
                  Belum ada riwayat unduhan.
                </li>
              ) : (
                history.map((item) => (
                  <HistoryItem
                    key={item.id}
                    item={item}
                    onReuse={handleRedownload}
                    onDelete={handleDeleteHistory}
                  />
                ))
              )}
            </ul>
          )}
        </div>

        {/* ── FOOTER ── */}
        <footer
          className="mt-auto pt-8 border-t"
          style={{ borderColor: "rgba(255,255,255,0.05)" }}
        >
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-dark-400">
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3" /> Aman &amp; Privat
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
          <p className="mt-3 text-xs text-dark-500 text-center">
            VidSave • Gunakan sesuai hak cipta yang berlaku
          </p>
        </footer>
      </div>
    </div>
  );
}
