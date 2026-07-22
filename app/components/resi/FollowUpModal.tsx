'use client';

import { useState } from 'react';
import { Pencil, Clock } from 'lucide-react';
import Modal from '@/app/components/ui/Modal';
import type { ResiItem } from '@/lib/types';

function getFUCount(catatan?: string) {
  if (!catatan || !catatan.trim()) return 0;
  return catatan.trim().split('\n').filter((l) => l.trim().length > 0).length;
}

interface FollowUpModalProps {
  resi: ResiItem | null;
  onClose: () => void;
  onSave: (resi: ResiItem, note: string) => Promise<void>;
}

export default function FollowUpModal({ resi, onClose, onSave }: FollowUpModalProps) {
  const [newNote, setNewNote] = useState('');
  const [saving, setSaving] = useState(false);

  if (!resi) return null;

  const fuCount = getFUCount(resi.catatan);

  const handleSave = async () => {
    if (!newNote.trim()) return;
    setSaving(true);
    await onSave(resi, newNote);
    setNewNote('');
    setSaving(false);
    onClose();
  };

  return (
    <Modal open={!!resi} onClose={onClose} title="Follow Up Resi">
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-800">
          <Pencil className="w-4 h-4 text-blue-400 shrink-0" />
          <div>
            <p className="text-sm font-medium text-white">{resi.no_resi}</p>
            <p className="text-xs text-slate-400">
              {resi.agen} &middot;{' '}
              <span className="inline-flex items-center gap-1 text-amber-400">
                <Clock className="w-3 h-3" /> {fuCount}x Follow Up
              </span>
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-400">Riwayat Sebelumnya</label>
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 h-40 overflow-y-auto text-xs font-mono whitespace-pre-line text-slate-300">
            {resi.catatan || <span className="text-slate-600 italic">Belum ada riwayat.</span>}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-400">Tambah Catatan Hari Ini</label>
          <textarea
            rows={3}
            placeholder="Misal: FU ke-2 via WA CS Gudang, pembeli dikonfirmasi..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors resize-none placeholder:text-slate-600"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800/80">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={!newNote.trim() || saving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Menyimpan...' : 'Simpan Catatan'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
