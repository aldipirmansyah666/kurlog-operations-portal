'use client';

import { useState } from 'react';
import { Pencil, Clock, Check, X, History, MessageSquare } from 'lucide-react';
import Modal from '@/app/components/ui/Modal';
import type { ResiItem } from '@/lib/types';

function parseEntries(catatan?: string): string[] {
  if (!catatan || !catatan.trim()) return [];
  return catatan.split('\n').filter((l) => l.trim().length > 0);
}

export default function FollowUpModal({ resi, onClose, onSave, onUpdateNote }: { resi: ResiItem | null; onClose: () => void; onSave: (resi: ResiItem, note: string) => Promise<void>; onUpdateNote: (id: number, newCatatan: string) => Promise<void> }) {
  const [newNote, setNewNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

  if (!resi) return null;
  const entries = parseEntries(resi.catatan);
  const fuCount = entries.length;

  const handleSave = async () => {
    if (!newNote.trim()) return;
    setSaving(true);
    await onSave(resi, newNote);
    setNewNote('');
    setSaving(false);
    onClose();
  };

  const handleStartEdit = (idx: number) => { setEditingIdx(idx); setEditText(entries[idx]); };
  const handleCancelEdit = () => { setEditingIdx(null); setEditText(''); };
  const handleSaveEdit = async () => {
    if (editingIdx === null) return;
    const updated = [...entries]; updated[editingIdx] = editText.trim();
    const newCatatan = updated.filter((e) => e.length > 0).join('\n');
    await onUpdateNote(resi.id!, newCatatan);
    setEditingIdx(null); setEditText(''); onClose();
  };
  const handleDeleteEntry = async (idx: number) => {
    const updated = entries.filter((_, i) => i !== idx);
    await onUpdateNote(resi.id!, updated.join('\n'));
    setEditingIdx(null); setEditText(''); onClose();
  };

  return (
    <Modal open={!!resi} onClose={onClose} title="Follow Up Resi" subtitle={`${resi.no_resi} • ${resi.agen}`}>
      <div className="space-y-5">
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-indigo-50 border border-indigo-200">
          <span className="h-10 w-10 rounded-xl bg-white border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-sm"><MessageSquare className="h-5 w-5" /></span>
          <div>
            <p className="text-sm font-bold tracking-tight text-slate-900">{resi.no_resi}</p>
            <p className="text-xs text-slate-600 flex items-center gap-1.5"><Clock className="h-3 w-3 text-amber-500" /> {fuCount}x Follow Up • {resi.status_resi}</p>
          </div>
          <span className="ml-auto px-2.5 py-1 rounded-full bg-white border border-slate-200 text-xs font-mono font-semibold text-slate-700">{resi.petugas}</span>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold tracking-widest text-slate-500 uppercase flex items-center gap-1.5"><History className="h-3.5 w-3.5" /> Riwayat Sebelumnya</label>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 overflow-hidden">
            <div className="max-h-48 overflow-y-auto divide-y divide-slate-200">
              {entries.length === 0 ? (
                <p className="p-4 text-xs text-slate-400 italic">Belum ada riwayat follow up.</p>
              ) : (
                entries.map((entry, idx) => {
                  const isEditing = editingIdx === idx;
                  return (
                    <div key={idx} className="group px-4 py-3 text-xs font-mono text-slate-700 bg-white">
                      {isEditing ? (
                        <div className="space-y-2">
                          <textarea rows={2} value={editText} onChange={(e) => setEditText(e.target.value)} autoFocus className="w-full rounded-xl bg-white border border-slate-200 p-2.5 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none" />
                          <div className="flex items-center gap-1.5">
                            <button onClick={handleSaveEdit} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-full cursor-pointer"><Check className="h-3 w-3" /> Simpan</button>
                            <button onClick={handleCancelEdit} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-full cursor-pointer"><X className="h-3 w-3" /> Batal</button>
                            <button onClick={() => handleDeleteEntry(idx)} className="ml-auto px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-full cursor-pointer">Hapus</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-2">
                          <p className="whitespace-pre-line leading-relaxed">{entry}</p>
                          <button onClick={() => handleStartEdit(idx)} className="shrink-0 h-7 w-7 rounded-full bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer"><Pencil className="h-3 w-3" /></button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold tracking-widest text-slate-500 uppercase">Tambah Catatan Hari Ini</label>
          <textarea rows={3} placeholder="Misal: FU ke-2 via WA CS Gudang, pembeli dikonfirmasi…" value={newNote} onChange={(e) => setNewNote(e.target.value)} className="w-full rounded-2xl bg-white border border-slate-200 p-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none" />
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">Batal</button>
          <button onClick={handleSave} disabled={!newNote.trim() || saving} className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer">{saving ? 'Menyimpan…' : 'Simpan Catatan'}</button>
        </div>
      </div>
    </Modal>
  );
}
