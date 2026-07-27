import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { hashPassword, verifyPassword, createSessionToken, setSessionCookie } from '@/lib/auth';

const SEED_ADMIN = {
  name: 'Administrator',
  username: 'admin',
  password: 'admin123',
  role: 'ADMIN' as const,
};

async function ensureAdminExists(): Promise<string | null> {
  try {
    const { data, error: checkError } = await supabase.from('users').select('id').limit(1);
    if (checkError) {
      return `Gagal akses tabel users: ${checkError.message}. Pastikan tabel users sudah dibuat dan RLS diizinkan.`;
    }
    if (data && data.length > 0) return null;

    const hashedPassword = await hashPassword(SEED_ADMIN.password);
    const { error: insertError } = await supabase.from('users').insert({
      name: SEED_ADMIN.name,
      username: SEED_ADMIN.username,
      password: hashedPassword,
      role: SEED_ADMIN.role,
    });
    if (insertError) {
      return `Gagal seed admin: ${insertError.message}. Pastikan RLS policy mengizinkan INSERT.`;
    }
    return null;
  } catch (e) {
    return `ensureAdminExists error: ${String(e)}`;
  }
}

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username dan password harus diisi' }, { status: 400 });
    }

    const seedError = await ensureAdminExists();
    if (seedError) {
      return NextResponse.json({ error: seedError }, { status: 500 });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username.trim())
      .limit(1)
      .single();

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ error: 'Tabel users belum dibuat. Jalankan SQL migration di Supabase Dashboard.' }, { status: 500 });
      }
      return NextResponse.json({ error: 'Username atau Password salah' }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ error: 'Username atau Password salah' }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: 'Username atau Password salah' }, { status: 401 });
    }

    const token = await createSessionToken({
      userId: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    });

    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: { name: user.name, username: user.username, role: user.role },
    });
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
