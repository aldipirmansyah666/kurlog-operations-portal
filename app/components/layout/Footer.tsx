export default function Footer() {
  return (
    <footer className="border-t border-[#E2E8F0] bg-white/50 py-5">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-[11px] text-slate-400">
        <p>&copy; {new Date().getFullYear()} KurLog Operations Portal</p>
        <p className="text-slate-400">Developed by Aldi</p>
      </div>
    </footer>
  );
}
