export function TableSkeleton({ rows = 8, cols = 10 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="bg-slate-50/70 border-b border-slate-200">
        <div className="flex">
          {Array.from({ length: cols }).map((_, ci) => (
            <div key={ci} className="p-4 flex-1">
              <div className="h-3 w-16 bg-slate-200 rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, ri) => (
        <div key={ri} className="flex border-b border-slate-100 last:border-0" style={{ animationDelay: `${ri * 40}ms` }}>
          {Array.from({ length: cols }).map((_, ci) => (
            <div key={ci} className="p-4 flex-1">
              <div className="h-3 bg-slate-100 rounded-full animate-pulse" style={{ width: `${48 + ((ri * 7 + ci * 13) % 42)}%` }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-5 animate-pulse">
      <div className="h-1 w-full bg-slate-100 rounded-full mb-4" />
      <div className="h-3 w-28 bg-slate-100 rounded-full mb-3" />
      <div className="h-8 w-20 bg-slate-100 rounded-lg" />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-6 animate-pulse space-y-4">
      <div className="h-3 w-40 bg-slate-100 rounded-full" />
      <div className="h-64 flex items-center justify-center">
        <div className="h-32 w-32 rounded-full bg-slate-100" />
      </div>
    </div>
  );
}
