import './globals.css';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

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
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col font-sans antialiased">
        <Navbar />
        <main className="flex-1 pb-8">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
