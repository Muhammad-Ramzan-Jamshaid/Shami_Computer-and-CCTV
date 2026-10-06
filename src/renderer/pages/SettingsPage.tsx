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
    <div style={{ padding: '24px', height: '100%', overflowY: 'auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#f8fafc' }}>Settings & System Configuration</h1>
        <p style={{ fontSize: '13px', color: '#94a3b8' }}>Configure shop branding, A4 invoice options, and staff user permissions</p>
      </div>

      {successMessage && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#10b981', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={18} /> {successMessage}
        </div>
      )}

      <form onSubmit={handleSaveSettings}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          {/* Shop Information Panel */}
          <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#f8fafc', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Store size={18} color="#60a5fa" /> Shop Details
            </h3>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Shop Name *</label>
              <input
                type="text"
                required
                value={settings.shop_name}
                onChange={e => setSettings({ ...settings, shop_name: e.target.value })}
                style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px' }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Phone Number *</label>
              <input
                type="text"
                required
                value={settings.phone}
                onChange={e => setSettings({ ...settings, phone: e.target.value })}
                style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px' }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Shop Address *</label>
              <textarea
                rows={2}
                required
                value={settings.address}
                onChange={e => setSettings({ ...settings, address: e.target.value })}
                style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px' }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Invoice Footer Message</label>
              <input
                type="text"
                value={settings.invoice_footer}
                onChange={e => setSettings({ ...settings, invoice_footer: e.target.value })}
                style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Return / Warranty Note</label>
              <input
                type="text"
                value={settings.return_policy}
                onChange={e => setSettings({ ...settings, return_policy: e.target.value })}
                style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px' }}
              />
            </div>
          </div>

          {/* Invoice & Preferences Panel */}
          <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#f8fafc', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="#c084fc" /> Invoice & Inventory Options
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#f8fafc', fontSize: '13px', cursor: 'pointer', padding: '8px', backgroundColor: '#0f172a', borderRadius: '6px' }}>
                <span>Show Product SKU Code on Invoice</span>
                <input
                  type="checkbox"
                  checked={settings.show_sku}
                  onChange={e => setSettings({ ...settings, show_sku: e.target.checked })}
                />
              </label>

              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#f8fafc', fontSize: '13px', cursor: 'pointer', padding: '8px', backgroundColor: '#0f172a', borderRadius: '6px' }}>
                <span>Show Customer Name on Invoice</span>
                <input
                  type="checkbox"
                  checked={settings.show_customer}
                  onChange={e => setSettings({ ...settings, show_customer: e.target.checked })}
                />
              </label>

              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#f8fafc', fontSize: '13px', cursor: 'pointer', padding: '8px', backgroundColor: '#0f172a', borderRadius: '6px' }}>
                <span>Show Discount Column on Invoice</span>
                <input
                  type="checkbox"
                  checked={settings.show_discount}
                  onChange={e => setSettings({ ...settings, show_discount: e.target.checked })}
                />
              </label>

              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#f8fafc', fontSize: '13px', cursor: 'pointer', padding: '8px', backgroundColor: '#0f172a', borderRadius: '6px' }}>
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
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Save size={18} /> Save Settings
            </button>
          </div>
        </div>
      </form>

      {/* User Accounts Management Section */}
      <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={18} color="#10b981" /> System Users & Security Roles
          </h3>
          <button
            onClick={() => setShowAddUserModal(true)}
            style={{
              backgroundColor: '#059669',
              color: '#ffffff',
              border: 'none',
              padding: '8px 14px',
              borderRadius: '6px',
              fontWeight: 'bold',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <UserPlus size={15} /> Add User
          </button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#0f172a', color: '#94a3b8', textAlign: 'left' }}>
              <th style={{ padding: '10px' }}>Name</th>
              <th style={{ padding: '10px' }}>Username</th>
              <th style={{ padding: '10px' }}>Role</th>
              <th style={{ padding: '10px', textAlign: 'center' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '10px', fontWeight: 'bold', color: '#f8fafc' }}>{u.name}</td>
                <td style={{ padding: '10px', color: '#60a5fa', fontFamily: 'monospace' }}>{u.username}</td>
                <td style={{ padding: '10px' }}>
                  <span style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: u.role === 'ADMIN' ? '#059669' : '#d97706',
                    color: '#ffffff',
                    fontWeight: 'bold'
                  }}>
                    {u.role}
                  </span>
                </td>
                <td style={{ padding: '10px', textAlign: 'center', color: u.active ? '#10b981' : '#64748b' }}>
                  {u.active ? '● Active' : '○ Inactive'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', width: '400px', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#f8fafc', marginBottom: '16px' }}>Create User Account</h3>
            <form onSubmit={handleCreateUser}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Full Name *</label>
                <input type="text" required value={newUserName} onChange={e => setNewUserName(e.target.value)} style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Username *</label>
                <input type="text" required value={newUserUsername} onChange={e => setNewUserUsername(e.target.value)} style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Password *</label>
                <input type="password" required value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Role</label>
                <select value={newUserRole} onChange={e => setNewUserRole(e.target.value as any)} style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px' }}>
                  <option value="CASHIER">Cashier / Staff (POS Sales Only)</option>
                  <option value="ADMIN">Admin / Owner (Full Access)</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" style={{ flex: 1, padding: '10px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Create User</button>
                <button type="button" onClick={() => setShowAddUserModal(false)} style={{ padding: '10px 16px', backgroundColor: '#334155', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
