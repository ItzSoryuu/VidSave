export default function SkeletonCard() {
  return (
    <div
      className="glass rounded-2xl p-5 space-y-4"
      style={{ animation: "fade-in 0.3s ease" }}
      aria-hidden="true"
    >
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="skeleton rounded-xl flex-shrink-0 w-full sm:w-40" style={{ aspectRatio: "16 / 10" }} />
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
