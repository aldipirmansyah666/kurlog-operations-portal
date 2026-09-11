import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { DataLengkapItem, DataLengkapUtamaItem } from '@/lib/types';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { sanitizeDataLengkapUtamaValues } from '@/lib/dataLengkapUtama';
import { dataLengkapItemToUtamaValues, dataLengkapUtamaToItem } from '@/lib/dataLengkap';

// Data Lengkap (loket) mengambil data dari master `data_lengkap_utama`.
// Mutations kini via server API (/api/data-lengkap-utama) using service_role, reads via anon or server.
export function useDataLengkap() {
  const [data, setData] = useState<DataLengkapItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/data-lengkap-utama', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        const rows = (json.data as DataLengkapUtamaItem[]) || [];
        setData(rows.map(dataLengkapUtamaToItem));
        setLoading(false);
        return;
      }
      // Fallback to anon direct read
      const { data: rows, error } = await supabase.from('data_lengkap_utama').select('*').order('no', { ascending: true });
      if (error) {
        console.error('Supabase fetch error:', error);
        setLoading(false);
        return;
      }
      const batch = (rows || []) as DataLengkapUtamaItem[];
      setData(batch.map(dataLengkapUtamaToItem));
      setLoading(false);
    } catch (e) {
      console.error('fetchData error:', e);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional client-side CRUD fetch (see AGENTS.md)
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const channel: RealtimeChannel = supabase
      .channel('data-lengkap-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'data_lengkap_utama' }, () => {
        fetchData();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  const addItem = useCallback(
    async (item: DataLengkapItem) => {
      const values = dataLengkapItemToUtamaValues(item);
      const res = await fetch('/api/data-lengkap-utama', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Gagal tambah data');
      }
      await fetchData();
    },
    [fetchData]
  );

  const updateItem = useCallback(
    async (id: string, item: DataLengkapItem) => {
      const values = dataLengkapItemToUtamaValues(item);
      const res = await fetch('/api/data-lengkap-utama', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, values }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Gagal update data');
      }
      await fetchData();
    },
    [fetchData]
  );

  const deleteItem = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/data-lengkap-utama?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Gagal hapus data');
      }
      await fetchData();
    },
    [fetchData]
  );

  const importItems = useCallback(
    async (items: DataLengkapItem[]) => {
      const values = items.map((item) => sanitizeDataLengkapUtamaValues(dataLengkapItemToUtamaValues(item)) as unknown as Record<string, unknown>);
      // Use batch endpoint
      const res = await fetch('/api/data-lengkap-utama', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: values }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Gagal import');
      }
      await fetchData();
    },
    [fetchData]
  );

  const deleteAll = useCallback(async () => {
    const res = await fetch('/api/data-lengkap-utama?all=true', { method: 'DELETE' });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error || 'Gagal hapus semua');
    }
    await fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    addItem,
    updateItem,
    deleteItem,
    importItems,
    deleteAll,
    refetch: fetchData,
  };
}
