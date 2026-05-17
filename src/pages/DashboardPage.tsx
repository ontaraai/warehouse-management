import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWarehouse } from '../contexts/WarehouseContext';
import { supabase } from '../lib/supabaseClient';
import {
  Package, AlertTriangle, TrendingUp, TrendingDown, LogOut,
  ArrowUpCircle, ArrowDownCircle, Warehouse, ChevronDown
} from 'lucide-react';
import type { Transaction } from '../lib/types';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { warehouse, warehouses, switchWarehouse } = useWarehouse();

  const [totalProducts, setTotalProducts] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [recentTxns, setRecentTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSwitcher, setShowSwitcher] = useState(false);

  const fetchDashboard = async () => {
    if (!warehouse) return;
    setLoading(true);

    // Fetch product counts
    const { data: products } = await supabase
      .from('products')
      .select('id, current_stock, low_stock_threshold')
      .eq('warehouse_id', warehouse.id);

    if (products) {
      setTotalProducts(products.length);
      setLowStockCount(products.filter(p =>
        p.low_stock_threshold > 0 && p.current_stock <= p.low_stock_threshold
      ).length);
    }

    // Fetch 5 most recent transactions
    const { data: txns } = await supabase
      .from('transactions')
      .select('*, transaction_items(*, products(name, unit))')
      .eq('warehouse_id', warehouse.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (txns) setRecentTxns(txns);
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboard();
  }, [warehouse]);

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  return (
    <div className="container" style={{ paddingBottom: 'calc(var(--bottom-nav-height) + 16px)' }}>
      {/* Header Row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '22px', fontWeight: '700' }}>Hi, {displayName} 👋</h1>

          {/* Warehouse Switcher */}
          <button onClick={() => setShowSwitcher(!showSwitcher)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px',
              color: 'var(--color-primary)', fontWeight: '600', fontSize: '14px'
            }}>
            <Warehouse size={14} />
            {warehouse?.name || 'Loading...'}
            {warehouses.length > 1 && <ChevronDown size={14} />}
          </button>
        </div>
        <button onClick={signOut} style={{ padding: '8px', color: 'var(--color-text-muted)' }}>
          <LogOut size={20} />
        </button>
      </div>

      {/* Warehouse Dropdown */}
      {showSwitcher && warehouses.length > 1 && (
        <div className="card" style={{ marginBottom: '16px', padding: '4px' }}>
          {warehouses.map(w => (
            <button key={w.id} onClick={() => { switchWarehouse(w.id); setShowSwitcher(false); }}
              style={{
                width: '100%', padding: '12px', textAlign: 'left', borderRadius: '8px',
                fontWeight: w.id === warehouse?.id ? '700' : '400', fontSize: '14px',
                background: w.id === warehouse?.id ? '#eff6ff' : 'transparent',
                color: w.id === warehouse?.id ? 'var(--color-primary)' : 'var(--color-text)'
              }}>
              {w.name}
            </button>
          ))}
        </div>
      )}

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
        <button onClick={() => navigate('/products')} className="card"
          style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', cursor: 'pointer' }}>
          <div style={{ padding: '12px', background: '#eff6ff', color: 'var(--color-primary)', borderRadius: '12px', marginBottom: '10px' }}>
            <Package size={22} />
          </div>
          <span style={{ fontSize: '26px', fontWeight: '700' }}>{loading ? '—' : totalProducts}</span>
          <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Products</span>
        </button>

        <button onClick={() => navigate('/products')} className="card"
          style={{
            marginBottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', cursor: 'pointer',
            border: lowStockCount > 0 ? '1px solid #fecaca' : undefined
          }}>
          <div style={{
            padding: '12px', borderRadius: '12px', marginBottom: '10px',
            background: lowStockCount > 0 ? '#fef2f2' : '#f8fafc',
            color: lowStockCount > 0 ? 'var(--color-danger)' : 'var(--color-text-muted)'
          }}>
            <AlertTriangle size={22} />
          </div>
          <span style={{ fontSize: '26px', fontWeight: '700', color: lowStockCount > 0 ? 'var(--color-danger)' : undefined }}>
            {loading ? '—' : lowStockCount}
          </span>
          <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Low Stock</span>
        </button>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
        <button onClick={() => navigate('/transaction')} className="card"
          style={{ marginBottom: 0, padding: '14px 12px', display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--color-success)', color: 'white', cursor: 'pointer' }}>
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '8px' }}>
            <TrendingUp size={18} />
          </div>
          <span style={{ fontWeight: '600', fontSize: '14px' }}>Add Inward</span>
        </button>

        <button onClick={() => navigate('/transaction')} className="card"
          style={{ marginBottom: 0, padding: '14px 12px', display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--color-danger)', color: 'white', cursor: 'pointer' }}>
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '8px' }}>
            <TrendingDown size={18} />
          </div>
          <span style={{ fontWeight: '600', fontSize: '14px' }}>Add Outward</span>
        </button>
      </div>

      {/* Recent Transactions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '600' }}>Recent Transactions</h2>
        <button onClick={() => navigate('/history')} style={{ fontSize: '13px', color: 'var(--color-primary)', fontWeight: '600' }}>
          View All
        </button>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)' }}>Loading...</div>
      ) : recentTxns.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)', fontSize: '14px' }}>
          No transactions yet. Start by adding an inward transaction!
        </div>
      ) : (
        recentTxns.map(txn => {
          const isInward = txn.type === 'inward';
          const totalQty = txn.transaction_items?.reduce((s, i) => s + i.quantity, 0) || 0;
          const time = new Date(txn.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
          const itemNames = txn.transaction_items?.map(i => i.products?.name).filter(Boolean).join(', ') || 'Transaction';

          return (
            <div key={txn.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px' }}>
              {isInward
                ? <ArrowUpCircle size={24} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                : <ArrowDownCircle size={24} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: '500', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {itemNames}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{time}</div>
              </div>
              <span style={{
                padding: '3px 8px', borderRadius: '6px', fontWeight: '700', fontSize: '12px',
                background: isInward ? '#f0fdf4' : '#fef2f2',
                color: isInward ? 'var(--color-success)' : 'var(--color-danger)'
              }}>
                {isInward ? '+' : '-'}{totalQty}
              </span>
            </div>
          );
        })
      )}
    </div>
  );
};
