import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Printer, 
  Eye, 
  XCircle, 
  Trash2,
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
    <div style={{ padding: '24px', height: '100%', overflowY: 'auto', backgroundColor: '#f1f5f9' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a' }}>Sales History</h1>
        <p style={{ fontSize: '14px', color: '#64748b', marginTop: '3px' }}>View past invoices, reprint A4 bills, and void cancelled sales</p>
      </div>

      {/* Filters Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '20px',
        backgroundColor: '#ffffff',
        padding: '16px',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        alignItems: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        {/* Invoice Search */}
        <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
          <Search size={17} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '11px' }} />
          <input
            type="text"
            placeholder="Filter by Invoice Number..."
            value={invoiceSearch}
            onChange={e => setInvoiceSearch(e.target.value)}
            style={{ width: '100%', padding: '9px 12px 9px 38px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a', fontSize: '14.5px', boxSizing: 'border-box' }}
          />
        </div>

        {/* Date Filter Presets */}
        <select
          value={dateFilterType}
          onChange={e => setDateFilterType(e.target.value)}
          style={{ padding: '9px 14px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a', fontSize: '14px' }}
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
              style={{ padding: '8px 10px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a', fontSize: '14px' }}
            />
            <span style={{ color: '#64748b', fontSize: '14px' }}>to</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              style={{ padding: '8px 10px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a', fontSize: '14px' }}
            />
          </div>
        )}

        {/* Payment Method Filter */}
        <select
          value={paymentFilter}
          onChange={e => setPaymentFilter(e.target.value)}
          style={{ padding: '9px 14px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a', fontSize: '14px' }}
        >
          <option value="ALL">All Payment Methods</option>
          <option value="CASH">Cash</option>
          <option value="BANK">Bank / Online</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      {/* Sales Table */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', color: '#475569', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '12px 14px', fontSize: '13.5px', fontWeight: '600' }}>Invoice #</th>
              <th style={{ padding: '12px 14px', fontSize: '13.5px', fontWeight: '600' }}>Date & Time</th>
              <th style={{ padding: '12px 14px', fontSize: '13.5px', fontWeight: '600' }}>Customer</th>
              <th style={{ padding: '12px 14px', textAlign: 'right', fontSize: '13.5px', fontWeight: '600' }}>Total (Rs)</th>
              <th style={{ padding: '12px 14px', textAlign: 'center', fontSize: '13.5px', fontWeight: '600' }}>Payment Method</th>
              <th style={{ padding: '12px 14px', textAlign: 'center', fontSize: '13.5px', fontWeight: '600' }}>Status</th>
              <th style={{ padding: '12px 14px', textAlign: 'center', fontSize: '13.5px', fontWeight: '600' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sales.length > 0 ? (
              sales.map(sale => {
                const isCancelled = sale.status === 'CANCELLED';

                return (
                  <tr key={sale.id} style={{ borderBottom: '1px solid #f1f5f9', opacity: isCancelled ? 0.6 : 1 }}>
                    <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 'bold', color: '#2563eb', fontSize: '14px' }}>
                      {sale.invoice_number}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '13.5px' }}>
                      {new Date(sale.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#0f172a', fontWeight: '500', fontSize: '14.5px' }}>
                      {sale.customer_name || 'Walk-in Customer'}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 'bold', color: isCancelled ? '#64748b' : '#16a34a', fontSize: '15.5px' }}>
                      Rs {sale.total.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <span style={{ fontSize: '12.5px', padding: '3px 10px', borderRadius: '4px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', color: '#475569', fontWeight: '500' }}>
                        {sale.payment_method}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <span style={{
                        fontSize: '12.5px',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontWeight: 'bold',
                        backgroundColor: isCancelled ? '#fee2e2' : '#dcfce7',
                        color: isCancelled ? '#b91c1c' : '#15803d'
                      }}>
                        {sale.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
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
                            padding: '7px 12px',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '13px',
                            fontWeight: '600',
                            boxShadow: '0 1px 2px rgba(37,99,235,0.2)'
                          }}
                        >
                          <Printer size={15} /> Reprint
                        </button>

                        {!isCancelled && currentUser?.role === 'ADMIN' && (
                          <button
                            onClick={() => handleOpenCancelModal(sale)}
                            title="Cancel / Void Sale (Mark as Cancelled)"
                            style={{
                              backgroundColor: '#fef3c7',
                              border: '1px solid #fde68a',
                              color: '#d97706',
                              padding: '7px 9px',
                              borderRadius: '5px',
                              cursor: 'pointer'
                            }}
                          >
                            <XCircle size={16} />
                          </button>
                        )}

                        {currentUser?.role === 'ADMIN' && (
                          <button
                            onClick={async () => {
                              if (confirm(`Are you sure you want to PERMANENTLY DELETE invoice #${sale.invoice_number}? This will remove it from all records and restore stock.`)) {
                                const res = await window.api.deleteSale(sale.id, currentUser.id);
                                if (res.success) {
                                  loadSales();
                                } else {
                                  alert(res.error || 'Failed to delete sale');
                                }
                              }
                            }}
                            title="Permanently Delete Invoice from Database"
                            style={{
                              backgroundColor: '#fee2e2',
                              border: '1px solid #fecaca',
                              color: '#dc2626',
                              padding: '7px 9px',
                              borderRadius: '5px',
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: '#64748b', fontSize: '14.5px' }}>
                  No sales invoices recorded.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Cancel Sale Modal */}
      {showCancelModal && cancelSaleTarget && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', width: '450px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 'bold', color: '#dc2626', marginBottom: '12px' }}>
              Confirm Cancel Sale Invoice #{cancelSaleTarget.invoice_number}
            </h3>
            <p style={{ fontSize: '14px', color: '#475569', marginBottom: '16px' }}>
              Cancelling this sale will automatically restore all sold quantities back into stock inventory.
            </p>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '13.5px', color: '#334155', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Reason for Cancellation</label>
              <input
                type="text"
                placeholder="e.g. Customer returned items / Wrong billing"
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a', fontSize: '14.5px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleConfirmCancel}
                style={{ flex: 1, padding: '12px', backgroundColor: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '14.5px', cursor: 'pointer' }}
              >
                Yes, Void & Restore Stock
              </button>
              <button
                onClick={() => setShowCancelModal(false)}
                style={{ padding: '12px 18px', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}
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
