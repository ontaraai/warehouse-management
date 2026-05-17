import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

type ToastType = 'success' | 'error';

interface ToastMessage {
  id: number;
  type: ToastType;
  text: string;
}

let toastId = 0;
let addToastFn: ((type: ToastType, text: string) => void) | null = null;

export function showToast(type: ToastType, text: string) {
  if (addToastFn) addToastFn(type, text);
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    addToastFn = (type, text) => {
      const id = ++toastId;
      setToasts(prev => [...prev, { id, type, text }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    };
    return () => { addToastFn = null; };
  }, []);

  return (
    <>
      {children}
      <div style={{
        position: 'fixed', top: '16px', left: '16px', right: '16px',
        zIndex: 200, display: 'flex', flexDirection: 'column', gap: '8px',
        pointerEvents: 'none'
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '14px 16px', borderRadius: '12px', pointerEvents: 'auto',
            background: t.type === 'success' ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${t.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            animation: 'slideIn 0.3s ease'
          }}>
            {t.type === 'success'
              ? <CheckCircle size={20} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
              : <XCircle size={20} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />}
            <span style={{ flex: 1, fontSize: '14px', fontWeight: '500', color: 'var(--color-text)' }}>{t.text}</span>
            <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
              style={{ padding: '2px', color: 'var(--color-text-muted)' }}>
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </>
  );
};
