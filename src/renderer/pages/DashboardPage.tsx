import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  FileText, 
  DollarSign, 
  Package, 
  AlertTriangle, 
  PlusCircle, 
  ShoppingCart, 
  Database,
  Printer
} from 'lucide-react';
import { DashboardStats, Sale } from '../../shared/types';

interface DashboardPageProps {
  setActiveTab: (tab: string) => void;
  onViewInvoice: (sale: Sale) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ setActiveTab, onViewInvoice }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadStats = async () => {
    setLoading(true);
    try {
      if (window.api?.getDashboardStats) {
        const res = await window.api.getDashboardStats();
        setStats(res);
      }
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div style={{ padding: '24px', height: '100%', overflowY: 'auto', backgroundColor: '#f1f5f9' }}>
      {/* Top Banner & Quick Actions */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a' }}>Dashboard</h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '3px' }}>Real-time daily sales, inventory status, and quick shop actions</p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setActiveTab('pos')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(37,99,235,0.2)'
            }}
          >
            <ShoppingCart size={18} /> New Sale
          </button>
          <button
            onClick={() => setActiveTab('products')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#16a34a',
              color: '#ffffff',
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(22,163,74,0.2)'
            }}
          >
            <PlusCircle size={18} /> Add Product
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#ffffff',
              color: '#334155',
              padding: '10px 18px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontWeight: '500',
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <Database size={18} color="#64748b" /> Backup
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '28px'
      }}>
        {/* Today Sales Card */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ backgroundColor: '#eff6ff', padding: '12px', borderRadius: '10px' }}>
            <TrendingUp size={26} color="#2563eb" />
          </div>
          <div>
            <p style={{ fontSize: '13.5px', color: '#64748b', fontWeight: '600' }}>Today's Sales</p>
            <h2 style={{ fontSize: '26px', fontWeight: 'bold', color: '#0f172a', marginTop: '2px' }}>
              Rs {stats?.todaySalesTotal ? stats.todaySalesTotal.toLocaleString() : 0}
            </h2>
          </div>
        </div>

        {/* Today Invoices */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ backgroundColor: '#f5f3ff', padding: '12px', borderRadius: '10px' }}>
            <FileText size={26} color="#7c3aed" />
          </div>
          <div>
            <p style={{ fontSize: '13.5px', color: '#64748b', fontWeight: '600' }}>Invoices Created</p>
            <h2 style={{ fontSize: '26px', fontWeight: 'bold', color: '#0f172a', marginTop: '2px' }}>
              {stats?.todayInvoicesCount || 0}
            </h2>
          </div>
        </div>

        {/* Today Profit */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ backgroundColor: '#ecfdf5', padding: '12px', borderRadius: '10px' }}>
            <DollarSign size={26} color="#059669" />
          </div>
          <div>
            <p style={{ fontSize: '13.5px', color: '#64748b', fontWeight: '600' }}>Today's Profit</p>
            <h2 style={{ fontSize: '26px', fontWeight: 'bold', color: '#16a34a', marginTop: '2px' }}>
              Rs {stats?.todayProfitTotal ? stats.todayProfitTotal.toLocaleString() : 0}
            </h2>
          </div>
        </div>

        {/* Total Products */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ backgroundColor: '#f0f9ff', padding: '12px', borderRadius: '10px' }}>
            <Package size={26} color="#0284c7" />
          </div>
          <div>
            <p style={{ fontSize: '13.5px', color: '#64748b', fontWeight: '600' }}>Total Products</p>
            <h2 style={{ fontSize: '26px', fontWeight: 'bold', color: '#0f172a', marginTop: '2px' }}>
              {stats?.totalProducts || 0}
            </h2>
          </div>
        </div>

        {/* Low Stock Warning */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ backgroundColor: '#fef2f2', padding: '12px', borderRadius: '10px' }}>
            <AlertTriangle size={26} color="#dc2626" />
          </div>
          <div>
            <p style={{ fontSize: '13.5px', color: '#64748b', fontWeight: '600' }}>Low Stock Items</p>
            <h2 style={{ fontSize: '26px', fontWeight: 'bold', color: '#dc2626', marginTop: '2px' }}>
              {stats?.lowStockCount || 0}
            </h2>
          </div>
        </div>
      </div>

      {/* Main Content Two Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Recent Sales Table */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a' }}>Recent Invoices</h3>
            <button
              onClick={() => setActiveTab('sales-history')}
              style={{ fontSize: '13.5px', color: '#2563eb', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              View All →
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                <th style={{ padding: '10px 8px', fontSize: '13.5px', fontWeight: '600' }}>Invoice</th>
                <th style={{ padding: '10px 8px', fontSize: '13.5px', fontWeight: '600' }}>Customer</th>
                <th style={{ padding: '10px 8px', textAlign: 'right', fontSize: '13.5px', fontWeight: '600' }}>Total</th>
                <th style={{ padding: '10px 8px', textAlign: 'center', fontSize: '13.5px', fontWeight: '600' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentSales && stats.recentSales.length > 0 ? (
                stats.recentSales.map((sale) => (
                  <tr key={sale.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 8px', fontFamily: 'monospace', color: '#2563eb', fontWeight: '600', fontSize: '13.5px' }}>{sale.invoice_number}</td>
                    <td style={{ padding: '10px 8px', color: '#334155', fontWeight: '500' }}>{sale.customer_name || 'Walk-in'}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 'bold', color: '#16a34a', fontSize: '15px' }}>
                      Rs {sale.total.toLocaleString()}
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                      <button
                        onClick={async () => {
                          const fullSale = await window.api.getSaleById(sale.id);
                          if (fullSale) onViewInvoice(fullSale);
                        }}
                        style={{
                          backgroundColor: '#f1f5f9',
                          border: '1px solid #cbd5e1',
                          color: '#334155',
                          padding: '6px 10px',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                        title="Print / View Invoice"
                      >
                        <Printer size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>No sales recorded today yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Low Stock Warning Box */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={20} /> Low Stock Alerts
            </h3>
            <button
              onClick={() => setActiveTab('products')}
              style={{ fontSize: '13.5px', color: '#2563eb', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Update Stock →
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                <th style={{ padding: '10px 8px', fontSize: '13.5px', fontWeight: '600' }}>Product</th>
                <th style={{ padding: '10px 8px', fontSize: '13.5px', fontWeight: '600' }}>Category</th>
                <th style={{ padding: '10px 8px', textAlign: 'center', fontSize: '13.5px', fontWeight: '600' }}>Available</th>
                <th style={{ padding: '10px 8px', textAlign: 'center', fontSize: '13.5px', fontWeight: '600' }}>Min Limit</th>
              </tr>
            </thead>
            <tbody>
              {stats?.lowStockProducts && stats.lowStockProducts.length > 0 ? (
                stats.lowStockProducts.map((prod) => (
                  <tr key={prod.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 8px', fontWeight: 'bold', color: '#0f172a' }}>{prod.name}</td>
                    <td style={{ padding: '10px 8px', color: '#64748b' }}>{prod.category_name}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: '4px',
                        backgroundColor: '#fee2e2',
                        color: '#b91c1c',
                        fontWeight: 'bold',
                        fontSize: '12.5px'
                      }}>
                        {prod.stock_quantity} {prod.unit}
                      </span>
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', color: '#64748b' }}>
                      {prod.minimum_stock}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#16a34a' }}>All products are well stocked!</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
