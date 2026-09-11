'use client';

import { useState } from 'react';
import { Pencil, Trash2, Lock, Clock, MoreHorizontal, ExternalLink, ShieldCheck, Hash } from 'lucide-react';
import { STATUS_LIST, isClosedStatus } from '@/lib/constants';
import type { ResiItem } from '@/lib/types';
import StatusBadge from '@/app/components/ui/StatusBadge';

function getFUCount(catatan?: string) {
  if (!catatan || !catatan.trim()) return 0;
  return catatan.trim().split('\n').filter((line) => line.trim().length > 0).length;
}

function getFUStyle(count: number) {
  if (count === 0) return 'bg-slate-50 text-slate-500 border-slate-200 ring-slate-200/50';
  if (count === 1) return 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-600/20';
  if (count === 2) return 'bg-orange-50 text-orange-700 border-orange-200 ring-orange-600/20';
  return 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-600/20';
}

function escapeHtml(text: string) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function NotePopover({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-flex items-center" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <p className="text-xs text-slate-600 line-clamp-1 max-w-[200px] leading-relaxed">{text.split('\n').pop()}</p>
      <button
        onClick={() => setOpen((v) => !v)}
        className="ml-1 h-6 w-6 rounded-full bg-white border border-slate-200 shadow-sm text-slate-400 hover:text-slate-700 hover:border-slate-300 flex items-center justify-center active:scale-[0.98] transition-all cursor-pointer"
        title="Buka catatan"
      >
        <MoreHorizontal className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30 w-[380px] bg-white border border-slate-200 shadow-lg rounded-2xl p-4 animate-slide-in">
          <p className="text-slate-700 font-semibold text-xs uppercase tracking-wider mb-2">Catatan Lengkap</p>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300">
            <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed font-mono">{text}</p>
          </div>
          <div className="flex justify-end mt-3">
            <button
              onClick={() => {
                const w = window.open('', '_blank');
                if (w) {
                  w.document.write(`<html><head><title>Catatan Resi</title><style>body{font-family:'JetBrains Mono',monospace;padding:24px;background:#f8fafc;color:#0f172a;white-space:pre-wrap;line-height:1.6;}</style></head><body>${escapeHtml(text).replace(/\n/g, '<br>')}</body></html>`);
                  w.document.close();
                }
              }}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 active:scale-[0.98] transition-all cursor-pointer"
            >
              <ExternalLink className="h-3 w-3" /> Buka di tab baru
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ResiRow({ item, index, selected, onToggleSelect, onStatusChange, onFollowUp, onDelete }: { item: ResiItem; index: number; selected: boolean; onToggleSelect: (id: number) => void; onStatusChange: (id: number, status: string) => void; onFollowUp: (item: ResiItem) => void; onDelete: (id: number) => void }) {
  const fuCount = getFUCount(item.catatan);
  const closed = isClosedStatus(item.status_resi);
  return (
    <tr className={`group border-b border-slate-200 last:border-0 hover:bg-indigo-50/50 transition-colors ${selected ? 'bg-indigo-50/60 hover:bg-indigo-50' : index % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
      <td className="px-3 py-2.5 text-center">
        <input type="checkbox" checked={selected} onChange={() => onToggleSelect(item.id!)} className="h-4 w-4 rounded-md border-slate-300 bg-white text-indigo-600 focus:ring-indigo-500/20 focus:ring-2 cursor-pointer" />
      </td>
      <td className="px-3 py-2.5 text-center text-xs font-mono text-slate-400">{String(index + 1).padStart(2, '0')}</td>
      <td className="px-3 py-2.5 text-xs font-mono text-slate-600 whitespace-nowrap">{item.tgl_tiket || '—'}</td>
      <td className="px-3 py-2.5">
        <div className="inline-flex items-center gap-1.5">
          <span className="h-6 w-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm"><Hash className="h-3 w-3" /></span>
          <span className="text-xs font-mono font-bold tracking-tight text-slate-900">{item.no_resi}</span>
        </div>
      </td>
      <td className="px-3 py-2.5 text-xs font-semibold tracking-tight text-slate-800 max-w-[160px] truncate">{item.agen}</td>
      <td className="px-3 py-2.5"><span className="inline-flex px-2 py-1 rounded-full bg-white border border-slate-200 shadow-sm text-[11px] font-bold tracking-wide text-slate-700">{item.layanan || 'PE'}</span></td>
      <td className="px-3 py-2.5 text-xs text-slate-600 max-w-[120px] truncate">{item.petugas}</td>
      <td className="px-3 py-2.5">
        <div className="min-w-[130px] flex items-center gap-1">
          <StatusBadge status={item.status_resi} size="sm" />
          <select value={item.status_resi} onChange={(e) => onStatusChange(item.id!, e.target.value)} className="ml-1 bg-transparent border-0 text-[11px] font-semibold text-slate-500 hover:text-slate-700 cursor-pointer focus:outline-none focus:ring-0">
            {!(STATUS_LIST as string[]).includes(item.status_resi) && <option value={item.status_resi}>{item.status_resi}</option>}
            {STATUS_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </td>
      <td className="px-3 py-2.5 text-center">
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold border shadow-sm ring-1 ${getFUStyle(fuCount)}`}>
          <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
          <Clock className="h-3 w-3" /> {fuCount}x
        </span>
      </td>
      <td className="px-3 py-2.5 max-w-[220px]">
        {item.catatan ? <NotePopover text={item.catatan} /> : <span className="text-xs text-slate-300 italic">—</span>}
      </td>
      <td className="px-3 py-2.5">
        <div className="flex items-center justify-center gap-1">
          {closed ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-500 bg-slate-100 border border-slate-200 rounded-full"><Lock className="h-3 w-3" /> Closed</span>
          ) : (
            <button onClick={() => onFollowUp(item)} className="h-8 w-8 rounded-xl bg-white border border-slate-200 shadow-sm text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 flex items-center justify-center active:scale-[0.98] transition-all duration-150 focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer" title="Follow Up">
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          <button onClick={() => onDelete(item.id!)} className="h-8 w-8 rounded-xl bg-white border border-slate-200 shadow-sm text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 flex items-center justify-center active:scale-[0.98] transition-all duration-150 focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer" title="Hapus">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function ResiTable({ items, loading, selectedIds, onToggleSelect, onToggleAll, onStatusChange, onFollowUp, onDelete }: { items: ResiItem[]; loading: boolean; selectedIds: Set<number>; onToggleSelect: (id: number) => void; onToggleAll: (ids: number[]) => void; onStatusChange: (id: number, status: string) => void; onFollowUp: (item: ResiItem) => void; onDelete: (id: number) => void }) {
  const headers = ['', 'NO', 'TGL TIKET', 'NO. RESI', 'AGEN', 'LAYANAN', 'PETUGAS', 'STATUS', 'FU', 'CATATAN', 'AKSI'];
  const visibleIds = items.filter((i) => i.id !== undefined).map((i) => i.id!);
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));

  return (
    <div className="overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm">
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300">
        <table className="w-full text-left table-premium">
          <thead className="sticky top-0 z-10 bg-slate-100/80 backdrop-blur-sm border-b border-slate-200">
            <tr>
              {headers.map((h) => (
                <th key={h} className="px-3 py-3 whitespace-nowrap text-slate-700 font-semibold text-xs uppercase tracking-wider">
                  {h === '' ? (
                    <input type="checkbox" checked={allSelected} onChange={() => onToggleAll(visibleIds)} className="h-4 w-4 rounded-md border-slate-300 bg-white text-indigo-600 focus:ring-indigo-500/20 cursor-pointer" />
                  ) : h === 'STATUS' ? (
                    <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> {h}</span>
                  ) : (
                    h
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-slate-800">
            {loading ? (
              <tr><td colSpan={11} className="text-center py-12"><span className="inline-flex items-center gap-2 text-sm text-slate-500"><span className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-indigo-600 animate-spin" /> Memuat data…</span></td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={11} className="text-center py-12 text-sm text-slate-500">Tidak ada data resi ditemukan.</td></tr>
            ) : (
              items.map((item, i) => (
                <ResiRow key={item.id} item={item} index={i} selected={item.id !== undefined && selectedIds.has(item.id)} onToggleSelect={onToggleSelect} onStatusChange={onStatusChange} onFollowUp={onFollowUp} onDelete={onDelete} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
