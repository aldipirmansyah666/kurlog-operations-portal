import Link from 'next/link';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="max-w-lg mx-auto p-6 md:p-10">
      <div className="bg-slate-900/70 rounded-xl border border-slate-800/80 p-8 text-center space-y-4">
        <h2 className="text-4xl font-bold text-slate-700">404</h2>
        <p className="text-sm text-slate-400">Halaman yang Anda cari tidak ditemukan.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
        >
          <Home className="w-4 h-4" />
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
