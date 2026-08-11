import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { DataLengkapUtamaItem, DataLengkapUtamaValues } from '@/lib/types';
import { sanitizeDataLengkapUtamaValues } from '@/lib/dataLengkapUtama';
import type { RealtimeChannel } from '@supabase/supabase-js';

const PAGE_SIZE = 1000;
const INSERT_CHUNK = 500;

export function useDataLengkapUtama() {
  const [data, setData] = useState<DataLengkapUtamaItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const allRows: DataLengkapUtamaItem[] = [];
    let from = 0;
    let keepFetching = true;

    while (keepFetching) {
      const { data: rows, error } = await supabase
        .from('data_lengkap_utama')
        .select('*')
        .order('no', { ascending: true })
        .range(from, from + PAGE_SIZE - 1);

      if (error) {
        console.error('Supabase fetch error:', error);
        setLoading(false);
        return;
      }

      const batch = rows || [];
      allRows.push(...batch);

      if (batch.length < PAGE_SIZE) {
        keepFetching = false;
      } else {
        from += PAGE_SIZE;
      }
    }

    setData(allRows);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional client-side CRUD fetch (see AGENTS.md)
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const channel: RealtimeChannel = supabase
      .channel('data-lengkap-utama-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'data_lengkap_utama' },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  const nextNo = useCallback(() => {
    let max = 0;
    for (const item of data) {
      if (item.no > max) max = item.no;
    }
    return max + 1;
  }, [data]);

  const addItem = useCallback(
    async (values: DataLengkapUtamaValues) => {
      const { error } = await supabase
        .from('data_lengkap_utama')
        .insert({ ...sanitizeDataLengkapUtamaValues(values), no: nextNo() });
      if (error) throw error;
      await fetchData();
    },
    [nextNo, fetchData]
  );

  const updateItem = useCallback(
    async (id: string, values: DataLengkapUtamaValues) => {
      const { error } = await supabase
        .from('data_lengkap_utama')
        .update({ ...sanitizeDataLengkapUtamaValues(values), updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      await fetchData();
    },
    [fetchData]
  );

  const deleteItem = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from('data_lengkap_utama')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await fetchData();
    },
    [fetchData]
  );

  const importItems = useCallback(
    async (items: DataLengkapUtamaValues[]) => {
      let no = nextNo();
      for (let i = 0; i < items.length; i += INSERT_CHUNK) {
        const chunk = items.slice(i, i + INSERT_CHUNK).map((item) => ({ ...sanitizeDataLengkapUtamaValues(item), no: no++ }));
        const { error } = await supabase.from('data_lengkap_utama').insert(chunk);
        if (error) throw error;
      }
      await fetchData();
    },
    [nextNo, fetchData]
  );

  const deleteAll = useCallback(async () => {
    const { error } = await supabase
      .from('data_lengkap_utama')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) throw error;
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
