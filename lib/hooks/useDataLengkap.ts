import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { DataLengkapItem } from '@/lib/types';
import { emptyDataLengkap } from '@/lib/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface DbRow {
  id: string;
  no: number;
  data: DataLengkapItem;
  created_at: string;
  updated_at: string;
}

function toItem(row: DbRow): DataLengkapItem {
  return { ...row.data, id: row.id, no: row.no };
}

export function useDataLengkap() {
  const [data, setData] = useState<DataLengkapItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: rows, error } = await supabase
      .from('data_lengkap')
      .select('*')
      .order('no', { ascending: true })
      .range(0, 999999);

    if (!error) setData((rows || []).map(toItem));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const channel: RealtimeChannel = supabase
      .channel('data-lengkap-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'data_lengkap' },
        () => { fetchData(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  const addItem = useCallback(async (item: Omit<DataLengkapItem, 'id' | 'no' | 'waktuUpdate'>) => {
    const current = [...data];
    const nextNo = current.length > 0 ? Math.max(...current.map((i) => i.no)) + 1 : 1;
    const newItem: DataLengkapItem = {
      ...emptyDataLengkap(nextNo),
      ...item,
      id: crypto.randomUUID(),
      no: nextNo,
      waktuUpdate: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('data_lengkap')
      .insert({ id: newItem.id, no: newItem.no, data: newItem });

    if (error) throw error;
    await fetchData();
    return newItem;
  }, [data, fetchData]);

  const updateItem = useCallback(async (id: string, updates: Partial<DataLengkapItem>) => {
    const current = data.find((i) => i.id === id);
    if (!current) return;
    const updated = { ...current, ...updates, waktuUpdate: new Date().toISOString() };

    const { error } = await supabase
      .from('data_lengkap')
      .update({ data: updated, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    await fetchData();
  }, [data, fetchData]);

  const deleteItem = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('data_lengkap')
      .delete()
      .eq('id', id);

    if (error) throw error;
    await fetchData();
  }, [fetchData]);

  const importItems = useCallback(async (items: Omit<DataLengkapItem, 'id' | 'no' | 'waktuUpdate'>[]) => {
    const current = [...data];
    let nextNo = current.length > 0 ? Math.max(...current.map((i) => i.no)) + 1 : 1;
    const rows = items.map((item) => {
      const newItem: DataLengkapItem = {
        ...emptyDataLengkap(nextNo),
        ...item,
        id: crypto.randomUUID(),
        no: nextNo,
        waktuUpdate: new Date().toISOString(),
      };
      nextNo++;
      return { id: newItem.id, no: newItem.no, data: newItem };
    });

    const { error } = await supabase.from('data_lengkap').insert(rows);
    if (error) throw error;
    await fetchData();
  }, [data, fetchData]);

  const clearAll = useCallback(async () => {
    const { error } = await supabase.from('data_lengkap').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) throw error;
    await fetchData();
  }, [fetchData]);

  return { data, loading, addItem, updateItem, deleteItem, importItems, clearAll, refetch: fetchData };
}
