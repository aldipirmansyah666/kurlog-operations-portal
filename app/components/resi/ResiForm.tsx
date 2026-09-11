'use client';

import { useState } from 'react';
import { Plus, Sparkles, ShieldCheck } from 'lucide-react';
import { LAYANAN_OPTIONS, STATUS_LIST, isClosedStatus } from '@/lib/constants';

interface ResiFormProps {
  onSubmit: (data: { tgl_tiket: string; no_resi: string; agen: string; layanan: string; petugas: string; status_resi: string; status_fu: string }) => Promise<void>;
  submitting: boolean;
}

export default function ResiForm({ onSubmit, submitting }: ResiFormProps) {
  const todayStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const [tglTiket, setTglTiket] = useState('');
  const [noResi, setNoResi] = useState('');
  const [agen, setAgen] = useState('');
  const [layanan, setLayanan] = useState('PE');
  const [petugas, setPetugas] = useState('');
  const [statusResi, setStatusResi] = useState('PERJALANAN');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!noResi.trim()) errs.noResi = 'Nomor resi wajib diisi';
    else if (noResi.trim().length > 50) errs.noResi = 'Nomor resi max 50 karakter';
    if (!agen.trim()) errs.agen = 'Nama agen wajib diisi';
    else if (agen.trim().length > 100) errs.agen = 'Nama agen max 100 karakter';
    if (!petugas.trim()) errs.petugas = 'Petugas wajib diisi';
    else if (petugas.trim().length > 100) errs.petugas = 'Petugas max 100 karakter';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const isClosed = isClosedStatus(statusResi);
    await onSubmit({ tgl_tiket: tglTiket.trim() || todayStr, no_resi: noResi.trim(), agen: agen.trim(), layanan, petugas: petugas.trim(), status_resi: statusResi, status_fu: isClosed ? 'CLOSED' : 'PERLU FOLLOW UP' });
    setTglTiket(''); setNoResi(''); setAgen(''); setLayanan('PE'); setPetugas(''); setStatusResi('PERJALANAN'); setErrors({});
  };

  const inputBase = "w-full rounded-xl bg-white border px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 transition-all duration-150";
  const inputState = (field: string) => (errors[field] ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/10 bg-rose-50/30' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 hover:border-slate-300');

  return (
    <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center gap-3">
          <span className="h-8 w-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm"><Plus className="h-4 w-4" /></span>
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-slate-900 flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-indigo-500" /> Tambah Resi Baru</h3>
            <p className="text-xs text-slate-500">Input manual — otomatis set status FU & closed_at</p>
          </div>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold"><ShieldCheck className="h-3 w-3" /> Validated</span>
      </div>

      <form onSubmit={handleSubmit} className="p-5 grid grid-cols-1 md:grid-cols-7 gap-3">
        <div className="space-y-1">
          <label className="text-[11px] font-semibold tracking-widest text-slate-500 uppercase">Tgl Tiket</label>
          <input type="text" placeholder={`Otomatis ${todayStr}`} value={tglTiket} onChange={(e) => setTglTiket(e.target.value)} className={`${inputBase} ${inputState('tgl_tiket')}`} />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-semibold tracking-widest text-slate-500 uppercase">No. Resi *</label>
          <input type="text" placeholder="P260..." value={noResi} onChange={(e) => setNoResi(e.target.value)} className={`${inputBase} ${inputState('noResi')}`} />
          {errors.noResi && <p className="text-[11px] font-medium text-rose-600">{errors.noResi}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-semibold tracking-widest text-slate-500 uppercase">Agen *</label>
          <input type="text" placeholder="Nama agen" value={agen} onChange={(e) => setAgen(e.target.value)} className={`${inputBase} ${inputState('agen')}`} />
          {errors.agen && <p className="text-[11px] font-medium text-rose-600">{errors.agen}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-semibold tracking-widest text-slate-500 uppercase">Layanan</label>
          <select value={layanan} onChange={(e) => setLayanan(e.target.value)} className={`${inputBase} ${inputState('layanan')} cursor-pointer font-medium`}>
            {LAYANAN_OPTIONS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-semibold tracking-widest text-slate-500 uppercase">Petugas *</label>
          <input type="text" placeholder="Nama petugas" value={petugas} onChange={(e) => setPetugas(e.target.value)} className={`${inputBase} ${inputState('petugas')}`} />
          {errors.petugas && <p className="text-[11px] font-medium text-rose-600">{errors.petugas}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-semibold tracking-widest text-slate-500 uppercase">Status</label>
          <select value={statusResi} onChange={(e) => setStatusResi(e.target.value)} className={`${inputBase} ${inputState('status')} cursor-pointer font-semibold`}>
            {STATUS_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex items-end">
          <button type="submit" disabled={submitting} className="w-full inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl px-4 py-2.5 shadow-sm hover:shadow transition-all duration-150 focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
            {submitting ? 'Menyimpan…' : 'Simpan Resi'}
          </button>
        </div>
      </form>
    </div>
  );
}
