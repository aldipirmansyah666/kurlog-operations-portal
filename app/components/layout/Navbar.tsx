'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PackageSearch, ShoppingBag, AlertTriangle } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Monitoring Resi', icon: PackageSearch },
  { href: '/bagging', label: 'Otomasi Bagging', icon: ShoppingBag },
  { href: '/bailout', label: 'Informasi Bailout', icon: AlertTriangle },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 bg-[#090d16]/80 backdrop-blur-xl border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center">
            <PackageSearch className="w-4.5 h-4.5 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white tracking-tight">
              KurLog <span className="text-cyan-400 font-normal">Portal</span>
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="Online" />
          </div>
        </Link>

        <nav className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800/80">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
