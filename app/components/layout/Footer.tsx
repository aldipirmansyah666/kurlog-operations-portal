export default function Footer() {
  return (
    <footer className="w-full mt-auto border-t border-slate-200 bg-white/60 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">

        {/* Kiri: Brand & Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-semibold text-slate-800">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Cult Flow
          </div>
          <span className="text-slate-300">&bull;</span>
          <span className="text-slate-400">&copy; 2026 Cult System. All rights reserved.</span>
        </div>

        {/* Tengah: Tagline / Status */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-600">
          <span>&#9889; Operations &amp; Reconcile Engine</span>
        </div>

        {/* Kanan: Credit & Version */}
        <div className="flex items-center gap-3">
          <span>
            Developed by{' '}
            <strong className="text-slate-700 font-semibold">Aldi Pirmansyah</strong>
          </span>
          <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 font-mono text-[10px] border border-blue-500/20">
            v1.2.0
          </span>
        </div>

      </div>
    </footer>
  );
}
