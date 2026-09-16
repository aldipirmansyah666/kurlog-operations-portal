import { useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import type { ResiItem } from '@/lib/types';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { isClosedStatus } from '@/lib/constants';

export function useResi() {
  const [resiList, setResiList] = useState<ResiItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchResi = useCallback(async () => {
    try {
      // Prefer server API (authenticated) – falls back to anon if needed.
      // After RLS migration, anon SELECT remains allowed for reads, but server API
      // is the canonical path and also triggers expired-closed cleanup server-side.
      const res = await fetch('/api/resi', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        setResiList((json.data as ResiItem[]) || []);
        setLoading(false);
        return;
      }
      // Fallback to direct supabase (anon) for backwards compat before migration
      const { data, error } = await supabase.from('resi').select('*').order('id', { ascending: false });
      if (error) {
        console.error('Supabase fetch resi error:', error);
        setLoading(false);
        return;
      }
      setResiList(data || []);
      setLoading(false);
    } catch (e) {
      console.error('fetchResi unexpected error:', e);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional client-side CRUD fetch (see AGENTS.md)
    fetchResi();
  }, [fetchResi]);

  useEffect(() => {
    const channel: RealtimeChannel = supabase
      .channel('resi-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'resi' }, () => {
        fetchResi();
      })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn(`[realtime:resi] subscribe status: ${status}`);
        }
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchResi]);

  const addResi = useCallback(
    async (item: Omit<ResiItem, 'id' | 'created_at'>) => {
      const res = await fetch('/api/resi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Gagal menambahkan resi');
      }
      await fetchResi();
    },
    [fetchResi]
  );

  const addResiBatch = useCallback(
    async (items: Omit<ResiItem, 'id' | 'created_at'>[]) => {
      const CHUNK = 500;
      for (let i = 0; i < items.length; i += CHUNK) {
        const chunk = items.slice(i, i + CHUNK);
        const res = await fetch('/api/resi', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: chunk }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || `Gagal import batch ${Math.floor(i / CHUNK) + 1}: ${res.statusText}`);
        }
      }
      await fetchResi();
    },
    [fetchResi]
  );

  const updateStatus = useCallback(
    async (id: number, newStatus: string) => {
      const res = await fetch('/api/resi', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status_resi: newStatus }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Gagal update status');
      }
      await fetchResi();
    },
    [fetchResi]
  );

  const addNote = useCallback(
    async (resi: ResiItem, note: string) => {
      const res = await fetch('/api/resi', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: resi.id, addNote: note }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Gagal menambah catatan');
      }
      await fetchResi();
    },
    [fetchResi]
  );

  const updateNote = useCallback(
    async (id: number, newCatatan: string) => {
      const res = await fetch('/api/resi', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, catatan: newCatatan }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Gagal update catatan');
      }
      await fetchResi();
    },
    [fetchResi]
  );

  const deleteResi = useCallback(
    async (id: number) => {
      const res = await fetch(`/api/resi?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Gagal hapus resi');
      }
      await fetchResi();
    },
    [fetchResi]
  );

  const deleteAllResi = useCallback(async () => {
    const res = await fetch('/api/resi?all=true', { method: 'DELETE' });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error || 'Gagal hapus semua');
    }
    await fetchResi();
  }, [fetchResi]);

  const deleteResiBatch = useCallback(
    async (ids: number[]) => {
      if (ids.length === 0) return;
      const res = await fetch('/api/resi', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Gagal hapus batch');
      }
      await fetchResi();
    },
    [fetchResi]
  );

  const { totalCount, needFUCount, doneCount } = useMemo(() => {
    let need = 0;
    let done = 0;
    for (const r of resiList) {
      if (isClosedStatus(r.status_resi)) done++;
      else need++;
    }
    return { totalCount: resiList.length, needFUCount: need, doneCount: done };
  }, [resiList]);

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
