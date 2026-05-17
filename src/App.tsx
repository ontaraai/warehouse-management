import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './components/Toast';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProductsPage } from './pages/ProductsPage';
import { ProductFormPage } from './pages/ProductFormPage';
import { TransactionPage } from './pages/TransactionPage';
import { TransactionHistoryPage } from './pages/TransactionHistoryPage';
import { TeamPage } from './pages/TeamPage';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<Layout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/new" element={<ProductFormPage />} />
              <Route path="/products/edit/:id" element={<ProductFormPage />} />
              <Route path="/transaction" element={<TransactionPage />} />
              <Route path="/history" element={<TransactionHistoryPage />} />
              <Route path="/team" element={<TeamPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
