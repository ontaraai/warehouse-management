import React, { useState } from 'react';
import { Search, X, Package } from 'lucide-react';
import type { Product } from '../lib/types';

interface ProductSelectorModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (product: Product) => void;
  products: Product[];
  excludeIds?: string[];
}

export const ProductSelectorModal: React.FC<ProductSelectorModalProps> = ({
  open, onClose, onSelect, products, excludeIds = []
}) => {
  const [search, setSearch] = useState('');

  if (!open) return null;

  const filtered = products.filter(p => {
    if (excludeIds.includes(p.id)) return false;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q));
  });

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--color-bg)', zIndex: 100,
      display: 'flex', flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px', display: 'flex', alignItems: 'center', gap: '12px',
        borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)'
      }}>
        <button onClick={() => { onClose(); setSearch(''); }} style={{ padding: '4px', color: 'var(--color-text-muted)' }}>
          <X size={24} />
        </button>
        <h2 style={{ fontSize: '18px', fontWeight: '700', flex: 1 }}>Select Product</h2>
      </div>

      {/* Search */}
      <div style={{ padding: '12px 16px', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
            style={{
              width: '100%', padding: '12px 12px 12px 40px', border: '1px solid var(--color-border)',
              borderRadius: '10px', background: 'var(--color-bg)', fontSize: '15px'
            }}
          />
        </div>
      </div>

      {/* Product List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)' }}>
            <Package size={36} style={{ marginBottom: '8px' }} />
            <p>No products found</p>
          </div>
        ) : (
          filtered.map(product => (
            <button
              key={product.id}
              onClick={() => { onSelect(product); setSearch(''); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                padding: '14px 12px', background: 'var(--color-surface)', borderRadius: '10px',
                marginBottom: '8px', textAlign: 'left', border: '1px solid var(--color-border)',
                transition: 'background 0.15s'
              }}
            >
              <div style={{
                minWidth: '44px', height: '44px', borderRadius: '10px', display: 'flex',
                flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                background: '#f0fdf4', color: 'var(--color-success)'
              }}>
                <span style={{ fontSize: '15px', fontWeight: '700', lineHeight: 1 }}>{product.current_stock}</span>
                <span style={{ fontSize: '9px', fontWeight: '500' }}>{product.unit}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: '600', fontSize: '15px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {product.name}
                </div>
                {product.sku && (
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{product.sku}</div>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};
