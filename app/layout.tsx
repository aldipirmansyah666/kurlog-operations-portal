import './globals.css';
import LayoutShell from './components/layout/LayoutShell';
import { Inter, JetBrains_Mono } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
});

export const metadata = {
  title: 'Cult Portal',
  description: 'Sistem Terpadu Monitoring & Otomasi CS',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={`${inter.variable} ${jetbrainsMono.variable} bg-[#F1F5F9] text-slate-800 min-h-screen flex flex-col font-sans antialiased`}>
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
