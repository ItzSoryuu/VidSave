// P1-13: these orbs used `animation: pulse-glow Ns infinite`, which combined
// with the `backdrop-filter` on every .glass panel forced a full re-blur of the
// whole page on each frame. They are now static (one-shot fade only), which is
// visually near-identical at blur(80px) and effectively free.

const ORBS = [
  {
    size: 500,
    top: "-10%",
    left: "-10%",
    background: "radial-gradient(circle, #ff0000 0%, transparent 70%)",
    delay: "0s",
  },
  {
    size: 600,
    top: "30%",
    right: "-15%",
    background: "radial-gradient(circle, #833ab4 0%, #e1306c 50%, transparent 70%)",
    delay: "0.2s",
  },
  {
    size: 400,
    bottom: "10%",
    left: "20%",
    background: "radial-gradient(circle, #00f2ea 0%, transparent 70%)",
    delay: "0.4s",
  },
];

export default function BackgroundOrbs() {
  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      {ORBS.map((orb, i) => (
        <div
          key={i}
          className="absolute rounded-full opacity-20"
          style={{
            width: orb.size,
            height: orb.size,
            top: orb.top,
            left: orb.left,
            right: orb.right,
            bottom: orb.bottom,
            background: orb.background,
            filter: "blur(80px)",
            animation: `fade-in 1.4s ease ${orb.delay} forwards`,
          }}
        />
      ))}
    </div>
  );
}
