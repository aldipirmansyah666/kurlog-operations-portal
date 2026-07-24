import Link from 'next/link';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="max-w-lg mx-auto p-6 md:p-10">
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-8 text-center space-y-4 shadow-sm">
        <h2 className="text-4xl font-bold text-slate-200">404</h2>
        <p className="text-sm text-slate-400">Halaman yang Anda cari tidak ditemukan.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#1E293B] hover:bg-slate-700 rounded-lg transition-colors"
        >
          <Home className="w-4 h-4" />
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
