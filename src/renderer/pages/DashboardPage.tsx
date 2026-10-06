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
    <div style={{ padding: '24px', height: '100%', overflowY: 'auto' }}>
      {/* Top Banner & Quick Actions */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#f8fafc' }}>Dashboard</h1>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>Real-time daily sales, inventory status, and quick shop actions</p>
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
              padding: '10px 18px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            <ShoppingCart size={16} /> New Sale
          </button>
          <button
            onClick={() => setActiveTab('products')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#059669',
              color: '#ffffff',
              padding: '10px 18px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            <PlusCircle size={16} /> Add Product
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#334155',
              color: '#f8fafc',
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid #475569',
              fontWeight: '500',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            <Database size={16} /> Backup
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
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{ backgroundColor: 'rgba(37, 99, 235, 0.2)', padding: '12px', borderRadius: '10px' }}>
            <TrendingUp size={24} color="#3b82f6" />
          </div>
          <div>
            <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>Today's Sales</p>
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#f8fafc', marginTop: '2px' }}>
              Rs {stats?.todaySalesTotal ? stats.todaySalesTotal.toLocaleString() : 0}
            </h2>
          </div>
        </div>

        {/* Today Invoices */}
        <div style={{
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{ backgroundColor: 'rgba(168, 85, 247, 0.2)', padding: '12px', borderRadius: '10px' }}>
            <FileText size={24} color="#c084fc" />
          </div>
          <div>
            <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>Invoices Created</p>
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#f8fafc', marginTop: '2px' }}>
              {stats?.todayInvoicesCount || 0}
            </h2>
          </div>
        </div>

        {/* Today Profit */}
        <div style={{
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', padding: '12px', borderRadius: '10px' }}>
            <DollarSign size={24} color="#10b981" />
          </div>
          <div>
            <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>Today's Profit</p>
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#10b981', marginTop: '2px' }}>
              Rs {stats?.todayProfitTotal ? stats.todayProfitTotal.toLocaleString() : 0}
            </h2>
          </div>
        </div>

        {/* Total Products */}
        <div style={{
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{ backgroundColor: 'rgba(14, 165, 233, 0.2)', padding: '12px', borderRadius: '10px' }}>
            <Package size={24} color="#38bdf8" />
          </div>
          <div>
            <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>Total Products</p>
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#f8fafc', marginTop: '2px' }}>
              {stats?.totalProducts || 0}
            </h2>
          </div>
        </div>

        {/* Low Stock Warning */}
        <div style={{
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', padding: '12px', borderRadius: '10px' }}>
            <AlertTriangle size={24} color="#ef4444" />
          </div>
          <div>
            <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>Low Stock Items</p>
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#ef4444', marginTop: '2px' }}>
              {stats?.lowStockCount || 0}
            </h2>
          </div>
        </div>
      </div>

      {/* Main Content Two Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Recent Sales Table */}
        <div style={{
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#f8fafc' }}>Recent Invoices</h3>
            <button
              onClick={() => setActiveTab('sales-history')}
              style={{ fontSize: '12px', color: '#60a5fa', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              View All →
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8', textAlign: 'left' }}>
                <th style={{ padding: '8px' }}>Invoice</th>
                <th style={{ padding: '8px' }}>Customer</th>
                <th style={{ padding: '8px', textAlign: 'right' }}>Total</th>
                <th style={{ padding: '8px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentSales && stats.recentSales.length > 0 ? (
                stats.recentSales.map((sale) => (
                  <tr key={sale.id} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '10px 8px', fontFamily: 'monospace', color: '#60a5fa' }}>{sale.invoice_number}</td>
                    <td style={{ padding: '10px 8px', color: '#cbd5e1' }}>{sale.customer_name || 'Walk-in'}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 'bold', color: '#10b981' }}>
                      Rs {sale.total.toLocaleString()}
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                      <button
                        onClick={async () => {
                          const fullSale = await window.api.getSaleById(sale.id);
                          if (fullSale) onViewInvoice(fullSale);
                        }}
                        style={{
                          backgroundColor: '#334155',
                          border: 'none',
                          color: '#f8fafc',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        <Printer size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No sales recorded today yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Low Stock Warning Box */}
        <div style={{
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} /> Low Stock Alerts
            </h3>
            <button
              onClick={() => setActiveTab('products')}
              style={{ fontSize: '12px', color: '#60a5fa', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Update Stock →
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8', textAlign: 'left' }}>
                <th style={{ padding: '8px' }}>Product</th>
                <th style={{ padding: '8px' }}>Category</th>
                <th style={{ padding: '8px', textAlign: 'center' }}>Available</th>
                <th style={{ padding: '8px', textAlign: 'center' }}>Min Limit</th>
              </tr>
            </thead>
            <tbody>
              {stats?.lowStockProducts && stats.lowStockProducts.length > 0 ? (
                stats.lowStockProducts.map((prod) => (
                  <tr key={prod.id} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '10px 8px', fontWeight: 'bold', color: '#f8fafc' }}>{prod.name}</td>
                    <td style={{ padding: '10px 8px', color: '#94a3b8' }}>{prod.category_name}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                        color: '#ef4444',
                        fontWeight: 'bold'
                      }}>
                        {prod.stock_quantity} {prod.unit}
                      </span>
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', color: '#94a3b8' }}>
                      {prod.minimum_stock}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#10b981' }}>All products are well stocked!</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
