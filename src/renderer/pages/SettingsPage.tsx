import React, { useState, useEffect } from 'react';
import { Settings, Store, FileText, Shield, UserPlus, Save, CheckCircle2 } from 'lucide-react';
import { ShopSettings, User } from '../../shared/types';

interface SettingsPageProps {
  currentUser: User | null;
  onSettingsUpdated: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ currentUser, onSettingsUpdated }) => {
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // New User Form State
  const [showAddUserModal, setShowAddUserModal] = useState<boolean>(false);
  const [newUserName, setNewUserName] = useState<string>('');
  const [newUserUsername, setNewUserUsername] = useState<string>('');
  const [newUserPassword, setNewUserPassword] = useState<string>('');
  const [newUserRole, setNewUserRole] = useState<'ADMIN' | 'CASHIER'>('CASHIER');

  const loadData = async () => {
    try {
      if (window.api) {
        const s = await window.api.getSettings();
        const u = await window.api.getUsers();
        setSettings(s);
        setUsers(u || []);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    const res = await window.api.updateSettings(settings);
    if (res.success) {
      setSuccessMessage('Settings updated successfully!');
      onSettingsUpdated();
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserUsername.trim() || !newUserPassword.trim()) return;
    const res = await window.api.createUser({
      name: newUserName.trim(),
      username: newUserUsername.trim(),
      password: newUserPassword.trim(),
      role: newUserRole
    });

    if (res.success) {
      setShowAddUserModal(false);
      setNewUserName('');
      setNewUserUsername('');
      setNewUserPassword('');
      loadData();
    } else {
      alert(res.error || 'Failed to create user');
    }
  };

  if (!settings) return null;

  return (
    <div style={{ padding: '24px', height: '100%', overflowY: 'auto', backgroundColor: '#f1f5f9' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a' }}>Settings & System Configuration</h1>
        <p style={{ fontSize: '14px', color: '#64748b' }}>Configure shop branding, A4 invoice options, and staff user permissions</p>
      </div>

      {successMessage && (
        <div style={{ backgroundColor: '#dcfce7', border: '1px solid #86efac', color: '#15803d', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={18} /> {successMessage}
        </div>
      )}

      <form onSubmit={handleSaveSettings}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          {/* Shop Information Panel */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 'bold', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Store size={20} color="#2563eb" /> Shop Details
            </h3>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '13.5px', color: '#475569', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Shop Name *</label>
              <input
                type="text"
                required
                value={settings.shop_name}
                onChange={e => setSettings({ ...settings, shop_name: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a', fontSize: '14.5px' }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '13.5px', color: '#475569', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Phone Number *</label>
              <input
                type="text"
                required
                value={settings.phone}
                onChange={e => setSettings({ ...settings, phone: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a', fontSize: '14.5px' }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '13.5px', color: '#475569', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Shop Address *</label>
              <textarea
                rows={2}
                required
                value={settings.address}
                onChange={e => setSettings({ ...settings, address: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a', fontSize: '14.5px' }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '13.5px', color: '#475569', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Invoice Footer Message</label>
              <input
                type="text"
                value={settings.invoice_footer}
                onChange={e => setSettings({ ...settings, invoice_footer: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a', fontSize: '14.5px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '13.5px', color: '#475569', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Return / Warranty Note</label>
              <input
                type="text"
                value={settings.return_policy}
                onChange={e => setSettings({ ...settings, return_policy: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a', fontSize: '14.5px' }}
              />
            </div>
          </div>

          {/* Invoice & Preferences Panel */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 'bold', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={20} color="#7c3aed" /> Invoice & Inventory Options
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#0f172a', fontSize: '14px', cursor: 'pointer', padding: '12px 14px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                <span>Show Product SKU Code on Invoice</span>
                <input
                  type="checkbox"
                  checked={settings.show_sku}
                  onChange={e => setSettings({ ...settings, show_sku: e.target.checked })}
                />
              </label>

              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#0f172a', fontSize: '14px', cursor: 'pointer', padding: '12px 14px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                <span>Show Customer Name on Invoice</span>
                <input
                  type="checkbox"
                  checked={settings.show_customer}
                  onChange={e => setSettings({ ...settings, show_customer: e.target.checked })}
                />
              </label>

              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#0f172a', fontSize: '14px', cursor: 'pointer', padding: '12px 14px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                <span>Show Discount Column on Invoice</span>
                <input
                  type="checkbox"
                  checked={settings.show_discount}
                  onChange={e => setSettings({ ...settings, show_discount: e.target.checked })}
                />
              </label>

              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#0f172a', fontSize: '14px', cursor: 'pointer', padding: '12px 14px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                <span>Allow Negative Stock Selling (Default OFF)</span>
                <input
                  type="checkbox"
                  checked={settings.allow_negative_stock}
                  onChange={e => setSettings({ ...settings, allow_negative_stock: e.target.checked })}
                />
              </label>
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                marginTop: '24px',
                padding: '12px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '15px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 1px 2px rgba(37,99,235,0.2)'
              }}
            >
              <Save size={18} /> Save Settings
            </button>
          </div>
        </div>
      </form>

      {/* User Accounts Management Section */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 'bold', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={20} color="#16a34a" /> System Users & Security Roles
          </h3>
          <button
            onClick={() => setShowAddUserModal(true)}
            style={{
              backgroundColor: '#16a34a',
              color: '#ffffff',
              border: 'none',
              padding: '9px 16px',
              borderRadius: '6px',
              fontWeight: 'bold',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 1px 2px rgba(22,163,74,0.2)'
            }}
          >
            <UserPlus size={16} /> Add User
          </button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', color: '#475569', textAlign: 'left', borderBottom: '1px solid #e2e8f0', fontSize: '13.5px' }}>
              <th style={{ padding: '12px 14px' }}>Name</th>
              <th style={{ padding: '12px 14px' }}>Username</th>
              <th style={{ padding: '12px 14px' }}>Role</th>
              <th style={{ padding: '12px 14px', textAlign: 'center' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 14px', fontWeight: 'bold', color: '#0f172a' }}>{u.name}</td>
                <td style={{ padding: '12px 14px', color: '#2563eb', fontFamily: 'monospace', fontSize: '14.5px' }}>{u.username}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{
                    fontSize: '12.5px',
                    padding: '3px 10px',
                    borderRadius: '4px',
                    backgroundColor: u.role === 'ADMIN' ? '#dcfce7' : '#fef3c7',
                    color: u.role === 'ADMIN' ? '#15803d' : '#b45309',
                    border: u.role === 'ADMIN' ? '1px solid #bbf7d0' : '1px solid #fde68a',
                    fontWeight: 'bold'
                  }}>
                    {u.role}
                  </span>
                </td>
                <td style={{ padding: '12px 14px', textAlign: 'center', color: u.active ? '#16a34a' : '#64748b', fontWeight: '500' }}>
                  {u.active ? '● Active' : '○ Inactive'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', width: '420px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a', marginBottom: '16px' }}>Create User Account</h3>
            <form onSubmit={handleCreateUser}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '13.5px', color: '#475569', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Full Name *</label>
                <input type="text" required value={newUserName} onChange={e => setNewUserName(e.target.value)} style={{ width: '100%', padding: '9px 12px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a', fontSize: '14.5px' }} />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '13.5px', color: '#475569', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Username *</label>
                <input type="text" required value={newUserUsername} onChange={e => setNewUserUsername(e.target.value)} style={{ width: '100%', padding: '9px 12px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a', fontSize: '14.5px' }} />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '13.5px', color: '#475569', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Password *</label>
                <input type="password" required value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} style={{ width: '100%', padding: '9px 12px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a', fontSize: '14.5px' }} />
              </div>
              <div style={{ marginBottom: '18px' }}>
                <label style={{ fontSize: '13.5px', color: '#475569', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Role</label>
                <select value={newUserRole} onChange={e => setNewUserRole(e.target.value as any)} style={{ width: '100%', padding: '9px 12px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a', fontSize: '14.5px' }}>
                  <option value="CASHIER">Cashier / Staff (POS Sales Only)</option>
                  <option value="ADMIN">Admin / Owner (Full Access)</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" style={{ flex: 1, padding: '10px 18px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '14.5px', cursor: 'pointer', boxShadow: '0 1px 2px rgba(37,99,235,0.2)' }}>Create User</button>
                <button type="button" onClick={() => setShowAddUserModal(false)} style={{ padding: '10px 18px', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14.5px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

