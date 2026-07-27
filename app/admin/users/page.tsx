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
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-50 text-violet-600 border border-violet-200">
          <Shield className="w-2.5 h-2.5" /> ADMIN
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
        <User className="w-2.5 h-2.5" /> USER
      </span>
    );
  };

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-violet-500" />
            Manajemen Pengguna
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Kelola akun pengguna portal. Hanya Administrator yang dapat membuat akun baru.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-[#1E293B] hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Tambah Akun
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs animate-fade-in">
          {error}
          <button onClick={() => setError('')} className="ml-2 font-semibold cursor-pointer">✕</button>
        </div>
      )}
      {success && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs animate-fade-in">
          {success}
          <button onClick={() => setSuccess('')} className="ml-2 font-semibold cursor-pointer">✕</button>
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm animate-fade-in">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Tambah Akun Baru</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Nama Lengkap</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-[#E2E8F0] rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                placeholder="Nama lengkap"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Username / Email</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-[#E2E8F0] rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                placeholder="Username atau email"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
                className="w-full px-3 py-2 bg-slate-50 border border-[#E2E8F0] rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                placeholder="Minimal 6 karakter"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-[#E2E8F0] rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              >
                <option value="USER">USER (CS / Petugas)</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
            <div className="md:col-span-2 flex items-center gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#1E293B] hover:bg-slate-700 disabled:bg-slate-300 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                {submitting ? 'Menyimpan...' : 'Buat Akun'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center text-sm text-slate-400 shadow-sm">
          Memuat data pengguna...
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center text-sm text-slate-400 shadow-sm">
          Belum ada pengguna terdaftar.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-slate-50 text-slate-400 uppercase">
                <tr>
                  <th className="p-3">Nama</th>
                  <th className="p-3">Username</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Dibuat</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-slate-600">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 font-medium text-slate-800">{user.name}</td>
                    <td className="p-3 font-mono text-slate-500">{user.username}</td>
                    <td className="p-3">{roleBadge(user.role)}</td>
                    <td className="p-3 text-slate-400">
                      {new Date(user.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleResetPassword(user.id, user.name)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                          title="Reset Password"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id, user.name)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
