-- Resi: kolom closed_at untuk auto-hapus H+2 setelah status closed.
-- Jalankan di Supabase Dashboard -> SQL Editor.
-- Fitur monitoring resi: resi dengan status closed (DELIVERED/RETUR) akan
-- dihapus otomatis 2 hari setelah closed_at terisi.

alter table public.resi add column if not exists closed_at timestamptz;

create index if not exists resi_closed_at_idx on public.resi (closed_at)
  where status_resi in ('DELIVERED', 'RETUR');
