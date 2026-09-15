import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabaseServer';
import { normalizeKodeLoket, cleanBailoutValue } from '@/lib/bailoutParser';

function normalizePeriode(value: unknown): string {
  if (!value) return new Date().toISOString().slice(0, 10);
  const str = String(value).trim();
  // Coba parse DD/MM/YYYY, YYYYMMDD, ISO
  if (/^\d{8}$/.test(str)) {
    // 20260914 -> 2026-09-14
    return `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}`;
  }
  if (str.includes('/')) {
    const [d, m, y] = str.split('/');
    if (d && m && y) return `${y.padStart(4, '0')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  const d = new Date(str);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return new Date().toISOString().slice(0, 10);
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
  const periodeRaw = payload['periode'] ?? payload['tanggal'] ?? new Date().toISOString().slice(0, 10);
  const periode = normalizePeriode(periodeRaw);

  // items: BailoutRow[] atau BailoutRecord[]
  const rawItems = (payload['items'] as unknown[]) ?? (payload['data'] as unknown[]) ?? [];
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return NextResponse.json({ error: 'Items kosong' }, { status: 400 });
  }

  // Sanitasi + deduplikasi: kode_loket + periode UNIQUE
  const dedup = new Map<string, { kode_loket: string; periode: string; nama_loket: string; nominal: number; raw_payload: Record<string, unknown> }>();
  for (const it of rawItems as Record<string, unknown>[]) {
    const rawKode = String(it['KODE'] ?? it['kode_loket'] ?? it['kodeLoket'] ?? '').trim();
    const kode_loket = normalizeKodeLoket(rawKode);
    if (!kode_loket) continue;
    const nama_loket = String(it['NAMA'] ?? it['nama_loket'] ?? '').trim().replace(/\s+/g, ' ');
    const nominal = cleanBailoutValue(it['BAILOUT'] ?? it['nominal']);
    const key = `${kode_loket}::${periode}`;
    dedup.set(key, {
      kode_loket,
      periode,
      nama_loket,
      nominal,
      raw_payload: it as Record<string, unknown>,
    });
  }

  const rows = Array.from(dedup.values()).map((r) => ({
    kode_loket: r.kode_loket,
    periode: r.periode,
    tanggal_text: String(periodeRaw),
    nama_loket: r.nama_loket || null,
    nominal: r.nominal,
    raw_payload: r.raw_payload,
    updated_at: new Date().toISOString(),
  }));

  if (rows.length === 0) return NextResponse.json({ error: 'Tidak ada data valid setelah sanitasi' }, { status: 400 });

  // Upsert dengan onConflict eksplisit: kode_loket + periode
  const { error } = await supabaseServer.from('bailout').upsert(rows as unknown as Record<string, unknown>[], {
    onConflict: 'kode_loket,periode',
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, count: rows.length });
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const periode = searchParams.get('periode');
  let query = supabaseServer.from('bailout').select('*').order('periode', { ascending: false }).limit(200);
  if (periode) query = query.eq('periode', periode);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
