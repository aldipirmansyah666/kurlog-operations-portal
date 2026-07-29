'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { PackageSearch, ShoppingBag, AlertTriangle, FileCheck, Users, LogOut, Shield, Database } from 'lucide-react';

interface UserInfo {
  name: string;
  username: string;
  role: 'ADMIN' | 'USER';
}

const NAV_ITEMS = [
  { href: '/', label: 'Monitoring Resi', icon: PackageSearch },
  { href: '/data-lengkap', label: 'Data Lengkap', icon: Database },
  { href: '/bagging', label: 'Otomasi Bagging', icon: ShoppingBag },
  { href: '/bailout', label: 'Informasi Bailout', icon: AlertTriangle },
  { href: '/reconcile', label: 'Reconcile', icon: FileCheck },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data?.user) setUser(data.user); })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-[#E2E8F0] shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-[#1E293B] flex items-center justify-center">
            <PackageSearch className="w-4.5 h-4.5 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-800 tracking-tight">
              Cult <span className="text-slate-400 font-normal">Flow</span>
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

        {/* User Menu */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-[#1E293B] flex items-center justify-center">
                {user.role === 'ADMIN' ? (
                  <Shield className="w-3.5 h-3.5 text-violet-400" />
                ) : (
                  <span className="text-[10px] font-bold text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <span className="hidden md:inline">{user.name}</span>
            </button>

            {showDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl border border-[#E2E8F0] shadow-xl z-50 py-1 animate-fade-in">
                  <div className="px-3 py-2 border-b border-[#E2E8F0]">
                    <p className="text-xs font-semibold text-slate-800">{user.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{user.username}</p>
                    <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                      user.role === 'ADMIN'
                        ? 'bg-violet-50 text-violet-600'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                  {user.role === 'ADMIN' && (
                    <Link
                      href="/admin/users"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      <Users className="w-3.5 h-3.5" />
                      Manajemen Pengguna
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Keluar
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
