import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { getSession, hashPassword } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const { data, error } = await supabaseServer
      .from('users')
      .select('id, name, username, role, created_at')
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ users: data });
  } catch (e) {
    return NextResponse.json({ error: `Server error: ${String(e)}` }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Payload tidak valid' }, { status: 400 });
  }
  const { name, username, password, role } = body as { name?: unknown; username?: unknown; password?: unknown; role?: unknown };

  if (typeof name !== 'string' || typeof username !== 'string' || typeof password !== 'string' || !name.trim() || !username.trim() || !password) {
    return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 });
  }
  if (name.length > 100 || username.length > 100) {
    return NextResponse.json({ error: 'Nama/username terlalu panjang (max 100)' }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 });
  }

  const { data: existing } = await supabaseServer
    .from('users')
    .select('id')
    .eq('username', username.trim())
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 409 });
  }

  const hashedPassword = await hashPassword(password);
  const { error } = await supabaseServer.from('users').insert({
    name: name.trim(),
    username: username.trim(),
    password: hashedPassword,
    role: role === 'ADMIN' ? 'ADMIN' : 'USER',
  });

  if (error) {
    return NextResponse.json({ error: 'Gagal membuat akun' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Payload tidak valid' }, { status: 400 });
  }
  const { id, password } = body as { id?: unknown; password?: unknown };

  if (typeof id !== 'string' || typeof password !== 'string' || !id || !password) {
    return NextResponse.json({ error: 'ID dan password wajib diisi' }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 });
  }

  const hashedPassword = await hashPassword(password);
  const { error } = await supabaseServer
    .from('users')
    .update({ password: hashedPassword })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: 'Gagal mereset password' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID wajib diisi' }, { status: 400 });
  }
  if (id === session.userId) {
    return NextResponse.json({ error: 'Tidak dapat menghapus akun sendiri' }, { status: 400 });
  }

  const { error } = await supabaseServer.from('users').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: 'Gagal menghapus akun' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
