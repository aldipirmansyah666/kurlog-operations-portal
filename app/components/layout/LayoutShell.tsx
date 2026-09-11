'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';

const HIDE_NAV_ROUTES = ['/login'];

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNav = HIDE_NAV_ROUTES.some((r) => pathname.startsWith(r));

  if (hideNav) return <>{children}</>;

  return (
    <>
      <Navbar />
      <main className="flex-1 min-h-[calc(100vh-56px-64px)] animate-page-in">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}
