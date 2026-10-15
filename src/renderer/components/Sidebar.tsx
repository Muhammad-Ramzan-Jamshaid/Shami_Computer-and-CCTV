import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  History, 
  Users, 
  BarChart3, 
  Database, 
  Settings, 
  LogOut,
  ShieldCheck
} from 'lucide-react';
import { User } from '../../shared/types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User | null;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, currentUser, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, role: 'ALL' },
    { id: 'pos', label: 'New Sale / POS', icon: ShoppingCart, role: 'ALL' },
    { id: 'products', label: 'Products & Inventory', icon: Package, role: 'ADMIN' },
    { id: 'sales-history', label: 'Sales History', icon: History, role: 'ALL' },
    { id: 'customers', label: 'Customers', icon: Users, role: 'ALL' },
    { id: 'reports', label: 'Reports & Profit', icon: BarChart3, role: 'ADMIN' },
    { id: 'backup', label: 'Backup & Restore', icon: Database, role: 'ADMIN' },
    { id: 'settings', label: 'Settings', icon: Settings, role: 'ADMIN' },
  ];

  const filteredItems = menuItems.filter(
    item => item.role === 'ALL' || (currentUser && currentUser.role === 'ADMIN')
  );

  return (
    <aside style={{
      width: '220px',
      minWidth: '200px',
      flexShrink: 0,
      backgroundColor: '#ffffff',
      borderRight: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      justifyContent: 'space-between',
      overflowY: 'auto'
    }}>
      <div>
        {/* Brand Header */}
        <div style={{
          padding: '20px 16px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            backgroundColor: '#2563eb',
            borderRadius: '8px',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldCheck size={24} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: '17px', fontWeight: 'bold', color: '#0f172a', lineHeight: 1.2, margin: 0 }}>
              Shami POS
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '3px 0 0 0' }}>
              Computer & CCTV
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav style={{ padding: '12px 8px' }}>
          {filteredItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '11px 14px',
                  marginBottom: '5px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: isActive ? '#2563eb' : 'transparent',
                  color: isActive ? '#ffffff' : '#475569',
                  fontSize: '14.5px',
                  fontWeight: isActive ? '600' : '500',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = '#f1f5f9';
                    e.currentTarget.style.color = '#0f172a';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#475569';
                  }
                }}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Footer */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid #e2e8f0',
        backgroundColor: '#f8fafc'
      }}>
        {currentUser && (
          <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', margin: 0 }}>{currentUser.name}</p>
              <span style={{
                fontSize: '12px',
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: currentUser.role === 'ADMIN' ? '#dcfce7' : '#fef3c7',
                color: currentUser.role === 'ADMIN' ? '#15803d' : '#b45309',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                display: 'inline-block',
                marginTop: '4px'
              }}>
                {currentUser.role}
              </span>
            </div>
          </div>
        )}

        <button
          onClick={onLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px 12px',
            borderRadius: '6px',
            border: '1px solid #fecaca',
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
