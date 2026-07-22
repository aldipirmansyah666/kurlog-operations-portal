export function TableSkeleton({ rows = 8, cols = 10 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden">
      <div className="bg-slate-950/60 border-b border-slate-800">
        <div className="flex">
          {Array.from({ length: cols }).map((_, ci) => (
            <div key={ci} className="p-4 flex-1">
              <div className="h-3 w-16 bg-slate-800 rounded-md animate-pulse" />
            </div>
          ))}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, ri) => (
        <div
          key={ri}
          className="flex border-b border-slate-800/50"
          style={{ animationDelay: `${ri * 50}ms` }}
        >
          {Array.from({ length: cols }).map((_, ci) => (
            <div key={ci} className="p-4 flex-1">
              <div className="h-3 bg-slate-800/80 rounded-md animate-pulse" style={{ width: `${50 + Math.random() * 40}%` }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-slate-900/70 p-5 rounded-xl border border-slate-800/80 animate-pulse">
      <div className="h-3 w-24 bg-slate-800 rounded-md mb-3" />
      <div className="h-8 w-16 bg-slate-800 rounded-md" />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-slate-900/70 p-5 rounded-xl border border-slate-800/80 animate-pulse space-y-4">
      <div className="h-3 w-40 bg-slate-800 rounded-md" />
      <div className="h-64 w-full flex items-center justify-center">
        <div className="w-32 h-32 rounded-full bg-slate-800/60" />
      </div>
    </div>
  );
}
