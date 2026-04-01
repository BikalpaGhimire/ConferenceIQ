export function Skeleton({ className = '', lines = 1 }) {
  return (
    <div className={className}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton h-4 mb-2 last:mb-0"
          style={{ width: i === lines - 1 && lines > 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-card rounded-xl p-5 animate-fade-in">
      <div className="flex items-start gap-4">
        <div className="skeleton w-16 h-16 rounded-full shrink-0" />
        <div className="flex-1">
          <div className="skeleton h-5 w-48 mb-2" />
          <div className="skeleton h-4 w-64 mb-1" />
          <div className="skeleton h-4 w-40" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="space-y-4 p-4">
      <div className="bg-card rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="skeleton w-20 h-20 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-6 w-56" />
            <div className="skeleton h-4 w-72" />
            <div className="skeleton h-4 w-48" />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-3/4" />
        </div>
      </div>
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-8 w-20 rounded-full" />
        ))}
      </div>
      <div className="bg-card rounded-xl p-5">
        <Skeleton lines={4} />
      </div>
    </div>
  );
}
