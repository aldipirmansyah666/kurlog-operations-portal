'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { DataLengkapItem } from '@/lib/types';
import { emptyDataLengkap } from '@/lib/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (item: DataLengkapItem) => void;
  editItem?: DataLengkapItem | null;
}

const FORM_GROUPS: { title: string; keys: (keyof Omit<DataLengkapItem, 'id' | 'no'>)[] }[] = [
  {
    title: 'Info Pendaftaran',
    keys: ['tglPendaftaran', 'statusKurlog', 'ppid', 'namaLoketOnpays', 'namaLoketKurlog', 'locationId', 'userMile', 'passwordMile', 'regional', 'kcuKc'],
  },
  {
    title: 'Data Pemilik',
    keys: ['namaPemilik', 'noKtp', 'noNpwp', 'noHpPemilik', 'noHpLoket', 'email', 'noDirian', 'nib', 'noKbli'],
  },
  {
    title: 'Alamat Lengkap',
    keys: ['alamatPemilikKtp', 'alamatLengkapLoket', 'rtRw', 'kelDesa', 'kec', 'kabKota', 'propinsi', 'kodePos', 'electricArea', 'rekomendasi', 'latitude', 'longitude'],
  },
  {
    title: 'Rekening',
    keys: ['nomorRekening', 'namaBank', 'namaPemilikRekening'],
  },
  {
    title: 'Tahapan KURLOG',
    keys: ['syarat', 'pengajuanSurveyKePos', 'pengajuanPos', 'pendaftaranKurlog', 'kelengkapanPerangkat', 'aktivasiKurlog', 'aktivasiSicepat', 'training', 'transaksi', 'posPpob', 'posOnly', 'sicepat', 'catatan', 'waktuUpdate'],
  },
];

const FIELD_LABELS: Record<string, string> = {
  tglPendaftaran: 'Tgl Pendaftaran',
  statusKurlog: 'Status KurLog',
  ppid: 'PPID',
  namaLoketOnpays: 'Nama Loket di Onpays',
  namaLoketKurlog: 'Nama Loket di KurLog',
  locationId: 'Location ID',
  userMile: 'User Mile',
  passwordMile: 'Password Mile',
  regional: 'Regional',
  kcuKc: 'KCU/KC',
  namaPemilik: 'Nama Pemilik',
  noKtp: 'No KTP',
  noNpwp: 'No NPWP',
  noHpPemilik: 'No HP Pemilik',
  noHpLoket: 'No HP Loket',
  email: 'Email',
  noDirian: 'No Dirian',
  nib: 'NIB',
  noKbli: 'No KBLI',
  alamatPemilikKtp: 'Alamat Pemilik (KTP)',
  alamatLengkapLoket: 'Alamat Lengkap Loket',
  rtRw: 'RT/RW',
  kelDesa: 'Kel/Desa',
  kec: 'Kecamatan',
  kabKota: 'Kab/Kota',
  propinsi: 'Propinsi',
  kodePos: 'Kode Pos',
  electricArea: 'Electric Area',
  rekomendasi: 'Rekomendasi',
  latitude: 'Latitude',
  longitude: 'Longitude',
  nomorRekening: 'Nomor Rekening',
  namaBank: 'Nama Bank',
  namaPemilikRekening: 'Nama Pemilik Rekening',
  syarat: 'Syarat',
  pengajuanSurveyKePos: 'Pengajuan Survey ke Pos',
  pengajuanPos: 'Pengajuan Pos',
  pendaftaranKurlog: 'Pendaftaran KurLog',
  kelengkapanPerangkat: 'Kelengkapan Perangkat',
  aktivasiKurlog: 'Aktivasi KurLog',
  aktivasiSicepat: 'Aktivasi Sicepat',
  training: 'Training',
  transaksi: 'Transaksi',
  posPpob: 'Pos + PPOB',
  posOnly: 'Pos Only',
  sicepat: 'Sicepat',
  catatan: 'Catatan',
  waktuUpdate: 'Waktu Update',
};

export default function DataLengkapForm({ open, onClose, onSave, editItem }: Props) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const base = emptyDataLengkap(editItem?.no || 0);
    const record: Record<string, string> = {};
    for (const key of Object.keys(base) as (keyof DataLengkapItem)[]) {
      record[key] = String(editItem?.[key] ?? base[key] ?? '');
    }
    return record;
  });

  useEffect(() => {
    if (open) {
      const base = emptyDataLengkap(editItem?.no || 0);
      const record: Record<string, string> = {};
      for (const key of Object.keys(base) as (keyof DataLengkapItem)[]) {
        record[key] = String(editItem?.[key] ?? base[key] ?? '');
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect -- form reset when modal opens with new editItem
      setValues(record);
    }
  }, [open, editItem]);

  const setValue = (key: keyof Omit<DataLengkapItem, 'id' | 'no'>, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    const item = emptyDataLengkap(editItem?.no || 0);
    // Only copy string fields from values; keep id/no from editItem
    for (const key of Object.keys(item) as (keyof DataLengkapItem)[]) {
      if (key === 'id' || key === 'no') continue;
      item[key] = values[key] ?? '';
    }
    if (editItem?.id) item.id = editItem.id;
    onSave(item);
    onClose();
  };

  if (!open) return null;

  const inputCls =
    'w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 hover:border-slate-300 transition-all';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-5xl bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col animate-modal-in overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white shrink-0">
          <div>
            <h3 className="text-[15px] font-bold tracking-tight text-slate-900">
              {editItem ? 'Edit Data Lengkap' : 'Tambah Data Lengkap'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {editItem
                ? `Mengedit NO ${editItem.no} — ${editItem.namaLoketKurlog || editItem.ppid || editItem.namaPemilik || '-'}`
                : 'Isi data lengkap loket sesuai kolom Excel — semua field opsional'}
            </p>
          </div>
          <button onClick={onClose} className="h-9 w-9 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300 flex items-center justify-center shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
          {FORM_GROUPS.map((group) => (
            <div key={group.title} className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3 shadow-sm">
              <p className="text-xs font-bold tracking-widest text-indigo-700 uppercase flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" /> {group.title}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {group.keys.map((key) => (
                  <div key={key} className="space-y-1.5">
                    <label className="text-[11px] font-semibold tracking-widest text-slate-500 uppercase">{FIELD_LABELS[key] || key}</label>
                    <input type="text" value={values[key]} onChange={(e) => setValue(key, e.target.value)} placeholder={FIELD_LABELS[key] || key} className={inputCls} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-200 bg-white shrink-0">
          <button onClick={onClose} className="px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all focus-visible:ring-2 focus-visible:ring-slate-400 cursor-pointer">Batal</button>
          <button onClick={handleSave} className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer">{editItem ? 'Simpan Perubahan' : 'Simpan Data'}</button>
        </div>
      </div>
    </div>
  );
}