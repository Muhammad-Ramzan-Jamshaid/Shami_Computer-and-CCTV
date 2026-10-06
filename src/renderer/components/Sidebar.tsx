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
      width: '240px',
      backgroundColor: '#111827',
      borderRight: '1px solid #1f2937',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      justifyContent: 'space-between'
    }}>
      <div>
        {/* Brand Header */}
        <div style={{
          padding: '20px 16px',
          borderBottom: '1px solid #1f2937',
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
            <h1 style={{ fontSize: '15px', fontWeight: 'bold', color: '#f9fafb', lineHeight: 1.2 }}>
              Shami POS
            </h1>
            <p style={{ fontSize: '11px', color: '#9ca3af' }}>
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
                  padding: '10px 14px',
                  marginBottom: '4px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: isActive ? '#2563eb' : 'transparent',
                  color: isActive ? '#ffffff' : '#9ca3af',
                  fontSize: '13px',
                  fontWeight: isActive ? '600' : '400',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = '#1f2937';
                    e.currentTarget.style.color = '#f3f4f6';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#9ca3af';
                  }
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Footer */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid #1f2937',
        backgroundColor: '#0f172a'
      }}>
        {currentUser && (
          <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#f3f4f6' }}>{currentUser.name}</p>
              <span style={{
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: currentUser.role === 'ADMIN' ? '#059669' : '#d97706',
                color: '#ffffff',
                fontWeight: 'bold',
                textTransform: 'uppercase'
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
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #374151',
            backgroundColor: '#1f2937',
            color: '#ef4444',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          <LogOut size={15} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
