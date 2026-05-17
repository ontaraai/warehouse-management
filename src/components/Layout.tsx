import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { WarehouseProvider } from '../contexts/WarehouseContext';
import { BottomNav } from './BottomNav';

export const Layout: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <WarehouseProvider>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <main style={{ flex: 1, overflowY: 'auto' }}>
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </WarehouseProvider>
  );
};
