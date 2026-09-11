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

  // Batch import: { items: DataLengkapUtamaValues[] }
  if (Array.isArray(payload['items'])) {
    const items = payload['items'] as Record<string, unknown>[];
    if (items.length === 0) return NextResponse.json({ error: 'Items kosong' }, { status: 400 });

    // server computes nextNo atomically: fetch max(no)
    const { data: maxRow } = await supabaseServer.from('data_lengkap_utama').select('no').order('no', { ascending: false }).limit(1).single();
    let nextNo = (maxRow as { no: number } | null)?.no ? (maxRow as { no: number }).no + 1 : 1;

    const INSERT_CHUNK = 500;
    for (let i = 0; i < items.length; i += INSERT_CHUNK) {
      const chunk = items.slice(i, i + INSERT_CHUNK).map((item) => ({
        ...sanitizeDataLengkapUtamaValues(item),
        no: nextNo++,
      }));
      const { error } = await supabaseServer.from('data_lengkap_utama').insert(chunk);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  // Single insert: { values: {...} } or direct
  const values = (payload['values'] as Record<string, unknown>) ?? payload;
  const { data: maxRow } = await supabaseServer.from('data_lengkap_utama').select('no').order('no', { ascending: false }).limit(1).single();
  const nextNo = (maxRow as { no: number } | null)?.no ? (maxRow as { no: number }).no + 1 : 1;

  const sanitized = sanitizeDataLengkapUtamaValues(values);
  const { error } = await supabaseServer.from('data_lengkap_utama').insert({ ...sanitized, no: nextNo });
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
