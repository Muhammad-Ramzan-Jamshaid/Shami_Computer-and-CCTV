import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import { ProductsPage } from './pages/ProductsPage';
import { POSPage } from './pages/POSPage';
import { SalesHistoryPage } from './pages/SalesHistoryPage';
import { ReportsPage } from './pages/ReportsPage';
import { CustomersPage } from './pages/CustomersPage';
import { BackupPage } from './pages/BackupPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { A4InvoiceModal } from './components/A4InvoiceModal';
import { User, ShopSettings, Sale } from '../shared/types';
import './index.css';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);
  const [previewSale, setPreviewSale] = useState<Sale | null>(null);

  const loadShopSettings = async () => {
    try {
      if (window.api) {
        const s = await window.api.getSettings();
        setShopSettings(s);
      }
    } catch (err) {
      console.error('Failed to load shop settings:', err);
    }
  };

  useEffect(() => {
    loadShopSettings();
  }, []);

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  const handleSaleCompleted = (sale: Sale) => {
    setPreviewSale(sale);
  };

  // If not logged in, display Login Screen
  if (!currentUser) {
    return <LoginPage onLoginSuccess={(u) => setCurrentUser(u)} />;
  }

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: '#f1f5f9' }}>
      {/* Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <Header
          currentUser={currentUser}
          shopSettings={shopSettings}
        />

        <main style={{ flex: 1, overflow: 'hidden', backgroundColor: '#f1f5f9' }}>
          {activeTab === 'dashboard' && (
            <DashboardPage
              setActiveTab={setActiveTab}
              onViewInvoice={(s) => setPreviewSale(s)}
            />
          )}

          {activeTab === 'pos' && (
            <POSPage
              currentUser={currentUser}
              onSaleSuccess={handleSaleCompleted}
            />
          )}

          {activeTab === 'products' && (
            <ProductsPage currentUser={currentUser} />
          )}

          {activeTab === 'sales-history' && (
            <SalesHistoryPage
              currentUser={currentUser}
              onViewInvoice={(s) => setPreviewSale(s)}
            />
          )}

          {activeTab === 'customers' && (
            <CustomersPage />
          )}

          {activeTab === 'reports' && (
            <ReportsPage />
          )}

          {activeTab === 'backup' && (
            <BackupPage />
          )}

          {activeTab === 'settings' && (
            <SettingsPage
              currentUser={currentUser}
              onSettingsUpdated={loadShopSettings}
            />
          )}
        </main>
      </div>

      {/* A4 Printable Invoice Modal */}
      {previewSale && (
        <A4InvoiceModal
          sale={previewSale}
          shopSettings={shopSettings}
          onClose={() => setPreviewSale(null)}
        />
      )}
    </div>
  );
}

export default App;
