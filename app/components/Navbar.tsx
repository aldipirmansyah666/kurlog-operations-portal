'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="bg-slate-900/80 border-b border-slate-800 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl p-2 bg-blue-600/20 border border-blue-500/30 rounded-xl">⚡</span>
          <div>
            <h1 className="text-lg font-black text-white tracking-tight">KurLog Operations Portal</h1>
            <p className="text-slate-400 text-xs">Sistem Terpadu Monitoring & Otomasi CS</p>
          </div>
        </div>

        {/* Menu Navigasi Per Page */}
        <nav className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800/80 gap-1">
          <Link
            href="/"
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              pathname === '/'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            📦 Monitoring Resi
          </Link>
          <Link
            href="/bagging"
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              pathname === '/bagging'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🛍️ Otomasi Bagging WA
          </Link>
        </nav>
      </div>
    </header>
  );
}