export default function Footer() {
  return (
    <footer className="border-t border-slate-800/60 bg-slate-900/30 py-5">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-[11px] text-slate-500">
        <p>&copy; {new Date().getFullYear()} KurLog Operations Portal</p>
        <p className="text-slate-600">Sistem Terpadu Monitoring &amp; Otomasi CS</p>
      </div>
    </footer>
  );
}
