import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PackageSearch, ArrowLeftRight, History, Users } from 'lucide-react';

export const BottomNav: React.FC = () => {
  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: 'var(--bottom-nav-height)',
      backgroundColor: 'var(--color-surface)',
      borderTop: '1px solid var(--color-border)',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      paddingBottom: 'env(safe-area-inset-bottom)',
      zIndex: 50
    }}>
      <NavItem to="/" icon={<LayoutDashboard size={24} />} label="Home" />
      <NavItem to="/products" icon={<PackageSearch size={24} />} label="Products" />
      <NavItem to="/transaction" icon={<ArrowLeftRight size={24} />} label="Add Txn" />
      <NavItem to="/history" icon={<History size={22} />} label="History" />
      <NavItem to="/team" icon={<Users size={22} />} label="Team" />
    </nav>
  );
};

const NavItem: React.FC<{ to: string, icon: React.ReactNode, label: string }> = ({ to, icon, label }) => {
  return (
    <NavLink 
      to={to} 
      style={({ isActive }) => ({
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
        width: '100%',
        height: '100%',
        textDecoration: 'none',
        gap: '4px'
      })}
    >
      {icon}
      <span style={{ fontSize: '10px', fontWeight: '500' }}>{label}</span>
    </NavLink>
  );
};
