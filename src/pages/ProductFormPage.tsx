import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { ArrowLeft, Plus } from 'lucide-react';
import { UNITS } from '../lib/types';

export const ProductFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const { products, createProduct, updateProduct } = useProducts();
  const { categories, createCategory } = useCategories();

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [unit, setUnit] = useState('Pc');
  const [price, setPrice] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('0');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Load existing product data when editing
  useEffect(() => {
    if (isEditing && products.length > 0) {
      const product = products.find(p => p.id === id);
      if (product) {
        setName(product.name);
        setSku(product.sku || '');
        setCategoryId(product.category_id || '');
        setUnit(product.unit);
        setPrice(product.price != null ? String(product.price) : '');
        setLowStockThreshold(String(product.low_stock_threshold));
      }
    }
  }, [isEditing, id, products]);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    const cat = await createCategory(newCategoryName.trim());
    if (cat) {
      setCategoryId(cat.id);
      setNewCategoryName('');
      setShowNewCategory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Product name is required'); return; }

    setSaving(true);
    setError('');

    const payload = {
      name: name.trim(),
      sku: sku.trim() || null,
      category_id: categoryId || null,
      unit,
      price: price ? parseFloat(price) : null,
      low_stock_threshold: parseFloat(lowStockThreshold) || 0,
    };

    try {
      if (isEditing && id) {
        await updateProduct(id, payload);
      } else {
        await createProduct(payload);
      }
      navigate('/products');
    } catch (err: any) {
      setError(err?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container" style={{ paddingBottom: 'calc(var(--bottom-nav-height) + 16px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button onClick={() => navigate('/products')} style={{ padding: '8px', color: 'var(--color-text-muted)' }}>
          <ArrowLeft size={22} />
        </button>
        <h1 className="page-title" style={{ fontSize: '20px' }}>{isEditing ? 'Edit Product' : 'Add Product'}</h1>
      </div>

      {error && (
        <div style={{ padding: '12px', background: '#fee2e2', color: 'var(--color-danger)', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="card">
          {/* Name */}
          <div className="input-group">
            <label>Product Name *</label>
            <input type="text" placeholder="e.g. Black Border 25mm" value={name} onChange={e => setName(e.target.value)} required />
          </div>

          {/* SKU */}
          <div className="input-group">
            <label>SKU / Code (optional)</label>
            <input type="text" placeholder="e.g. BB-25-7x3" value={sku} onChange={e => setSku(e.target.value)} />
          </div>

          {/* Category */}
          <div className="input-group">
            <label>Category</label>
            {!showNewCategory ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  style={{
                    flex: 1, padding: '12px', border: '1px solid var(--color-border)', borderRadius: '8px',
                    background: 'var(--color-surface)', fontSize: '15px', color: categoryId ? 'var(--color-text)' : 'var(--color-text-muted)'
                  }}
                >
                  <option value="">No category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button type="button" onClick={() => setShowNewCategory(true)}
                  style={{ padding: '12px', borderRadius: '8px', background: '#eff6ff', color: 'var(--color-primary)' }}>
                  <Plus size={20} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="text" placeholder="New category name" value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)} style={{ flex: 1 }} autoFocus />
                <button type="button" onClick={handleAddCategory} className="btn btn-primary" style={{ width: 'auto', padding: '12px 16px' }}>Add</button>
                <button type="button" onClick={() => setShowNewCategory(false)} className="btn btn-outline" style={{ width: 'auto', padding: '12px 16px' }}>✕</button>
              </div>
            )}
          </div>

          {/* Unit */}
          <div className="input-group">
            <label>Unit</label>
            <select
              value={unit}
              onChange={e => setUnit(e.target.value)}
              style={{ width: '100%', padding: '12px', border: '1px solid var(--color-border)', borderRadius: '8px', background: 'var(--color-surface)', fontSize: '15px' }}
            >
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          {/* Price */}
          <div className="input-group">
            <label>Price (optional)</label>
            <input type="number" placeholder="0.00" value={price} onChange={e => setPrice(e.target.value)} min="0" step="0.01" />
          </div>

          {/* Low Stock Threshold */}
          <div className="input-group">
            <label>Low Stock Alert Threshold</label>
            <input type="number" placeholder="0" value={lowStockThreshold} onChange={e => setLowStockThreshold(e.target.value)} min="0" />
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>
              You'll see a warning when stock falls to or below this number. Set 0 to disable.
            </span>
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop: '8px' }}>
          {saving ? 'Saving...' : isEditing ? 'Update Product' : 'Add Product'}
        </button>
      </form>
    </div>
  );
};
