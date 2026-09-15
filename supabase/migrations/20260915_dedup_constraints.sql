-- Migration: Pencegahan Data Duplikat & Penanganan Update (Upsert)
-- Date: 2026-09-15
-- Tujuan: Pastikan unique constraints untuk kode_loket, periode, dan no_resi
-- sesuai audit mendalam modul Bailout, Bagging, Monitoring Resi.

-- ---------------------------------------------------------------------------
-- 1. Tabel resi / Bagging: no_resi harus UNIQUE
--    Bagging dan Monitoring Resi memakai tabel `resi` dengan field no_resi.
--    Tanpa constraint ini, import Excel yang sama bisa INSERT duplikat.
-- ---------------------------------------------------------------------------
do $$
begin
  -- Pastikan tabel resi ada sebelum alter
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='resi') then
    -- Index unik untuk no_resi (case-insensitive via lower, tapi pakai plain untuk upsert onConflict)
    -- Supabase onConflict butuh index/constraint unik pada kolom target.
    if not exists (select 1 from pg_indexes where schemaname='public' and indexname='resi_no_resi_key') then
      create unique index resi_no_resi_key on public.resi (no_resi);
    end if;
    -- Constraint tambahan untuk kode_loket+periode jika ada kolom periode? resi tidak pakai periode, jadi hanya no_resi
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2. Tabel Loket / Data Lengkap Utama: kode_loket (ppid) harus UNIQUE
--    data_lengkap_utama.ppid adalah kode_loket. Spec: kode_loket UNIQUE.
--    Nilai kosong/null diperbolehkan tapi tidak boleh duplikat kode valid.
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='data_lengkap_utama') then
    -- Hapus duplikat sebelum create index (opsional: keep first)
    -- Tidak dijalankan otomatis untuk safety; admin harus cek manual jika ada duplikat.

    -- Unique index partial: hanya untuk ppid yang tidak kosong
    if not exists (select 1 from pg_indexes where schemaname='public' and indexname='data_lengkap_utama_ppid_unique') then
      create unique index data_lengkap_utama_ppid_unique on public.data_lengkap_utama (ppid) where ppid is not null and ppid <> '';
    end if;

    -- Index tambahan untuk no (auto-increment) sudah ada, tapi ppid adalah kunci bisnis
    -- Pastikan updated_at trigger tetap ada (tidak diubah di migrasi ini)
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 3. Tabel Bailout: kombinasi kode_loket + periode/tanggal harus UNIQUE
--    Bailout saat ini di-parse dari sheet CA (kode_loket = KODE/MITRA ID/PAYMENT POINT)
--    dengan periode = tanggal H-1 dari nama sheet atau header Minus H-1.
--    Buat tabel bailout jika belum ada, dengan unique (kode_loket, periode).
-- ---------------------------------------------------------------------------
create table if not exists public.bailout (
  id uuid primary key default gen_random_uuid(),
  kode_loket text not null,
  periode date not null,
  tanggal_text text, -- untuk audit: "20260914" atau "2026-09-14"
  nama_loket text,
  nominal integer not null default 0, -- sudah disanitasi via cleanBailoutValue
  raw_payload jsonb, -- simpan baris asli untuk debug
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint bailout_kode_periode_unique unique (kode_loket, periode)
);

create index if not exists bailout_kode_loket_idx on public.bailout (kode_loket);
create index if not exists bailout_periode_idx on public.bailout (periode);

-- Realtime untuk bailout (opsional, agar WA Logs bisa live)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname='public' and tablename='bailout'
  ) then
    alter publication supabase_realtime add table public.bailout;
  end if;
end $$;

-- RLS untuk bailout (konsisten dengan data_lengkap_utama/resi)
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='bailout') then
    execute 'alter table public.bailout enable row level security';
    drop policy if exists "bailout_anon_select" on public.bailout;
    create policy "bailout_anon_select" on public.bailout for select to anon, authenticated using (true);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Verifikasi:
-- select indexname, indexdef from pg_indexes where tablename in ('resi','data_lengkap_utama','bailout');
-- select conname, contype from pg_constraint where conrelid in ('public.resi'::regclass, 'public.data_lengkap_utama'::regclass, 'public.bailout'::regclass);
