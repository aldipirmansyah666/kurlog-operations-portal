'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { LAYANAN_OPTIONS, STATUS_LIST } from '@/lib/constants';

interface ResiFormProps {
  onSubmit: (data: {
    tgl_tiket: string;
    no_resi: string;
    agen: string;
    layanan: string;
    petugas: string;
    status_resi: string;
    status_fu: string;
  }) => Promise<void>;
  submitting: boolean;
  onSuccess: () => void;
}

export default function ResiForm({ onSubmit, submitting, onSuccess }: ResiFormProps) {
  const todayStr = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

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
    if (!agen.trim()) errs.agen = 'Nama agen wajib diisi';
    if (!petugas.trim()) errs.petugas = 'Petugas wajib diisi';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const isClosed = ['DELIVERED', 'RETUR'].includes(statusResi);
    await onSubmit({
      tgl_tiket: tglTiket.trim() || todayStr,
      no_resi: noResi.trim(),
      agen: agen.trim(),
      layanan,
      petugas: petugas.trim(),
      status_resi: statusResi,
      status_fu: isClosed ? 'CLOSED' : 'PERLU FOLLOW UP',
    });

    setTglTiket('');
    setNoResi('');
    setAgen('');
    setLayanan('PE');
    setPetugas('');
    setStatusResi('PERJALANAN');
    setErrors({});
    onSuccess();
  };

  const inputClass = (field: string) =>
    `w-full bg-slate-950 border rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-600 ${
      errors[field] ? 'border-rose-500/60' : 'border-slate-800'
    }`;

  return (
    <div className="bg-slate-900/70 rounded-xl border border-slate-800/80 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Plus className="w-4 h-4 text-blue-400" />
        <h3 className="text-sm font-semibold text-slate-200">Tambah Resi Baru</h3>
      </div>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-7 gap-3">
        <div className="space-y-1">
          <input
            type="text"
            placeholder="Tgl Tiket (21/07/2026)"
            value={tglTiket}
            onChange={(e) => setTglTiket(e.target.value)}
            className={inputClass('tgl_tiket')}
          />
        </div>
        <div className="space-y-1">
          <input
            type="text"
            placeholder="No. Resi *"
            value={noResi}
            onChange={(e) => setNoResi(e.target.value)}
            className={inputClass('noResi')}
          />
          {errors.noResi && <p className="text-[10px] text-rose-400">{errors.noResi}</p>}
        </div>
        <div className="space-y-1">
          <input
            type="text"
            placeholder="Nama Agen *"
            value={agen}
            onChange={(e) => setAgen(e.target.value)}
            className={inputClass('agen')}
          />
          {errors.agen && <p className="text-[10px] text-rose-400">{errors.agen}</p>}
        </div>
        <select
          value={layanan}
          onChange={(e) => setLayanan(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer font-medium"
        >
          {LAYANAN_OPTIONS.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
        <div className="space-y-1">
          <input
            type="text"
            placeholder="Petugas *"
            value={petugas}
            onChange={(e) => setPetugas(e.target.value)}
            className={inputClass('petugas')}
          />
          {errors.petugas && <p className="text-[10px] text-rose-400">{errors.petugas}</p>}
        </div>
        <select
          value={statusResi}
          onChange={(e) => setStatusResi(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer font-medium"
        >
          {STATUS_LIST.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm rounded-lg px-4 py-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Menyimpan...' : 'Simpan'}
        </button>
      </form>
    </div>
  );
}
