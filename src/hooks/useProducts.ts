import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useWarehouse } from '../contexts/WarehouseContext';
import type { Product } from '../lib/types';

export function useProducts() {
  const { warehouse } = useWarehouse();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProducts = useCallback(async () => {
    if (!warehouse) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(*)')
      .eq('warehouse_id', warehouse.id)
      .order('name');
    if (!error && data) setProducts(data);
    setLoading(false);
  }, [warehouse]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const createProduct = async (product: {
    name: string;
    sku?: string;
    category_id?: string | null;
    unit: string;
    price?: number | null;
    low_stock_threshold?: number;
  }) => {
    if (!warehouse) return null;
    const { data, error } = await supabase
      .from('products')
      .insert({ ...product, warehouse_id: warehouse.id })
      .select('*, categories(*)')
      .single();
    if (!error && data) {
      setProducts(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      return data;
    }
    throw error;
  };

  const updateProduct = async (id: string, updates: {
    name?: string;
    sku?: string | null;
    category_id?: string | null;
    unit?: string;
    price?: number | null;
    low_stock_threshold?: number;
  }) => {
    const { data, error } = await supabase
      .from('products')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, categories(*)')
      .single();
    if (!error && data) {
      setProducts(prev => prev.map(p => p.id === id ? data : p));
      return data;
    }
    throw error;
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) {
      setProducts(prev => prev.filter(p => p.id !== id));
      return true;
    }
    throw error;
  };

  return { products, loading, fetchProducts, createProduct, updateProduct, deleteProduct };
}
