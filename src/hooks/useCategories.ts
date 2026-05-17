import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useWarehouse } from '../contexts/WarehouseContext';
import type { Category } from '../lib/types';

export function useCategories() {
  const { warehouse } = useWarehouse();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCategories = useCallback(async () => {
    if (!warehouse) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('warehouse_id', warehouse.id)
      .order('name');
    if (!error && data) setCategories(data);
    setLoading(false);
  }, [warehouse]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const createCategory = async (name: string) => {
    if (!warehouse) return null;
    const { data, error } = await supabase
      .from('categories')
      .insert({ warehouse_id: warehouse.id, name: name.trim() })
      .select()
      .single();
    if (!error && data) {
      setCategories(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      return data;
    }
    return null;
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (!error) setCategories(prev => prev.filter(c => c.id !== id));
    return !error;
  };

  return { categories, loading, fetchCategories, createCategory, deleteCategory };
}
