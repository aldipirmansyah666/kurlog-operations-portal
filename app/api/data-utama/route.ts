import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabaseServer } from '@/lib/supabaseServer';

// Alias route untuk kompatibilitas: /api/data-utama → proxy ke data_lengkap_utama
// Menjaga spec "app/api/data-utama/route.ts" yang diminta task agar tidak 404

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { data, error } = await supabaseServer.from('data_lengkap_utama').select('*').order('no', { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  // Proxy ke handler utama
  const { POST: handler } = await import('../data-lengkap-utama/route');
  return handler(req);
}

export async function PATCH(req: Request) {
  const { PATCH: handler } = await import('../data-lengkap-utama/route');
  return handler(req);
}

export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const allParam = searchParams.get('all');
    const confirmParam = searchParams.get('confirm');
    const isDeleteAllQuery =
      allParam === 'true' ||
      String(confirmParam ?? '').trim().toUpperCase() === 'HAPUS' ||
      String(allParam ?? '').trim().toUpperCase() === 'HAPUS';

    if (isDeleteAllQuery) {
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

    const id = searchParams.get('id');
    if (id) {
      const { error } = await supabaseServer.from('data_lengkap_utama').delete().eq('id', id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    let payload: Record<string, unknown> | null = null;
    try {
      const body = await req.json();
      payload = body as Record<string, unknown>;
    } catch {}

    if (payload) {
      const confirmVal = String(payload['confirm'] ?? '').trim().toUpperCase();
      if (payload['all'] === true || payload['deleteAll'] === true || confirmVal === 'HAPUS') {
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
    }

    return NextResponse.json({ error: 'ID wajib diisi atau gunakan ?all=true atau body { confirm: \"HAPUS\" }' }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
