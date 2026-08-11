'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type { DataLengkapUtamaItem, DataLengkapUtamaValues } from '@/lib/types';
import { DATA_LENGKAP_UTAMA_COLUMNS, emptyDataLengkapUtamaValues } from '@/lib/dataLengkapUtama';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (values: DataLengkapUtamaValues) => void;
  editItem?: DataLengkapUtamaItem | null;
}

type InputKind = 'text' | 'textarea' | 'password' | 'checkbox' | 'select';

const BANK_OPTIONS = [
  'BNI',
  'BRI',
  'BCA',
  'MANDIRI',
  'BTN',
  'BSI',
  'CIMB NIAGA',
  'DANAMON',
  'PERMATA',
  'BANK SYARIAH INDONESIA',
  'BTPN',
  'BANK JAGO',
  'BANK DIGITAL BCA',
  'MAYBANK',
  'OCBC NISP',
  'PANIN',
  'UOB',
  'BANK MUAMALAT',
  'SEABANK',
];

const FIELD_KINDS: Partial<Record<keyof DataLengkapUtamaValues, { kind: InputKind; options?: string[] }>> = {
  pos_ppob: { kind: 'checkbox' },
  pos_only: { kind: 'checkbox' },
  sicepat: { kind: 'checkbox' },
  password_mile: { kind: 'password' },
  nama_bank: { kind: 'select', options: BANK_OPTIONS },
  alamat_pemilik_ktp: { kind: 'textarea' },
  alamat_lengkap_loket: { kind: 'textarea' },
  syarat: { kind: 'textarea' },
  kelengkapan_perangkat: { kind: 'textarea' },
  catatan: { kind: 'textarea' },
};

const TABS: { title: string; sections: { title: string; keys: (keyof DataLengkapUtamaValues)[] }[] }[] = [
  {
    title: 'Data Loket',
    sections: [
      { title: 'Identitas Loket', keys: ['ppid', 'nama_loket_onpays', 'nama_loket_kurlog', 'nama_pemilik'] },
    ],
  },
  {
    title: 'Status & KURLOG',
    sections: [
      {
        title: 'Status',
        keys: ['syarat', 'pengajuan_survey_ke_pos', 'pengajuan_pos', 'pendaftaran_kurlog', 'kelengkapan_perangkat', 'aktivasi_kurlog', 'aktivasi_sicepat', 'training', 'transaksi', 'catatan', 'waktu'],
      },
      { title: 'Kurlog', keys: ['pos_ppob', 'pos_only', 'sicepat'] },
    ],
  },
  {
    title: 'Pemilik & Alamat',
    sections: [
      {
        title: 'Alamat Lengkap',
        keys: ['alamat_pemilik_ktp', 'alamat_lengkap_loket', 'rt_rw', 'kel_desa', 'kec', 'kab_kota', 'propinsi', 'kode_pos'],
      },
      {
        title: 'Legalitas & Kontak',
        keys: ['no_ktp', 'no_npwp', 'electric_area', 'rekomendasi', 'no_hp_pemilik', 'no_hp_loket', 'email'],
      },
    ],
  },
  {
    title: 'Sistem & Perbankan',
    sections: [
      { title: 'Sistem & Area', keys: ['no_dirian', 'location_id', 'user_mile', 'password_mile', 'regional', 'kcu_kc', 'nib', 'no_kbli'] },
      { title: 'Perbankan & Koordinat', keys: ['nomor_rekening', 'nama_bank', 'nama_pemilik_rekening', 'latitude', 'longitude'] },
    ],
  },
];

export default function DataLengkapUtamaForm({ open, onClose, onSave, editItem }: Props) {
  const [activeTab, setActiveTab] = useState(0);
  const [values, setValues] = useState<DataLengkapUtamaValues>(() => {
    const base = emptyDataLengkapUtamaValues();
    if (editItem) {
      for (const key of Object.keys(base) as (keyof DataLengkapUtamaValues)[]) {
        base[key] = String(editItem[key] ?? '');
      }
    }
    return base;
  });

  const setValue = (key: keyof DataLengkapUtamaValues, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const labelOf = (key: keyof DataLengkapUtamaValues) =>
    DATA_LENGKAP_UTAMA_COLUMNS.find((c) => c.key === key)?.label ?? String(key);

  const handleSave = () => {
    onSave(values);
    onClose();
  };

  if (!open) return null;

  const inputCls =
    'w-full bg-white border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors';
  const selectCls =
    'w-full bg-white border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer';

  const renderField = (key: keyof DataLengkapUtamaValues) => {
    const def = FIELD_KINDS[key];

    if (def?.kind === 'checkbox') {
      const checked = values[key] !== '' && values[key] !== null;
      return (
        <label className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setValue(key, e.target.checked ? 'X' : '')}
            className="w-3.5 h-3.5 accent-blue-600 cursor-pointer"
          />
          <span className="text-[11px] font-medium text-slate-600 uppercase tracking-wider">
            {labelOf(key)}
          </span>
        </label>
      );
    }

    if (def?.kind === 'select') {
      const current = values[key] || '';
      const options = def.options ?? [];
      return (
        <select
          value={current}
          onChange={(e) => setValue(key, e.target.value)}
          className={selectCls}
        >
          <option value="">— Kosong —</option>
          {current && !options.includes(current) && <option value={current}>{current}</option>}
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }

    if (def?.kind === 'textarea') {
      return (
        <textarea
          rows={2}
          value={values[key]}
          onChange={(e) => setValue(key, e.target.value)}
          placeholder={labelOf(key)}
          className={`${inputCls} resize-none`}
        />
      );
    }

    return (
      <input
        type={def?.kind === 'password' ? 'password' : 'text'}
        value={values[key]}
        onChange={(e) => setValue(key, e.target.value)}
        placeholder={labelOf(key)}
        className={inputCls}
      />
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-5xl bg-white border border-[#E2E8F0] rounded-2xl shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] shrink-0">
          <div>
            <h3 className="text-base font-semibold text-slate-800">
              {editItem ? 'Edit Data Lengkap Utama' : 'Tambah Data Lengkap Utama'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {editItem
                ? `Mengedit NO ${editItem.no} — ${editItem.nama_loket_kurlog || editItem.ppid || editItem.nama_pemilik || '-'}`
                : 'Semua kolom bersifat opsional — boleh dikosongkan.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="flex items-center gap-1 border-b border-[#E2E8F0] px-4 overflow-x-auto shrink-0">
          {TABS.map((tab, i) => (
            <button
              key={tab.title}
              onClick={() => setActiveTab(i)}
              className={`px-4 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                activeTab === i
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.title}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {TABS[activeTab].sections.map((section) => (
            <div key={section.title} className="space-y-3">
              <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider border-b border-[#E2E8F0] pb-2">
                {section.title}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {section.keys.map((key) => (
                  <div key={key} className="space-y-1">
                    {FIELD_KINDS[key]?.kind !== 'checkbox' && (
                      <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                        {labelOf(key)}
                      </label>
                    )}
                    {renderField(key)}
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
