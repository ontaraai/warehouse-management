import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';
import type { Warehouse } from '../lib/types';

interface WarehouseContextType {
  warehouse: Warehouse | null;
  warehouses: Warehouse[];
  loading: boolean;
  switchWarehouse: (id: string) => void;
  refreshWarehouses: () => Promise<void>;
}

const WarehouseContext = createContext<WarehouseContextType | undefined>(undefined);

export const WarehouseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWarehouses = async () => {
    if (!user) {
      setWarehouses([]);
      setWarehouse(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data: members } = await supabase
      .from('warehouse_members')
      .select('warehouse_id')
      .eq('user_id', user.id);

    if (members && members.length > 0) {
      const ids = members.map(m => m.warehouse_id);
      const { data: whs } = await supabase
        .from('warehouses')
        .select('*')
        .in('id', ids);

      if (whs && whs.length > 0) {
        setWarehouses(whs);
        // Restore last selected or pick first
        const savedId = localStorage.getItem('activeWarehouseId');
        const found = whs.find(w => w.id === savedId);
        setWarehouse(found ?? whs[0]);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWarehouses();
  }, [user]);

  const switchWarehouse = (id: string) => {
    const found = warehouses.find(w => w.id === id);
    if (found) {
      setWarehouse(found);
      localStorage.setItem('activeWarehouseId', id);
    }
  };

  return (
    <WarehouseContext.Provider value={{ warehouse, warehouses, loading, switchWarehouse, refreshWarehouses: fetchWarehouses }}>
      {children}
    </WarehouseContext.Provider>
  );
};

export const useWarehouse = () => {
  const context = useContext(WarehouseContext);
  if (context === undefined) {
    throw new Error('useWarehouse must be used within a WarehouseProvider');
  }
  return context;
};
