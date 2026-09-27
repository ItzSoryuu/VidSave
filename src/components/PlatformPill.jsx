import { PlatformIcon } from "./icons.jsx";
import { PLATFORM_CONFIG } from "../config/platforms.js";

// P2-15: colours come from config/platforms.js, so the .badge-yt/.badge-ig/
// .badge-tt rules in the stylesheet are gone and the two lists cannot drift.
export default function PlatformPill({ platform, className = "" }) {
  if (!platform) return null;
  const cfg = PLATFORM_CONFIG[platform];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${className}`}
      style={{
        background: cfg.badgeBg,
        border: `1px solid ${cfg.badgeBorder}`,
        color: cfg.badgeText,
        boxShadow: `inset 0 1px 0 0 rgba(255,255,255,0.2), 0 0 14px -2px ${cfg.glow}`,
      }}
    >
      <PlatformIcon platform={platform} className="w-3.5 h-3.5" />
      {cfg.name}
    </span>
  );
}
