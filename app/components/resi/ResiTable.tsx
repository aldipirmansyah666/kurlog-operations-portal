'use client';

import { useState } from 'react';
import { Pencil, Trash2, Lock, Clock, MoreHorizontal, ExternalLink } from 'lucide-react';
import { STATUS_LIST, isClosedStatus } from '@/lib/constants';
import type { ResiItem } from '@/lib/types';

function getFUCount(catatan?: string) {
  if (!catatan || !catatan.trim()) return 0;
  return catatan.trim().split('\n').filter((line) => line.trim().length > 0).length;
}

function getFUStyle(count: number) {
  if (count === 0) return 'bg-slate-100 text-slate-400 border border-slate-200';
  if (count === 1) return 'bg-amber-50 text-amber-600 border border-amber-200';
  if (count === 2) return 'bg-orange-50 text-orange-600 border border-orange-200';
  return 'bg-rose-50 text-rose-600 border border-rose-200';
}

interface NotePopoverProps {
  text: string;
}

function NotePopover({ text }: NotePopoverProps) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <p className="text-[11px] text-slate-500 line-clamp-1 max-w-[180px]">
        {text.split('\n').pop()}
      </p>
      <button className="ml-1 p-0.5 rounded text-slate-300 hover:text-slate-500 transition-colors cursor-pointer">
        <MoreHorizontal className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div className="absolute bottom-full left-0 mb-2 z-30 w-[360px] bg-white border border-[#E2E8F0] rounded-xl shadow-xl p-4 animate-fade-in">
          <p className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Catatan Lengkap</p>
          <div className="bg-slate-50 border border-[#E2E8F0] rounded-lg p-3 max-h-48 overflow-y-auto">
            <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed font-mono">{text}</p>
          </div>
          <div className="flex justify-end mt-3 pt-2 border-t border-[#E2E8F0]">
            <button
              onClick={() => {
                const w = window.open('', '_blank');
                if (w) {
                  w.document.write(`<html><head><title>Catatan Resi</title><style>body{font-family:'JetBrains Mono',monospace;padding:24px;background:#f8fafc;color:#1e293b;white-space:pre-wrap;line-height:1.6;}</style></head><body>${text.replace(/\n/g, '<br>')}</body></html>`);
                  w.document.close();
                }
              }}
              className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 font-medium transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3 h-3" /> Open in new window
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface ResiRowProps {
  item: ResiItem;
  index: number;
  selected: boolean;
  onToggleSelect: (id: number) => void;
  onStatusChange: (id: number, status: string) => void;
  onFollowUp: (item: ResiItem) => void;
  onDelete: (id: number) => void;
}

function ResiRow({ item, index, selected, onToggleSelect, onStatusChange, onFollowUp, onDelete }: ResiRowProps) {
  const fuCount = getFUCount(item.catatan);
  const closed = isClosedStatus(item.status_resi);

  return (
    <tr className={`border-b border-[#E2E8F0] hover:bg-slate-50/80 transition-colors ${selected ? 'bg-blue-50/50' : ''}`}>
      <td className="px-4 py-3 text-center">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(item.id!)}
          className="w-3.5 h-3.5 rounded border-slate-300 bg-white text-blue-600 focus:ring-blue-500/50 focus:ring-offset-0 cursor-pointer accent-blue-600"
        />
      </td>
      <td className="px-4 py-3 text-center text-xs text-slate-400 font-mono">{index + 1}</td>
      <td className="px-4 py-3 text-xs font-mono text-slate-500">{item.tgl_tiket || '-'}</td>
      <td className="px-4 py-3 text-xs font-mono font-semibold text-slate-800 tracking-wide">{item.no_resi}</td>
      <td className="px-4 py-3 text-xs font-medium text-slate-700">{item.agen}</td>
      <td className="px-4 py-3 text-xs font-semibold text-slate-600">{item.layanan || 'PE'}</td>
      <td className="px-4 py-3 text-xs text-slate-500">{item.petugas}</td>
      <td className="px-4 py-3">
        <select
          value={item.status_resi}
          onChange={(e) => onStatusChange(item.id!, e.target.value)}
          className="bg-transparent border-0 text-[11px] font-semibold cursor-pointer focus:outline-none p-0 text-slate-700"
        >
          {STATUS_LIST.map((s) => (
            <option key={s} value={s} className="bg-white">{s}</option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3 text-center">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${getFUStyle(fuCount)}`}
        >
          <Clock className="w-3 h-3" />
          {fuCount}x
        </span>
      </td>
      <td className="px-4 py-3 max-w-[200px]">
        {item.catatan ? (
          <NotePopover text={item.catatan} />
        ) : (
          <span className="text-[11px] text-slate-300 italic">-</span>
        )}
      </td>
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-1">
          {closed ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-400 bg-slate-100 rounded-lg border border-[#E2E8F0]">
              <Lock className="w-3 h-3" />
              Closed
            </span>
          ) : (
            <button
              onClick={() => onFollowUp(item)}
              className="p-1.5 rounded-lg bg-transparent hover:bg-blue-50 text-slate-300 hover:text-blue-500 border border-transparent hover:border-blue-200 transition-all duration-200 cursor-pointer hover:scale-110"
              title="Follow Up"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => onDelete(item.id!)}
            className="p-1.5 rounded-lg bg-transparent hover:bg-rose-50 text-slate-300 hover:text-rose-500 border border-transparent hover:border-rose-200 transition-all duration-200 cursor-pointer hover:scale-110"
            title="Hapus"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

interface ResiTableProps {
  items: ResiItem[];
  loading: boolean;
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  onToggleAll: (ids: number[]) => void;
  onStatusChange: (id: number, status: string) => void;
  onFollowUp: (item: ResiItem) => void;
  onDelete: (id: number) => void;
}

export default function ResiTable({
  items,
  loading,
  selectedIds,
  onToggleSelect,
  onToggleAll,
  onStatusChange,
  onFollowUp,
  onDelete,
}: ResiTableProps) {
  const headers = ['', 'NO', 'TGL TIKET', 'NO. RESI', 'AGEN', 'LAYANAN', 'PETUGAS', 'STATUS', 'FU', 'CATATAN', 'AKSI'];
  const visibleIds = items.filter((i) => i.id !== undefined).map((i) => i.id!);
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-[#E2E8F0]">
            <tr>
              {headers.map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider"
                >
                  {h === '' ? (
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={() => onToggleAll(visibleIds)}
                      className="w-3.5 h-3.5 rounded border-slate-300 bg-white text-blue-600 focus:ring-blue-500/50 focus:ring-offset-0 cursor-pointer accent-blue-600"
                    />
                  ) : (
                    h
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={11} className="text-center py-12 text-slate-400 text-sm">
                  Memuat data...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center py-12 text-slate-400 text-sm">
                  Tidak ada data resi ditemukan.
                </td>
              </tr>
            ) : (
              items.map((item, i) => (
                <ResiRow
                  key={item.id}
                  item={item}
                  index={i}
                  selected={item.id !== undefined && selectedIds.has(item.id)}
                  onToggleSelect={onToggleSelect}
                  onStatusChange={onStatusChange}
                  onFollowUp={onFollowUp}
                  onDelete={onDelete}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
