import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabaseServer';
import { isClosedStatus } from '@/lib/constants';

const CLOSED_AUTO_DELETE_DAYS = 2;

async function deleteExpiredClosed() {
  const cutoff = new Date(Date.now() - CLOSED_AUTO_DELETE_DAYS * 24 * 60 * 60 * 1000).toISOString();
  // service_role bypasses RLS – safe to run server-side
  const { error } = await supabaseServer
    .from('resi')
    .delete()
    .in('status_resi', ['DELIVERED', 'RETUR'])
    .lt('closed_at', cutoff);
  if (error) console.error('[api/resi] auto-delete error:', error.message);
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabaseServer
    .from('resi')
    .select('*')
    .order('id', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // fire-and-forget cleanup (don't block response)
  deleteExpiredClosed().catch(() => {});

  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Payload tidak valid' }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;

  // Batch insert: { items: [...] }
  if (Array.isArray(payload['items'])) {
    const items = payload['items'] as Record<string, unknown>[];
    if (items.length === 0) return NextResponse.json({ error: 'Items kosong' }, { status: 400 });
    if (items.length > 1000) return NextResponse.json({ error: 'Batch max 1000' }, { status: 400 });

    const rows = items.map((item) => ({
      tgl_tiket: String(item['tgl_tiket'] ?? ''),
      no_resi: String(item['no_resi'] ?? '').trim(),
      agen: String(item['agen'] ?? '').trim(),
      layanan: String(item['layanan'] ?? 'PE'),
      petugas: String(item['petugas'] ?? '').trim(),
      status_resi: String(item['status_resi'] ?? 'PERJALANAN'),
      status_fu: String(item['status_fu'] ?? (isClosedStatus(String(item['status_resi'] ?? '')) ? 'CLOSED' : 'PERLU FOLLOW UP')),
      catatan: item['catatan'] ? String(item['catatan']) : null,
      closed_at: isClosedStatus(String(item['status_resi'] ?? '')) ? new Date().toISOString() : null,
    }));

    // basic validation
    for (const r of rows) {
      if (!r.no_resi || !r.agen || !r.petugas) {
        return NextResponse.json({ error: 'no_resi, agen, petugas wajib diisi' }, { status: 400 });
      }
    }

    const { error } = await supabaseServer.from('resi').insert(rows);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  // Single insert: { item: {...} } or direct item
  const item = (payload['item'] as Record<string, unknown>) ?? payload;
  if (!item['no_resi'] || !item['agen'] || !item['petugas']) {
    return NextResponse.json({ error: 'no_resi, agen, petugas wajib diisi' }, { status: 400 });
  }

  const row = {
    tgl_tiket: String(item['tgl_tiket'] ?? ''),
    no_resi: String(item['no_resi']).trim(),
    agen: String(item['agen']).trim(),
    layanan: String(item['layanan'] ?? 'PE'),
    petugas: String(item['petugas']).trim(),
    status_resi: String(item['status_resi'] ?? 'PERJALANAN'),
    status_fu: String(item['status_fu'] ?? (isClosedStatus(String(item['status_resi'])) ? 'CLOSED' : 'PERLU FOLLOW UP')),
    catatan: item['catatan'] ? String(item['catatan']) : null,
    closed_at: isClosedStatus(String(item['status_resi'])) ? new Date().toISOString() : null,
  };

  const { error } = await supabaseServer.from('resi').insert([row]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Payload tidak valid' }, { status: 400 });
  }

  const { id, status_resi, catatan, addNote } = body as {
    id?: number;
    status_resi?: string;
    catatan?: string | null;
    addNote?: string;
  };

  if (!id) return NextResponse.json({ error: 'ID wajib diisi' }, { status: 400 });

  // Add note (append with timestamp)
  if (typeof addNote === 'string' && addNote.trim()) {
    const { data: existing, error: selErr } = await supabaseServer.from('resi').select('catatan').eq('id', id).single();
    if (selErr) return NextResponse.json({ error: selErr.message }, { status: 500 });
    const timestamp = new Date().toLocaleString('id-ID', {
      day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit',
    });
    const entry = `[${timestamp}] ${addNote.trim()}`;
    const updatedCatatan = existing?.catatan ? `${existing.catatan}\n${entry}` : entry;
    const { error } = await supabaseServer.from('resi').update({ catatan: updatedCatatan }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  // Update status
  if (typeof status_resi === 'string') {
    const nextFU = isClosedStatus(status_resi) ? 'CLOSED' : 'PERLU FOLLOW UP';
    const { error } = await supabaseServer
      .from('resi')
      .update({
        status_resi,
        status_fu: nextFU,
        closed_at: isClosedStatus(status_resi) ? new Date().toISOString() : null,
      })
      .eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  // Update catatan directly
  if (catatan !== undefined) {
    const { error } = await supabaseServer.from('resi').update({ catatan: catatan || null }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Tidak ada field untuk diupdate' }, { status: 400 });
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const idParam = searchParams.get('id');
  const idsParam = searchParams.get('ids');

  // Delete single via ?id=
  if (idParam) {
    const id = Number(idParam);
    if (Number.isNaN(id)) return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
    const { error } = await supabaseServer.from('resi').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  // Delete batch via ?ids=1,2,3  or body { ids: [] } or { deleteAll: true }
  let ids: number[] = [];
  let deleteAll = false;

  if (idsParam) {
    ids = idsParam.split(',').map((v) => Number(v.trim())).filter((n) => !Number.isNaN(n));
  } else {
    try {
      const body = await req.json();
      const payload = body as Record<string, unknown>;
      if (payload['deleteAll'] === true) deleteAll = true;
      if (Array.isArray(payload['ids'])) ids = (payload['ids'] as unknown[]).map((v) => Number(v)).filter((n) => !Number.isNaN(n));
      if (typeof payload['id'] === 'number') ids = [payload['id'] as number];
    } catch {
      // no body – check if deleteAll requested via no ids
      if (!idParam && !idsParam) {
        // if no id/ids, interpret as deleteAll only if explicitly requested via query
        // to avoid accidental mass delete, require ?all=true
        if (searchParams.get('all') === 'true') deleteAll = true;
      }
    }
  }

  if (deleteAll) {
    // delete in batches to respect Supabase limits
    while (true) {
      const { data, error } = await supabaseServer.from('resi').select('id').limit(1000);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      if (!data || data.length === 0) break;
      const batchIds = data.map((r: { id: number }) => r.id);
      const { error: delErr } = await supabaseServer.from('resi').delete().in('id', batchIds);
      if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });
      if (data.length < 1000) break;
    }
    return NextResponse.json({ success: true });
  }

  if (ids.length > 0) {
    const CHUNK = 500;
    for (let i = 0; i < ids.length; i += CHUNK) {
      const chunk = ids.slice(i, i + CHUNK);
      const { error } = await supabaseServer.from('resi').delete().in('id', chunk);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'ID/ids wajib diisi atau gunakan ?all=true untuk hapus semua' }, { status: 400 });
}
