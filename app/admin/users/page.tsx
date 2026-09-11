'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Plus, Trash2, KeyRound, Shield, User, Loader2 } from 'lucide-react';

interface ApiUser {
  id: string;
  name: string;
  username: string;
  role: string;
  created_at: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', username: '', password: '', role: 'USER' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (!res.ok || res.status === 401 || res.status === 403) {
        setError(data.error || 'Akses ditolak');
        if (res.status === 401 || res.status === 403) router.push('/');
        return;
      }
      setUsers(data.users || []);
    } catch (e) {
      setError(`Gagal memuat data pengguna: ${String(e)}`);
    } finally {
      setLoading(false);
    }
  }, [router]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Gagal membuat akun');
        return;
      }

      setSuccess(`Akun "${formData.name}" berhasil dibuat`);
      setFormData({ name: '', username: '', password: '', role: 'USER' });
      setShowForm(false);
      fetchUsers();
    } catch {
      setError('Terjadi kesalahan jaringan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus akun "${name}"? Tindakan ini tidak dapat dibatalkan.`)) return;

    try {
      const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Gagal menghapus akun');
        return;
      }
      setSuccess(`Akun "${name}" berhasil dihapus`);
      fetchUsers();
    } catch {
      setError('Terjadi kesalahan jaringan');
    }
  };

  const handleResetPassword = async (id: string, name: string) => {
    const newPassword = prompt(`Reset password untuk "${name}". Masukkan password baru:`);
    if (!newPassword || newPassword.length < 6) {
      if (newPassword !== null) setError('Password minimal 6 karakter');
      return;
    }

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, password: newPassword }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Gagal reset password');
        return;
      }
      setSuccess(`Password "${name}" berhasil direset`);
    } catch {
      setError('Terjadi kesalahan jaringan');
    }
  };

  const roleBadge = (role: string) => {
    if (role === 'ADMIN') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide bg-violet-50 text-violet-700 border border-violet-200">
          <Shield className="w-3 h-3" /> ADMIN
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide bg-slate-50 text-slate-600 border border-slate-200">
        <User className="w-3 h-3" /> USER
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-page-in">
      {/* Header */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-500" />
        <div className="px-5 sm:px-6 py-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex gap-4">
            <div className="hidden sm:flex h-11 w-11 rounded-xl bg-slate-900 text-white items-center justify-center shadow-sm shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="page-header-title text-[18px] tracking-tight text-slate-900 flex items-center gap-2">
                Manajemen Pengguna
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold tracking-widest uppercase">Admin</span>
              </h1>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                Kelola akun pengguna portal. Hanya Administrator yang dapat membuat akun baru.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-sm transition-all duration-150 focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah Akun
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center justify-between gap-3 animate-fade-in">
          <span>{error}</span>
          <button onClick={() => setError('')} className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-white border border-rose-200 text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer shrink-0">✕</button>
        </div>
      )}
      {success && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center justify-between gap-3 animate-fade-in">
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-white border border-emerald-200 text-emerald-500 hover:bg-emerald-50 transition-colors cursor-pointer shrink-0">✕</button>
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
          <div className="h-1 w-full bg-gradient-to-r from-indigo-600 to-sky-500" />
          <div className="p-6">
            <h3 className="text-sm font-semibold tracking-tight text-slate-900 mb-4">Tambah Akun Baru</h3>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold tracking-widest text-slate-500 uppercase mb-1.5">Nama Lengkap</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  placeholder="Nama lengkap"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold tracking-widest text-slate-500 uppercase mb-1.5">Username / Email</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  placeholder="Username atau email"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold tracking-widest text-slate-500 uppercase mb-1.5">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  placeholder="Minimal 6 karakter"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold tracking-widest text-slate-500 uppercase mb-1.5">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                >
                  <option value="USER">USER — CS / Petugas</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              <div className="md:col-span-2 flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 rounded-xl shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer disabled:cursor-not-allowed"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  {submitting ? 'Menyimpan...' : 'Buat Akun'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users Table */}
      {loading ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center shadow-sm">
          <span className="inline-flex items-center gap-2 text-sm text-slate-500"><span className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-indigo-600 animate-spin" /> Memuat data pengguna…</span>
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center shadow-sm">
          <div className="mx-auto h-10 w-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-3">
            <Users className="h-5 w-5 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-600">Belum ada pengguna terdaftar.</p>
          <p className="text-xs text-slate-400 mt-1">Tambah akun baru untuk mulai mengelola akses portal.</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 text-slate-500">
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 text-[11px] font-bold tracking-widest uppercase">Nama</th>
                  <th className="px-4 py-3 text-[11px] font-bold tracking-widest uppercase">Username</th>
                  <th className="px-4 py-3 text-[11px] font-bold tracking-widest uppercase">Role</th>
                  <th className="px-4 py-3 text-[11px] font-bold tracking-widest uppercase">Dibuat</th>
                  <th className="px-4 py-3 text-[11px] font-bold tracking-widest uppercase text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-semibold tracking-tight text-slate-900">{user.name}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-600">{user.username}</td>
                    <td className="px-4 py-3">{roleBadge(user.role)}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(user.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleResetPassword(user.id, user.name)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-amber-600 hover:bg-amber-50 hover:border-amber-200 transition-all cursor-pointer"
                          title="Reset Password"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id, user.name)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-all cursor-pointer"
                          title="Hapus Akun"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
