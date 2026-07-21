import './globals.css';
import Navbar from './components/Navbar';

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
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col justify-between font-sans antialiased">
        {/* Navbar Atas */}
        <div>
          <Navbar />
          <main className="pb-12">{children}</main>
        </div>

        {/* Footer */}
        <footer className="border-t border-slate-800/80 bg-slate-900/40 py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>© {new Date().getFullYear()} KurLog Operations Portal. All rights reserved.</p>
            <p className="flex items-center gap-1 font-medium text-slate-400">
              Developed by <span className="text-blue-400 font-semibold">Aldi</span>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}