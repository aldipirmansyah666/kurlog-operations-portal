import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabaseServer';
import { sanitizeDataLengkapUtamaValues } from '@/lib/dataLengkapUtama';

const ZERO_WIDTH_REGEX = /[\uFEFF\u200B\u200C\u200D\u2060\u180E]/g;

function normalizePpidKey(value: string): string {
  return String(value ?? '')
    .replace(/\u00A0/g, ' ')
    .replace(ZERO_WIDTH_REGEX, '')
    .replace(/[\t\r\n]/g, '')
    .replace(/\s+/g, '')
    .trim()
    .toUpperCase();
}

export async function GET() {
  try {
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
      if (error) return NextResponse.json({ error: `Gagal fetch data-lengkap-utama: ${error.message}` }, { status: 500 });
      const batch = data || [];
      allRows.push(...batch);
      if (batch.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }
    return NextResponse.json({ data: allRows });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[api/data-lengkap-utama GET] unexpected:', msg);
    return NextResponse.json({ error: `Terjadi kesalahan server: ${msg}` }, { status: 500 });
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

      const sanitizedAll = items.map((it) => sanitizeDataLengkapUtamaValues(it));
      const dedup = new Map<string, ReturnType<typeof sanitizeDataLengkapUtamaValues>>();
      const noPpidItems: ReturnType<typeof sanitizeDataLengkapUtamaValues>[] = [];
      for (const san of sanitizedAll) {
        const ppid = (san.ppid as string | null) ?? '';
        if (!ppid) {
          noPpidItems.push(san);
        } else {
          dedup.set(normalizePpidKey(ppid), san);
        }
      }
      // dedup map already normalized key, but keep original ppid value upper-normalized for DB
      const dedupedWithPpid = Array.from(dedup.values());

      const ppids = dedupedWithPpid.map((v) => v.ppid as string).filter(Boolean);
      const existingMap = new Map<string, number>();
      if (ppids.length > 0) {
        const orFilter = ppids.map((p) => `ppid.ilike.${p.replace(/,/g, '\\,')}`).join(',');
        const { data: existing, error: existErr } = await supabaseServer.from('data_lengkap_utama').select('ppid,no').or(orFilter);
        if (existErr) return NextResponse.json({ error: `Gagal fetch existing ppid: ${existErr.message}` }, { status: 500 });
        for (const row of (existing as { ppid: string; no: number }[] | null) ?? []) {
          const normKey = normalizePpidKey(String(row.ppid ?? ''));
          if (normKey && normKey !== '-' && normKey !== '0' && normKey !== 'NULL' && normKey !== 'N/A' && normKey !== 'NA') {
            if (!existingMap.has(normKey)) existingMap.set(normKey, row.no);
          }
        }
      }
      const { data: maxRow, error: maxErr } = await supabaseServer.from('data_lengkap_utama').select('no').order('no', { ascending: false }).limit(1).single();
      if (maxErr && maxErr.code !== 'PGRST116') return NextResponse.json({ error: `Gagal fetch max no: ${maxErr.message}` }, { status: 500 });
      let nextNo = (maxRow as { no: number } | null)?.no ? (maxRow as { no: number }).no + 1 : 1;

      const withNoPpid = dedupedWithPpid.map((san) => {
        const ppidNorm = normalizePpidKey(String(san.ppid as string ?? ''));
        const existingNo = existingMap.get(ppidNorm);
        return { ...san, no: existingNo ?? nextNo++ };
      });
      const withoutNoPpid = noPpidItems.map((san) => ({ ...san, no: nextNo++ }));
      const allToUpsert = [...withNoPpid, ...withoutNoPpid];

      const UPSERT_CHUNK = 500;
      for (let i = 0; i < allToUpsert.length; i += UPSERT_CHUNK) {
        const chunk = allToUpsert.slice(i, i + UPSERT_CHUNK);
        const withPpidChunk = chunk.filter((c) => (c.ppid as string | null));
        const withoutPpidChunk = chunk.filter((c) => !(c.ppid as string | null));
        if (withPpidChunk.length > 0) {
          const { error } = await supabaseServer.from('data_lengkap_utama').upsert(withPpidChunk as unknown as Record<string, unknown>[], { onConflict: 'ppid' });
          if (error) return NextResponse.json({ error: `Gagal upsert chunk ${i / UPSERT_CHUNK + 1}: ${error.message}` }, { status: 500 });
        }
        if (withoutPpidChunk.length > 0) {
          const { error } = await supabaseServer.from('data_lengkap_utama').insert(withoutPpidChunk as unknown as Record<string, unknown>[]);
          if (error) return NextResponse.json({ error: `Gagal insert chunk ${i / UPSERT_CHUNK + 1}: ${error.message}` }, { status: 500 });
        }
      }
      return NextResponse.json({ success: true, count: allToUpsert.length });
    }

    const values = (payload['values'] as Record<string, unknown>) ?? payload;
    const sanitized = sanitizeDataLengkapUtamaValues(values);
    const ppidSingle = sanitized.ppid as string | null;
    if (ppidSingle) {
      const { data: existing, error: existErr } = await supabaseServer.from('data_lengkap_utama').select('no').ilike('ppid', ppidSingle).maybeSingle();
      if (existErr) return NextResponse.json({ error: `Gagal cek existing: ${existErr.message}` }, { status: 500 });
      if (existing) {
        const { error } = await supabaseServer.from('data_lengkap_utama').upsert({ ...sanitized, no: (existing as { no: number }).no } as unknown as Record<string, unknown>, { onConflict: 'ppid' });
        if (error) return NextResponse.json({ error: `Gagal upsert: ${error.message}` }, { status: 500 });
        return NextResponse.json({ success: true });
      }
      const { data: maxRow2, error: maxErr2 } = await supabaseServer.from('data_lengkap_utama').select('no').order('no', { ascending: false }).limit(1).single();
      if (maxErr2 && maxErr2.code !== 'PGRST116') return NextResponse.json({ error: `Gagal fetch max no: ${maxErr2.message}` }, { status: 500 });
      const nextNo2 = (maxRow2 as { no: number } | null)?.no ? (maxRow2 as { no: number }).no + 1 : 1;
      const { error } = await supabaseServer.from('data_lengkap_utama').upsert({ ...sanitized, no: nextNo2 } as unknown as Record<string, unknown>, { onConflict: 'ppid' });
      if (error) return NextResponse.json({ error: `Gagal upsert: ${error.message}` }, { status: 500 });
      return NextResponse.json({ success: true });
    }
    const { data: maxRow3, error: maxErr3 } = await supabaseServer.from('data_lengkap_utama').select('no').order('no', { ascending: false }).limit(1).single();
    if (maxErr3 && maxErr3.code !== 'PGRST116') return NextResponse.json({ error: `Gagal fetch max no: ${maxErr3.message}` }, { status: 500 });
    const nextNo3 = (maxRow3 as { no: number } | null)?.no ? (maxRow3 as { no: number }).no + 1 : 1;
    const { error: errEmpty } = await supabaseServer.from('data_lengkap_utama').insert({ ...sanitized, no: nextNo3 } as unknown as Record<string, unknown>);
    if (errEmpty) return NextResponse.json({ error: `Gagal insert: ${errEmpty.message}` }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[api/data-lengkap-utama POST] unexpected:', msg);
    return NextResponse.json({ error: `Terjadi kesalahan server: ${msg}` }, { status: 500 });
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

    const { id, values } = body as { id?: string; values?: Record<string, unknown> };
    if (!id || !values) return NextResponse.json({ error: 'ID dan values wajib diisi' }, { status: 400 });

    const sanitized = sanitizeDataLengkapUtamaValues(values);
    const { error } = await supabaseServer
      .from('data_lengkap_utama')
      .update({ ...sanitized, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) return NextResponse.json({ error: `Gagal update: ${error.message}` }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[api/data-lengkap-utama PATCH] unexpected:', msg);
    return NextResponse.json({ error: `Terjadi kesalahan server: ${msg}` }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const allParam = searchParams.get('all');
    const confirmParam = searchParams.get('confirm');
    const isDeleteAllQuery =
      allParam === 'true' ||
      String(confirmParam ?? '').trim().toUpperCase() === 'HAPUS' ||
      String(allParam ?? '').trim().toUpperCase() === 'HAPUS';

    // Helper: deleteMany / TRUNCATE CASCADE dengan handling FK + sub-service
    const executeDeleteAll = async () => {
      try {
        // Jika backend external/microservice dikonfigurasi, forward request sesuai ekspektasi sub-service
        const serviceUrl = process.env.DATA_UTAMA_SERVICE_URL || process.env.NEXT_PUBLIC_DATA_UTAMA_SERVICE_URL;
        if (serviceUrl) {
          const res = await fetch(`${serviceUrl.replace(/\/$/, '')}/data-lengkap-utama`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deleteAll: true, confirm: 'HAPUS' }),
          });
          if (!res.ok) {
            const txt = await res.text().catch(() => res.statusText);
            throw new Error(`Sub-service error ${res.status}: ${txt}`);
          }
          return;
        }

        // Prisma langsung (jika migrasi ke Prisma):
        // try {
        //   const { prisma } = await import('@/lib/prisma');
        //   await prisma.dataLengkapUtama.deleteMany({});
        //   return;
        // } catch {}
        // try {
        //   const { prisma } = await import('@/lib/prisma');
        //   await prisma.$executeRawUnsafe('TRUNCATE TABLE "DataLengkapUtama" CASCADE;');
        //   return;
        // } catch {}

        // Fallback Supabase: loop delete 1000 batch (kompatibel RLS + service_role)
        while (true) {
          const { data, error: selErr } = await supabaseServer.from('data_lengkap_utama').select('id').limit(1000);
          if (selErr) throw selErr;
          if (!data || data.length === 0) break;
          const ids = data.map((r: { id: string }) => r.id);
          const { error } = await supabaseServer.from('data_lengkap_utama').delete().in('id', ids);
          if (error) throw error;
          if (data.length < 1000) break;
        }
        return;
      } catch (error) {
        console.error('DELETE ALL ERROR:', error);
        const msg = String(error);
        const isFkError = /foreign key|violates|FK|relasi|constraint/i.test(msg);
        if (isFkError) {
          try {
            const rpcResult = await (supabaseServer as unknown as { rpc: (n: string, p: unknown) => Promise<{ error: unknown }> }).rpc('exec_sql', {
              sql: 'TRUNCATE TABLE "data_lengkap_utama" CASCADE;',
            });
            if (rpcResult && !rpcResult.error) return;
          } catch {}
          // Prisma fallback TRUNCATE CASCADE
          try {
            // const { prisma } = await import('@/lib/prisma');
            // await prisma.$executeRawUnsafe('TRUNCATE TABLE "DataLengkapUtama" CASCADE;');
            // return;
          } catch {}
          try {
            const { error: delErr } = await supabaseServer.from('data_lengkap_utama').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            if (!delErr) return;
          } catch {}
        }
        throw error;
      }
    };

    if (isDeleteAllQuery) {
      try {
        await executeDeleteAll();
        return NextResponse.json({ success: true, message: 'Semua data berhasil dihapus' });
      } catch (err) {
        console.error('DELETE ALL ERROR:', err);
        const error = err as Error;
        return NextResponse.json({ success: false, error: error.message ?? String(err) }, { status: 400 });
      }
    }

    if (id) {
      try {
        const { error } = await supabaseServer.from('data_lengkap_utama').delete().eq('id', id);
        if (error) throw error;
        return NextResponse.json({ success: true });
      } catch (err) {
        console.error('DELETE ALL ERROR:', err);
        const error = err as Error;
        return NextResponse.json({ success: false, error: error.message ?? String(err) }, { status: 400 });
      }
    }

    let payload: Record<string, unknown> | null = null;
    try {
      const body = await req.json();
      payload = body as Record<string, unknown>;
    } catch {
      // no body
    }

    if (payload) {
      const confirmVal = String(payload['confirm'] ?? '').trim().toUpperCase();
      const isConfirmHapus = confirmVal === 'HAPUS';
      // Dukung juga confirm:true (boolean) dari beberapa client
      const confirmBool = payload['confirm'] === true;
      if (payload['all'] === true || payload['deleteAll'] === true || isConfirmHapus || confirmBool) {
        try {
          // Jika ada serviceUrl, pastikan request ke sub-service dikirim dengan header & body yang benar
          const serviceUrl = process.env.DATA_UTAMA_SERVICE_URL || process.env.NEXT_PUBLIC_DATA_UTAMA_SERVICE_URL;
          if (serviceUrl) {
            const res = await fetch(`${serviceUrl.replace(/\/$/, '')}/data-lengkap-utama`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ deleteAll: true, confirm: 'HAPUS' }),
            });
            if (!res.ok) {
              const txt = await res.text().catch(() => res.statusText);
              throw new Error(`Sub-service error ${res.status}: ${txt}`);
            }
            return NextResponse.json({ success: true, message: 'Semua data berhasil dihapus' });
          }
          await executeDeleteAll();
          return NextResponse.json({ success: true, message: 'Semua data berhasil dihapus' });
        } catch (err) {
          console.error('DELETE ALL ERROR:', err);
          const error = err as Error;
          return NextResponse.json({ success: false, error: error.message ?? String(err) }, { status: 400 });
        }
      }
      if (typeof payload['id'] === 'string') {
        try {
          const { error } = await supabaseServer.from('data_lengkap_utama').delete().eq('id', payload['id'] as string);
          if (error) throw error;
          return NextResponse.json({ success: true });
        } catch (err) {
          console.error('DELETE ALL ERROR:', err);
          const error = err as Error;
          return NextResponse.json({ success: false, error: error.message ?? String(err) }, { status: 400 });
        }
      }
      if (Array.isArray(payload['ids'])) {
        const ids = (payload['ids'] as unknown[]).map((v) => String(v)).filter(Boolean);
        if (ids.length > 0) {
          try {
            const { error } = await supabaseServer.from('data_lengkap_utama').delete().in('id', ids);
            if (error) throw error;
            return NextResponse.json({ success: true });
          } catch (err) {
            console.error('DELETE ALL ERROR:', err);
            const error = err as Error;
            return NextResponse.json({ success: false, error: error.message ?? String(err) }, { status: 400 });
          }
        }
      }
    }

    return NextResponse.json({ error: 'ID wajib diisi atau gunakan ?all=true atau body { confirm: "HAPUS" }' }, { status: 400 });
  } catch (err) {
    console.error('DELETE ALL ERROR:', err);
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message ?? String(err) }, { status: 400 });
  }
}
