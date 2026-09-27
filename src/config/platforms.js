// Single source of truth for platform branding.
// Previously these hex values were duplicated in PLATFORM_CONFIG (JS) and in
// .badge-yt / .badge-ig / .badge-tt (CSS), which drifted apart. Everything now
// derives from here; the stylesheet no longer hardcodes platform colours.

export const PLATFORM_CONFIG = {
  youtube: {
    name: "YouTube",
    color: "#ff0000",
    accent: "#ff4444",
    gradient: "linear-gradient(135deg, #ff0000, #cc0000)",
    glow: "rgba(255,0,0,0.3)",
    badgeBg:
      "linear-gradient(135deg, rgba(255,0,0,0.22) 0%, rgba(180,0,0,0.12) 100%), rgba(30,10,10,0.6)",
    badgeBorder: "rgba(255,70,70,0.35)",
    badgeText: "#ff6b6b",
  },
  instagram: {
    name: "Instagram",
    color: "#e1306c",
    accent: "#e1306c",
    gradient: "linear-gradient(135deg, #fd1d1d, #e1306c, #833ab4)",
    glow: "rgba(225,48,108,0.3)",
    badgeBg:
      "linear-gradient(135deg, rgba(225,48,108,0.22) 0%, rgba(131,58,180,0.12) 100%), rgba(30,10,25,0.6)",
    badgeBorder: "rgba(247,119,55,0.35)",
    badgeText: "#f472b6",
  },
  tiktok: {
    name: "TikTok",
    color: "#00f2ea",
    accent: "#00f2ea",
    gradient: "linear-gradient(135deg, #00f2ea, #ff0050)",
    glow: "rgba(0,242,234,0.3)",
    badgeBg:
      "linear-gradient(135deg, rgba(0,242,234,0.2) 0%, rgba(255,0,80,0.12) 100%), rgba(10,25,30,0.6)",
    badgeBorder: "rgba(0,242,234,0.35)",
    badgeText: "#22d3ee",
  },
};

export const SUPPORTED_PLATFORMS = Object.keys(PLATFORM_CONFIG);

export function detectPlatform(url) {
  if (/youtube\.com|youtu\.be/i.test(url)) return "youtube";
  if (/instagram\.com/i.test(url)) return "instagram";
  if (/tiktok\.com/i.test(url)) return "tiktok";
  return null;
}
