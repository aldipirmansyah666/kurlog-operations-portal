import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabaseServer';
import { normalizeKodeLoket, normalizeNama, cleanBailoutValue, normalizePeriodeToISO, sanitizePeriodeOrToday } from '@/lib/bailoutParser';

function normalizePeriode(value: unknown): string {
  return sanitizePeriodeOrToday(value);
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
    const periodeRaw = payload['periode'] ?? payload['tanggal'] ?? new Date().toISOString().slice(0, 10);
    const periode = normalizePeriode(periodeRaw);

    const rawItems = (payload['items'] as unknown[]) ?? (payload['data'] as unknown[]) ?? [];
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return NextResponse.json({ error: 'Items kosong: kirim array items/data' }, { status: 400 });
    }

    const dedup = new Map<string, { kode_loket: string; periode: string; nama_loket: string; nominal: number; raw_payload: Record<string, unknown> }>();
    for (const it of rawItems as Record<string, unknown>[]) {
      if (typeof it !== 'object' || it === null) continue;
      const rawKode = String(it['KODE'] ?? it['kode_loket'] ?? it['kodeLoket'] ?? '');
      const kode_loket = normalizeKodeLoket(rawKode);
      if (!kode_loket) continue;
      const nama_loket = normalizeNama(it['NAMA'] ?? it['nama_loket'] ?? '');
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

    if (rows.length === 0) return NextResponse.json({ error: 'Tidak ada data valid setelah sanitasi: semua KODE kosong atau invalid' }, { status: 400 });

    // Chunked upsert untuk hindari payload limit / timeout (bailout biasanya <500 tapi aman untuk 1000+)
    const CHUNK = 500;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const chunk = rows.slice(i, i + CHUNK);
      const { error } = await supabaseServer.from('bailout').upsert(chunk as unknown as Record<string, unknown>[], {
        onConflict: 'kode_loket,periode',
      });
      if (error) return NextResponse.json({ error: `Gagal upsert bailout chunk ${i / CHUNK + 1}: ${error.message}` }, { status: 500 });
    }
    return NextResponse.json({ success: true, count: rows.length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[api/bailout POST] unexpected:', msg);
    return NextResponse.json({ error: `Terjadi kesalahan server (bailout): ${msg}` }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const periodeRaw = searchParams.get('periode');
    const periode = periodeRaw ? normalizePeriodeToISO(periodeRaw) : null;
    let query = supabaseServer.from('bailout').select('*').order('periode', { ascending: false }).limit(200);
    if (periode) query = query.eq('periode', periode);
    const { data, error } = await query;
    if (error) return NextResponse.json({ error: `Gagal fetch bailout: ${error.message}` }, { status: 500 });
    return NextResponse.json({ data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[api/bailout GET] unexpected:', msg);
    return NextResponse.json({ error: `Terjadi kesalahan server (bailout): ${msg}` }, { status: 500 });
  }
}
