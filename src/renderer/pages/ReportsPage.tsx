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
    <div style={{ padding: '24px', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#f8fafc' }}>Reports & Profit Analytics</h1>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>Comprehensive shop financial reports & item profit breakdown</p>
        </div>

        <button
          onClick={() => window.print()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#334155',
            color: '#ffffff',
            padding: '8px 16px',
            borderRadius: '6px',
            border: '1px solid #475569',
            fontWeight: '600',
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          <Printer size={16} /> Print Report
        </button>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
        <button
          onClick={() => setActiveTab('DAILY')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: activeTab === 'DAILY' ? '#2563eb' : '#1e293b',
            color: '#ffffff',
            fontWeight: 'bold',
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          Daily Summary Report
        </button>
        <button
          onClick={() => setActiveTab('PRODUCT')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: activeTab === 'PRODUCT' ? '#2563eb' : '#1e293b',
            color: '#ffffff',
            fontWeight: 'bold',
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          Product Sales & Profit Report
        </button>
      </div>

      {/* Daily Report Tab */}
      {activeTab === 'DAILY' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', backgroundColor: '#1e293b', padding: '16px', borderRadius: '10px', border: '1px solid #334155' }}>
            <label style={{ color: '#cbd5e1', fontSize: '13px', fontWeight: 'bold' }}>Select Date:</label>
            <input
              type="date"
              value={dailyDate}
              onChange={e => setDailyDate(e.target.value)}
              style={{ padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
              <p style={{ fontSize: '12px', color: '#94a3b8' }}>Total Sales</p>
              <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#f8fafc', marginTop: '4px' }}>
                Rs {dailyReport?.totalSales ? dailyReport.totalSales.toLocaleString() : 0}
              </h2>
            </div>
            <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
              <p style={{ fontSize: '12px', color: '#94a3b8' }}>Total Profit</p>
              <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#10b981', marginTop: '4px' }}>
                Rs {dailyReport?.totalProfit ? dailyReport.totalProfit.toLocaleString() : 0}
              </h2>
            </div>
            <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
              <p style={{ fontSize: '12px', color: '#94a3b8' }}>Total Invoices</p>
              <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#60a5fa', marginTop: '4px' }}>
                {dailyReport?.totalInvoices || 0}
              </h2>
            </div>
            <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
              <p style={{ fontSize: '12px', color: '#94a3b8' }}>Total Discounts Given</p>
              <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#ef4444', marginTop: '4px' }}>
                Rs {dailyReport?.totalDiscounts ? dailyReport.totalDiscounts.toLocaleString() : 0}
              </h2>
            </div>
          </div>

          {/* Payment breakdown */}
          <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#f8fafc', marginBottom: '16px' }}>Payment Method Breakdown</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '8px' }}>
                <p style={{ fontSize: '12px', color: '#94a3b8' }}>Cash Sales</p>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981', marginTop: '4px' }}>Rs {dailyReport?.cashSales.toLocaleString() || 0}</h3>
              </div>
              <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '8px' }}>
                <p style={{ fontSize: '12px', color: '#94a3b8' }}>Bank / Online Sales</p>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#3b82f6', marginTop: '4px' }}>Rs {dailyReport?.bankSales.toLocaleString() || 0}</h3>
              </div>
              <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '8px' }}>
                <p style={{ fontSize: '12px', color: '#94a3b8' }}>Other Sales</p>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#c084fc', marginTop: '4px' }}>Rs {dailyReport?.otherSales.toLocaleString() || 0}</h3>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Sales & Profit Report Tab */}
      {activeTab === 'PRODUCT' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', backgroundColor: '#1e293b', padding: '16px', borderRadius: '10px', border: '1px solid #334155' }}>
            <label style={{ color: '#cbd5e1', fontSize: '13px', fontWeight: 'bold' }}>From Date:</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px' }} />
            <label style={{ color: '#cbd5e1', fontSize: '13px', fontWeight: 'bold' }}>To Date:</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px' }} />
          </div>

          <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#0f172a', color: '#94a3b8', textAlign: 'left' }}>
                  <th style={{ padding: '12px' }}>Product Name</th>
                  <th style={{ padding: '12px' }}>SKU</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Qty Sold</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Total Cost (Rs)</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Sales Revenue (Rs)</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Estimated Profit (Rs)</th>
                </tr>
              </thead>
              <tbody>
                {productReports.length > 0 ? (
                  productReports.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #334155' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold', color: '#f8fafc' }}>{item.product_name}</td>
                      <td style={{ padding: '12px', fontFamily: 'monospace', color: '#60a5fa' }}>{item.sku}</td>
                      <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#f8fafc' }}>{item.quantity_sold}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#94a3b8' }}>{item.total_cost.toLocaleString()}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#f8fafc' }}>{item.sales_amount.toLocaleString()}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#10b981' }}>{item.profit.toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>No product sales recorded in this date range.</td>
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
