'use client';

import { useState } from 'react';
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
    'w-full bg-white border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-5xl bg-white border border-[#E2E8F0] rounded-2xl shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] shrink-0">
          <div>
            <h3 className="text-base font-semibold text-slate-800">
              {editItem ? 'Edit Data Lengkap' : 'Tambah Data Lengkap'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {editItem
                ? `Mengedit NO ${editItem.no} — ${editItem.namaLoketKurlog || editItem.ppid || editItem.namaPemilik || '-'}`
                : 'Isi data lengkap loket sesuai kolom pada file Excel'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {FORM_GROUPS.map((group) => (
            <div key={group.title} className="space-y-3">
              <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider border-b border-[#E2E8F0] pb-2">
                {group.title}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {group.keys.map((key) => (
                  <div key={key} className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                      {FIELD_LABELS[key] || key}
                    </label>
                    <input
                      type="text"
                      value={values[key]}
                      onChange={(e) => setValue(key, e.target.value)}
                      placeholder={FIELD_LABELS[key] || key}
                      className={inputCls}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E2E8F0] shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-50 border border-[#E2E8F0] rounded-lg transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-sm font-medium text-white bg-[#1E293B] hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            {editItem ? 'Simpan Perubahan' : 'Simpan Data'}
          </button>
        </div>
      </div>
    </div>
  );
}