import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  UserPlus, 
  CheckCircle,
  Printer,
  DollarSign
} from 'lucide-react';
import { Product, Category, Customer, PaymentMethod, Sale, User } from '../../shared/types';

interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
  discount: number;
  line_total: number;
}

interface POSPageProps {
  currentUser: User | null;
  onSaleSuccess: (sale: Sale) => void;
}

export const POSPage: React.FC<POSPageProps> = ({ currentUser, onSaleSuccess }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Cart & Sale State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [overallDiscount, setOverallDiscount] = useState<number>(0);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');

  // Customer Add Modal
  const [showAddCustomerModal, setShowAddCustomerModal] = useState<boolean>(false);
  const [newCustName, setNewCustName] = useState<string>('');
  const [newCustPhone, setNewCustPhone] = useState<string>('');
  const [newCustAddress, setNewCustAddress] = useState<string>('');

  const [errorMessage, setErrorMessage] = useState<string>('');

  const loadInitialData = async () => {
    try {
      if (window.api) {
        const prods = await window.api.getProducts();
        const cats = await window.api.getCategories();
        const custs = await window.api.getCustomers();
        setProducts(prods?.filter(p => p.active) || []);
        setCategories(cats || []);
        setCustomers(custs || []);
      }
    } catch (err) {
      console.error('Failed to load POS data:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Cart Management
  const addToCart = (product: Product) => {
    if (product.stock_quantity <= 0) {
      setErrorMessage(`'${product.name}' is out of stock!`);
      return;
    }

    setErrorMessage('');
    const existingIndex = cart.findIndex(item => item.product.id === product.id);

    if (existingIndex > -1) {
      const existingItem = cart[existingIndex];
      if (existingItem.quantity + 1 > product.stock_quantity) {
        setErrorMessage(`Only ${product.stock_quantity} units available in stock for '${product.name}'`);
        return;
      }

      const updatedCart = [...cart];
      const newQty = existingItem.quantity + 1;
      updatedCart[existingIndex] = {
        ...existingItem,
        quantity: newQty,
        line_total: newQty * existingItem.unit_price - existingItem.discount
      };
      setCart(updatedCart);
    } else {
      setCart([
        ...cart,
        {
          product,
          quantity: 1,
          unit_price: product.selling_price,
          discount: 0,
          line_total: product.selling_price
        }
      ]);
    }
  };

  const updateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(index);
      return;
    }

    const item = cart[index];
    if (newQty > item.product.stock_quantity) {
      setErrorMessage(`Only ${item.product.stock_quantity} units available for '${item.product.name}'`);
      return;
    }

    setErrorMessage('');
    const updatedCart = [...cart];
    updatedCart[index] = {
      ...item,
      quantity: newQty,
      line_total: newQty * item.unit_price - item.discount
    };
    setCart(updatedCart);
  };

  const updateDiscount = (index: number, discountAmt: number) => {
    const item = cart[index];
    const maxDiscount = item.quantity * item.unit_price;
    const safeDisc = Math.min(Math.max(0, discountAmt), maxDiscount);

    const updatedCart = [...cart];
    updatedCart[index] = {
      ...item,
      discount: safeDisc,
      line_total: item.quantity * item.unit_price - safeDisc
    };
    setCart(updatedCart);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCart([]);
    setOverallDiscount(0);
    setAmountPaid(0);
    setErrorMessage('');
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);
  const itemsDiscount = cart.reduce((acc, item) => acc + item.discount, 0);
  const totalDiscount = itemsDiscount + overallDiscount;
  const grandTotal = Math.max(0, subtotal - totalDiscount);
  const changeReturn = Math.max(0, amountPaid - grandTotal);

  // Submit Sale
  const handleCheckout = async () => {
    if (cart.length === 0) {
      setErrorMessage('Cart is empty. Please select products first.');
      return;
    }

    if (amountPaid < grandTotal) {
      setErrorMessage(`Amount paid (Rs ${amountPaid}) is less than Grand Total (Rs ${grandTotal})`);
      return;
    }

    setErrorMessage('');

    const saleInput = {
      customer_id: selectedCustomerId,
      subtotal,
      discount: totalDiscount,
      total: grandTotal,
      amount_paid: amountPaid,
      payment_method: paymentMethod,
      created_by: currentUser ? currentUser.id : 1,
      items: cart.map(item => ({
        product_id: item.product.id,
        product_name_snapshot: item.product.name,
        sku_snapshot: item.product.sku,
        quantity: item.quantity,
        purchase_price_snapshot: item.product.purchase_price,
        selling_price: item.unit_price,
        discount: item.discount,
        line_total: item.line_total
      }))
    };

    try {
      const res = await window.api.createSale(saleInput);
      if (!res.success) {
        setErrorMessage(res.error || 'Sale failed to complete');
        return;
      }

      // Fetch full sale object with items for invoice preview
      const fullSale = await window.api.getSaleById(res.saleId);
      clearCart();
      loadInitialData(); // Refresh product stock levels
      if (fullSale) onSaleSuccess(fullSale);
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustPhone.trim()) return;
    const res = await window.api.addCustomer({
      name: newCustName.trim(),
      phone: newCustPhone.trim(),
      address: newCustAddress.trim()
    });

    if (res.success && res.id) {
      setSelectedCustomerId(res.id);
      setShowAddCustomerModal(false);
      setNewCustName('');
      setNewCustPhone('');
      setNewCustAddress('');
      loadInitialData();
    }
  };

  // Product Grid Filter
  const filteredProducts = products.filter((p: Product) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || p.category_id === parseInt(selectedCategory);
    return matchesSearch && matchesCat;
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', height: '100%', overflow: 'hidden' }}>
      {/* Left: Product Selection Area */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%', borderRight: '1px solid #334155' }}>
        {/* Search & Category Tabs */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            <input
              type="text"
              placeholder="Search product by name or scan SKU barcode..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                padding: '10px 12px 10px 40px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '14px'
              }}
            />
          </div>

          {/* Category Badges Horizontal Scroll */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px' }}>
            <button
              onClick={() => setSelectedCategory('ALL')}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: 'none',
                backgroundColor: selectedCategory === 'ALL' ? '#2563eb' : '#1e293b',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              All Items
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id.toString())}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: 'none',
                  backgroundColor: selectedCategory === cat.id.toString() ? '#2563eb' : '#1e293b',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
          gap: '12px',
          overflowY: 'auto',
          alignContent: 'start'
        }}>
          {filteredProducts.map(prod => {
            const isOutOfStock = prod.stock_quantity <= 0;

            return (
              <div
                key={prod.id}
                onClick={() => !isOutOfStock && addToCart(prod)}
                style={{
                  backgroundColor: isOutOfStock ? '#111827' : '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '10px',
                  padding: '12px',
                  cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                  opacity: isOutOfStock ? 0.5 : 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 0.1s ease, border-color 0.1s ease'
                }}
                onMouseEnter={e => { if (!isOutOfStock) e.currentTarget.style.borderColor = '#2563eb'; }}
                onMouseLeave={e => { if (!isOutOfStock) e.currentTarget.style.borderColor = '#334155'; }}
              >
                <div>
                  <span style={{ fontSize: '10px', color: '#60a5fa', fontFamily: 'monospace' }}>{prod.sku}</span>
                  <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#f8fafc', margin: '4px 0 6px 0', lineHeight: '1.2' }}>{prod.name}</h4>
                  <p style={{ fontSize: '11px', color: '#94a3b8' }}>{prod.category_name}</p>
                </div>

                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#10b981' }}>Rs {prod.selling_price.toLocaleString()}</span>
                  <span style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: isOutOfStock ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)',
                    color: isOutOfStock ? '#ef4444' : '#10b981',
                    fontWeight: 'bold'
                  }}>
                    {prod.stock_quantity} {prod.unit}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Cart & Checkout Billing Sidebar */}
      <div style={{ backgroundColor: '#0f172a', padding: '20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Customer Selector Header */}
        <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            value={selectedCustomerId || ''}
            onChange={e => setSelectedCustomerId(e.target.value ? parseInt(e.target.value) : null)}
            style={{
              flex: 1,
              padding: '8px 12px',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#f8fafc',
              fontSize: '13px'
            }}
          >
            <option value="">👤 Walk-in Customer</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
            ))}
          </select>
          <button
            onClick={() => setShowAddCustomerModal(true)}
            style={{
              backgroundColor: '#334155',
              border: 'none',
              color: '#f8fafc',
              padding: '8px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px'
            }}
          >
            <UserPlus size={16} /> New
          </button>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#ef4444', padding: '10px', borderRadius: '6px', marginBottom: '12px', fontSize: '12px' }}>
            {errorMessage}
          </div>
        )}

        {/* Cart Item Table */}
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px', borderBottom: '1px solid #334155' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ color: '#94a3b8', borderBottom: '1px solid #1e293b', textAlign: 'left' }}>
                <th style={{ padding: '6px' }}>Item</th>
                <th style={{ padding: '6px', textAlign: 'center' }}>Qty</th>
                <th style={{ padding: '6px', textAlign: 'right' }}>Total</th>
                <th style={{ padding: '6px' }}></th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '8px 6px', color: '#f8fafc' }}>
                    <div style={{ fontWeight: 'bold' }}>{item.product.name}</div>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>Rs {item.unit_price}</div>
                  </td>
                  <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <button onClick={() => updateQuantity(idx, item.quantity - 1)} style={{ background: '#334155', border: 'none', color: '#fff', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer' }}>-</button>
                      <span style={{ fontWeight: 'bold', minWidth: '20px' }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(idx, item.quantity + 1)} style={{ background: '#334155', border: 'none', color: '#fff', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer' }}>+</button>
                    </div>
                  </td>
                  <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 'bold', color: '#10b981' }}>
                    Rs {item.line_total.toLocaleString()}
                  </td>
                  <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                    <button onClick={() => removeFromCart(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bill Calculations Panel */}
        <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '10px', border: '1px solid #334155' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px', color: '#cbd5e1' }}>
            <span>Subtotal:</span>
            <span>Rs {subtotal.toLocaleString()}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '13px', color: '#cbd5e1' }}>
            <span>Overall Discount (Rs):</span>
            <input
              type="number"
              min="0"
              value={overallDiscount}
              onChange={e => setOverallDiscount(parseFloat(e.target.value) || 0)}
              style={{ width: '80px', padding: '4px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '4px', color: '#ef4444', fontWeight: 'bold', textAlign: 'right', fontSize: '12px' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '16px', fontWeight: 'bold', color: '#f8fafc', borderTop: '1px solid #334155', paddingTop: '8px' }}>
            <span>Grand Total:</span>
            <span style={{ color: '#10b981' }}>Rs {grandTotal.toLocaleString()}</span>
          </div>

          {/* Payment Method Radio */}
          <div style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
            {(['CASH', 'BANK', 'OTHER'] as PaymentMethod[]).map(m => (
              <button
                key={m}
                onClick={() => setPaymentMethod(m)}
                style={{
                  flex: 1,
                  padding: '6px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: paymentMethod === m ? '#2563eb' : '#0f172a',
                  color: '#ffffff',
                  cursor: 'pointer'
                }}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Amount Paid Input */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Amount Paid by Customer (Rs)</label>
            <input
              type="number"
              min="0"
              value={amountPaid}
              onChange={e => setAmountPaid(parseFloat(e.target.value) || 0)}
              style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '15px', fontWeight: 'bold' }}
            />
            {amountPaid > grandTotal && (
              <p style={{ fontSize: '12px', color: '#10b981', marginTop: '4px', fontWeight: 'bold' }}>
                Change to return: Rs {changeReturn.toLocaleString()}
              </p>
            )}
          </div>

          {/* Complete Sale Button */}
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: cart.length === 0 ? '#475569' : '#059669',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '14px',
              cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <CheckCircle size={18} /> Complete Sale & Print Invoice
          </button>
        </div>
      </div>

      {/* Add New Customer Modal */}
      {showAddCustomerModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', width: '400px', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#f8fafc', marginBottom: '16px' }}>Add New Customer</h3>
            <form onSubmit={handleCreateCustomer}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Customer Name *</label>
                <input type="text" required value={newCustName} onChange={e => setNewCustName(e.target.value)} style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Phone Number *</label>
                <input type="text" required value={newCustPhone} onChange={e => setNewCustPhone(e.target.value)} style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Address (Optional)</label>
                <input type="text" value={newCustAddress} onChange={e => setNewCustAddress(e.target.value)} style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" style={{ flex: 1, padding: '10px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Save Customer</button>
                <button type="button" onClick={() => setShowAddCustomerModal(false)} style={{ padding: '10px 16px', backgroundColor: '#334155', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
