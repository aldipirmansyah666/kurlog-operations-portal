'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PackageSearch, ShoppingBag } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 bg-[#090d16]/80 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* LOGO & BRANDING */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <PackageSearch className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                KurLog <span className="text-cyan-400 font-light">Portal</span>
              </h1>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                LIVE
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Sistem Terpadu Monitoring & Otomasi CS</p>
          </div>
        </Link>

        {/* NAVIGATION TABS */}
        <nav className="flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800/80">
          <Link
            href="/"
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              pathname === '/'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <PackageSearch className="w-4 h-4" />
            <span>Monitoring Resi</span>
          </Link>

          <Link
            href="/bagging"
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              pathname === '/bagging'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Otomasi Bagging WA</span>
          </Link>
        </nav>

      </div>
    </header>
  );
}