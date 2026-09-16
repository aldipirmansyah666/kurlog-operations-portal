import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabaseServer';
import { isClosedStatus } from '@/lib/constants';
import { normalizePeriodeToISO } from '@/lib/bailoutParser';

const NBSP_REGEX = /\u00A0/g;
const ZERO_WIDTH_REGEX = /[\uFEFF\u200B\u200C\u200D\u2060\u180E]/g;

function stripInvisible(value: string): string {
  return value.replace(NBSP_REGEX, ' ').replace(ZERO_WIDTH_REGEX, '').replace(/\r/g, '');
}

function normalizeNoResi(value: string): string {
  return stripInvisible(value).replace(/[\t\n]/g, '').trim().replace(/\s+/g, '').toUpperCase();
}
function normalizeAgen(value: string): string {
  return stripInvisible(value).replace(/[\t\n]/g, ' ').trim().replace(/\s+/g, ' ');
}

function sanitizeTglTiket(value: unknown): string {
  if (value == null) return new Date().toISOString().slice(0, 10);
  const str = stripInvisible(String(value)).trim();
  if (!str) return new Date().toISOString().slice(0, 10);
  const iso = normalizePeriodeToISO(str);
  if (iso) return iso;
  // Jika tidak bisa diparse sebagai periode, tapi mengandung format tanggal Indonesia text, coba fallback Date
  const d = new Date(str);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  // Return as-is untuk legacy DD/MM/YYYY display, tapi simpan raw agar tidak Invalid Date di DB
  return str.slice(0, 50);
}

const CLOSED_AUTO_DELETE_DAYS = 2;

async function deleteExpiredClosed() {
  const cutoff = new Date(Date.now() - CLOSED_AUTO_DELETE_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabaseServer
    .from('resi')
    .delete()
    .in('status_resi', ['DELIVERED', 'RETUR'])
    .lt('closed_at', cutoff);
  if (error) console.error('[api/resi] auto-delete error:', error.message);
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabaseServer
      .from('resi')
      .select('*')
      .order('id', { ascending: false });

    if (error) return NextResponse.json({ error: `Gagal fetch resi: ${error.message}` }, { status: 500 });

    deleteExpiredClosed().catch((e) => console.error('[api/resi] auto-delete catch:', e));

    return NextResponse.json({ data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[api/resi GET] unexpected:', msg);
    return NextResponse.json({ error: `Terjadi kesalahan server (resi): ${msg}` }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Payload tidak valid: JSON malformed' }, { status: 400 });
    }

    const payload = body as Record<string, unknown>;

    if (Array.isArray(payload['items'])) {
      const items = payload['items'] as Record<string, unknown>[];
      if (items.length === 0) return NextResponse.json({ error: 'Items kosong' }, { status: 400 });
      if (items.length > 1000) return NextResponse.json({ error: 'Batch max 1000 per request — gunakan chunking (500 per batch)' }, { status: 400 });

      const rows = items.map((item) => {
        if (typeof item !== 'object' || item === null) return null as unknown as (typeof rows)[number];
        return {
          tgl_tiket: sanitizeTglTiket(item['tgl_tiket']),
          no_resi: normalizeNoResi(String(item['no_resi'] ?? '')),
          agen: normalizeAgen(String(item['agen'] ?? '')),
          layanan: stripInvisible(String(item['layanan'] ?? 'PE')).trim().toUpperCase().replace(/\s+/g, ' '),
          petugas: stripInvisible(String(item['petugas'] ?? '')).replace(/[\t\n]/g, ' ').trim().replace(/\s+/g, ' '),
          status_resi: stripInvisible(String(item['status_resi'] ?? 'PERJALANAN')).trim().toUpperCase().replace(/\s+/g, ' '),
          status_fu: String(item['status_fu'] ?? (isClosedStatus(String(item['status_resi'] ?? '')) ? 'CLOSED' : 'PERLU FOLLOW UP')),
          catatan: item['catatan'] ? stripInvisible(String(item['catatan'])).trim() : null,
          closed_at: isClosedStatus(String(item['status_resi'] ?? '')) ? new Date().toISOString() : null,
        };
      }).filter(Boolean) as {
        tgl_tiket: string; no_resi: string; agen: string; layanan: string; petugas: string; status_resi: string; status_fu: string; catatan: string | null; closed_at: string | null;
      }[];

      for (const r of rows) {
        if (!r.no_resi || !r.agen || !r.petugas) {
          return NextResponse.json({ error: `Validasi gagal: no_resi=${r.no_resi || '-'} agen=${r.agen || '-'} petugas=${r.petugas || '-'} wajib diisi` }, { status: 400 });
        }
      }

      const deduped = new Map<string, (typeof rows)[number]>();
      for (const r of rows) deduped.set(r.no_resi, r);
      const dedupedRows = Array.from(deduped.values());

      // Chunked upsert 500 untuk hindari statement timeout
      const CHUNK = 500;
      for (let i = 0; i < dedupedRows.length; i += CHUNK) {
        const chunk = dedupedRows.slice(i, i + CHUNK);
        const { error } = await supabaseServer.from('resi').upsert(chunk, { onConflict: 'no_resi' });
        if (error) return NextResponse.json({ error: `Gagal upsert resi chunk ${i / CHUNK + 1}: ${error.message}` }, { status: 500 });
      }
      return NextResponse.json({ success: true, count: dedupedRows.length });
    }

    const item = (payload['item'] as Record<string, unknown>) ?? payload;
    if (!item['no_resi'] || !item['agen'] || !item['petugas']) {
      return NextResponse.json({ error: 'no_resi, agen, petugas wajib diisi' }, { status: 400 });
    }

    const row = {
      tgl_tiket: sanitizeTglTiket(item['tgl_tiket']),
      no_resi: normalizeNoResi(String(item['no_resi'])),
      agen: normalizeAgen(String(item['agen'])),
      layanan: stripInvisible(String(item['layanan'] ?? 'PE')).trim().toUpperCase(),
      petugas: stripInvisible(String(item['petugas'])).replace(/[\t\n]/g, ' ').trim(),
      status_resi: stripInvisible(String(item['status_resi'] ?? 'PERJALANAN')).trim().toUpperCase(),
      status_fu: String(item['status_fu'] ?? (isClosedStatus(String(item['status_resi'])) ? 'CLOSED' : 'PERLU FOLLOW UP')),
      catatan: item['catatan'] ? stripInvisible(String(item['catatan'])).trim() : null,
      closed_at: isClosedStatus(String(item['status_resi'])) ? new Date().toISOString() : null,
    };

    const { error } = await supabaseServer.from('resi').upsert([row], { onConflict: 'no_resi' });
    if (error) return NextResponse.json({ error: `Gagal upsert resi: ${error.message}` }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[api/resi POST] unexpected:', msg);
    return NextResponse.json({ error: `Terjadi kesalahan server (resi): ${msg}` }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Payload tidak valid: JSON malformed' }, { status: 400 });
    }

    const { id, status_resi, catatan, addNote } = body as {
      id?: number;
      status_resi?: string;
      catatan?: string | null;
      addNote?: string;
    };

    if (!id) return NextResponse.json({ error: 'ID wajib diisi' }, { status: 400 });

    if (typeof addNote === 'string' && stripInvisible(addNote).trim()) {
      const { data: existing, error: selErr } = await supabaseServer.from('resi').select('catatan').eq('id', id).single();
      if (selErr) return NextResponse.json({ error: `Gagal fetch catatan: ${selErr.message}` }, { status: 500 });
      const timestamp = new Date().toLocaleString('id-ID', {
        day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit',
      });
      const entry = `[${timestamp}] ${stripInvisible(addNote).trim()}`;
      const updatedCatatan = existing?.catatan ? `${existing.catatan}\n${entry}` : entry;
      const { error } = await supabaseServer.from('resi').update({ catatan: updatedCatatan }).eq('id', id);
      if (error) return NextResponse.json({ error: `Gagal tambah catatan: ${error.message}` }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    if (typeof status_resi === 'string') {
      const cleanStatus = stripInvisible(status_resi).trim().toUpperCase();
      const nextFU = isClosedStatus(cleanStatus) ? 'CLOSED' : 'PERLU FOLLOW UP';
      const { error } = await supabaseServer
        .from('resi')
        .update({
          status_resi: cleanStatus,
          status_fu: nextFU,
          closed_at: isClosedStatus(cleanStatus) ? new Date().toISOString() : null,
        })
        .eq('id', id);
      if (error) return NextResponse.json({ error: `Gagal update status: ${error.message}` }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    if (catatan !== undefined) {
      const cleanCatatan = catatan ? stripInvisible(String(catatan)).trim() : null;
      const { error } = await supabaseServer.from('resi').update({ catatan: cleanCatatan || null }).eq('id', id);
      if (error) return NextResponse.json({ error: `Gagal update catatan: ${error.message}` }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Tidak ada field untuk diupdate' }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[api/resi PATCH] unexpected:', msg);
    return NextResponse.json({ error: `Terjadi kesalahan server (resi): ${msg}` }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get('id');
    const idsParam = searchParams.get('ids');

    if (idParam) {
      const id = Number(stripInvisible(idParam).trim());
      if (Number.isNaN(id)) return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
      const { error } = await supabaseServer.from('resi').delete().eq('id', id);
      if (error) return NextResponse.json({ error: `Gagal hapus resi: ${error.message}` }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    let ids: number[] = [];
    let deleteAll = false;

    if (idsParam) {
      ids = idsParam.split(',').map((v) => Number(stripInvisible(v).trim())).filter((n) => !Number.isNaN(n));
    } else {
      try {
        const body = await req.json();
        const payload = body as Record<string, unknown>;
        if (payload['deleteAll'] === true) deleteAll = true;
        if (Array.isArray(payload['ids'])) ids = (payload['ids'] as unknown[]).map((v) => Number(String(v).trim())).filter((n) => !Number.isNaN(n));
        if (typeof payload['id'] === 'number') ids = [payload['id'] as number];
      } catch {
        if (!idParam && !idsParam) {
          if (searchParams.get('all') === 'true') deleteAll = true;
        }
      }
    }

    if (deleteAll) {
      while (true) {
        const { data, error } = await supabaseServer.from('resi').select('id').limit(1000);
        if (error) return NextResponse.json({ error: `Gagal fetch ids deleteAll: ${error.message}` }, { status: 500 });
        if (!data || data.length === 0) break;
        const batchIds = data.map((r: { id: number }) => r.id);
        const { error: delErr } = await supabaseServer.from('resi').delete().in('id', batchIds);
        if (delErr) return NextResponse.json({ error: `Gagal delete batch: ${delErr.message}` }, { status: 500 });
        if (data.length < 1000) break;
      }
      return NextResponse.json({ success: true });
    }

    if (ids.length > 0) {
      const CHUNK = 500;
      for (let i = 0; i < ids.length; i += CHUNK) {
        const chunk = ids.slice(i, i + CHUNK);
        const { error } = await supabaseServer.from('resi').delete().in('id', chunk);
        if (error) return NextResponse.json({ error: `Gagal delete chunk ${i / CHUNK + 1}: ${error.message}` }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'ID/ids wajib diisi atau gunakan ?all=true untuk hapus semua' }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[api/resi DELETE] unexpected:', msg);
    return NextResponse.json({ error: `Terjadi kesalahan server (resi): ${msg}` }, { status: 500 });
  }
}
