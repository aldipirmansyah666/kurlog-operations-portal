import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { DataLengkapUtamaItem, DataLengkapUtamaValues } from '@/lib/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function useDataLengkapUtama() {
  const [data, setData] = useState<DataLengkapUtamaItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/data-lengkap-utama', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        setData((json.data as DataLengkapUtamaItem[]) || []);
        setLoading(false);
        return;
      }
      // Fallback to anon read
      const { data: rows, error } = await supabase.from('data_lengkap_utama').select('*').order('no', { ascending: true });
      if (error) {
        console.error('Supabase fetch error:', error);
        setLoading(false);
        return;
      }
      setData((rows || []) as DataLengkapUtamaItem[]);
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
      .channel('data-lengkap-utama-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'data_lengkap_utama' }, () => {
        fetchData();
      })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn(`[realtime:data-lengkap-utama] status: ${status}`);
        }
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  const addItem = useCallback(
    async (values: DataLengkapUtamaValues) => {
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
    async (id: string, values: DataLengkapUtamaValues) => {
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
    async (items: DataLengkapUtamaValues[]) => {
      // Client-side chunking untuk hindari 413 / timeout (1465+ rows) — mirror PasteImportModal logic
      const CHUNK = 500;
      for (let i = 0; i < items.length; i += CHUNK) {
        const chunk = items.slice(i, i + CHUNK);
        const res = await fetch('/api/data-lengkap-utama', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: chunk }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || `Gagal import batch ${Math.floor(i / CHUNK) + 1}: ${res.statusText}`);
        }
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
