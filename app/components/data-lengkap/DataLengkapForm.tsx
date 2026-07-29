'use client';

import { useState, useRef } from 'react';
import { X, Plus, Trash2, ClipboardPaste } from 'lucide-react';
import type { DataLengkapItem } from '@/lib/types';

interface Row {
  ppid: string;
  namaLoketKurlog: string;
  noHpLoket: string;
  email: string;
  userMile: string;
  passwordMile: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: DataLengkapItem) => void;
  onSaveBatch: (items: DataLengkapItem[]) => void;
  editItem?: DataLengkapItem | null;
  nextNo: number;
}

const emptyRow = (): Row => ({
  ppid: '',
  namaLoketKurlog: '',
  noHpLoket: '',
  email: '',
  userMile: '',
  passwordMile: '',
});

export default function DataLengkapForm({ open, onClose, onSave, onSaveBatch, editItem }: Props) {
  const [rows, setRows] = useState<Row[]>(() => {
    if (editItem) return [{
      ppid: editItem.ppid,
      namaLoketKurlog: editItem.namaLoketKurlog,
      noHpLoket: editItem.noHpLoket,
      email: editItem.email,
      userMile: editItem.userMile,
      passwordMile: editItem.passwordMile,
    }];
    return [emptyRow()];
  });
  const [pasteText, setPasteText] = useState('');
  const [showPaste, setShowPaste] = useState(false);
  const pasteRef = useRef<HTMLTextAreaElement>(null);

  const updateRow = (idx: number, key: keyof Row, value: string) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [key]: value } : r)));
  };

  const addRow = () => {
    setRows((prev) => [...prev, emptyRow()]);
  };

  const deleteRow = (idx: number) => {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const parsePaste = () => {
    const lines = pasteText.trim().split('\n').filter(Boolean);
    const parsed: Row[] = lines.map((line) => {
      const parts = line.split('\t');
      return {
        ppid: parts[0]?.trim() || '',
        namaLoketKurlog: parts[1]?.trim() || '',
        noHpLoket: parts[2]?.trim() || '',
        email: parts[3]?.trim() || '',
        userMile: parts[4]?.trim() || '',
        passwordMile: parts[5]?.trim() || '',
      };
    });
    if (parsed.length > 0) {
      setRows(parsed);
      setShowPaste(false);
      setPasteText('');
    }
  };

  const handleSave = () => {
    const items = rows
      .filter((r) => r.ppid || r.namaLoketKurlog || r.noHpLoket)
      .map((r) => {
        const item = emptyDataLengkap(0);
        item.ppid = r.ppid;
        item.namaLoketKurlog = r.namaLoketKurlog;
        item.noHpLoket = r.noHpLoket;
        item.email = r.email;
        item.userMile = r.userMile;
        item.passwordMile = r.passwordMile;
        return item;
      });

    if (!items.length) return;

    if (editItem && items.length === 1) {
      onSave({ ...items[0], id: editItem.id, no: editItem.no });
    } else {
      onSaveBatch(items);
    }
    onClose();
  };

  if (!open) return null;

  const inputCls = 'w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl animate-modal-in max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 shrink-0">
          <div>
            <h3 className="text-base font-semibold text-slate-100">
              {editItem ? 'Edit Data Loket' : 'Input Data Loket'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {editItem ? `Mengedit ${editItem.ppid || editItem.namaLoketKurlog}` : `${rows.length} data loket`}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Paste area */}
          {!editItem && (
            <>
              {showPaste ? (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Paste Data dari Excel</p>
                  <textarea
                    ref={pasteRef}
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    rows={6}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none font-mono"
                    placeholder={`Paste data yang di-copas dari Excel (tab-separated):\nPPID\tNama Loket\tNo HP\tEmail\tUser Mile\tPassword`}
                  />
                  <div className="flex gap-2">
                    <button onClick={parsePaste} className="px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors cursor-pointer">
                      Parse & Tampilkan
                    </button>
                    <button onClick={() => setShowPaste(false)} className="px-4 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer">
                      Batal
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowPaste(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  Paste Data dari Excel
                </button>
              )}
            </>
          )}

          {/* Table header */}
          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="px-2.5 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider border-r border-slate-800 w-16">AKSI</th>
                  <th className="px-2.5 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider border-r border-slate-800">PPID</th>
                  <th className="px-2.5 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider border-r border-slate-800">NAMA LOKET DI KURLOG</th>
                  <th className="px-2.5 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider border-r border-slate-800">NO.HP LOKET</th>
                  <th className="px-2.5 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider border-r border-slate-800">EMAIL</th>
                  <th className="px-2.5 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider border-r border-slate-800">USER MILE</th>
                  <th className="px-2.5 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">PASSWORD MILE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-2.5 py-1.5 border-r border-slate-800">
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => deleteRow(idx)}
                          className="p-1 rounded-md hover:bg-slate-700 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Hapus baris"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="px-2.5 py-1.5 border-r border-slate-800">
                      <input type="text" value={row.ppid} onChange={(e) => updateRow(idx, 'ppid', e.target.value)} placeholder="PPID" className={inputCls} />
                    </td>
                    <td className="px-2.5 py-1.5 border-r border-slate-800">
                      <input type="text" value={row.namaLoketKurlog} onChange={(e) => updateRow(idx, 'namaLoketKurlog', e.target.value)} placeholder="Nama Loket Kurlog" className={inputCls} />
                    </td>
                    <td className="px-2.5 py-1.5 border-r border-slate-800">
                      <input type="text" value={row.noHpLoket} onChange={(e) => updateRow(idx, 'noHpLoket', e.target.value)} placeholder="No HP Loket" className={inputCls} />
                    </td>
                    <td className="px-2.5 py-1.5 border-r border-slate-800">
                      <input type="text" value={row.email} onChange={(e) => updateRow(idx, 'email', e.target.value)} placeholder="Email" className={inputCls} />
                    </td>
                    <td className="px-2.5 py-1.5 border-r border-slate-800">
                      <input type="text" value={row.userMile} onChange={(e) => updateRow(idx, 'userMile', e.target.value)} placeholder="User Mile" className={inputCls} />
                    </td>
                    <td className="px-2.5 py-1.5">
                      <input type="text" value={row.passwordMile} onChange={(e) => updateRow(idx, 'passwordMile', e.target.value)} placeholder="Password Mile" className={inputCls} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add row button */}
          {!editItem && (
            <button
              onClick={addRow}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Baris
            </button>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700 shrink-0">
          <span className="text-[11px] text-slate-600">
            {rows.length} baris data
          </span>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer">
              Batal
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors cursor-pointer"
            >
              {editItem ? 'Simpan Perubahan' : 'Simpan Data'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function emptyDataLengkap(no: number): DataLengkapItem {
  return {
    id: '',
    no,
    tglPendaftaran: '',
    statusKurlog: '',
    ppid: '',
    namaLoketOnpays: '',
    namaLoketKurlog: '',
    locationId: '',
    userMile: '',
    passwordMile: '',
    regional: '',
    kcuKc: '',
    namaPemilik: '',
    noKtp: '',
    noNpwp: '',
    noHpPemilik: '',
    noHpLoket: '',
    email: '',
    noDirian: '',
    nib: '',
    noKbli: '',
    alamatPemilikKtp: '',
    alamatLengkapLoket: '',
    rtRw: '',
    kelDesa: '',
    kec: '',
    kabKota: '',
    propinsi: '',
    kodePos: '',
    electricArea: '',
    rekomendasi: '',
    latitude: '',
    longitude: '',
    nomorRekening: '',
    namaBank: '',
    namaPemilikRekening: '',
    syarat: '',
    pengajuanSurveyKePos: '',
    pengajuanPos: '',
    pendaftaranKurlog: '',
    kelengkapanPerangkat: '',
    aktivasiKurlog: '',
    aktivasiSicepat: '',
    training: '',
    transaksi: '',
    posPpob: '',
    posOnly: '',
    sicepat: '',
    catatan: '',
    waktuUpdate: '',
  };
}
