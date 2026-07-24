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
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-8 text-center space-y-4 shadow-sm">
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 inline-block">
          <AlertTriangle className="w-8 h-8 text-rose-400" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-800">Terjadi Kesalahan</h2>
          <p className="text-sm text-slate-400 mt-1">
            {error.message || 'Terjadi kesalahan yang tidak terduga.'}
          </p>
        </div>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#1E293B] hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
        >
          <RefreshCcw className="w-4 h-4" />
          Coba Lagi
        </button>
      </div>
    </div>
  );
}
