import './globals.css';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
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
  title: 'KurLog Operations Portal',
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
        <Navbar />
        <main className="flex-1 pb-8">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
