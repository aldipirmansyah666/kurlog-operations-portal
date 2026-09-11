import './globals.css';
import LayoutShell from './components/layout/LayoutShell';
import { Inter, JetBrains_Mono } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata = {
  title: 'Cult Flow — Operations Portal',
  description: 'Premium Enterprise Dashboard untuk monitoring resi, data loket & reconcile KurLog.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="scroll-smooth">
      <body className={`${inter.variable} ${jetbrainsMono.variable} bg-slate-50 text-slate-900 min-h-screen flex flex-col font-sans antialiased selection:bg-indigo-100 selection:text-indigo-900`}>
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
