export default function Footer() {
  return (
    <footer className="w-full mt-auto border-t border-slate-200/70 bg-white/70 backdrop-blur-xl">
      <div className="max-w-[1440px] mx-auto py-5 px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-3 text-xs leading-none">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-semibold tracking-tight text-slate-900">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Cult Flow
          </div>
          <span className="h-3 w-px bg-slate-200 hidden sm:block" />
          <span className="text-slate-500 tracking-tight">&copy; 2026 Cult System — Operations & Reconcile Engine</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 text-white text-[10px] font-medium tracking-widest uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
          </span>
          <span className="text-slate-400">
            Crafted by <strong className="text-slate-700 font-semibold">Aldi Pirmansyah</strong>
          </span>
          <span className="px-2 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono text-[10px] font-semibold tracking-wide">
            v1.2.0
          </span>
        </div>
      </div>
    </footer>
  );
}
