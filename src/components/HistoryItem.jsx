import { RotateCcw, Trash2, Film, Download } from "lucide-react";
import PlatformPill from "./PlatformPill.jsx";
import { timeAgo } from "../utils/format.js";

export default function HistoryItem({ item, onReuse, onDelete }) {
  return (
    <li
      className="surface rounded-xl p-3 flex items-center gap-3 group card-hover"
      style={{ animation: "fade-in 0.3s ease forwards" }}
    >
      <div
        className="relative flex-shrink-0 rounded-lg overflow-hidden"
        style={{ width: 56, height: 36, background: "#1a1a28" }}
      >
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt=""
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

      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-white truncate">{item.title}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <PlatformPill platform={item.platform} />
          {item.format && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ background: "rgba(255,255,255,0.06)", color: "#cbd5e1" }}
            >
              <Download className="w-3 h-3" />
              {item.format}
            </span>
          )}
          <span className="text-xs text-dark-300">{timeAgo(item.timestamp)}</span>
        </div>
      </div>

      {/* Always visible: hover-only reveal made these unreachable on touch
          devices and via keyboard. */}
      <div className="flex items-center gap-1 opacity-60 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <button
          type="button"
          onClick={() => onReuse(item.url)}
          className="p-2 rounded-lg text-dark-200 hover:text-white hover:bg-white/10 transition-all"
          title="Ambil ulang"
          aria-label={`Ambil ulang: ${item.title}`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          className="p-2 rounded-lg text-dark-200 hover:text-red-400 hover:bg-red-500/10 transition-all"
          title="Hapus"
          aria-label={`Hapus riwayat: ${item.title}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </li>
  );
}
