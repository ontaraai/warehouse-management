import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { useWarehouse } from '../contexts/WarehouseContext';
import { ProductSelectorModal } from '../components/ProductSelectorModal';
import { showToast } from '../components/Toast';
import { supabase } from '../lib/supabaseClient';
import { ArrowLeft, Trash2, Plus, Calendar, XCircle } from 'lucide-react';
import type { Product } from '../lib/types';

interface CartItem {
  product: Product;
  quantity: number;
}

export const TransactionPage: React.FC = () => {
  const navigate = useNavigate();
  const { warehouse } = useWarehouse();
  const { products, fetchProducts } = useProducts();

  const [type, setType] = useState<'inward' | 'outward'>('inward');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [remark, setRemark] = useState('');
  const [showSelector, setShowSelector] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isInward = type === 'inward';
  const themeColor = isInward ? 'var(--color-success)' : 'var(--color-danger)';

  const addToCart = (product: Product) => {
    setCart(prev => [...prev, { product, quantity: 1 }]);
    setShowSelector(false);
  };

  const updateQuantity = (index: number, qty: number) => {
    setCart(prev => prev.map((item, i) => i === index ? { ...item, quantity: Math.max(1, qty) } : item));
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCart([]);
    setRemark('');
  };

  const handleSubmit = async () => {
    if (!warehouse || cart.length === 0) return;

    setSubmitting(true);
    try {
      const p_items = cart.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity
      }));

      const { error } = await supabase.rpc('process_transaction', {
        p_warehouse_id: warehouse.id,
        p_type: type,
        p_items: p_items,
        p_remark: remark.trim() || null,
        p_date: date,
      });

      if (error) throw error;

      showToast('success', `${isInward ? 'Inward' : 'Outward'} transaction saved!`);
      clearCart();
      fetchProducts();
      navigate('/history');
    } catch (err: any) {
      const msg = err?.message || 'Transaction failed';
      if (msg.includes('Insufficient stock')) {
        showToast('error', 'Insufficient stock for one or more items.');
      } else {
        showToast('error', msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', paddingBottom: 'var(--bottom-nav-height)' }}>
      {/* Colored Header */}
      <div style={{
        background: themeColor, color: 'white', padding: '16px',
        display: 'flex', alignItems: 'center', gap: '12px', transition: 'background 0.3s'
      }}>
        <button onClick={() => navigate('/')} style={{ padding: '4px', color: 'white' }}>
          <ArrowLeft size={22} />
        </button>
        <h1 style={{ fontSize: '18px', fontWeight: '700', flex: 1 }}>
          Add {isInward ? 'Inward' : 'Outward'} Transaction
        </h1>
      </div>

      {/* Type Toggle */}
      <div style={{ display: 'flex', margin: '16px 16px 0', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
        <button
          onClick={() => setType('inward')}
          style={{
            flex: 1, padding: '10px', fontWeight: '600', fontSize: '14px', transition: 'all 0.2s',
            background: isInward ? 'var(--color-success)' : 'var(--color-surface)',
            color: isInward ? 'white' : 'var(--color-text-muted)'
          }}
        >▲ Inward</button>
        <button
          onClick={() => setType('outward')}
          style={{
            flex: 1, padding: '10px', fontWeight: '600', fontSize: '14px', transition: 'all 0.2s',
            background: !isInward ? 'var(--color-danger)' : 'var(--color-surface)',
            color: !isInward ? 'white' : 'var(--color-text-muted)'
          }}
        >▼ Outward</button>
      </div>

      <div className="container" style={{ flex: 1 }}>
        {/* Date & Clear Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} style={{ color: 'var(--color-text-muted)' }} />
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              style={{
                padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: '8px',
                background: 'var(--color-surface)', fontSize: '14px', fontWeight: '500'
              }}
            />
          </div>
          {cart.length > 0 && (
            <button onClick={clearCart} style={{ color: 'var(--color-danger)', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <XCircle size={16} /> Clear Cart
            </button>
          )}
        </div>

        {/* Cart Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Table Header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '36px 1fr 70px 80px 36px',
            gap: '4px', padding: '10px 12px', background: '#f8fafc',
            borderBottom: '1px solid var(--color-border)', fontSize: '12px',
            fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase'
          }}>
            <span>No</span>
            <span>Item</span>
            <span style={{ textAlign: 'center' }}>Stock</span>
            <span style={{ textAlign: 'center' }}>Qty</span>
            <span></span>
          </div>

          {/* Cart Items */}
          {cart.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center' }}>
              <button onClick={() => setShowSelector(true)} style={{
                color: 'var(--color-success)', fontWeight: '600', fontSize: '15px',
                display: 'flex', alignItems: 'center', gap: '6px', margin: '0 auto'
              }}>
                <Plus size={18} /> Select Item
              </button>
            </div>
          ) : (
            cart.map((item, index) => (
              <div key={item.product.id} style={{
                display: 'grid', gridTemplateColumns: '36px 1fr 70px 80px 36px',
                gap: '4px', padding: '10px 12px', alignItems: 'center',
                borderBottom: '1px solid var(--color-border)'
              }}>
                <span style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>{index + 1}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: '500', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.product.name}
                  </div>
                </div>
                <span style={{ textAlign: 'center', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                  {item.product.current_stock} {item.product.unit}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={e => updateQuantity(index, parseInt(e.target.value) || 1)}
                    style={{
                      width: '52px', padding: '6px 4px', border: '1px solid var(--color-border)',
                      borderRadius: '6px', textAlign: 'center', fontSize: '14px', fontWeight: '600'
                    }}
                  />
                </div>
                <button onClick={() => removeFromCart(index)} style={{ padding: '4px', color: 'var(--color-danger)' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add More Items */}
        {cart.length > 0 && (
          <button onClick={() => setShowSelector(true)} style={{
            display: 'flex', alignItems: 'center', gap: '6px', margin: '12px auto',
            color: 'var(--color-success)', fontWeight: '600', fontSize: '14px'
          }}>
            <Plus size={18} /> Select Item
          </button>
        )}

        {/* Total */}
        {cart.length > 0 && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', padding: '12px 0',
            borderTop: '1px solid var(--color-border)', marginTop: '8px',
            fontWeight: '600', fontSize: '15px'
          }}>
            <span>Total Quantity:</span>
            <span style={{ color: themeColor }}>{totalQty}</span>
          </div>
        )}

        {/* Remark */}
        <div className="input-group" style={{ marginTop: '8px' }}>
          <label>Remark (Optional)</label>
          <textarea
            placeholder="Enter remark..."
            value={remark}
            onChange={e => setRemark(e.target.value)}
            rows={2}
            style={{
              width: '100%', padding: '12px', border: '1px solid var(--color-border)',
              borderRadius: '8px', background: 'var(--color-surface)', fontSize: '15px',
              resize: 'vertical', fontFamily: 'inherit'
            }}
          />
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={cart.length === 0 || submitting}
          className="btn"
          style={{
            marginTop: '8px', marginBottom: '16px',
            background: cart.length === 0 ? '#cbd5e1' : themeColor,
            color: 'white', fontSize: '16px', fontWeight: '700',
            transition: 'background 0.2s'
          }}
        >
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
      </div>

      {/* Product Selector Modal */}
      <ProductSelectorModal
        open={showSelector}
        onClose={() => setShowSelector(false)}
        onSelect={addToCart}
        products={products}
        excludeIds={cart.map(c => c.product.id)}
      />
    </div>
  );
};
