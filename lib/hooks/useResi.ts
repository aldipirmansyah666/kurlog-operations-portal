import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { ResiItem } from '@/lib/types';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { isClosedStatus } from '@/lib/constants';

export function useResi() {
  const [resiList, setResiList] = useState<ResiItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchResi = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('resi')
      .select('*')
      .order('id', { ascending: false });

    if (!error) setResiList(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchResi();
  }, [fetchResi]);

  useEffect(() => {
    const channel: RealtimeChannel = supabase
      .channel('resi-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'resi' },
        () => {
          fetchResi();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchResi]);

  const addResi = useCallback(
    async (item: Omit<ResiItem, 'id' | 'created_at'>) => {
      const { error } = await supabase.from('resi').insert([item]);
      if (error) throw error;
      await fetchResi();
    },
    [fetchResi]
  );

  const addResiBatch = useCallback(
    async (items: Omit<ResiItem, 'id' | 'created_at'>[]) => {
      const { error } = await supabase.from('resi').insert(items);
      if (error) throw error;
      await fetchResi();
    },
    [fetchResi]
  );

  const updateStatus = useCallback(
    async (id: number, newStatus: string) => {
      const nextFU = isClosedStatus(newStatus) ? 'CLOSED' : 'PERLU FOLLOW UP';
      const { error } = await supabase
        .from('resi')
        .update({ status_resi: newStatus, status_fu: nextFU })
        .eq('id', id);
      if (error) throw error;
      await fetchResi();
    },
    [fetchResi]
  );

  const addNote = useCallback(
    async (resi: ResiItem, note: string) => {
      const timestamp = new Date().toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
      const entry = `[${timestamp}] ${note.trim()}`;
      const updatedCatatan = resi.catatan
        ? `${resi.catatan}\n${entry}`
        : entry;

      const { error } = await supabase
        .from('resi')
        .update({ catatan: updatedCatatan })
        .eq('id', resi.id);
      if (error) throw error;
      await fetchResi();
    },
    [fetchResi]
  );

  const updateNote = useCallback(
    async (id: number, newCatatan: string) => {
      const { error } = await supabase
        .from('resi')
        .update({ catatan: newCatatan || null })
        .eq('id', id);
      if (error) throw error;
      await fetchResi();
    },
    [fetchResi]
  );

  const deleteResi = useCallback(
    async (id: number) => {
      const { error } = await supabase.from('resi').delete().eq('id', id);
      if (error) throw error;
      await fetchResi();
    },
    [fetchResi]
  );

  const deleteAllResi = useCallback(async () => {
    const { error } = await supabase.from('resi').delete().neq('id', 0);
    if (error) throw error;
    await fetchResi();
  }, [fetchResi]);

  const deleteResiBatch = useCallback(
    async (ids: number[]) => {
      const { error } = await supabase.from('resi').delete().in('id', ids);
      if (error) throw error;
      await fetchResi();
    },
    [fetchResi]
  );

  const totalCount = resiList.length;
  const needFUCount = resiList.filter((i) => !isClosedStatus(i.status_resi)).length;
  const doneCount = resiList.filter((i) => isClosedStatus(i.status_resi)).length;

  return {
    resiList,
    loading,
    totalCount,
    needFUCount,
    doneCount,
    addResi,
    addResiBatch,
    updateStatus,
    addNote,
    updateNote,
    deleteResi,
    deleteAllResi,
    deleteResiBatch,
    refetch: fetchResi,
  };
}
