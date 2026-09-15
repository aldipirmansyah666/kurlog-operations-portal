'use client';

import { useState, useMemo } from 'react';
import {
  Megaphone,
  Send,
  Eye,
  RotateCcw,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Users,
  MapPin,
  Timer,
  ShieldCheck,
  Sparkles,
  Copy,
  Check,
  CheckCheck,
  AlertTriangle,
} from 'lucide-react';
import Modal from '@/app/components/ui/Modal';
import ToastContainer from '@/app/components/ui/Toast';
import { useToast } from '@/lib/hooks/useToast';

type TargetOption = 'Semua Agen' | 'Agen Minus/Bailout' | 'Filter Area: Jakarta' | 'Filter Area: Surabaya' | 'Filter Area: Yogyakarta' | 'Filter Area: Bandung';
type ThrottleOption = 'Fast' | 'Medium' | 'Slow';
type BroadcastStatus = 'Completed' | 'In Progress' | 'Draft' | 'Failed';

interface BroadcastHistory {
  id: string;
  tanggal: string; // ISO
  judul: string;
  target: TargetOption;
  totalPenerima: number;
  status: BroadcastStatus;
  progress: number; // 0-100
  pesan: string;
}

const TARGET_OPTIONS: TargetOption[] = [
  'Semua Agen',
  'Agen Minus/Bailout',
  'Filter Area: Jakarta',
  'Filter Area: Surabaya',
  'Filter Area: Yogyakarta',
  'Filter Area: Bandung',
];

const THROTTLE_OPTIONS: { value: ThrottleOption; label: string; desc: string; recommended?: boolean }[] = [
  { value: 'Fast', label: 'Fast (1-2s)', desc: 'Kirim cepat, risiko limit' },
  { value: 'Medium', label: 'Medium (3-5s)', desc: 'Seimbang, direkomendasikan', recommended: true },
  { value: 'Slow', label: 'Slow (5-10s)', desc: 'Aman untuk broadcast besar' },
];

const MOCK_HISTORY: BroadcastHistory[] = [
  {
    id: 'brc-001',
    tanggal: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    judul: 'Pengumuman Libur Operasional Idul Fitri',
    target: 'Semua Agen',
    totalPenerima: 342,
    status: 'Completed',
    progress: 100,
    pesan: 'Halo {{nama_agen}} ({{kode_loket}}), kami informasikan libur operasional 29-31 Maret. Mohon atur stok resi.',
  },
  {
    id: 'brc-002',
    tanggal: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    judul: 'Reminder Pelunasan Bailout Minus H-1',
    target: 'Agen Minus/Bailout',
    totalPenerima: 28,
    status: 'In Progress',
    progress: 62,
    pesan: 'Halo {{nama_agen}}, minus bailout {{kode_loket}} per H-1 masih tercatat. Mohon segera dilunasi sebelum 09.00 WIB.',
  },
  {
    id: 'brc-003',
    tanggal: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    judul: 'Update SOP Bagging Terbaru',
    target: 'Filter Area: Jakarta',
    totalPenerima: 87,
    status: 'Draft',
    progress: 0,
    pesan: 'Halo {{nama_agen}}, SOP bagging terbaru wajib dibagging H+0 sebelum jam 17.00. Terima kasih.',
  },
  {
    id: 'brc-004',
    tanggal: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    judul: 'Broadcast Gagal - Maintenance Rekening',
    target: 'Filter Area: Surabaya',
    totalPenerima: 54,
    status: 'Failed',
    progress: 18,
    pesan: 'Halo {{nama_agen}} ({{kode_loket}}), maintenance rekening BRI 02.00-04.00 WIB. Mohon tunda transaksi.',
  },
  {
    id: 'brc-005',
    tanggal: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
    judul: 'Pengumuman Kenaikan Tarif Layanan PE',
    target: 'Semua Agen',
    totalPenerima: 410,
    status: 'Completed',
    progress: 100,
    pesan: 'Halo {{nama_agen}}, tarif layanan PE efektif 01 Okt naik Rp 500. Mohon informasikan ke customer.',
  },
];

function generateKodeUnik(length = 6): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

function formatTanggal(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) + ' • ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function renderPreview(pesan: string, includeFooter: boolean, kode: string): string {
  const base = pesan
    .replaceAll('{{nama_agen}}', 'MUC LEUWINANGGUNG')
    .replaceAll('{{kode_loket}}', 'SBPAYS-MUC-009');
  if (!includeFooter) return base;
  const footer = '\n\nDemi keamanan dan kenyamanan, mohon simpan nomor ini sebagai KONTAK di HP Anda.\n---\n_Ref: BRC-' + kode + ' | ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB_';
  return base + footer;
}

function StatusBadge({ status }: { status: BroadcastStatus }) {
  if (status === 'Completed') return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 className="h-3 w-3" /> Completed</span>;
  if (status === 'In Progress') return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200"><Clock className="h-3 w-3" /> In Progress</span>;
  if (status === 'Draft') return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-50 text-slate-600 border border-slate-200"><FileText className="h-3 w-3" /> Draft</span>;
  return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200"><XCircle className="h-3 w-3" /> Failed</span>;
}

export default function BroadcastPage() {
  const [title, setTitle] = useState('Pengumuman Operasional Harian');
  const [target, setTarget] = useState<TargetOption>('Semua Agen');
  const [throttle, setThrottle] = useState<ThrottleOption>('Medium');
  const [pesan, setPesan] = useState('Halo {{nama_agen}} ({{kode_loket}}),\n\nKami sampaikan informasi terbaru terkait operasional. Mohon perhatikan jadwal dan tetap jaga layanan prima.\n\nTerima kasih atas kerja samanya.');
  const [includeFooter, setIncludeFooter] = useState(true);
  const [kode] = useState(() => generateKodeUnik(6));
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<BroadcastHistory[]>(MOCK_HISTORY);
  const [detail, setDetail] = useState<BroadcastHistory | null>(null);
  const { toasts, showToast, removeToast } = useToast();

  const preview = useMemo(() => renderPreview(pesan, includeFooter, kode), [pesan, includeFooter, kode]);

  const handleCopyPreview = async () => {
    try {
      await navigator.clipboard.writeText(preview);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = preview;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKirimBroadcast = () => {
    if (!title.trim()) {
      showToast('Judul campaign wajib diisi', 'warning');
      return;
    }
    if (!pesan.trim()) {
      showToast('Pesan pengumuman wajib diisi', 'warning');
      return;
    }
    const newEntry: BroadcastHistory = {
      id: `brc-${Date.now()}`,
      tanggal: new Date().toISOString(),
      judul: title.trim(),
      target,
      totalPenerima: target === 'Semua Agen' ? 342 : target === 'Agen Minus/Bailout' ? 28 : 78,
      status: 'In Progress',
      progress: 0,
      pesan: pesan,
    };
    setHistory((prev) => [newEntry, ...prev]);
    showToast(`Broadcast "${title}" dijadwalkan • Throttle: ${throttle} • Target: ${target}`, 'success');
  };

  const handleRetry = (id: string) => {
    setHistory((prev) => prev.map((h) => (h.id === id ? { ...h, status: 'In Progress' as BroadcastStatus, progress: 12 } : h)));
    showToast('Mengirim ulang broadcast yang gagal...', 'info');
    setTimeout(() => {
      setHistory((prev) => prev.map((h) => (h.id === id ? { ...h, status: 'Completed' as BroadcastStatus, progress: 100 } : h)));
      showToast('Broadcast berhasil dikirim ulang', 'success');
    }, 1500);
  };

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-500" />
          <div className="px-5 sm:px-6 py-5 flex gap-4">
            <span className="hidden sm:flex h-11 w-11 rounded-xl bg-slate-900 text-white items-center justify-center shadow-sm shrink-0"><Megaphone className="h-5 w-5" /></span>
            <div>
              <h1 className="text-[18px] font-bold tracking-tight text-slate-900 flex items-center gap-2">Broadcast Manual <span className="px-2 py-0.5 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-[10px] font-bold tracking-widest uppercase">Pengumuman</span></h1>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">Buat pengumuman terpusat ke agen dengan throttle aman, variabel personalisasi, dan riwayat terkontrol.</p>
            </div>
          </div>
        </div>

        {/* Form + Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Form */}
          <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200/80 bg-slate-50/50 flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-600" />
              <h2 className="text-sm font-bold tracking-tight text-slate-900">Form Buat Broadcast</h2>
            </div>
            <div className="p-5 space-y-4 flex-1">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold tracking-widest text-slate-600 uppercase">Title Campaign (Judul Pengumuman)</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contoh: Pengumuman Libur Nasional" className="w-full rounded-xl bg-white border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold tracking-widest text-slate-600 uppercase flex items-center gap-1"><Users className="h-3 w-3" /> Target</label>
                  <select value={target} onChange={(e) => setTarget(e.target.value as TargetOption)} className="w-full rounded-xl bg-white border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">
                    {TARGET_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold tracking-widest text-slate-600 uppercase flex items-center gap-1"><Timer className="h-3 w-3" /> Jeda Kirim (Throttle)</label>
                  <select value={throttle} onChange={(e) => setThrottle(e.target.value as ThrottleOption)} className="w-full rounded-xl bg-white border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">
                    {THROTTLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label} {o.recommended ? '• Recommended' : ''}</option>)}
                  </select>
                </div>
              </div>
              {throttle === 'Medium' && <p className="text-[11px] text-emerald-600 flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Medium (3-5s) direkomendasikan untuk menghindari limit WhatsApp.</p>}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold tracking-widest text-slate-600 uppercase">Pesan Pengumuman — dukung variabel <span className="font-mono normal-case tracking-normal text-indigo-600">{'{{nama_agen}}, {{kode_loket}}'}</span></label>
                <textarea value={pesan} onChange={(e) => setPesan(e.target.value)} rows={8} placeholder="Halo {{nama_agen}} ({{kode_loket}}), ..." className="w-full rounded-xl bg-white border border-slate-200 p-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-y font-mono leading-relaxed" />
                <p className="text-[11px] text-slate-400">Variabel akan otomatis terganti di preview dan saat kirim.</p>
              </div>
              <label className="flex gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200 cursor-pointer">
                <input type="checkbox" checked={includeFooter} onChange={(e) => setIncludeFooter(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-amber-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-xs leading-relaxed text-slate-700">
                  <span className="font-semibold">Footer otomatis:</span> “Demi keamanan dan kenyamanan, mohon simpan nomor ini sebagai KONTAK di HP Anda.” + Ref Unik <span className="font-mono bg-white border border-amber-200 px-1.5 py-0.5 rounded text-[11px]">BRC-{kode}</span>
                </span>
              </label>
              <button onClick={handleKirimBroadcast} className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-sm transition-colors cursor-pointer">
                <Send className="h-4 w-4" /> Buat & Jadwalkan Broadcast
              </button>
            </div>
          </div>

          {/* Live Preview */}
          <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900"><Sparkles className="h-4 w-4 text-amber-500" /> Live Preview</div>
              <span className="text-[11px] font-mono bg-white border border-slate-200 px-2 py-1 rounded-full text-slate-600">contoh: MUC LEUWINANGGUNG</span>
            </div>
            <div className="p-5 flex-1 flex flex-col gap-4">
              {/* WhatsApp Bubble Mockup */}
              <div className="rounded-[20px] bg-[#ECE5DD] border border-[#D1C7B8] p-4 shadow-inner flex-1 flex flex-col">
                <div className="flex-1 flex items-end justify-start">
                  <div className="max-w-[92%] bg-white rounded-2xl rounded-bl-sm shadow-sm border border-white/60 px-4 py-3 relative">
                    <div className="absolute -bottom-1 left-0 w-3 h-3 bg-white rotate-45 translate-x-1" style={{ clipPath: 'polygon(0 0, 0 100%, 100% 100%)' }} />
                    <pre className="text-[13px] leading-[1.5] text-[#111B21] whitespace-pre-wrap font-sans break-words">{preview || <span className="text-slate-400 italic">Ketik pesan untuk melihat preview...</span>}</pre>
                    <div className="flex justify-end items-center gap-1 mt-1.5">
                      <span className="text-[11px] text-[#667781] font-mono">{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                      <CheckCheck className="h-3.5 w-3.5 text-[#53BDEB]" />
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-center">
                  <span className="px-2.5 py-1 rounded-full bg-white/80 border border-[#D1C7B8] text-[11px] font-medium text-[#667781]">Enkripsi end-to-end • Preview lokal</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleCopyPreview} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer">
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />} {copied ? 'Tersalin' : 'Salin Preview'}
                </button>
                <div className="flex-1 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 text-[11px] text-slate-500 leading-relaxed">
                  Target: <strong className="text-slate-700">{target}</strong> • Throttle: <strong className="text-slate-700">{THROTTLE_OPTIONS.find(o=>o.value===throttle)?.label}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Riwayat */}
        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-tight text-slate-900 flex items-center gap-2"><Clock className="h-4 w-4 text-slate-500" /> Riwayat Broadcast</h2>
            <span className="text-xs text-slate-500">{history.length} campaign</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase text-[11px] tracking-widest">
                <tr>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">Tanggal</th>
                  <th className="px-4 py-3 font-semibold min-w-[180px]">Judul Campaign</th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">Target</th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">Total Penerima</th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">Progress / Status</th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-[11px] text-slate-600">{formatTanggal(h.tanggal)}</td>
                    <td className="px-4 py-3 max-w-[260px]">
                      <p className="font-semibold text-slate-800 truncate">{h.judul}</p>
                      <p className="text-[11px] text-slate-500 truncate">{h.pesan.slice(0, 56)}…</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-50 border border-slate-200 text-[11px] font-medium text-slate-700">
                        {h.target.includes('Area') ? <MapPin className="h-3 w-3" /> : <Users className="h-3 w-3" />} {h.target}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-semibold text-slate-800">{h.totalPenerima}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
                          <div className={`h-full transition-all ${h.status === 'Completed' ? 'bg-emerald-500' : h.status === 'Failed' ? 'bg-rose-500' : h.status === 'In Progress' ? 'bg-sky-500' : 'bg-slate-300'}`} style={{ width: `${h.progress}%` }} />
                        </div>
                        <StatusBadge status={h.status} />
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => setDetail(h)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors cursor-pointer">
                          <Eye className="h-3 w-3" /> Detail
                        </button>
                        {(h.status === 'Failed' || h.status === 'Draft') && (
                          <button onClick={() => handleRetry(h.id)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-amber-500 text-white text-[11px] font-semibold hover:bg-amber-600 shadow-sm transition-colors cursor-pointer">
                            <RotateCcw className="h-3 w-3" /> Retry
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
      </div>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.judul} subtitle={detail ? `${formatTanggal(detail.tanggal)} • ${detail.target} • ${detail.totalPenerima} penerima` : ''} maxWidth="max-w-2xl">
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <StatusBadge status={detail.status} />
              <span className="text-xs text-slate-500">{detail.progress}% • {detail.totalPenerima} penerima</span>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-[#ECE5DD] p-4">
              <div className="bg-white rounded-2xl rounded-bl-sm shadow-sm border border-white/60 px-4 py-3 max-w-[92%]">
                <pre className="text-sm leading-relaxed text-[#111B21] whitespace-pre-wrap font-sans">{renderPreview(detail.pesan, true, generateKodeUnik(6))}</pre>
                <div className="flex justify-end mt-2 text-[11px] text-[#667781]">{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} <CheckCheck className="h-3.5 w-3.5 ml-1 text-[#53BDEB]" /></div>
              </div>
            </div>
            {detail.status === 'Failed' && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                <AlertTriangle className="h-4 w-4" /> Broadcast gagal di sebagian penerima. Gunakan Retry untuk mengirim ulang.
              </div>
            )}
            <div className="flex justify-end gap-2">
              {detail.status === 'Failed' && (
                <button onClick={() => { handleRetry(detail.id); setDetail(null); }} className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm cursor-pointer inline-flex items-center gap-1.5"><RotateCcw className="h-3.5 w-3.5" /> Kirim Ulang</button>
              )}
              <button onClick={() => setDetail(null)} className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">Tutup</button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
