import React, { useState, useMemo } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { useWarehouse } from '../contexts/WarehouseContext';
import { useProducts } from '../hooks/useProducts';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { showToast } from '../components/Toast';
import { exportTransactionsPDF } from '../lib/pdfExport';
import {
  Search, ArrowUpCircle, ArrowDownCircle, Trash2, FileDown,
  ChevronDown, ChevronUp, Calendar
} from 'lucide-react';

type FilterPreset = 'today' | 'yesterday' | 'week' | 'month' | 'custom';

function getDateRange(preset: FilterPreset): { from: string; to: string } {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split('T')[0];

  switch (preset) {
    case 'today':
      return { from: fmt(today), to: fmt(today) };
    case 'yesterday': {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      return { from: fmt(y), to: fmt(y) };
    }
    case 'week': {
      const w = new Date(today);
      w.setDate(w.getDate() - 6);
      return { from: fmt(w), to: fmt(today) };
    }
    case 'month': {
      const m = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: fmt(m), to: fmt(today) };
    }
    default:
      return { from: fmt(today), to: fmt(today) };
  }
}

export const TransactionHistoryPage: React.FC = () => {
  const { warehouse } = useWarehouse();
  const { fetchProducts } = useProducts();

  const [preset, setPreset] = useState<FilterPreset>('today');
  const [customFrom, setCustomFrom] = useState(() => new Date().toISOString().split('T')[0]);
  const [customTo, setCustomTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const dateRange = preset === 'custom'
    ? { from: customFrom, to: customTo }
    : getDateRange(preset);

  const { transactions, loading, deleteTransaction } = useTransactions({
    dateFrom: dateRange.from,
    dateTo: dateRange.to,
  });

  // Search filter (client-side within fetched results)
  const filtered = useMemo(() => {
    if (!search.trim()) return transactions;
    const q = search.toLowerCase();
    return transactions.filter(txn => {
      if (txn.remark && txn.remark.toLowerCase().includes(q)) return true;
      return txn.transaction_items?.some(item =>
        item.products?.name?.toLowerCase().includes(q)
      );
    });
  }, [transactions, search]);

  // Summary stats
  const stats = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    filtered.forEach(txn => {
      const qty = txn.transaction_items?.reduce((s, i) => s + i.quantity, 0) || 0;
      if (txn.type === 'inward') totalIn += qty;
      else totalOut += qty;
    });
    return { count: filtered.length, totalIn, totalOut };
  }, [filtered]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTransaction(deleteTarget);
      fetchProducts();
      showToast('success', 'Transaction deleted & stock reversed.');
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to delete transaction.');
    }
    setDeleteTarget(null);
  };

  const handleExport = () => {
    if (!warehouse) return;
    exportTransactionsPDF({
      transactions: filtered,
      warehouseName: warehouse.name,
      dateFrom: dateRange.from,
      dateTo: dateRange.to,
    });
    showToast('success', 'PDF downloaded!');
  };

  const presets: { key: FilterPreset; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'custom', label: 'Custom' },
  ];

  return (
    <div className="container" style={{ paddingBottom: 'calc(var(--bottom-nav-height) + 16px)' }}>
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title" style={{ fontSize: '20px' }}>Transactions</h1>
        <button onClick={handleExport} disabled={filtered.length === 0}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
            background: 'var(--color-primary)', color: 'white', borderRadius: '8px',
            fontWeight: '600', fontSize: '13px', opacity: filtered.length === 0 ? 0.5 : 1
          }}>
          <FileDown size={16} /> Export PDF
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '12px' }}>
        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
        <input type="text" placeholder="Search product or remark..." value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '10px 12px 10px 40px', border: '1px solid var(--color-border)',
            borderRadius: '10px', background: 'var(--color-surface)', fontSize: '14px'
          }}
        />
      </div>

      {/* Date Filter Chips */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '4px', WebkitOverflowScrolling: 'touch' }}>
        {presets.map(p => (
          <button key={p.key} onClick={() => setPreset(p.key)}
            style={{
              padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '500',
              whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.2s',
              background: preset === p.key ? 'var(--color-primary)' : 'var(--color-surface)',
              color: preset === p.key ? 'white' : 'var(--color-text-muted)',
              border: `1px solid ${preset === p.key ? 'var(--color-primary)' : 'var(--color-border)'}`
            }}
          >{p.label}</button>
        ))}
      </div>

      {/* Custom Date Range */}
      {preset === 'custom' && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
          <Calendar size={16} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
          <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
            style={{ flex: 1, padding: '8px', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '13px' }} />
          <span style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>to</span>
          <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
            style={{ flex: 1, padding: '8px', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '13px' }} />
        </div>
      )}

      {/* Summary Bar */}
      <div style={{
        display: 'flex', gap: '4px', justifyContent: 'space-around', padding: '10px',
        background: 'var(--color-surface)', borderRadius: '10px', marginBottom: '16px',
        border: '1px solid var(--color-border)', fontSize: '13px'
      }}>
        <span><strong>{stats.count}</strong> Txns</span>
        <span style={{ color: 'var(--color-border)' }}>|</span>
        <span style={{ color: 'var(--color-success)' }}>In: <strong>{stats.totalIn}</strong></span>
        <span style={{ color: 'var(--color-border)' }}>|</span>
        <span style={{ color: 'var(--color-danger)' }}>Out: <strong>{stats.totalOut}</strong></span>
      </div>

      {/* Transaction List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)' }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--color-text-muted)' }}>
          No transactions found for this period.
        </div>
      ) : (
        filtered.map(txn => {
          const isInward = txn.type === 'inward';
          const totalQty = txn.transaction_items?.reduce((s, i) => s + i.quantity, 0) || 0;
          const isExpanded = expandedId === txn.id;
          const time = new Date(txn.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
          const dateDisplay = new Date(txn.transaction_date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

          return (
            <div key={txn.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Main Row */}
              <button onClick={() => setExpandedId(isExpanded ? null : txn.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '14px 12px', textAlign: 'left'
                }}>
                {/* Arrow icon */}
                {isInward
                  ? <ArrowUpCircle size={28} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                  : <ArrowDownCircle size={28} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />}

                {/* Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '600', fontSize: '14px' }}>
                    {txn.transaction_items?.map(i => i.products?.name).filter(Boolean).join(', ') || 'Transaction'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    {dateDisplay} · {time}
                    {txn.remark && <> · {txn.remark}</>}
                  </div>
                </div>

                {/* Qty Badge */}
                <div style={{
                  padding: '4px 10px', borderRadius: '8px', fontWeight: '700', fontSize: '13px',
                  background: isInward ? '#f0fdf4' : '#fef2f2',
                  color: isInward ? 'var(--color-success)' : 'var(--color-danger)'
                }}>
                  {isInward ? '+' : '-'}{totalQty}
                </div>

                {isExpanded ? <ChevronUp size={18} style={{ color: 'var(--color-text-muted)' }} />
                  : <ChevronDown size={18} style={{ color: 'var(--color-text-muted)' }} />}
              </button>

              {/* Expanded Items */}
              {isExpanded && (
                <div style={{ borderTop: '1px solid var(--color-border)', padding: '8px 12px', background: '#f8fafc' }}>
                  {txn.transaction_items?.map(item => (
                    <div key={item.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '6px 0', fontSize: '13px'
                    }}>
                      <span>{item.products?.name || 'Unknown'}</span>
                      <span style={{ color: 'var(--color-text-muted)' }}>
                        {item.quantity} {item.products?.unit} ({item.stock_before}→{item.stock_after})
                      </span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid var(--color-border)', marginTop: '4px' }}>
                    <button onClick={() => setDeleteTarget(txn.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        color: 'var(--color-danger)', fontSize: '13px', fontWeight: '600', padding: '6px 10px',
                        borderRadius: '6px', background: '#fef2f2'
                      }}>
                      <Trash2 size={14} /> Delete & Reverse
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Transaction"
        message="This will delete the transaction and reverse all stock changes. This cannot be undone."
        confirmLabel="Delete & Reverse"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        danger
      />
    </div>
  );
};
