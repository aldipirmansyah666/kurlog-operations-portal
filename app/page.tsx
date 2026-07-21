'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface ResiItem {
  id?: number;
  created_at?: string;
  tgl_tiket?: string;
  no_resi: string;
  agen: string;
  layanan?: string;
  petugas: string;
  status_resi: string;
  status_fu?: string;
  catatan?: string;
}

const STATUS_COLORS: { [key: string]: string } = {
  PERJALANAN: '#3b82f6',
  DELIVERED: '#10b981',
  RETUR: '#f43f5e',
  HOLD: '#f59e0b',
  CCH: '#a855f7',
};

export default function Home() {
  const [resiList, setResiList] = useState<ResiItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterTab, setFilterTab] = useState<'all' | 'fu' | 'done'>('all');

  // State Filter Tanggal Tiket
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');

  const [showPasteModal, setShowPasteModal] = useState<boolean>(false);
  const [pasteData, setPasteData] = useState<string>('');
  const [selectedResi, setSelectedResi] = useState<ResiItem | null>(null);
  const [newNote, setNewNote] = useState<string>('');

  const [tglTiket, setTglTiket] = useState('');
  const [noResi, setNoResi] = useState('');
  const [agen, setAgen] = useState('');
  const [layanan, setLayanan] = useState('PE');
  const [petugas, setPetugas] = useState('');
  const [statusResi, setStatusResi] = useState('PERJALANAN');

  const fetchResi = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('resi')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.error('Error fetching resi:', error);
    } else {
      setResiList(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchResi();
  }, []);

  const getFUCount = (catatan?: string) => {
    if (!catatan || !catatan.trim()) return 0;
    return catatan.trim().split('\n').filter((line) => line.trim().length > 0).length;
  };

  const isClosedStatus = (status: string) => {
    const s = status.toUpperCase();
    return s === 'DELIVERED' || s === 'RETUR';
  };

  // Helper konversi format tanggal DD/MM/YYYY ke YYYY-MM-DD
  const parseDateToISO = (dateStr?: string) => {
    if (!dateStr) return '';
    const parts = dateStr.trim().split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return dateStr;
  };

  // Logic Filtering Resi (Search, Tab Status, & Filter Tanggal Tiket)
  const filteredResi = useMemo(() => {
    return resiList.filter((item) => {
      // 1. Filter Pencarian
      const matchSearch =
        item.no_resi?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.agen?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.petugas?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.status_resi?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tgl_tiket?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;

      // 2. Filter Tab Status
      if (filterTab === 'fu' && isClosedStatus(item.status_resi)) return false;
      if (filterTab === 'done' && !isClosedStatus(item.status_resi)) return false;

      // 3. Filter Tanggal Tiket (Range)
      const itemISO = parseDateToISO(item.tgl_tiket);
      if (startDateFilter && itemISO < startDateFilter) return false;
      if (endDateFilter && itemISO > endDateFilter) return false;

      return true;
    });
  }, [resiList, searchQuery, filterTab, startDateFilter, endDateFilter]);

  // Analytics Data (Pie Chart Status)
  const statusChartData = useMemo(() => {
    const counts: { [key: string]: number } = {
      PERJALANAN: 0,
      DELIVERED: 0,
      RETUR: 0,
      HOLD: 0,
      CCH: 0,
    };
    filteredResi.forEach((r) => {
      const st = r.status_resi.toUpperCase();
      if (counts[st] !== undefined) counts[st]++;
      else counts[st] = 1;
    });
    return Object.keys(counts)
      .map((key) => ({ name: key, value: counts[key] }))
      .filter((d) => d.value > 0);
  }, [filteredResi]);

  // Analytics Data (Top 5 Agen Bermasalah / Butuh FU)
  const topAgenChartData = useMemo(() => {
    const agenMap: { [key: string]: number } = {};
    filteredResi
      .filter((r) => !isClosedStatus(r.status_resi))
      .forEach((r) => {
        const agn = r.agen.toUpperCase();
        agenMap[agn] = (agenMap[agn] || 0) + 1;
      });

    return Object.entries(agenMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [filteredResi]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noResi || !agen || !petugas) {
      alert('Mohon isi Nomor Resi, Nama Agen, dan Petugas!');
      return;
    }

    const todayStr = new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    setSubmitting(true);
    const newResi = {
      tgl_tiket: tglTiket.trim() || todayStr,
      no_resi: noResi.trim(),
      agen: agen.trim(),
      layanan: layanan.trim(),
      petugas: petugas.trim(),
      status_resi: statusResi,
      status_fu: isClosedStatus(statusResi) ? 'CLOSED' : 'PERLU FOLLOW UP',
    };

    const { error } = await supabase.from('resi').insert([newResi]);

    if (error) {
      alert(`Gagal menambah data: ${error.message}`);
    } else {
      setTglTiket('');
      setNoResi('');
      setAgen('');
      setLayanan('PE');
      setPetugas('');
      setStatusResi('PERJALANAN');
      fetchResi();
    }
    setSubmitting(false);
  };

  const handleBatchPasteSubmit = async () => {
    if (!pasteData.trim()) {
      alert('Silakan tempel (paste) data terlebih dahulu.');
      return;
    }

    setSubmitting(true);
    const rows = pasteData.trim().split('\n');
    const recordsToInsert: ResiItem[] = [];

    const todayStr = new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    rows.forEach((row) => {
      const cols = row.split('\t').map((c) => c.trim());
      if (cols.length >= 2 && cols[0]) {
        let tgl = cols[0];
        let resi = cols[1];
        let agn = cols[2] || '-';
        let lyn = cols[3] || 'PE';
        let ptg = cols[4] || 'ADMIN';
        let st = cols[5] ? cols[5].toUpperCase() : 'PERJALANAN';

        if (cols.length === 5 || !tgl.includes('/')) {
          tgl = todayStr;
          resi = cols[0];
          agn = cols[1] || '-';
          lyn = cols[2] || 'PE';
          ptg = cols[3] || 'ADMIN';
          st = cols[4] ? cols[4].toUpperCase() : 'PERJALANAN';
        }

        recordsToInsert.push({
          tgl_tiket: tgl,
          no_resi: resi,
          agen: agn,
          layanan: lyn,
          petugas: ptg,
          status_resi: st,
          status_fu: isClosedStatus(st) ? 'CLOSED' : 'PERLU FOLLOW UP',
        });
      }
    });

    if (recordsToInsert.length === 0) {
      alert('Format data tidak valid!');
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from('resi').insert(recordsToInsert);

    if (error) {
      alert(`Gagal import data: ${error.message}`);
    } else {
      alert(`Berhasil mengimpor ${recordsToInsert.length} data resi! 🎉`);
      setPasteData('');
      setShowPasteModal(false);
      fetchResi();
    }
    setSubmitting(false);
  };

  const handleSelectStatus = async (id: number, newStatus: string) => {
    const nextFU = isClosedStatus(newStatus) ? 'CLOSED' : 'PERLU FOLLOW UP';

    const { error } = await supabase
      .from('resi')
      .update({ status_resi: newStatus, status_fu: nextFU })
      .eq('id', id);

    if (error) {
      alert(`Gagal mengupdate status: ${error.message}`);
    } else {
      fetchResi();
    }
  };

  const handleAddCatatan = async () => {
    if (!newNote.trim() || !selectedResi) return;

    const timestamp = new Date().toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    const entry = `[${timestamp}] ${newNote.trim()}`;
    const updatedCatatan = selectedResi.catatan
      ? `${selectedResi.catatan}\n${entry}`
      : entry;

    const { error } = await supabase
      .from('resi')
      .update({ catatan: updatedCatatan })
      .eq('id', selectedResi.id);

    if (error) {
      alert(`Gagal menyimpan catatan: ${error.message}`);
    } else {
      setNewNote('');
      setSelectedResi(null);
      await fetchResi();
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus tiket resi ini?')) {
      const { error } = await supabase.from('resi').delete().eq('id', id);
      if (error) {
        alert(`Gagal menghapus: ${error.message}`);
      } else {
        fetchResi();
      }
    }
  };

  const handleDeleteAll = async () => {
    const confirmText = prompt(
      '⚠️ PERINGATAN: Apakah Anda yakin ingin MENGHAPUS SEMUA DATA RESI?\n\nKetik "HAPUS" untuk mengonfirmasi:'
    );

    if (confirmText === 'HAPUS') {
      setLoading(true);
      const { error } = await supabase.from('resi').delete().neq('id', 0);

      if (error) {
        alert(`Gagal menghapus semua data: ${error.message}`);
      } else {
        alert('Semua data resi berhasil dibersihkan! 🧹');
        fetchResi();
      }
      setLoading(false);
    }
  };

  const totalCount = resiList.length;
  const needFUCount = resiList.filter((i) => !isClosedStatus(i.status_resi)).length;
  const doneCount = resiList.filter((i) => isClosedStatus(i.status_resi)).length;

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'RETUR':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
      case 'HOLD':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'CCH':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/40';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
    }
  };

  return (
    <main className="max-w-7xl mx-auto p-6 md:p-10 space-y-8">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            📦 Monitoring & Follow Up Resi
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Pencatatan harian, penandaan berapa kali FU, dan penanganan tiket pengiriman.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={handleDeleteAll}
            className="bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 font-medium text-xs rounded-xl px-3.5 py-2.5 transition-all cursor-pointer"
          >
            🗑️ Hapus Semua Data
          </button>
          <button
            onClick={() => setShowPasteModal(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl px-4 py-2.5 transition-all cursor-pointer shadow-lg shadow-emerald-600/20"
          >
            📋 Import Copas Excel
          </button>
        </div>
      </div>

      {/* Counter Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-slate-900/70 p-6 rounded-2xl border border-slate-800/80 shadow-lg flex justify-between items-center">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Total Tiket Resi</p>
            <h3 className="text-4xl font-black text-white">{totalCount}</h3>
          </div>
          <div className="p-3.5 bg-slate-800/80 border border-slate-700/50 rounded-xl text-2xl">📋</div>
        </div>

        <div className="bg-slate-900/70 p-6 rounded-2xl border border-amber-500/20 shadow-lg flex justify-between items-center">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-amber-400 font-bold">Perlu Follow Up (Proses)</p>
            <h3 className="text-4xl font-black text-amber-400">{needFUCount}</h3>
          </div>
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-2xl">⏳</div>
        </div>

        <div className="bg-slate-900/70 p-6 rounded-2xl border border-emerald-500/20 shadow-lg flex justify-between items-center">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold">Closed (Delivered & Retur)</p>
            <h3 className="text-4xl font-black text-emerald-400">{doneCount}</h3>
          </div>
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-2xl">✅</div>
        </div>
      </div>

      {/* PRIORITAS 3: DASHBOARD ANALYTICS VISUAL */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Pie Chart Distribusi Status */}
        <div className="bg-slate-900/70 p-6 rounded-2xl border border-slate-800/80 shadow-lg space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            📊 Distribusi Status Kendala Resi
          </h3>
          <div className="h-64 w-full flex items-center justify-center">
            {statusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#8884d8'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', borderColor: '#334155' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs text-slate-500 italic">Belum ada data untuk grafik status.</span>
            )}
          </div>
        </div>

        {/* Chart 2: Bar Chart Top Agen Perlu Follow Up */}
        <div className="bg-slate-900/70 p-6 rounded-2xl border border-slate-800/80 shadow-lg space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            🔥 Top 5 Agen Perlu Follow Up
          </h3>
          <div className="h-64 w-full flex items-center justify-center">
            {topAgenChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topAgenChartData} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" stroke="#64748b" />
                  <YAxis type="category" dataKey="name" stroke="#cbd5e1" width={110} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', borderColor: '#334155' }} />
                  <Bar dataKey="count" fill="#f59e0b" radius={[0, 8, 8, 0]} name="Jml Resi" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs text-slate-500 italic">Tidak ada agen yang memerlukan follow up.</span>
            )}
          </div>
        </div>
      </section>

      {/* Form Single Resi */}
      <section className="bg-slate-900/70 p-6 rounded-2xl border border-slate-800/80 shadow-lg space-y-4">
        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">➕ Tambah Single Resi Baru</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-7 gap-3">
          <input
            type="text"
            placeholder="Tgl Tiket (21/07/2026)"
            value={tglTiket}
            onChange={(e) => setTglTiket(e.target.value)}
            className="bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          />
          <input
            type="text"
            placeholder="No. Resi"
            value={noResi}
            onChange={(e) => setNoResi(e.target.value)}
            className="bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            required
          />
          <input
            type="text"
            placeholder="Nama Agen (MUC SWEET / CIMAREME)"
            value={agen}
            onChange={(e) => setAgen(e.target.value)}
            className="bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            required
          />
          
          <select
            value={layanan}
            onChange={(e) => setLayanan(e.target.value)}
            className="bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer font-semibold"
          >
            <option value="PE">PE</option>
            <option value="PKH">PKH</option>
            <option value="EC3">EC3</option>
          </select>

          <input
            type="text"
            placeholder="Petugas"
            value={petugas}
            onChange={(e) => setPetugas(e.target.value)}
            className="bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            required
          />
          
          <select
            value={statusResi}
            onChange={(e) => setStatusResi(e.target.value)}
            className="bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer font-semibold"
          >
            <option value="PERJALANAN">PERJALANAN</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="RETUR">RETUR</option>
            <option value="HOLD">HOLD</option>
            <option value="CCH">CCH</option>
          </select>

          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl px-4 py-2.5 transition-all cursor-pointer shadow-lg shadow-blue-600/20"
          >
            {submitting ? 'Menyimpan...' : 'Simpan Tiket'}
          </button>
        </form>
      </section>

      {/* FILTER & SEARCH TERPADU (Termasuk Filter Tanggal Tiket) */}
      <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 space-y-4 backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          {/* Input Search */}
          <input
            type="text"
            placeholder="🔎 Cari No Resi, Agen, Petugas, atau Tgl..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full lg:w-80 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          />

          {/* Filter Rentang Tanggal Tiket */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="font-medium text-slate-300">📅 Tanggal Tiket:</span>
            <input
              type="date"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            />
            <span>s/d</span>
            <input
              type="date"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            />
            {(startDateFilter || endDateFilter) && (
              <button
                onClick={() => {
                  setStartDateFilter('');
                  setEndDateFilter('');
                }}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-semibold cursor-pointer transition-all"
              >
                Reset Tgl
              </button>
            )}
          </div>

          {/* Filter Tab Status */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                filterTab === 'all' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'bg-slate-950 text-slate-400 border border-slate-800'
              }`}
            >
              Semua ({totalCount})
            </button>
            <button
              onClick={() => setFilterTab('fu')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                filterTab === 'fu' ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20' : 'bg-slate-950 text-slate-400 border border-slate-800'
              }`}
            >
              Perlu FU ({needFUCount})
            </button>
            <button
              onClick={() => setFilterTab('done')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                filterTab === 'done' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'bg-slate-950 text-slate-400 border border-slate-800'
              }`}
            >
              Closed ({doneCount})
            </button>
          </div>
        </div>
      </div>

      {/* Table Data */}
      <section className="bg-slate-900/70 rounded-2xl border border-slate-800/80 shadow-xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-4 w-12 text-center font-bold">NO</th>
                <th className="p-4 font-bold">TGL TIKET</th>
                <th className="p-4 font-bold">NO. RESI</th>
                <th className="p-4 font-bold">NAMA AGEN</th>
                <th className="p-4 font-bold">LAYANAN</th>
                <th className="p-4 font-bold">PETUGAS</th>
                <th className="p-4 font-bold">STATUS RESI</th>
                <th className="p-4 font-bold text-center">JML FU</th>
                <th className="p-4 font-bold">CATATAN TERAKHIR</th>
                <th className="p-4 font-bold text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-slate-500">Memuat data resi...</td>
                </tr>
              ) : filteredResi.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-slate-500">Tidak ada data resi ditemukan.</td>
                </tr>
              ) : (
                filteredResi.map((item, index) => {
                  const fuCount = getFUCount(item.catatan);
                  const isClosed = isClosedStatus(item.status_resi);

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 text-center font-mono text-slate-400 font-bold">{index + 1}</td>
                      <td className="p-4 font-mono text-slate-300">{item.tgl_tiket || '-'}</td>
                      <td className="p-4 font-mono font-semibold text-blue-400">{item.no_resi}</td>
                      <td className="p-4 font-medium">{item.agen}</td>
                      <td className="p-4 font-semibold text-amber-400">{item.layanan || 'PE'}</td>
                      <td className="p-4">{item.petugas}</td>
                      <td className="p-4">
                        <select
                          value={item.status_resi}
                          onChange={(e) => handleSelectStatus(item.id!, e.target.value)}
                          className={`px-3 py-1 text-[11px] font-extrabold rounded-xl border bg-slate-950 cursor-pointer focus:outline-none ${getStatusBadgeStyle(item.status_resi)}`}
                        >
                          <option value="PERJALANAN" className="bg-slate-900 text-blue-400">PERJALANAN</option>
                          <option value="DELIVERED" className="bg-slate-900 text-emerald-400">DELIVERED (CLOSED)</option>
                          <option value="RETUR" className="bg-slate-900 text-rose-400">RETUR (CLOSED)</option>
                          <option value="HOLD" className="bg-slate-900 text-amber-400">HOLD</option>
                          <option value="CCH" className="bg-slate-900 text-purple-400">CCH</option>
                        </select>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full border ${fuCount > 0 ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
                          {fuCount}x FU
                        </span>
                      </td>
                      <td className="p-4 max-w-xs">
                        {item.catatan ? (
                          <p className="text-[11px] text-slate-300 line-clamp-2 whitespace-pre-line font-mono bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                            {item.catatan.split('\n').pop()}
                          </p>
                        ) : (
                          <span className="text-slate-600 text-[11px] italic">Belum ada catatan</span>
                        )}
                      </td>
                      <td className="p-4 text-center space-x-2 whitespace-nowrap">
                        {isClosed ? (
                          <button disabled className="px-3 py-1.5 bg-slate-800 text-slate-500 rounded-lg text-[11px] font-semibold border border-slate-700 cursor-not-allowed opacity-60">
                            🔒 Closed
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedResi(item)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-semibold transition-all cursor-pointer shadow-md shadow-blue-600/20"
                          >
                            📝 Follow Up
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(item.id!)}
                          className="px-2.5 py-1.5 bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 rounded-lg text-[11px] border border-rose-900/30 cursor-pointer"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* MODAL FOLLOW UP */}
      {selectedResi && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 max-w-xl w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">📝 Catatan Follow Up Harian</h3>
                <p className="text-xs text-blue-400 font-mono mt-0.5">
                  Resi: {selectedResi.no_resi} ({selectedResi.agen}) - Total FU: {getFUCount(selectedResi.catatan)}x
                </p>
              </div>
              <button onClick={() => setSelectedResi(null)} className="text-slate-400 hover:text-white font-bold text-lg cursor-pointer">
                ✕
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Riwayat Follow Up Sebelumnya:</label>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 h-48 overflow-y-auto text-xs font-mono whitespace-pre-line text-slate-300">
                {selectedResi.catatan || <span className="text-slate-600 italic">Belum ada riwayat follow up.</span>}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Tambah Catatan Hari Ini:</label>
              <textarea
                rows={3}
                placeholder="Misal: FU ke-2 via WA CS Gudang, pembeli dikonfirmasi..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button onClick={() => setSelectedResi(null)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer">
                Batal
              </button>
              <button onClick={handleAddCatatan} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-lg shadow-blue-600/20">
                Simpan Catatan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PASTE MASSAL SPREADSHEET */}
      {showPasteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 max-w-2xl w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">📋 Import Resi dari Spreadsheet (Excel / Google Sheets)</h3>
              <button onClick={() => setShowPasteModal(false)} className="text-slate-400 hover:text-white font-bold cursor-pointer">
                ✕
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-xs text-slate-400 space-y-1">
              <p className="font-semibold text-slate-200">Cara Pakai (Format 6 Kolom):</p>
              <p className="text-amber-400 font-mono">Tgl Tiket | No. Resi | Nama Agen | Layanan (PE/PKH/EC3) | Petugas | Status</p>
            </div>

            <textarea
              rows={8}
              placeholder={`Contoh tempel (paste) di sini:\n21/07/2026\tP2604210156486\tMUC SWEET\tPKH\tNoviaCC\tPERJALANAN\n21/07/2026\tP2605110091369\tMUC NDH LOGISTIK\tPE\tianCC\tDELIVERED`}
              value={pasteData}
              onChange={(e) => setPasteData(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
            />

            <div className="flex justify-end gap-2.5">
              <button onClick={() => setShowPasteModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer">
                Batal
              </button>
              <button onClick={handleBatchPasteSubmit} disabled={submitting} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-lg shadow-emerald-600/20">
                {submitting ? 'Memproses Import...' : 'Import Data Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}