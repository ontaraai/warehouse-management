import React from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  onConfirm, onCancel, danger = false
}) => {
  if (!open) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px'
    }}>
      <div style={{
        background: 'var(--color-surface)', borderRadius: '16px', padding: '24px',
        width: '100%', maxWidth: '360px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>{title}</h3>
        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: '24px', lineHeight: '1.5' }}>{message}</p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onCancel} className="btn btn-outline" style={{ flex: 1 }}>{cancelLabel}</button>
          <button onClick={onConfirm} className="btn" style={{
            flex: 1, background: danger ? 'var(--color-danger)' : 'var(--color-primary)', color: 'white'
          }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
};
