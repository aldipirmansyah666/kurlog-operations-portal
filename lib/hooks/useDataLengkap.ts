'use client';

import { useState, useCallback } from 'react';
import type { DataLengkapItem } from '@/lib/types';
import { emptyDataLengkap } from '@/lib/types';

const STORAGE_KEY = 'dataLengkapData';

function loadFromStorage(): DataLengkapItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(data: DataLengkapItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable
  }
}

export function useDataLengkap() {
  const [data, setData] = useState<DataLengkapItem[]>(loadFromStorage);

  const refresh = useCallback(() => {
    setData(loadFromStorage());
  }, []);

  const addItem = useCallback((item: Omit<DataLengkapItem, 'id' | 'no' | 'waktuUpdate'>) => {
    const current = loadFromStorage();
    const nextNo = current.length > 0 ? Math.max(...current.map((i) => i.no)) + 1 : 1;
    const newItem: DataLengkapItem = {
      ...emptyDataLengkap(nextNo),
      ...item,
      id: crypto.randomUUID(),
      no: nextNo,
      waktuUpdate: new Date().toISOString(),
    };
    const updated = [...current, newItem];
    saveToStorage(updated);
    setData(updated);
    return newItem;
  }, []);

  const updateItem = useCallback((id: string, updates: Partial<DataLengkapItem>) => {
    const current = loadFromStorage();
    const updated = current.map((item) =>
      item.id === id ? { ...item, ...updates, waktuUpdate: new Date().toISOString() } : item
    );
    saveToStorage(updated);
    setData(updated);
  }, []);

  const deleteItem = useCallback((id: string) => {
    const current = loadFromStorage();
    const updated = current.filter((item) => item.id !== id);
    saveToStorage(updated);
    setData(updated);
  }, []);

  const importItems = useCallback((items: Omit<DataLengkapItem, 'id' | 'no' | 'waktuUpdate'>[]) => {
    const current = loadFromStorage();
    let nextNo = current.length > 0 ? Math.max(...current.map((i) => i.no)) + 1 : 1;
    const newItems: DataLengkapItem[] = items.map((item) => {
      const newItem: DataLengkapItem = {
        ...emptyDataLengkap(nextNo),
        ...item,
        id: crypto.randomUUID(),
        no: nextNo,
        waktuUpdate: new Date().toISOString(),
      };
      nextNo++;
      return newItem;
    });
    const updated = [...current, ...newItems];
    saveToStorage(updated);
    setData(updated);
    return newItems;
  }, []);

  const clearAll = useCallback(() => {
    saveToStorage([]);
    setData([]);
  }, []);

  return { data, addItem, updateItem, deleteItem, importItems, clearAll, refresh };
}
