'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { DataLengkapItem } from '@/lib/types';
import { emptyDataLengkap } from '@/lib/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: DataLengkapItem) => void;
  editItem?: DataLengkapItem | null;
  nextNo: number;
}

const TABS = [
  { id: 1, label: 'Info Loket', group: 'A' },
  { id: 2, label: 'Legalitas & Pemilik', group: 'B' },
  { id: 3, label: 'Alamat & Koordinat', group: 'C' },
  { id: 4, label: 'Bank & Aktivasi', group: 'D/E/F' },
];

const STATUS_OPTIONS = ['AKTIF', 'NON AKTIF', 'SUSPEND'];
const LENGKAP_OPTIONS = ['LENGKAP', 'BELUM LENGKAP'];
const SUDAH_BELUM = ['', 'SUDAH', 'BELUM'];
const YA_TIDAK = ['', 'YA', 'TIDAK'];

export default function DataLengkapForm({ open, onClose, onSave, editItem, nextNo }: Props) {
  const [activeTab, setActiveTab] = useState(1);
  const [form, setForm] = useState<DataLengkapItem>(() => {
    if (editItem) return { ...editItem };
    return { ...emptyDataLengkap(nextNo), id: crypto.randomUUID() };
  });

  useEffect(() => {
    if (open) {
      setForm(editItem ? { ...editItem } : { ...emptyDataLengkap(nextNo), id: crypto.randomUUID() });
      setActiveTab(1);
    }
  }, [open, editItem, nextNo]);

  const update = (key: keyof DataLengkapItem, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave({ ...form, waktuUpdate: new Date().toISOString() });
  };

  if (!open) return null;

  const inputCls = 'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors';
  const labelCls = 'block text-xs font-medium text-slate-400 mb-1';
  const gridCls = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl animate-modal-in max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 shrink-0">
          <div>
            <h3 className="text-base font-semibold text-slate-100">
              {editItem ? 'Edit Data Loket' : 'Tambah Data Loket Baru'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {editItem ? `Mengedit #${editItem.no} - ${editItem.namaLoketOnpays || 'tanpa nama'}` : `Data baru #${nextNo}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="flex gap-0.5 px-6 pt-4 border-b border-slate-700 shrink-0 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-slate-800 text-slate-100 border border-b-0 border-slate-700 -mb-px'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {tab.label}
              <span className="ml-1.5 text-[10px] text-slate-500">({tab.group})</span>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {activeTab === 1 && (
            <>
              <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Identitas Utama & Logistik</p>
              <div className={gridCls}>
                <div>
                  <label className={labelCls}>No. Urut</label>
                  <input type="text" value={form.no} disabled className={`${inputCls} opacity-60`} />
                </div>
                <div>
                  <label className={labelCls}>Tgl Pendaftaran</label>
                  <input type="text" value={form.tglPendaftaran} onChange={(e) => update('tglPendaftaran', e.target.value)} placeholder="Contoh: 0020/May/19" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Status Kurlog</label>
                  <select value={form.statusKurlog} onChange={(e) => update('statusKurlog', e.target.value)} className={inputCls}>
                    <option value="">-- Pilih --</option>
                    {STATUS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>PPID</label>
                  <input type="text" value={form.ppid} onChange={(e) => update('ppid', e.target.value)} placeholder="PPID" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Nama Loket di Onpays</label>
                  <input type="text" value={form.namaLoketOnpays} onChange={(e) => update('namaLoketOnpays', e.target.value)} placeholder="Nama loket" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Nama Loket di Kurlog</label>
                  <input type="text" value={form.namaLoketKurlog} onChange={(e) => update('namaLoketKurlog', e.target.value)} placeholder="Nama loket Kurlog" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Location ID</label>
                  <input type="text" value={form.locationId} onChange={(e) => update('locationId', e.target.value)} placeholder="Location ID" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>User Mile</label>
                  <input type="text" value={form.userMile} onChange={(e) => update('userMile', e.target.value)} placeholder="Username Mile" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Password Mile</label>
                  <input type="text" value={form.passwordMile} onChange={(e) => update('passwordMile', e.target.value)} placeholder="Password Mile" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Regional</label>
                  <input type="text" value={form.regional} onChange={(e) => update('regional', e.target.value)} placeholder="Regional" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>KCU/KC</label>
                  <input type="text" value={form.kcuKc} onChange={(e) => update('kcuKc', e.target.value)} placeholder="KCU/KC" className={inputCls} />
                </div>
              </div>
            </>
          )}

          {activeTab === 2 && (
            <>
              <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Identitas Pemilik & Legalitas</p>
              <div className={gridCls}>
                <div>
                  <label className={labelCls}>Nama Pemilik</label>
                  <input type="text" value={form.namaPemilik} onChange={(e) => update('namaPemilik', e.target.value)} placeholder="Nama lengkap" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>No KTP</label>
                  <input type="text" value={form.noKtp} onChange={(e) => update('noKtp', e.target.value)} placeholder="No KTP" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>No NPWP</label>
                  <input type="text" value={form.noNpwp} onChange={(e) => update('noNpwp', e.target.value)} placeholder="No NPWP" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>No HP Pemilik</label>
                  <input type="text" value={form.noHpPemilik} onChange={(e) => update('noHpPemilik', e.target.value)} placeholder="No HP" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>No HP Loket</label>
                  <input type="text" value={form.noHpLoket} onChange={(e) => update('noHpLoket', e.target.value)} placeholder="No HP loket" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Email</label>
                  <input type="text" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="Email" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>No Dirian</label>
                  <input type="text" value={form.noDirian} onChange={(e) => update('noDirian', e.target.value)} placeholder="No Dirian" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>NIB (No Induk Berusaha)</label>
                  <input type="text" value={form.nib} onChange={(e) => update('nib', e.target.value)} placeholder="NIB" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>No KBLI</label>
                  <input type="text" value={form.noKbli} onChange={(e) => update('noKbli', e.target.value)} placeholder="No KBLI" className={inputCls} />
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className={labelCls}>Alamat Pemilik (KTP)</label>
                  <textarea value={form.alamatPemilikKtp} onChange={(e) => update('alamatPemilikKtp', e.target.value)} rows={2} className={`${inputCls} resize-none`} placeholder="Alamat sesuai KTP" />
                </div>
              </div>
            </>
          )}

          {activeTab === 3 && (
            <>
              <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Alamat & Lokasi Detail Loket</p>
              <div className={gridCls}>
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className={labelCls}>Alamat Lengkap Loket</label>
                  <textarea value={form.alamatLengkapLoket} onChange={(e) => update('alamatLengkapLoket', e.target.value)} rows={2} className={`${inputCls} resize-none`} placeholder="Alamat lengkap loket" />
                </div>
                <div>
                  <label className={labelCls}>RT/RW</label>
                  <input type="text" value={form.rtRw} onChange={(e) => update('rtRw', e.target.value)} placeholder="RT/RW" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Kel/Desa</label>
                  <input type="text" value={form.kelDesa} onChange={(e) => update('kelDesa', e.target.value)} placeholder="Kelurahan/Desa" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Kecamatan</label>
                  <input type="text" value={form.kec} onChange={(e) => update('kec', e.target.value)} placeholder="Kecamatan" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Kab/Kota</label>
                  <input type="text" value={form.kabKota} onChange={(e) => update('kabKota', e.target.value)} placeholder="Kabupaten/Kota" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Propinsi</label>
                  <input type="text" value={form.propinsi} onChange={(e) => update('propinsi', e.target.value)} placeholder="Propinsi" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Kode Pos</label>
                  <input type="text" value={form.kodePos} onChange={(e) => update('kodePos', e.target.value)} placeholder="Kode Pos" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Electric Area</label>
                  <input type="text" value={form.electricArea} onChange={(e) => update('electricArea', e.target.value)} placeholder="Electric Area" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Rekomendasi</label>
                  <input type="text" value={form.rekomendasi} onChange={(e) => update('rekomendasi', e.target.value)} placeholder="Rekomendasi" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Latitude</label>
                  <input type="text" value={form.latitude} onChange={(e) => update('latitude', e.target.value)} placeholder="contoh: -6.123456" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Longitude</label>
                  <input type="text" value={form.longitude} onChange={(e) => update('longitude', e.target.value)} placeholder="contoh: 106.123456" className={inputCls} />
                </div>
              </div>
            </>
          )}

          {activeTab === 4 && (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-4">Rekening Bank</p>
                <div className={gridCls}>
                  <div>
                    <label className={labelCls}>Nomor Rekening</label>
                    <input type="text" value={form.nomorRekening} onChange={(e) => update('nomorRekening', e.target.value)} placeholder="No Rekening" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Nama Bank</label>
                    <input type="text" value={form.namaBank} onChange={(e) => update('namaBank', e.target.value)} placeholder="Nama Bank" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Nama Pemilik Rekening</label>
                    <input type="text" value={form.namaPemilikRekening} onChange={(e) => update('namaPemilikRekening', e.target.value)} placeholder="Nama Pemilik Rekening" className={inputCls} />
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-4">Status Progress & Aktivasi</p>
                <div className={gridCls}>
                  <div>
                    <label className={labelCls}>Syarat</label>
                    <select value={form.syarat} onChange={(e) => update('syarat', e.target.value)} className={inputCls}>
                      <option value="">-- Pilih --</option>
                      {LENGKAP_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Pengajuan Survey ke Pos</label>
                    <select value={form.pengajuanSurveyKePos} onChange={(e) => update('pengajuanSurveyKePos', e.target.value)} className={inputCls}>
                      <option value="">-- Pilih --</option>
                      {SUDAH_BELUM.map((o) => <option key={o} value={o}>{o || '-'}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Pengajuan Pos</label>
                    <select value={form.pengajuanPos} onChange={(e) => update('pengajuanPos', e.target.value)} className={inputCls}>
                      <option value="">-- Pilih --</option>
                      {SUDAH_BELUM.map((o) => <option key={o} value={o}>{o || '-'}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Pendaftaran Kurlog</label>
                    <select value={form.pendaftaranKurlog} onChange={(e) => update('pendaftaranKurlog', e.target.value)} className={inputCls}>
                      <option value="">-- Pilih --</option>
                      {SUDAH_BELUM.map((o) => <option key={o} value={o}>{o || '-'}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Kelengkapan Perangkat</label>
                    <select value={form.kelengkapanPerangkat} onChange={(e) => update('kelengkapanPerangkat', e.target.value)} className={inputCls}>
                      <option value="">-- Pilih --</option>
                      {LENGKAP_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Aktivasi Kurlog</label>
                    <select value={form.aktivasiKurlog} onChange={(e) => update('aktivasiKurlog', e.target.value)} className={inputCls}>
                      <option value="">-- Pilih --</option>
                      {STATUS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Aktivasi Sicepat</label>
                    <select value={form.aktivasiSicepat} onChange={(e) => update('aktivasiSicepat', e.target.value)} className={inputCls}>
                      <option value="">-- Pilih --</option>
                      {STATUS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Training</label>
                    <select value={form.training} onChange={(e) => update('training', e.target.value)} className={inputCls}>
                      <option value="">-- Pilih --</option>
                      {SUDAH_BELUM.map((o) => <option key={o} value={o}>{o || '-'}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Transaksi</label>
                    <select value={form.transaksi} onChange={(e) => update('transaksi', e.target.value)} className={inputCls}>
                      <option value="">-- Pilih --</option>
                      {SUDAH_BELUM.map((o) => <option key={o} value={o}>{o || '-'}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-4">Tipe Kategori Loket & Catatan</p>
                <div className={gridCls}>
                  <div>
                    <label className={labelCls}>Pos + PPOB</label>
                    <select value={form.posPpob} onChange={(e) => update('posPpob', e.target.value)} className={inputCls}>
                      {YA_TIDAK.map((o) => <option key={o} value={o}>{o || '-'}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Pos Only</label>
                    <select value={form.posOnly} onChange={(e) => update('posOnly', e.target.value)} className={inputCls}>
                      {YA_TIDAK.map((o) => <option key={o} value={o}>{o || '-'}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Sicepat</label>
                    <select value={form.sicepat} onChange={(e) => update('sicepat', e.target.value)} className={inputCls}>
                      {YA_TIDAK.map((o) => <option key={o} value={o}>{o || '-'}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className={labelCls}>Catatan</label>
                    <textarea value={form.catatan} onChange={(e) => update('catatan', e.target.value)} rows={2} className={`${inputCls} resize-none`} placeholder="Catatan tambahan..." />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700 shrink-0">
          <span className="text-[11px] text-slate-600">
            Tab {activeTab}/4 &mdash; {TABS[activeTab - 1]?.label}
          </span>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            {activeTab > 1 && (
              <button
                onClick={() => setActiveTab((t) => t - 1)}
                className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                Sebelumnya
              </button>
            )}
            {activeTab < 4 ? (
              <button
                onClick={() => setActiveTab((t) => t + 1)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors cursor-pointer"
              >
                Selanjutnya
              </button>
            ) : (
              <button
                onClick={handleSave}
                className="px-5 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors cursor-pointer"
              >
                {editItem ? 'Simpan Perubahan' : 'Tambah Data'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
