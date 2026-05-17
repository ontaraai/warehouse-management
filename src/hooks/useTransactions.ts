import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useWarehouse } from '../contexts/WarehouseContext';
import type { Transaction } from '../lib/types';

interface UseTransactionsOptions {
  dateFrom?: string;
  dateTo?: string;
}

export function useTransactions(options?: UseTransactionsOptions) {
  const { warehouse } = useWarehouse();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTransactions = useCallback(async () => {
    if (!warehouse) return;
    setLoading(true);

    let query = supabase
      .from('transactions')
      .select('*, transaction_items(*, products(*))')
      .eq('warehouse_id', warehouse.id)
      .order('created_at', { ascending: false });

    if (options?.dateFrom) {
      query = query.gte('transaction_date', options.dateFrom);
    }
    if (options?.dateTo) {
      query = query.lte('transaction_date', options.dateTo);
    }

    const { data, error } = await query;
    if (!error && data) setTransactions(data);
    setLoading(false);
  }, [warehouse, options?.dateFrom, options?.dateTo]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const deleteTransaction = async (id: string) => {
    const { error } = await supabase.rpc('delete_transaction', {
      p_transaction_id: id,
    });
    if (error) throw error;
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  return { transactions, loading, fetchTransactions, deleteTransaction };
}
