import { YoutubeIcon, InstagramIcon, TikTokIcon } from "./icons.jsx";

const CAPABILITIES = [
  {
    label: "YouTube",
    desc: "1080p · 720p · 480p · MP3",
    color: "#ff0000",
    bg: "rgba(255,0,0,0.08)",
    Icon: YoutubeIcon,
  },
  {
    label: "Instagram",
    desc: "Reels · Posts · Stories",
    color: "#e1306c",
    bg: "rgba(225,48,108,0.08)",
    Icon: InstagramIcon,
  },
  {
    label: "TikTok",
    desc: "No Watermark · MP3",
    color: "#00f2ea",
    bg: "rgba(0,242,234,0.08)",
    Icon: TikTokIcon,
  },
];

// P1-9: these used the same heavy glass treatment as the interactive cards,
// which flattened the difference between decorative and actionable surfaces.
// Now a flat `.surface` treatment, and it doubles as the empty state for the
// results area.
export default function StatsRow() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {CAPABILITIES.map((item) => (
          <div
            key={item.label}
            className="surface rounded-xl p-4 text-center"
            style={{ borderColor: `${item.color}22` }}
          >
            <div className="flex justify-center mb-2">
              <div className="p-2 rounded-lg" style={{ background: item.bg }}>
                <item.Icon className="w-5 h-5" style={{ color: item.color }} />
              </div>
            </div>
            <p className="text-sm font-bold text-white">{item.label}</p>
            <p className="text-xs text-dark-300 mt-0.5">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
