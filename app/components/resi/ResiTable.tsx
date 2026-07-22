'use client';

import { Pencil, Trash2, Lock, Clock } from 'lucide-react';
import StatusBadge from '@/app/components/ui/StatusBadge';
import { STATUS_LIST, isClosedStatus } from '@/lib/constants';
import type { ResiItem } from '@/lib/types';

function getFUCount(catatan?: string) {
  if (!catatan || !catatan.trim()) return 0;
  return catatan.trim().split('\n').filter((line) => line.trim().length > 0).length;
}

interface ResiRowProps {
  item: ResiItem;
  index: number;
  onStatusChange: (id: number, status: string) => void;
  onFollowUp: (item: ResiItem) => void;
  onDelete: (id: number) => void;
}

function ResiRow({ item, index, onStatusChange, onFollowUp, onDelete }: ResiRowProps) {
  const fuCount = getFUCount(item.catatan);
  const closed = isClosedStatus(item.status_resi);

  return (
    <tr className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
      <td className="px-4 py-3 text-center text-xs text-slate-500 font-mono">{index + 1}</td>
      <td className="px-4 py-3 text-xs font-mono text-slate-300">{item.tgl_tiket || '-'}</td>
      <td className="px-4 py-3 text-xs font-mono font-semibold text-blue-400">{item.no_resi}</td>
      <td className="px-4 py-3 text-xs font-medium text-slate-200">{item.agen}</td>
      <td className="px-4 py-3 text-xs font-semibold text-slate-300">{item.layanan || 'PE'}</td>
      <td className="px-4 py-3 text-xs text-slate-300">{item.petugas}</td>
      <td className="px-4 py-3">
        <select
          value={item.status_resi}
          onChange={(e) => onStatusChange(item.id!, e.target.value)}
          className="bg-transparent border-0 text-[11px] font-semibold cursor-pointer focus:outline-none p-0 text-slate-200"
        >
          {STATUS_LIST.map((s) => (
            <option key={s} value={s} className="bg-slate-900">{s}</option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3 text-center">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${
            fuCount > 0
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              : 'bg-slate-800 text-slate-500 border border-slate-700'
          }`}
        >
          <Clock className="w-3 h-3" />
          {fuCount}x
        </span>
      </td>
      <td className="px-4 py-3 max-w-[200px]">
        {item.catatan ? (
          <p className="text-[11px] text-slate-400 line-clamp-2 whitespace-pre-line font-mono bg-slate-950/60 p-1.5 rounded-md border border-slate-800/60">
            {item.catatan.split('\n').pop()}
          </p>
        ) : (
          <span className="text-[11px] text-slate-600 italic">-</span>
        )}
      </td>
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-1">
          {closed ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-500 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <Lock className="w-3 h-3" />
              Closed
            </span>
          ) : (
            <button
              onClick={() => onFollowUp(item)}
              className="p-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-600/20 transition-colors cursor-pointer"
              title="Follow Up"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => onDelete(item.id!)}
            className="p-1.5 rounded-lg bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-600/20 transition-colors cursor-pointer"
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
  onStatusChange: (id: number, status: string) => void;
  onFollowUp: (item: ResiItem) => void;
  onDelete: (id: number) => void;
}

export default function ResiTable({
  items,
  loading,
  onStatusChange,
  onFollowUp,
  onDelete,
}: ResiTableProps) {
  const headers = ['NO', 'TGL TIKET', 'NO. RESI', 'AGEN', 'LAYANAN', 'PETUGAS', 'STATUS', 'FU', 'CATATAN', 'AKSI'];

  return (
    <div className="bg-slate-900/70 rounded-xl border border-slate-800/80 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-950/60 border-b border-slate-800">
            <tr>
              {headers.map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-slate-200">
            {loading ? (
              <tr>
                <td colSpan={10} className="text-center py-12 text-slate-500 text-sm">
                  Memuat data...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-12 text-slate-500 text-sm">
                  Tidak ada data resi ditemukan.
                </td>
              </tr>
            ) : (
              items.map((item, i) => (
                <ResiRow
                  key={item.id}
                  item={item}
                  index={i}
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
