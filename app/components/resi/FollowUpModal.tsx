'use client';

import { useState } from 'react';
import { Pencil, Clock, Check, X } from 'lucide-react';
import Modal from '@/app/components/ui/Modal';
import type { ResiItem } from '@/lib/types';

function parseEntries(catatan?: string): string[] {
  if (!catatan || !catatan.trim()) return [];
  return catatan.split('\n').filter((l) => l.trim().length > 0);
}

interface FollowUpModalProps {
  resi: ResiItem | null;
  onClose: () => void;
  onSave: (resi: ResiItem, note: string) => Promise<void>;
  onUpdateNote: (id: number, newCatatan: string) => Promise<void>;
}

export default function FollowUpModal({ resi, onClose, onSave, onUpdateNote }: FollowUpModalProps) {
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

  const handleStartEdit = (idx: number) => {
    setEditingIdx(idx);
    setEditText(entries[idx]);
  };

  const handleCancelEdit = () => {
    setEditingIdx(null);
    setEditText('');
  };

  const handleSaveEdit = async () => {
    if (editingIdx === null) return;
    const updated = [...entries];
    updated[editingIdx] = editText.trim();
    const newCatatan = updated.filter((e) => e.length > 0).join('\n');
    await onUpdateNote(resi.id!, newCatatan);
    setEditingIdx(null);
    setEditText('');
    onClose();
  };

  const handleDeleteEntry = async (idx: number) => {
    const updated = entries.filter((_, i) => i !== idx);
    const newCatatan = updated.join('\n');
    await onUpdateNote(resi.id!, newCatatan);
    setEditingIdx(null);
    setEditText('');
    onClose();
  };

  return (
    <Modal open={!!resi} onClose={onClose} title="Follow Up Resi">
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-[#E2E8F0]">
          <Pencil className="w-4 h-4 text-blue-500 shrink-0" />
          <div>
            <p className="text-sm font-medium text-slate-800">{resi.no_resi}</p>
            <p className="text-xs text-slate-400">
              {resi.agen} &middot;{' '}
              <span className="inline-flex items-center gap-1 text-amber-500">
                <Clock className="w-3 h-3" /> {fuCount}x Follow Up
              </span>
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-400">Riwayat Sebelumnya</label>
          <div className="bg-slate-50 border border-[#E2E8F0] rounded-lg h-48 overflow-y-auto">
            {entries.length === 0 ? (
              <p className="p-3 text-xs text-slate-300 italic">Belum ada riwayat.</p>
            ) : (
              <ul className="divide-y divide-[#E2E8F0]">
                {entries.map((entry, idx) => {
                  const isEditing = editingIdx === idx;
                  return (
                    <li key={idx} className="group px-3 py-2 text-xs font-mono text-slate-600">
                      {isEditing ? (
                        <div className="space-y-2">
                          <textarea
                            rows={2}
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            autoFocus
                            className="w-full bg-white border border-[#E2E8F0] rounded-md p-2 text-xs font-mono text-slate-700 focus:outline-none focus:border-blue-500 resize-none"
                          />
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={handleSaveEdit}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors cursor-pointer"
                            >
                              <Check className="w-3 h-3" /> Simpan
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-50 border border-[#E2E8F0] rounded-md transition-colors cursor-pointer"
                            >
                              <X className="w-3 h-3" /> Batal
                            </button>
                            <button
                              onClick={() => handleDeleteEntry(idx)}
                              className="ml-auto inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-rose-500 hover:text-rose-400 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors cursor-pointer"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-2">
                          <p className="whitespace-pre-line leading-relaxed">{entry}</p>
                          <button
                            onClick={() => handleStartEdit(idx)}
                            className="shrink-0 mt-0.5 p-1 rounded-md text-slate-300 hover:text-blue-500 hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                            title="Edit catatan ini"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-400">Tambah Catatan Hari Ini</label>
          <textarea
            rows={3}
            placeholder="Misal: FU ke-2 via WA CS Gudang, pembeli dikonfirmasi..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="w-full bg-slate-50 border border-[#E2E8F0] rounded-lg p-3 text-sm text-slate-700 focus:outline-none focus:border-blue-500 transition-colors resize-none placeholder:text-slate-300"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-50 border border-[#E2E8F0] rounded-lg transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={!newNote.trim() || saving}
            className="px-4 py-2 text-sm font-medium text-white bg-[#1E293B] hover:bg-slate-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Menyimpan...' : 'Simpan Catatan'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
