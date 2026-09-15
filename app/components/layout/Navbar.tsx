'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  PackageSearch,
  ShoppingBag,
  AlertTriangle,
  FileCheck,
  Users,
  LogOut,
  Shield,
  Database,
  Layers,
  Menu,
  X,
  ChevronDown,
  ScrollText,
  MessageSquare,
  Megaphone,
} from 'lucide-react';

interface UserInfo {
  name: string;
  username: string;
  role: 'ADMIN' | 'USER';
}

const NAV_ITEMS = [
  { href: '/', label: 'Monitoring', icon: PackageSearch },
  { href: '/data-lengkap-utama', label: 'Data Utama', icon: Layers },
  { href: '/data-lengkap', label: 'Data Loket', icon: Database },
  { href: '/bagging', label: 'Bagging', icon: ShoppingBag },
  { href: '/bailout', label: 'Bailout', icon: AlertTriangle },
  { href: '/reconcile', label: 'Reconcile', icon: FileCheck },
  { href: '/logs', label: 'WA Logs', icon: ScrollText },
  { href: '/chat', label: 'CS Inbox', icon: MessageSquare },
  { href: '/broadcast', label: 'Broadcast', icon: Megaphone },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/auth/me', { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch((e) => {
        if (e?.name !== 'AbortError') console.error(e);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false);
    };
    if (showDropdown) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [showDropdown]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-[56px] items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm group-hover:bg-indigo-700 transition-colors">
                <PackageSearch className="h-[18px] w-[18px] text-white" />
              </div>
              <div className="leading-none">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[15px] font-bold tracking-tight text-slate-900">Cult</span>
                  <span className="text-[15px] font-light tracking-tight text-slate-500">Flow</span>
                  <span className="hidden sm:inline-flex ml-1 px-1.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-[9px] font-bold tracking-widest text-indigo-700">OPS</span>
                </div>
                <span className="text-[10px] font-medium tracking-widest text-slate-500 uppercase">Operations Portal</span>
              </div>
            </Link>

            {/* Desktop nav — light */}
            <nav className="hidden lg:flex items-center gap-1 rounded-full bg-slate-50 p-1 border border-slate-200">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || (href !== '/' && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`relative inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-tight transition-all duration-150 focus-visible:ring-2 focus-visible:ring-indigo-500 active:scale-[0.98] ${
                      active
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${active ? 'text-white' : 'text-slate-400'}`} />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            {user && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown((v) => !v)}
                  className="group inline-flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-full bg-white border border-slate-200 shadow-sm hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98] transition-all duration-150 focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
                >
                  <div className="h-7 w-7 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                    {user.role === 'ADMIN' ? (
                      <Shield className="h-3.5 w-3.5 text-white" />
                    ) : (
                      <span className="text-[11px] font-bold">{user.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="hidden sm:block text-left leading-none pr-1">
                    <div className="text-xs font-semibold tracking-tight text-slate-900">{user.name}</div>
                    <div className="text-[10px] font-medium text-slate-500">{user.role}</div>
                  </div>
                  <ChevronDown className={`hidden sm:block h-3.5 w-3.5 text-slate-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-lg z-50 overflow-hidden animate-slide-in">
                    <div className="p-4 bg-slate-50 border-b border-slate-200">
                      <p className="text-sm font-semibold tracking-tight text-slate-900">{user.name}</p>
                      <p className="text-xs font-mono text-slate-500">{user.username}</p>
                      <span className={`mt-2 inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold tracking-widest border ${user.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        {user.role}
                      </span>
                    </div>
                    <div className="p-1.5">
                      {user.role === 'ADMIN' && (
                        <Link
                          href="/admin/users"
                          onClick={() => setShowDropdown(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                        >
                          <Users className="h-3.5 w-3.5 text-slate-400" /> Manajemen Pengguna
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <LogOut className="h-3.5 w-3.5" /> Keluar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 hover:border-slate-300 active:scale-[0.98] transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="lg:hidden pb-4 animate-fade-in">
            <nav className="grid grid-cols-2 gap-2 p-2 rounded-2xl bg-slate-50 border border-slate-200">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold active:scale-[0.98] transition-all ${active ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-100'}`}
                  >
                    <Icon className="h-4 w-4" /> {label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
