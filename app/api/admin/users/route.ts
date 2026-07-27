import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession, hashPassword } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const { data, error } = await supabase
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

  const { name, username, password, role } = await req.json();

  if (!name || !username || !password) {
    return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('username', username.trim())
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 409 });
  }

  const hashedPassword = await hashPassword(password);
  const { error } = await supabase.from('users').insert({
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

  const { id, password } = await req.json();

  if (!id || !password) {
    return NextResponse.json({ error: 'ID dan password wajib diisi' }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 });
  }

  const hashedPassword = await hashPassword(password);
  const { error } = await supabase
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

  const { error } = await supabase.from('users').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: 'Gagal menghapus akun' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
