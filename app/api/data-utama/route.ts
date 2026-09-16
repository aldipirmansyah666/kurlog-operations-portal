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
    const { DELETE: handler } = await import('../data-lengkap-utama/route');
    return handler(req);
  } catch (error) {
    console.error('DELETE ALL ERROR:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
