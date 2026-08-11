import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { ResiItem } from '@/lib/types';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { isClosedStatus, CLOSED_STATUSES } from '@/lib/constants';

const CLOSED_AUTO_DELETE_DAYS = 2;

export function useResi() {
  const [resiList, setResiList] = useState<ResiItem[]>([]);
  const [loading, setLoading] = useState(true);

  const deleteExpiredClosed = useCallback(async () => {
    const cutoff = new Date(Date.now() - CLOSED_AUTO_DELETE_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase
      .from('resi')
      .delete()
      .in('status_resi', CLOSED_STATUSES)
      .lt('closed_at', cutoff);
    if (error) console.error('Auto-delete closed resi gagal:', error);
  }, []);

  const fetchResi = useCallback(async () => {
    const { data, error } = await supabase
      .from('resi')
      .select('*')
      .order('id', { ascending: false });

    if (!error) setResiList(data || []);
    setLoading(false);
    await deleteExpiredClosed();
  }, [deleteExpiredClosed]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional client-side CRUD fetch (see AGENTS.md)
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
      const { error } = await supabase.from('resi').insert([
        {
          ...item,
          closed_at: isClosedStatus(item.status_resi) ? new Date().toISOString() : null,
        },
      ]);
      if (error) throw error;
      await fetchResi();
    },
    [fetchResi]
  );

  const addResiBatch = useCallback(
    async (items: Omit<ResiItem, 'id' | 'created_at'>[]) => {
      const { error } = await supabase.from('resi').insert(
        items.map((item) => ({
          ...item,
          closed_at: isClosedStatus(item.status_resi) ? new Date().toISOString() : null,
        }))
      );
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
        .update({
          status_resi: newStatus,
          status_fu: nextFU,
          closed_at: isClosedStatus(newStatus) ? new Date().toISOString() : null,
        })
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
