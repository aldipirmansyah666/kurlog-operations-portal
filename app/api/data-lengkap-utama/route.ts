import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabaseServer';
import { sanitizeDataLengkapUtamaValues } from '@/lib/dataLengkapUtama';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const PAGE_SIZE = 1000;
  const allRows: unknown[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabaseServer
      .from('data_lengkap_utama')
      .select('*')
      .order('no', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const batch = data || [];
    allRows.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return NextResponse.json({ data: allRows });
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

  // Batch import: { items: DataLengkapUtamaValues[] } — gunakan upsert onConflict ppid
  if (Array.isArray(payload['items'])) {
    const items = payload['items'] as Record<string, unknown>[];
    if (items.length === 0) return NextResponse.json({ error: 'Items kosong' }, { status: 400 });

    // Sanitasi + deduplikasi dalam file (kode_loket sama -> last wins)
    const sanitizedAll = items.map((it) => sanitizeDataLengkapUtamaValues(it));
    const dedup = new Map<string, ReturnType<typeof sanitizeDataLengkapUtamaValues>>();
    const noPpidItems: ReturnType<typeof sanitizeDataLengkapUtamaValues>[] = [];
    for (const san of sanitizedAll) {
      const ppid = (san.ppid as string | null) ?? '';
      if (!ppid) {
        noPpidItems.push(san);
      } else {
        dedup.set(ppid, san);
      }
    }
    const dedupedWithPpid = Array.from(dedup.values());

    // Ambil existing ppid -> no mapping untuk mempertahankan `no` saat update (case-insensitive)
    const ppids = dedupedWithPpid.map((v) => v.ppid as string).filter(Boolean);
    const existingMap = new Map<string, number>(); // key = ppid normalized UPPER
    if (ppids.length > 0) {
      // Gunakan ilike untuk pencocokan case-insensitive agar "ppid001" vs "PPID001" dianggap sama
      const orFilter = ppids.map((p) => `ppid.ilike.${p.replace(/,/g, '\\,')}`).join(',');
      const { data: existing } = await supabaseServer.from('data_lengkap_utama').select('ppid,no').or(orFilter);
      for (const row of (existing as { ppid: string; no: number }[] | null) ?? []) {
        const normKey = String(row.ppid ?? '').trim().replace(/[\t\r\n]/g, '').replace(/[\u00A0]/g, ' ').replace(/\s+/g, '').toUpperCase();
        if (normKey && normKey !== '-' && normKey !== '0' && normKey !== 'NULL') {
          if (!existingMap.has(normKey)) existingMap.set(normKey, row.no);
        }
      }
    }
    const { data: maxRow } = await supabaseServer.from('data_lengkap_utama').select('no').order('no', { ascending: false }).limit(1).single();
    let nextNo = (maxRow as { no: number } | null)?.no ? (maxRow as { no: number }).no + 1 : 1;

    const withNoPpid = dedupedWithPpid.map((san) => {
      const ppid = String(san.ppid as string ?? '').trim().replace(/[\t\r\n]/g, '').replace(/[\u00A0]/g, ' ').replace(/\s+/g, '').toUpperCase();
      const existingNo = existingMap.get(ppid);
      return { ...san, no: existingNo ?? nextNo++ };
    });
    const withoutNoPpid = noPpidItems.map((san) => ({ ...san, no: nextNo++ }));
    const allToUpsert = [...withNoPpid, ...withoutNoPpid];

    // Chunked upsert: ppid unik -> onConflict, tanpa ppid -> insert (upsert juga aman karena ppid null tidak konflik)
    const UPSERT_CHUNK = 500;
    for (let i = 0; i < allToUpsert.length; i += UPSERT_CHUNK) {
      const chunk = allToUpsert.slice(i, i + UPSERT_CHUNK);
      const withPpidChunk = chunk.filter((c) => (c.ppid as string | null));
      const withoutPpidChunk = chunk.filter((c) => !(c.ppid as string | null));
      if (withPpidChunk.length > 0) {
        const { error } = await supabaseServer.from('data_lengkap_utama').upsert(withPpidChunk as unknown as Record<string, unknown>[], { onConflict: 'ppid' });
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      }
      if (withoutPpidChunk.length > 0) {
        const { error } = await supabaseServer.from('data_lengkap_utama').insert(withoutPpidChunk as unknown as Record<string, unknown>[]);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
    return NextResponse.json({ success: true });
  }

  // Single insert: { values: {...} } or direct — upsert onConflict ppid
  const values = (payload['values'] as Record<string, unknown>) ?? payload;
  const sanitized = sanitizeDataLengkapUtamaValues(values);
  const ppidSingle = sanitized.ppid as string | null;
  if (ppidSingle) {
    // Cek existing case-insensitive untuk mempertahankan `no`
    const { data: existing } = await supabaseServer.from('data_lengkap_utama').select('no').ilike('ppid', ppidSingle).maybeSingle();
    if (existing) {
      const { error } = await supabaseServer.from('data_lengkap_utama').upsert({ ...sanitized, no: (existing as { no: number }).no } as unknown as Record<string, unknown>, { onConflict: 'ppid' });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }
    const { data: maxRow2 } = await supabaseServer.from('data_lengkap_utama').select('no').order('no', { ascending: false }).limit(1).single();
    const nextNo2 = (maxRow2 as { no: number } | null)?.no ? (maxRow2 as { no: number }).no + 1 : 1;
    const { error } = await supabaseServer.from('data_lengkap_utama').upsert({ ...sanitized, no: nextNo2 } as unknown as Record<string, unknown>, { onConflict: 'ppid' });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }
  const { data: maxRow3 } = await supabaseServer.from('data_lengkap_utama').select('no').order('no', { ascending: false }).limit(1).single();
  const nextNo3 = (maxRow3 as { no: number } | null)?.no ? (maxRow3 as { no: number }).no + 1 : 1;
  const { error: errEmpty } = await supabaseServer.from('data_lengkap_utama').insert({ ...sanitized, no: nextNo3 } as unknown as Record<string, unknown>);
  if (errEmpty) return NextResponse.json({ error: errEmpty.message }, { status: 500 });
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

  const { id, values } = body as { id?: string; values?: Record<string, unknown> };
  if (!id || !values) return NextResponse.json({ error: 'ID dan values wajib diisi' }, { status: 400 });

  const sanitized = sanitizeDataLengkapUtamaValues(values);
  const { error } = await supabaseServer
    .from('data_lengkap_utama')
    .update({ ...sanitized, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const all = searchParams.get('all');

  if (all === 'true') {
    while (true) {
      const { data, error: selErr } = await supabaseServer.from('data_lengkap_utama').select('id').limit(1000);
      if (selErr) return NextResponse.json({ error: selErr.message }, { status: 500 });
      if (!data || data.length === 0) break;
      const ids = data.map((r: { id: string }) => r.id);
      const { error } = await supabaseServer.from('data_lengkap_utama').delete().in('id', ids);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      if (data.length < 1000) break;
    }
    return NextResponse.json({ success: true });
  }

  if (id) {
    const { error } = await supabaseServer.from('data_lengkap_utama').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  // Try body for batch or deleteAll
  try {
    const body = await req.json();
    const payload = body as Record<string, unknown>;
    if (payload['all'] === true || payload['deleteAll'] === true) {
      while (true) {
        const { data, error: selErr } = await supabaseServer.from('data_lengkap_utama').select('id').limit(1000);
        if (selErr) return NextResponse.json({ error: selErr.message }, { status: 500 });
        if (!data || data.length === 0) break;
        const ids = data.map((r: { id: string }) => r.id);
        const { error } = await supabaseServer.from('data_lengkap_utama').delete().in('id', ids);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        if (data.length < 1000) break;
      }
      return NextResponse.json({ success: true });
    }
    if (typeof payload['id'] === 'string') {
      const { error } = await supabaseServer.from('data_lengkap_utama').delete().eq('id', payload['id'] as string);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }
  } catch {
    // no body
  }

  return NextResponse.json({ error: 'ID wajib diisi atau gunakan ?all=true' }, { status: 400 });
}
