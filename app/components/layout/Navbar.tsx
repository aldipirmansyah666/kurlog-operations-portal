'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PackageSearch, ShoppingBag, AlertTriangle, FileCheck } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Monitoring Resi', icon: PackageSearch },
  { href: '/bagging', label: 'Otomasi Bagging', icon: ShoppingBag },
  { href: '/bailout', label: 'Informasi Bailout', icon: AlertTriangle },
  { href: '/reconcile', label: 'Reconcile', icon: FileCheck },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-[#E2E8F0] shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-[#1E293B] flex items-center justify-center">
            <PackageSearch className="w-4.5 h-4.5 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-800 tracking-tight">
              KurLog <span className="text-slate-400 font-normal">Portal</span>
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="Online" />
          </div>
        </Link>

        <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-[#E2E8F0]">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  active
                    ? 'bg-[#1E293B] text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-white hover:border hover:border-[#E2E8F0] border border-transparent'
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
