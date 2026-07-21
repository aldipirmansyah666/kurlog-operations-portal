import './globals.css';
import Navbar from './components/Navbar';

export const metadata = {
  title: 'KurLog Operations Portal',
  description: 'Aplikasi Monitoring Resi dan Otomasi Pengingat Bagging WA',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="bg-[#0b0f19] text-slate-100 min-h-screen">
        <Navbar />
        {children}
      </body>
    </html>
  );
}