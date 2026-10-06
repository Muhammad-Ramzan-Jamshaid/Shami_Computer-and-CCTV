import React from 'react';
import { Printer, X } from 'lucide-react';
import { Sale, ShopSettings } from '../../shared/types';

interface A4InvoiceModalProps {
  sale: Sale | null;
  shopSettings: ShopSettings | null;
  onClose: () => void;
}

export const A4InvoiceModal: React.FC<A4InvoiceModalProps> = ({ sale, shopSettings, onClose }) => {
  if (!sale) return null;

  const handlePrint = async () => {
    if (window.api?.printInvoice) {
      await window.api.printInvoice();
    } else {
      window.print();
    }
  };

  const formattedDate = new Date(sale.created_at).toLocaleDateString();
  const formattedTime = new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        color: '#000000',
        borderRadius: '8px',
        width: '210mm',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header toolbar for screen display */}
        <div className="no-print" style={{
          padding: '12px 20px',
          backgroundColor: '#1e293b',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTopLeftRadius: '8px',
          borderTopRightRadius: '8px'
        }}>
          <h3 style={{ fontSize: '15px', fontWeight: 'bold' }}>A4 Invoice Preview — {sale.invoice_number}</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handlePrint}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              <Printer size={16} /> Print A4 Invoice
            </button>
            <button
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px',
                backgroundColor: '#475569',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable A4 Content */}
        <div id="printable-a4-invoice" style={{ padding: '30px', flex: 1, backgroundColor: '#ffffff' }}>
          {/* Shop Header */}
          <div style={{ textAlign: 'center', borderBottom: '2px solid #000000', paddingBottom: '15px', marginBottom: '20px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '1px', color: '#1e3a8a', textTransform: 'uppercase' }}>
              {shopSettings?.shop_name || 'SHAMI COMPUTER AND CCTV'}
            </h1>
            <p style={{ fontSize: '12px', marginTop: '4px', fontWeight: '600', color: '#334155' }}>
              {shopSettings?.address || 'Safa Wala Chowk, near Habib Shah Hospital, Farooqabad, District Sheikhupura'}
            </p>
            <p style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '2px' }}>
              Phone: {shopSettings?.phone || '0306 4565908'}
            </p>
          </div>

          {/* Invoice Meta Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '15px',
            marginBottom: '20px',
            padding: '12px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '6px'
          }}>
            <div>
              <p style={{ fontSize: '13px', margin: '2px 0' }}><strong>Invoice No:</strong> <span style={{ fontFamily: 'monospace', fontSize: '14px' }}>{sale.invoice_number}</span></p>
              <p style={{ fontSize: '12px', margin: '2px 0' }}><strong>Date:</strong> {formattedDate}</p>
              <p style={{ fontSize: '12px', margin: '2px 0' }}><strong>Time:</strong> {formattedTime}</p>
            </div>
            <div>
              <p style={{ fontSize: '13px', margin: '2px 0' }}><strong>Customer Name:</strong> {sale.customer_name || 'Walk-in Customer'}</p>
              <p style={{ fontSize: '12px', margin: '2px 0' }}><strong>Phone:</strong> {sale.customer_phone || 'N/A'}</p>
              <p style={{ fontSize: '12px', margin: '2px 0' }}><strong>Payment Method:</strong> {sale.payment_method}</p>
            </div>
          </div>

          {/* Line Items Table */}
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            marginBottom: '20px',
            fontSize: '12px'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>
                <th style={{ padding: '8px', border: '1px solid #334155', textAlign: 'center', width: '40px' }}>Sr.</th>
                <th style={{ padding: '8px', border: '1px solid #334155', textAlign: 'left' }}>Item Description</th>
                {shopSettings?.show_sku && <th style={{ padding: '8px', border: '1px solid #334155', textAlign: 'left', width: '90px' }}>SKU</th>}
                <th style={{ padding: '8px', border: '1px solid #334155', textAlign: 'center', width: '50px' }}>Qty</th>
                <th style={{ padding: '8px', border: '1px solid #334155', textAlign: 'right', width: '80px' }}>Price (Rs)</th>
                {shopSettings?.show_discount && <th style={{ padding: '8px', border: '1px solid #334155', textAlign: 'right', width: '70px' }}>Disc (Rs)</th>}
                <th style={{ padding: '8px', border: '1px solid #334155', textAlign: 'right', width: '90px' }}>Total (Rs)</th>
              </tr>
            </thead>
            <tbody>
              {sale.items && sale.items.map((item, idx) => (
                <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                  <td style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'center' }}>{idx + 1}</td>
                  <td style={{ padding: '8px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>{item.product_name_snapshot}</td>
                  {shopSettings?.show_sku && <td style={{ padding: '8px', border: '1px solid #cbd5e1', fontFamily: 'monospace' }}>{item.sku_snapshot}</td>}
                  <td style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'right' }}>{item.selling_price.toLocaleString()}</td>
                  {shopSettings?.show_discount && <td style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'right' }}>{item.discount > 0 ? item.discount.toLocaleString() : '-'}</td>}
                  <td style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold' }}>{item.line_total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Summary Box */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '25px' }}>
            <div style={{ width: '260px', border: '1px solid #94a3b8', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderBottom: '1px solid #cbd5e1', fontSize: '12px' }}>
                <span>Subtotal:</span>
                <strong>Rs {sale.subtotal.toLocaleString()}</strong>
              </div>
              {sale.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderBottom: '1px solid #cbd5e1', fontSize: '12px', color: '#dc2626' }}>
                  <span>Discount:</span>
                  <strong>- Rs {sale.discount.toLocaleString()}</strong>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid #cbd5e1', fontSize: '14px', backgroundColor: '#1e293b', color: '#ffffff' }}>
                <span>Grand Total:</span>
                <strong>Rs {sale.total.toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderBottom: '1px solid #cbd5e1', fontSize: '12px' }}>
                <span>Amount Paid:</span>
                <strong>Rs {sale.amount_paid.toLocaleString()}</strong>
              </div>
              {sale.amount_paid > sale.total && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', fontSize: '12px', color: '#16a34a' }}>
                  <span>Change Return:</span>
                  <strong>Rs {(sale.amount_paid - sale.total).toLocaleString()}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Footer Terms & Warranty */}
          <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '12px', textAlign: 'center', marginTop: 'auto' }}>
            <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#334155' }}>
              {shopSettings?.invoice_footer || 'Thank you for shopping at Shami Computer & CCTV!'}
            </p>
            <p style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
              {shopSettings?.return_policy || 'Note: Warranty claims require original bill within 7 days. Physical damage/burnt items void warranty.'}
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', paddingTop: '10px', borderTop: '1px dashed #cbd5e1', fontSize: '10px' }}>
              <span>Customer Signature: ___________________</span>
              <span>Authorized Signature: ___________________</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
