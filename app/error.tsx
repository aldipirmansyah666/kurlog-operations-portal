'use client';

import { AlertTriangle, RefreshCcw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-lg mx-auto p-6 md:p-10">
      <div className="bg-slate-900/70 rounded-xl border border-slate-800/80 p-8 text-center space-y-4">
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 inline-block">
          <AlertTriangle className="w-8 h-8 text-rose-400" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-white">Terjadi Kesalahan</h2>
          <p className="text-sm text-slate-400 mt-1">
            {error.message || 'Terjadi kesalahan yang tidak terduga.'}
          </p>
        </div>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors cursor-pointer"
        >
          <RefreshCcw className="w-4 h-4" />
          Coba Lagi
        </button>
      </div>
    </div>
  );
}
