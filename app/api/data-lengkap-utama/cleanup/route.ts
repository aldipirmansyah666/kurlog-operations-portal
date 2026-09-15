import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabaseServer';

function normalizePpid(value: unknown): string {
  let s = String(value ?? '').replace(/[\u00A0]/g, ' ');
  s = s.trim().replace(/[\t\r\n]/g, '').replace(/\s+/g, '').toUpperCase();
  if (s === '-' || s === '0' || s === 'NULL' || s === '') return '';
  return s;
}

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Fetch all rows paginated
  const PAGE_SIZE = 1000;
  const allRows: { id: string; ppid: string | null; updated_at: string | null; created_at: string | null; no: number | null }[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabaseServer
      .from('data_lengkap_utama')
      .select('id,ppid,updated_at,created_at,no')
      .order('no', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const batch = (data as typeof allRows) || [];
    allRows.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  // Group by normalized ppid (case-insensitive, invisible cleaned)
  const groups = new Map<string, typeof allRows>();
  for (const row of allRows) {
    const norm = normalizePpid(row.ppid);
    if (!norm) continue; // abaikan ppid kosong / -,0,NULL (partial index tidak unik)
    if (!groups.has(norm)) groups.set(norm, []);
    groups.get(norm)!.push(row);
  }

  const duplicateGroups = Array.from(groups.entries()).filter(([, rows]) => rows.length > 1);
  let totalDuplicates = 0;
  const totalGroups = duplicateGroups.length;
  const details: { ppid: string; keep: string; deleted: string[] }[] = [];
  const idsToDelete: string[] = [];

  for (const [normPpid, rows] of duplicateGroups) {
    // Urutkan terbaru dulu: updated_at desc, lalu created_at desc, lalu no desc
    const sorted = [...rows].sort((a, b) => {
      const aTime = a.updated_at ? new Date(a.updated_at).getTime() : a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.updated_at ? new Date(b.updated_at).getTime() : b.created_at ? new Date(b.created_at).getTime() : 0;
      if (bTime !== aTime) return bTime - aTime;
      const aNo = a.no ?? 0;
      const bNo = b.no ?? 0;
      return bNo - aNo;
    });
    const keep = sorted[0];
    const toDelete = sorted.slice(1);
    totalDuplicates += toDelete.length;
    idsToDelete.push(...toDelete.map((r) => r.id));
    details.push({ ppid: normPpid, keep: keep.id, deleted: toDelete.map((r) => r.id) });
  }

  if (idsToDelete.length === 0) {
    return NextResponse.json({ success: true, message: 'Tidak ada duplikat ppid ditemukan', totalGroups: 0, totalDuplicates: 0, details: [] });
  }

  // Hapus duplikat chunked 500
  const CHUNK = 500;
  let deletedCount = 0;
  for (let i = 0; i < idsToDelete.length; i += CHUNK) {
    const chunk = idsToDelete.slice(i, i + CHUNK);
    const { error } = await supabaseServer.from('data_lengkap_utama').delete().in('id', chunk);
    if (error) return NextResponse.json({ error: error.message, deletedCount, totalDuplicates }, { status: 500 });
    deletedCount += chunk.length;
  }

  return NextResponse.json({
    success: true,
    message: `Cleanup selesai: ${totalGroups} grup ppid duplikat, ${deletedCount} baris dihapus, 1 terbaru per grup dipertahankan`,
    totalGroups,
    totalDuplicates: deletedCount,
    details,
  });
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Dry-run detection tanpa hapus: laporkan duplikat
  const PAGE_SIZE = 1000;
  const allRows: { id: string; ppid: string | null; updated_at: string | null; created_at: string | null; no: number | null }[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabaseServer
      .from('data_lengkap_utama')
      .select('id,ppid,updated_at,created_at,no')
      .order('no', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const batch = (data as typeof allRows) || [];
    allRows.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  const groups = new Map<string, typeof allRows>();
  for (const row of allRows) {
    const norm = normalizePpid(row.ppid);
    if (!norm) continue;
    if (!groups.has(norm)) groups.set(norm, []);
    groups.get(norm)!.push(row);
  }

  const duplicates = Array.from(groups.entries())
    .filter(([, rows]) => rows.length > 1)
    .map(([ppid, rows]) => ({
      ppid,
      count: rows.length,
      ids: rows.map((r) => r.id),
      rows: rows.map((r) => ({ id: r.id, ppid: r.ppid, no: r.no, updated_at: r.updated_at })),
    }));

  return NextResponse.json({
    success: true,
    totalGroups: duplicates.length,
    totalRows: allRows.length,
    duplicates,
  });
}
