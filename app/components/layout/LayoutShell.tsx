'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';

const HIDE_NAV_ROUTES = ['/login'];

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNav = HIDE_NAV_ROUTES.some((r) => pathname.startsWith(r));

  return (
    <>
      {!hideNav && <Navbar />}
      <main className="flex-1 pb-8">{children}</main>
      {!hideNav && <Footer />}
    </>
  );
}
