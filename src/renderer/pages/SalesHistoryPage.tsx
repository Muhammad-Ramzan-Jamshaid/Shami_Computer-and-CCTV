import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Printer, 
  Eye, 
  XCircle, 
  Calendar,
  Filter
} from 'lucide-react';
import { Sale, User } from '../../shared/types';

interface SalesHistoryPageProps {
  currentUser: User | null;
  onViewInvoice: (sale: Sale) => void;
}

export const SalesHistoryPage: React.FC<SalesHistoryPageProps> = ({ currentUser, onViewInvoice }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [invoiceSearch, setInvoiceSearch] = useState<string>('');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
  const [dateFilterType, setDateFilterType] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Cancel sale modal
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [cancelSaleTarget, setCancelSaleTarget] = useState<Sale | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');

  const loadSales = async () => {
    try {
      if (window.api) {
        let start = startDate;
        let end = endDate;

        const today = new Date();
        if (dateFilterType === 'TODAY') {
          start = today.toISOString().slice(0, 10);
          end = start;
        } else if (dateFilterType === 'YESTERDAY') {
          const yest = new Date(today);
          yest.setDate(yest.getDate() - 1);
          start = yest.toISOString().slice(0, 10);
          end = start;
        } else if (dateFilterType === 'THIS_MONTH') {
          start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
          end = today.toISOString().slice(0, 10);
        }

        const res = await window.api.getSales({
          invoiceNumber: invoiceSearch || undefined,
          paymentMethod: paymentFilter !== 'ALL' ? paymentFilter : undefined,
          startDate: start || undefined,
          endDate: end || undefined
        });

        setSales(res || []);
      }
    } catch (err) {
      console.error('Failed to load sales history:', err);
    }
  };

  useEffect(() => {
    loadSales();
  }, [invoiceSearch, paymentFilter, dateFilterType, startDate, endDate]);

  const handleOpenCancelModal = (sale: Sale) => {
    setCancelSaleTarget(sale);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancelSaleTarget || !currentUser) return;
    const res = await window.api.cancelSale(cancelSaleTarget.id, currentUser.id, cancelReason);
    if (res.success) {
      setShowCancelModal(false);
      loadSales();
    } else {
      alert(res.error || 'Failed to cancel sale');
    }
  };

  return (
    <div style={{ padding: '24px', height: '100%', overflowY: 'auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#f8fafc' }}>Sales History</h1>
        <p style={{ fontSize: '13px', color: '#94a3b8' }}>View past invoices, reprint A4 bills, and void cancelled sales</p>
      </div>

      {/* Filters Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '20px',
        backgroundColor: '#1e293b',
        padding: '16px',
        borderRadius: '10px',
        border: '1px solid #334155',
        alignItems: 'center'
      }}>
        {/* Invoice Search */}
        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
          <input
            type="text"
            placeholder="Filter by Invoice Number..."
            value={invoiceSearch}
            onChange={e => setInvoiceSearch(e.target.value)}
            style={{ width: '100%', padding: '7px 10px 7px 34px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px' }}
          />
        </div>

        {/* Date Filter Presets */}
        <select
          value={dateFilterType}
          onChange={e => setDateFilterType(e.target.value)}
          style={{ padding: '7px 12px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px' }}
        >
          <option value="ALL">All Time</option>
          <option value="TODAY">Today</option>
          <option value="YESTERDAY">Yesterday</option>
          <option value="THIS_MONTH">This Month</option>
          <option value="CUSTOM">Custom Date Range</option>
        </select>

        {dateFilterType === 'CUSTOM' && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              style={{ padding: '6px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '12px' }}
            />
            <span style={{ color: '#94a3b8' }}>to</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              style={{ padding: '6px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '12px' }}
            />
          </div>
        )}

        {/* Payment Method Filter */}
        <select
          value={paymentFilter}
          onChange={e => setPaymentFilter(e.target.value)}
          style={{ padding: '7px 12px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px' }}
        >
          <option value="ALL">All Payment Methods</option>
          <option value="CASH">Cash</option>
          <option value="BANK">Bank / Online</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      {/* Sales Table */}
      <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#0f172a', color: '#94a3b8', textAlign: 'left' }}>
              <th style={{ padding: '12px' }}>Invoice #</th>
              <th style={{ padding: '12px' }}>Date & Time</th>
              <th style={{ padding: '12px' }}>Customer</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Total (Rs)</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Payment Method</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sales.length > 0 ? (
              sales.map(sale => {
                const isCancelled = sale.status === 'CANCELLED';

                return (
                  <tr key={sale.id} style={{ borderBottom: '1px solid #334155', opacity: isCancelled ? 0.6 : 1 }}>
                    <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: 'bold', color: '#60a5fa' }}>
                      {sale.invoice_number}
                    </td>
                    <td style={{ padding: '12px', color: '#cbd5e1' }}>
                      {new Date(sale.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px', color: '#f8fafc', fontWeight: '500' }}>
                      {sale.customer_name || 'Walk-in Customer'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: isCancelled ? '#94a3b8' : '#10b981' }}>
                      Rs {sale.total.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#0f172a', color: '#cbd5e1' }}>
                        {sale.payment_method}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{
                        fontSize: '11px',
                        padding: '3px 8px',
                        borderRadius: '12px',
                        fontWeight: 'bold',
                        backgroundColor: isCancelled ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                        color: isCancelled ? '#ef4444' : '#10b981'
                      }}>
                        {sale.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        <button
                          onClick={async () => {
                            const fullSale = await window.api.getSaleById(sale.id);
                            if (fullSale) onViewInvoice(fullSale);
                          }}
                          title="View / Reprint A4 Invoice"
                          style={{
                            backgroundColor: '#2563eb',
                            border: 'none',
                            color: '#ffffff',
                            padding: '6px 10px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            fontWeight: 'bold'
                          }}
                        >
                          <Printer size={13} /> Reprint
                        </button>

                        {!isCancelled && currentUser?.role === 'ADMIN' && (
                          <button
                            onClick={() => handleOpenCancelModal(sale)}
                            title="Cancel / Void Sale"
                            style={{
                              backgroundColor: '#334155',
                              border: 'none',
                              color: '#ef4444',
                              padding: '6px',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            <XCircle size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                  No sales invoices recorded.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Cancel Sale Modal */}
      {showCancelModal && cancelSaleTarget && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#1e293b', border: '1px solid #ef4444', borderRadius: '12px', width: '420px', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#ef4444', marginBottom: '12px' }}>
              Confirm Cancel Sale Invoice #{cancelSaleTarget.invoice_number}
            </h3>
            <p style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '16px' }}>
              Cancelling this sale will automatically restore all sold quantities back into stock inventory.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Reason for Cancellation</label>
              <input
                type="text"
                placeholder="e.g. Customer returned items / Wrong billing"
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleConfirmCancel}
                style={{ flex: 1, padding: '10px', backgroundColor: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Yes, Void & Restore Stock
              </button>
              <button
                onClick={() => setShowCancelModal(false)}
                style={{ padding: '10px 16px', backgroundColor: '#334155', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Keep Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
