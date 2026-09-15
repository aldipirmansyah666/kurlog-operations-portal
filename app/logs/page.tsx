'use client';

import { useState, useMemo } from 'react';
import {
  ScrollText,
  Search,
  Filter,
  Calendar,
  Eye,
  RotateCcw,
  X,
  Send,
  CheckCircle2,
  Clock,
  XCircle,
  MessageSquare,
  ShoppingBag,
  AlertTriangle,
  FileCheck,
} from 'lucide-react';
import StatCard from '@/app/components/ui/StatCard';
import Pagination from '@/app/components/ui/Pagination';
import Modal from '@/app/components/ui/Modal';
import EmptyState from '@/app/components/ui/EmptyState';
import ToastContainer from '@/app/components/ui/Toast';
import { usePagination } from '@/lib/hooks/usePagination';
import { useToast } from '@/lib/hooks/useToast';
import type { WaLog, WaLogType, WaLogStatus } from '@/lib/types';

// ---------------------------------------------------------------------------
// Mock Data Dummy untuk Pengembangan UI
// ---------------------------------------------------------------------------
const MOCK_LOGS: WaLog[] = [
  {
    id: 'log-001',
    sentAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    type: 'Bagging',
    agenName: 'CIPTA USAHA MAKMUR',
    kodeLoket: 'SBPAYS-CA-001',
    waNumber: '+62 822-1756-9689',
    message:
      'Selamat pagi pak, mohon maaf mengganggu waktunya pak, kami sampaikan ada paket di agen bapak CIPTA USAHA MAKMUR pada Tanggal 14/09/2026 yang belum dibagging ya pak?\nMohon dibantu untuk segera dibagging.\n\nBerikut informasi resinya :\nP260012345678\nP260087654321\n\nSilahkan abaikan pesan ini apabila sudah melakukan bagging dan apabila terdapat Pertanyaan / kendala silahkan hubungi nomor +62 822-1756-9689 / +62 819-1066-6926.\nDemi keamanan dan kenyamanan, mohon simpan nomor ini sebagai KONTAK di HP Anda.\n\n--- \n_Ref: BGG-A1B2C3 | 09:12 WIB_',
    status: 'Sent',
  },
  {
    id: 'log-002',
    sentAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    type: 'Bailout',
    agenName: 'CV. MITRA PERDANA INDONESIA (MPI)',
    kodeLoket: 'SBPAYS-CV-MPI-00',
    waNumber: '+62 812-3456-7890',
    message:
      "Assalamu'alaikum Warahmatullahi Wabarakatuh,\nDear Kang Diwa & Mas Endi\n\nBerikut kami sampaikan minus pada tanggal 13 September 2026 sebesar Rp - 1.507.495.541\n\nMohon bantuan pelimpahannya sebelum pukul 09.00 WIB.\n\nHatur Nuhun 🙏",
    status: 'Sent',
  },
  {
    id: 'log-003',
    sentAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    type: 'Bailout',
    agenName: 'HAFSAH & BROTHERS',
    kodeLoket: 'PP002',
    waNumber: '+62 819-1066-6926',
    message:
      "Assalamu'alaikum Warahmatullahi Wabarakatuh,\nDear Team HAFSAH & BROTHERS\n\nBerikut kami sampaikan minus pada tanggal 13 September 2026 sebesar Rp 1.234.567\n\nMohon bantuan pelimpahannya (setor ke bank jika memungkinkan atau via internet banking) untuk menghindari penumpukan di hari Senin.",
    status: 'Pending',
  },
  {
    id: 'log-004',
    sentAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    type: 'Bagging',
    agenName: 'TOKO SUMBER REJEKI',
    kodeLoket: 'SBPAYS-TSR-012',
    waNumber: '+62 853-1122-3344',
    message:
      'Halo pak, izin mengganggu waktunya pak, kami sampaikan ada paket di agen bapak TOKO SUMBER REJEKI pada Tanggal 14/09/2026 yang belum dibagging ya pak?\nBoleh dibantu untuk segera diproses bagging ya pak.\n\nBerikut informasi resinya :\nSHPE1234567890\n\nSilahkan abaikan pesan ini apabila sudah melakukan bagging dan apabila terdapat Pertanyaan / kendala silahkan hubungi nomor +62 822-1756-9689 / +62 819-1066-6926.\nDemi keamanan dan kenyamanan, mohon simpan nomor ini sebagai KONTAK di HP Anda.\n\n--- \n_Ref: BGG-X9Y8Z7 | 08:05 WIB_',
    status: 'Failed',
  },
  {
    id: 'log-005',
    sentAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    type: 'Reconcile',
    agenName: 'GUNUNGRAYA',
    kodeLoket: 'RCL-EC3-001',
    waNumber: '+62 821-9999-0001',
    message: 'Reconcile EC3: 12 resi lolos validasi (SHPE/P260), 2 ditolak. Silahkan cek dashboard Reconcile untuk detail.',
    status: 'Sent',
  },
  {
    id: 'log-006',
    sentAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    type: 'Follow Up',
    agenName: 'PT. TRINERGI UTAMA JAYA - TUJ',
    kodeLoket: 'RESI-AGENT-01',
    waNumber: '+62 812-7777-8888',
    message: 'Halo, follow up resi P260012345 (Agen: PT. TRINERGI UTAMA JAYA - TUJ | Status: HOLD)\nPetugas: Admin\nCatatan: FU ke-2 via WA, pembeli belum respon\nMohon konfirmasi.',
    status: 'Pending',
  },
  {
    id: 'log-007',
    sentAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    type: 'Bagging',
    agenName: 'AGUSONO',
    kodeLoket: 'SBPAYS-AGS-009',
    waNumber: '+62 812-0000-1111',
    message:
      'Semangat pagi pak, maaf mengganggu waktunya sebentar pak, kami sampaikan ada paket di agen bapak AGUSONO pada Tanggal 15/09/2026 yang belum dibagging ya pak?\nMohon bantuannya untuk diproses bagging hari ini.\n\nBerikut informasi resinya :\nP260099988877\n\nSilahkan abaikan pesan ini apabila sudah melakukan bagging dan apabila terdapat Pertanyaan / kendala silahkan hubungi nomor +62 822-1756-9689 / +62 819-1066-6926.\nDemi keamanan dan kenyamanan, mohon simpan nomor ini sebagai KONTAK di HP Anda.\n\n--- \n_Ref: BGG-Q1W2E3 | 07:30 WIB_',
    status: 'Failed',
  },
  {
    id: 'log-008',
    sentAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    type: 'Bailout',
    agenName: 'DIKASA',
    kodeLoket: 'PP-DIK-005',
    waNumber: '+62 813-2222-3333',
    message:
      "Assalamu'alaikum Warahmatullahi Wabarakatuh,\nDear Pak Erwin\n\nBerikut kami sampaikan minus pada tanggal 12 September 2026 sebesar Rp - 750.000\n\nMohon bantuan pelimpahannya sebelum pukul 09.00 WIB.",
    status: 'Sent',
  },
  {
    id: 'log-009',
    sentAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    type: 'Reconcile',
    agenName: 'FAYAZA',
    kodeLoket: 'RCL-PKH-002',
    waNumber: '+62 822-3333-4444',
    message: 'Reconcile PKH: 8 resi valid (P260/TTSPOS), 0 ditolak. File valid / lolos check.',
    status: 'Sent',
  },
  {
    id: 'log-010',
    sentAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    type: 'Follow Up',
    agenName: 'BMAX CPY',
    kodeLoket: 'RESI-AGENT-02',
    waNumber: '+62 812-6666-5555',
    message: 'Halo, follow up resi SHPE998877 (Agen: BMAX CPY | Status: PERJALANAN)\nPetugas: CS\nCatatan: Pembeli janji ambil sore\nMohon konfirmasi.',
    status: 'Sent',
  },
  {
    id: 'log-011',
    sentAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
    type: 'Bagging',
    agenName: 'BERKAH JAYA ELEKTRIK (BJE)',
    kodeLoket: 'SBPAYS-BJE-007',
    waNumber: '+62 815-4444-5555',
    message:
      'Selamat siang pak, mohon maaf mengganggu aktivitasnya pak, kami sampaikan ada paket di agen bapak BERKAH JAYA ELEKTRIK (BJE) pada Tanggal 14/09/2026 yang belum dibagging ya pak?\nMohon dibantu untuk segera dibagging.\n\nBerikut informasi resinya :\nP260011223344\nP260055667788\nP260099001122\n\nSilahkan abaikan pesan ini apabila sudah melakukan bagging dan apabila terdapat Pertanyaan / kendala silahkan hubungi nomor +62 822-1756-9689 / +62 819-1066-6926.\nDemi keamanan dan kenyamanan, mohon simpan nomor ini sebagai KONTAK di HP Anda.\n\n--- \n_Ref: BGG-Z0Y9X8 | 10:00 WIB_',
    status: 'Pending',
  },
  {
    id: 'log-012',
    sentAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    type: 'Bailout',
    agenName: 'PT. TRINERGI UTAMA JAYA - TUJ MBI',
    kodeLoket: 'SBPAYS-TUJ-MBI',
    waNumber: '+62 812-9999-7777',
    message:
      "Assalamu'alaikum Warahmatullahi Wabarakatuh,\nDear Mitra MBI\n\nBerikut kami sampaikan minus pada tanggal 11 September 2026 sebesar Rp - 2.100.000\n\nMohon bantuan pelimpahannya sebelum pukul 09.00 WIB.",
    status: 'Failed',
  },
];

const TYPE_OPTIONS: (WaLogType | 'All')[] = ['All', 'Bagging', 'Bailout', 'Reconcile', 'Follow Up'];
const STATUS_OPTIONS: (WaLogStatus | 'All')[] = ['All', 'Sent', 'Pending', 'Failed'];

function formatWaktuKirim(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const date = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${date} • ${time} WIB`;
}

function truncateMessage(msg: string, max = 64): string {
  const single = msg.replace(/\s+/g, ' ').trim();
  if (single.length <= max) return single;
  return single.slice(0, max) + '…';
}

function StatusBadge({ status }: { status: WaLogStatus }) {
  if (status === 'Sent') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="h-3 w-3" /> Terkirim
      </span>
    );
  }
  if (status === 'Pending') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="h-3 w-3" /> Proses
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
      <XCircle className="h-3 w-3" /> Gagal
    </span>
  );
}

function TypeBadge({ type }: { type: WaLogType }) {
  const map: Record<WaLogType, { icon: typeof ShoppingBag; cls: string }> = {
    Bagging: { icon: ShoppingBag, cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    Bailout: { icon: AlertTriangle, cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    Reconcile: { icon: FileCheck, cls: 'bg-violet-50 text-violet-700 border-violet-200' },
    'Follow Up': { icon: MessageSquare, cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  };
  const cfg = map[type];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold border ${cfg.cls}`}>
      <Icon className="h-3 w-3" /> {type}
    </span>
  );
}

export default function WaLogsPage() {
  const [logs, setLogs] = useState<WaLog[]>(MOCK_LOGS);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<WaLogType | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<WaLogStatus | 'All'>('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [detailLog, setDetailLog] = useState<WaLog | null>(null);
  const { toasts, showToast, removeToast } = useToast();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((log) => {
      if (q) {
        const hay = `${log.agenName} ${log.kodeLoket} ${log.waNumber}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (typeFilter !== 'All' && log.type !== typeFilter) return false;
      if (statusFilter !== 'All' && log.status !== statusFilter) return false;
      const d = new Date(log.sentAt);
      if (dateFrom) {
        const from = new Date(dateFrom + 'T00:00:00');
        if (d < from) return false;
      }
      if (dateTo) {
        const to = new Date(dateTo + 'T23:59:59');
        if (d > to) return false;
      }
      return true;
    });
  }, [logs, search, typeFilter, statusFilter, dateFrom, dateTo]);

  const pagination = usePagination(filtered);

  const stats = useMemo(() => {
    const total = logs.length;
    const sent = logs.filter((l) => l.status === 'Sent').length;
    const pending = logs.filter((l) => l.status === 'Pending').length;
    const failed = logs.filter((l) => l.status === 'Failed').length;
    return { total, sent, pending, failed };
  }, [logs]);

  const handleResend = (id: string) => {
    setLogs((prev) => prev.map((l) => (l.id === id ? { ...l, status: 'Pending' as WaLogStatus } : l)));
    showToast('Mengirim ulang pesan...', 'info');
    setTimeout(() => {
      setLogs((prev) => prev.map((l) => (l.id === id ? { ...l, status: 'Sent' as WaLogStatus, sentAt: new Date().toISOString() } : l)));
      showToast('Pesan berhasil dikirim ulang', 'success');
    }, 1200);
  };

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('All');
    setStatusFilter('All');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilter = search || typeFilter !== 'All' || statusFilter !== 'All' || dateFrom || dateTo;

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-500" />
          <div className="px-5 sm:px-6 py-5">
            <div className="flex gap-4">
              <div className="hidden sm:flex h-11 w-11 rounded-xl bg-slate-900 text-white items-center justify-center shadow-sm shrink-0">
                <ScrollText className="h-5 w-5" />
              </div>
              <div>
                <h1 className="page-header-title text-[18px] tracking-tight text-slate-900 font-bold flex items-center gap-2">
                  WA Logs <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold tracking-widest uppercase">Outbox</span>
                </h1>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                  Monitoring pengiriman WhatsApp untuk Bagging, Bailout, Reconcile, dan Follow Up — lengkap dengan status, preview pesan, dan aksi kirim ulang.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Pesan Dikirim" value={stats.total} icon={<Send className="w-5 h-5" />} variant="default" />
          <StatCard label="Berhasil / Terkirim" value={stats.sent} icon={<CheckCircle2 className="w-5 h-5" />} variant="success" />
          <StatCard label="Pending / Antrean" value={stats.pending} icon={<Clock className="w-5 h-5" />} variant="warning" />
          <StatCard label="Gagal / Error" value={stats.failed} icon={<XCircle className="w-5 h-5" />} variant="danger" />
        </div>

        {/* Filter & Toolbar */}
        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-5 py-4 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-slate-600 uppercase">
              <Filter className="h-3.5 w-3.5" /> Filter & Pencarian
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
              <div className="lg:col-span-5 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari Nama Agen, Kode Loket, atau Nomor WA..."
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-9 pr-9 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 shadow-sm cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="lg:col-span-2">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as WaLogType | 'All')}
                  className="w-full rounded-xl bg-white border border-slate-200 px-3 py-2.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 cursor-pointer"
                >
                  {TYPE_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t === 'All' ? 'Semua Jenis' : t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="lg:col-span-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as WaLogStatus | 'All')}
                  className="w-full rounded-xl bg-white border border-slate-200 px-3 py-2.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 cursor-pointer"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s === 'All' ? 'Semua Status' : s === 'Sent' ? 'Terkirim' : s === 'Pending' ? 'Proses' : 'Gagal'}
                    </option>
                  ))}
                </select>
              </div>
              <div className="lg:col-span-3 flex gap-2">
                <div className="relative flex-1">
                  <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full rounded-xl bg-white border border-slate-200 pl-8 pr-2 py-2.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 cursor-pointer"
                  />
                </div>
                <span className="self-center text-slate-400">—</span>
                <div className="relative flex-1">
                  <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full rounded-xl bg-white border border-slate-200 pl-8 pr-2 py-2.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 cursor-pointer"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Menampilkan <strong className="text-slate-700">{filtered.length}</strong> dari <strong className="text-slate-700">{logs.length}</strong> log
                {hasActiveFilter && <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-bold">Filter aktif</span>}
              </p>
              {hasActiveFilter && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" /> Reset Filter
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Data Table */}
        {filtered.length === 0 ? (
          <EmptyState
            title="Tidak ada log"
            description={hasActiveFilter ? 'Tidak ada data yang cocok dengan filter. Coba ubah pencarian atau reset filter.' : 'Belum ada log pengiriman WA.'}
            icon={<ScrollText className="w-8 h-8 text-slate-300" />}
          />
        ) : (
          <div className="space-y-3">
            <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 backdrop-blur text-slate-500 uppercase text-[11px] tracking-widest sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 font-semibold whitespace-nowrap">Waktu Kirim</th>
                      <th className="px-4 py-3 font-semibold whitespace-nowrap">Jenis Pesan</th>
                      <th className="px-4 py-3 font-semibold whitespace-nowrap">Nama Agen / Loket</th>
                      <th className="px-4 py-3 font-semibold whitespace-nowrap">Nomor WA</th>
                      <th className="px-4 py-3 font-semibold min-w-[220px]">Isi Pesan</th>
                      <th className="px-4 py-3 font-semibold whitespace-nowrap">Status</th>
                      <th className="px-4 py-3 font-semibold whitespace-nowrap text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pagination.paginatedItems.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-slate-700 font-mono text-[11px]">{formatWaktuKirim(log.sentAt)}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <TypeBadge type={log.type} />
                        </td>
                        <td className="px-4 py-3 max-w-[180px] truncate">
                          <div className="font-semibold text-slate-800 leading-tight">{log.agenName}</div>
                          <div className="font-mono text-[11px] text-slate-500">{log.kodeLoket}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-700">{log.waNumber}</td>
                        <td className="px-4 py-3 max-w-[280px]">
                          <p className="truncate text-slate-600 leading-relaxed" title={log.message}>
                            {truncateMessage(log.message, 72)}
                          </p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <StatusBadge status={log.status} />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setDetailLog(log)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors cursor-pointer"
                            >
                              <Eye className="h-3 w-3" /> Detail
                            </button>
                            {log.status === 'Failed' && (
                              <button
                                onClick={() => handleResend(log.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-amber-500 text-white text-[11px] font-semibold hover:bg-amber-600 shadow-sm transition-colors cursor-pointer"
                              >
                                <RotateCcw className="h-3 w-3" /> Kirim Ulang
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm px-2">
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalItems}
                pageSize={pagination.pageSize}
                startItem={pagination.startItem}
                endItem={pagination.endItem}
                onPrev={pagination.prevPage}
                onNext={pagination.nextPage}
                onGoTo={pagination.goToPage}
                onPageSizeChange={pagination.changePageSize}
                hasPrev={pagination.hasPrev}
                hasNext={pagination.hasNext}
              />
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Modal open={!!detailLog} onClose={() => setDetailLog(null)} title="Detail Pesan" subtitle={detailLog ? `${detailLog.agenName} • ${detailLog.kodeLoket}` : ''} maxWidth="max-w-2xl">
        {detailLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                <p className="text-[11px] font-bold tracking-widest text-slate-500 uppercase">Waktu Kirim</p>
                <p className="font-mono font-semibold text-slate-800 mt-1">{formatWaktuKirim(detailLog.sentAt)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                <p className="text-[11px] font-bold tracking-widest text-slate-500 uppercase">Status</p>
                <div className="mt-1">
                  <StatusBadge status={detailLog.status} />
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                <p className="text-[11px] font-bold tracking-widest text-slate-500 uppercase">Jenis Pesan</p>
                <div className="mt-1">
                  <TypeBadge type={detailLog.type} />
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                <p className="text-[11px] font-bold tracking-widest text-slate-500 uppercase">Nomor WA</p>
                <p className="font-mono font-semibold text-slate-800 mt-1">{detailLog.waNumber}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-2 text-[11px] font-bold tracking-widest text-slate-600 uppercase">
                <MessageSquare className="h-3.5 w-3.5" /> Isi Pesan Lengkap
              </div>
              <pre className="p-4 text-xs font-mono text-slate-700 whitespace-pre-wrap leading-relaxed max-h-[40vh] overflow-y-auto">{detailLog.message}</pre>
            </div>
            <div className="flex justify-end gap-2">
              {detailLog.status === 'Failed' && (
                <button
                  onClick={() => {
                    handleResend(detailLog.id);
                    setDetailLog(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Kirim Ulang
                </button>
              )}
              <button
                onClick={() => setDetailLog(null)}
                className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
