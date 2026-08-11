-- Data Lengkap Utama (master)
-- Jalankan di Supabase Dashboard -> SQL Editor.
-- Struktur kolom mengikuti sheet "Agen CUM" pada file Excel master
-- (header bertingkat 2 baris: group STATUS, KURLOG, ALAMAT LENGKAP).
--
-- ATURAN VALIDASI:
--   SEMUA kolom bersifat OPSIONAL / NULLABLE (kecuali `id` sebagai primary key).
--   Nilai kosong disimpan sebagai NULL / string kosong, TIDAK memicu validation error.
--   `no` bukan primary key — diisi otomatis oleh klien (auto-increment dari data terbesar).

-- 1) Tabel utama (untuk instalasi baru).
create table if not exists public.data_lengkap_utama (
  id uuid primary key default gen_random_uuid(),
  no integer,                       -- nullable | diisi otomatis oleh klien
  -- A. Kelompok Status & Workflow (group STATUS)
  syarat text,                      -- nullable
  pengajuan_survey_ke_pos text,     -- nullable
  pengajuan_pos text,               -- nullable
  pendaftaran_kurlog text,          -- nullable
  kelengkapan_perangkat text,       -- nullable
  aktivasi_kurlog text,             -- nullable
  aktivasi_sicepat text,            -- nullable
  training text,                    -- nullable
  transaksi text,                   -- nullable
  catatan text,                     -- nullable
  waktu text,                       -- nullable
  -- B. Kelompok KURLOG
  pos_ppob text,                    -- nullable
  pos_only text,                    -- nullable
  sicepat text,                     -- nullable
  -- C. Identitas Loket & Pemilik
  ppid text,                        -- nullable
  nama_loket_onpays text,           -- nullable
  nama_loket_kurlog text,           -- nullable
  nama_pemilik text,                -- nullable
  -- D. Kelompok Alamat (group ALAMAT LENGKAP)
  alamat_pemilik_ktp text,          -- nullable
  alamat_lengkap_loket text,        -- nullable
  rt_rw text,                       -- nullable
  kel_desa text,                    -- nullable
  kec text,                         -- nullable
  kab_kota text,                    -- nullable
  propinsi text,                    -- nullable
  kode_pos text,                    -- nullable
  -- E. Legalitas & Kontak
  no_ktp text,                      -- nullable
  no_npwp text,                     -- nullable
  electric_area text,               -- nullable
  rekomendasi text,                 -- nullable
  no_hp_pemilik text,               -- nullable
  no_hp_loket text,                 -- nullable
  email text,                       -- nullable
  -- F. Akun System & Area
  no_dirian text,                   -- nullable
  location_id text,                 -- nullable
  user_mile text,                   -- nullable
  password_mile text,               -- nullable
  regional text,                    -- nullable
  kcu_kc text,                      -- nullable
  nib text,                         -- nullable
  no_kbli text,                     -- nullable
  -- G. Perbankan & Koordinat
  nomor_rekening text,              -- nullable
  nama_bank text,                   -- nullable
  nama_pemilik_rekening text,       -- nullable
  latitude text,                    -- nullable
  longitude text,                   -- nullable
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2) Migrasi dari skema lama: hapus kolom STATUS tekstual yang tidak dipakai lagi.
--    (syarat lama sudah tidak ada di skema baru; sisanya dipertahankan.)
alter table public.data_lengkap_utama drop column if exists status_kurlog;

-- 3) Index pendukung.
create index if not exists data_lengkap_utama_no_idx on public.data_lengkap_utama (no);
create index if not exists data_lengkap_utama_ppid_idx on public.data_lengkap_utama (ppid);
create index if not exists data_lengkap_utama_nama_loket_kurlog_idx on public.data_lengkap_utama (nama_loket_kurlog);
create index if not exists data_lengkap_utama_regional_idx on public.data_lengkap_utama (regional);
create index if not exists data_lengkap_utama_kcu_kc_idx on public.data_lengkap_utama (kcu_kc);

-- 4) Realtime: supaya perubahan langsung ter-refresh di halaman tanpa reload.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'data_lengkap_utama'
  ) then
    alter publication supabase_realtime add table public.data_lengkap_utama;
  end if;
end $$;
