import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Package, 
  Printer,
  FileText
} from 'lucide-react';
import { DailyReport, ProductReportItem } from '../../shared/types';

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'DAILY' | 'DATE_RANGE' | 'PRODUCT'>('DAILY');
  
  // Daily Report state
  const [dailyDate, setDailyDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null);

  // Range & Product report state
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [productReports, setProductReports] = useState<ProductReportItem[]>([]);

  const loadDailyReport = async () => {
    try {
      if (window.api) {
        const res = await window.api.getDailyReport(dailyDate);
        setDailyReport(res);
      }
    } catch (err) {
      console.error('Failed to load daily report:', err);
    }
  };

  const loadProductReport = async () => {
    try {
      if (window.api) {
        const res = await window.api.getProductSalesReport(startDate, endDate);
        setProductReports(res || []);
      }
    } catch (err) {
      console.error('Failed to load product sales report:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'DAILY') {
      loadDailyReport();
    } else {
      loadProductReport();
    }
  }, [activeTab, dailyDate, startDate, endDate]);

  return (
    <div style={{ padding: '24px', height: '100%', overflowY: 'auto', backgroundColor: '#f1f5f9' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a' }}>Reports & Profit Analytics</h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '3px' }}>Comprehensive shop financial reports & item profit breakdown</p>
        </div>

        <button
          onClick={() => window.print()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#ffffff',
            color: '#334155',
            padding: '10px 18px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            fontWeight: '600',
            fontSize: '14px',
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}
        >
          <Printer size={18} /> Print Report
        </button>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
        <button
          onClick={() => setActiveTab('DAILY')}
          style={{
            padding: '9px 18px',
            borderRadius: '6px',
            border: activeTab === 'DAILY' ? 'none' : '1px solid #cbd5e1',
            backgroundColor: activeTab === 'DAILY' ? '#2563eb' : '#ffffff',
            color: activeTab === 'DAILY' ? '#ffffff' : '#475569',
            fontWeight: 'bold',
            fontSize: '14px',
            cursor: 'pointer',
            boxShadow: activeTab === 'DAILY' ? '0 1px 2px rgba(37,99,235,0.2)' : 'none'
          }}
        >
          Daily Summary Report
        </button>
        <button
          onClick={() => setActiveTab('PRODUCT')}
          style={{
            padding: '9px 18px',
            borderRadius: '6px',
            border: activeTab === 'PRODUCT' ? 'none' : '1px solid #cbd5e1',
            backgroundColor: activeTab === 'PRODUCT' ? '#2563eb' : '#ffffff',
            color: activeTab === 'PRODUCT' ? '#ffffff' : '#475569',
            fontWeight: 'bold',
            fontSize: '14px',
            cursor: 'pointer',
            boxShadow: activeTab === 'PRODUCT' ? '0 1px 2px rgba(37,99,235,0.2)' : 'none'
          }}
        >
          Product Sales & Profit Report
        </button>
      </div>

      {/* Daily Report Tab */}
      {activeTab === 'DAILY' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', backgroundColor: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <label style={{ color: '#334155', fontSize: '14px', fontWeight: 'bold' }}>Select Date:</label>
            <input
              type="date"
              value={dailyDate}
              onChange={e => setDailyDate(e.target.value)}
              style={{ padding: '8px 12px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a', fontSize: '14px' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <p style={{ fontSize: '13.5px', color: '#64748b', fontWeight: '500' }}>Total Sales</p>
              <h2 style={{ fontSize: '26px', fontWeight: 'bold', color: '#0f172a', marginTop: '4px' }}>
                Rs {dailyReport?.totalSales ? dailyReport.totalSales.toLocaleString() : 0}
              </h2>
            </div>
            <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <p style={{ fontSize: '13.5px', color: '#64748b', fontWeight: '500' }}>Total Profit</p>
              <h2 style={{ fontSize: '26px', fontWeight: 'bold', color: '#16a34a', marginTop: '4px' }}>
                Rs {dailyReport?.totalProfit ? dailyReport.totalProfit.toLocaleString() : 0}
              </h2>
            </div>
            <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <p style={{ fontSize: '13.5px', color: '#64748b', fontWeight: '500' }}>Total Invoices</p>
              <h2 style={{ fontSize: '26px', fontWeight: 'bold', color: '#2563eb', marginTop: '4px' }}>
                {dailyReport?.totalInvoices || 0}
              </h2>
            </div>
            <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <p style={{ fontSize: '13.5px', color: '#64748b', fontWeight: '500' }}>Total Discounts Given</p>
              <h2 style={{ fontSize: '26px', fontWeight: 'bold', color: '#dc2626', marginTop: '4px' }}>
                Rs {dailyReport?.totalDiscounts ? dailyReport.totalDiscounts.toLocaleString() : 0}
              </h2>
            </div>
          </div>

          {/* Payment breakdown */}
          <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a', marginBottom: '16px' }}>Payment Method Breakdown</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <p style={{ fontSize: '13px', color: '#64748b' }}>Cash Sales</p>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#16a34a', marginTop: '4px' }}>Rs {dailyReport?.cashSales.toLocaleString() || 0}</h3>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <p style={{ fontSize: '13px', color: '#64748b' }}>Bank / Online Sales</p>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#2563eb', marginTop: '4px' }}>Rs {dailyReport?.bankSales.toLocaleString() || 0}</h3>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <p style={{ fontSize: '13px', color: '#64748b' }}>Other Sales</p>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#7c3aed', marginTop: '4px' }}>Rs {dailyReport?.otherSales.toLocaleString() || 0}</h3>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Sales & Profit Report Tab */}
      {activeTab === 'PRODUCT' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', backgroundColor: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <label style={{ color: '#334155', fontSize: '14px', fontWeight: 'bold' }}>From Date:</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '8px 12px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a', fontSize: '14px' }} />
            <label style={{ color: '#334155', fontSize: '14px', fontWeight: 'bold' }}>To Date:</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '8px 12px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a', fontSize: '14px' }} />
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', color: '#475569', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 14px', fontSize: '13.5px', fontWeight: '600' }}>Product Name</th>
                  <th style={{ padding: '12px 14px', fontSize: '13.5px', fontWeight: '600' }}>SKU</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center', fontSize: '13.5px', fontWeight: '600' }}>Qty Sold</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right', fontSize: '13.5px', fontWeight: '600' }}>Total Cost (Rs)</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right', fontSize: '13.5px', fontWeight: '600' }}>Sales Revenue (Rs)</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right', fontSize: '13.5px', fontWeight: '600' }}>Estimated Profit (Rs)</th>
                </tr>
              </thead>
              <tbody>
                {productReports.length > 0 ? (
                  productReports.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 'bold', color: '#0f172a', fontSize: '15px' }}>{item.product_name}</td>
                      <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#2563eb', fontSize: '13.5px' }}>{item.sku}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 'bold', color: '#0f172a' }}>{item.quantity_sold}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', color: '#64748b' }}>{item.total_cost.toLocaleString()}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 'bold', color: '#0f172a', fontSize: '15px' }}>{item.sales_amount.toLocaleString()}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 'bold', color: '#16a34a', fontSize: '15px' }}>{item.profit.toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: '#64748b', fontSize: '14.5px' }}>No product sales recorded in this date range.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
