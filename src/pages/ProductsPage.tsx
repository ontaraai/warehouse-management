import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Search, Plus, AlertTriangle, Package, Trash2, Edit3 } from 'lucide-react';
import type { Product } from '../lib/types';

export const ProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const { products, loading, deleteProduct } = useProducts();
  const { categories } = useCategories();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = !selectedCategory || p.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteProduct(deleteTarget.id);
    } catch {
      alert('Cannot delete: product may have transactions.');
    }
    setDeleteTarget(null);
  };

  return (
    <div className="container" style={{ paddingBottom: 'calc(var(--bottom-nav-height) + 80px)' }}>
      <div className="page-header">
        <h1 className="page-title">Products</h1>
        <span style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>{products.length} items</span>
      </div>

      {/* Search Bar */}
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '12px 12px 12px 40px', border: '1px solid var(--color-border)',
            borderRadius: '10px', background: 'var(--color-surface)', fontSize: '15px'
          }}
        />
      </div>

      {/* Category Filter Chips */}
      {categories.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '8px', WebkitOverflowScrolling: 'touch' }}>
          <button
            onClick={() => setSelectedCategory(null)}
            style={{
              padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '500',
              whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.2s',
              background: !selectedCategory ? 'var(--color-primary)' : 'var(--color-surface)',
              color: !selectedCategory ? 'white' : 'var(--color-text-muted)',
              border: `1px solid ${!selectedCategory ? 'var(--color-primary)' : 'var(--color-border)'}`
            }}
          >All</button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
              style={{
                padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '500',
                whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.2s',
                background: selectedCategory === cat.id ? 'var(--color-primary)' : 'var(--color-surface)',
                color: selectedCategory === cat.id ? 'white' : 'var(--color-text-muted)',
                border: `1px solid ${selectedCategory === cat.id ? 'var(--color-primary)' : 'var(--color-border)'}`
              }}
            >{cat.name}</button>
          ))}
        </div>
      )}

      {/* Product List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)' }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 16px' }}>
          <Package size={40} style={{ color: 'var(--color-text-muted)', marginBottom: '12px' }} />
          <p style={{ color: 'var(--color-text-muted)' }}>
            {products.length === 0 ? 'No products yet. Tap + to add one!' : 'No products match your filters.'}
          </p>
        </div>
      ) : (
        filtered.map(product => {
          const isLowStock = product.low_stock_threshold > 0 && product.current_stock <= product.low_stock_threshold;
          return (
            <div key={product.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Stock Badge */}
              <div style={{
                minWidth: '52px', height: '52px', borderRadius: '12px', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                background: isLowStock ? '#fef2f2' : '#f0fdf4',
                color: isLowStock ? 'var(--color-danger)' : 'var(--color-success)'
              }}>
                <span style={{ fontSize: '18px', fontWeight: '700', lineHeight: 1 }}>{product.current_stock}</span>
                <span style={{ fontSize: '10px', fontWeight: '500' }}>{product.unit}</span>
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontWeight: '600', fontSize: '15px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {product.name}
                  </span>
                  {isLowStock && <AlertTriangle size={14} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  {product.sku && <span>{product.sku} · </span>}
                  {product.categories?.name && <span>{product.categories.name}</span>}
                  {!product.sku && !product.categories?.name && <span>No category</span>}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                <button onClick={() => navigate(`/products/edit/${product.id}`)}
                  style={{ padding: '8px', color: 'var(--color-primary)', borderRadius: '8px' }}>
                  <Edit3 size={18} />
                </button>
                <button onClick={() => setDeleteTarget(product)}
                  style={{ padding: '8px', color: 'var(--color-danger)', borderRadius: '8px' }}>
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          );
        })
      )}

      {/* FAB */}
      <button
        onClick={() => navigate('/products/new')}
        style={{
          position: 'fixed', bottom: 'calc(var(--bottom-nav-height) + 20px)', right: '20px',
          width: '56px', height: '56px', borderRadius: '16px', background: 'var(--color-primary)',
          color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(59,130,246,0.4)', zIndex: 40, transition: 'transform 0.2s'
        }}
      >
        <Plus size={28} />
      </button>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        danger
      />
    </div>
  );
};
