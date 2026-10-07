import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  UserPlus, 
  CheckCircle,
  RotateCcw,
  PackageCheck,
  X,
  Printer
} from 'lucide-react';
import { Product, Category, Subcategory, Customer, PaymentMethod, Sale, User } from '../../shared/types';

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
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Search & Filter State (Medical Store Style)
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('ALL');
  const [showSearchDropdown, setShowSearchDropdown] = useState<boolean>(false);
  const [showFullCatalogModal, setShowFullCatalogModal] = useState<boolean>(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const checkoutCustNameRef = useRef<HTMLInputElement>(null);

  // Cart & Sale State
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Checkout & Customer State
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [custName, setCustName] = useState<string>('Walk-in Customer');
  const [custPhone, setCustPhone] = useState<string>('0300 0000000');

  const [overallDiscount, setOverallDiscount] = useState<number>(0);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');

  const [errorMessage, setErrorMessage] = useState<string>('');
  const [checkoutError, setCheckoutError] = useState<string>('');
  const [isAmountPaidCustom, setIsAmountPaidCustom] = useState<boolean>(false);

  const loadInitialData = async () => {
    try {
      if (window.api) {
        const prods = await window.api.getProducts();
        const cats = await window.api.getCategories();
        const subcats = await window.api.getSubcategories();
        const custs = await window.api.getCustomers();
        setProducts(prods?.filter(p => p.active) || []);
        setCategories(cats || []);
        setSubcategories(subcats || []);
        setCustomers(custs || []);
      }
    } catch (err) {
      console.error('Failed to load POS data:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleSelectCustomer = (idStr: string) => {
    if (!idStr) {
      setSelectedCustomerId(null);
      setCustName('Walk-in Customer');
      setCustPhone('0300 0000000');
    } else {
      const id = parseInt(idStr);
      const found = customers.find(c => c.id === id);
      if (found) {
        setSelectedCustomerId(found.id);
        setCustName(found.name);
        setCustPhone(found.phone);
      }
    }
  };

  // Cart Operations
  const addToCart = (product: Product) => {
    if (product.stock_quantity <= 0) {
      setErrorMessage(`'${product.name}' is out of stock!`);
      return;
    }

    setErrorMessage('');
    const existingIndex = cart.findIndex(item => item.product.id === product.id);

    if (existingIndex > -1) {
      const existingItem = cart[existingIndex];
      const newQty = existingItem.quantity + 1;

      if (newQty > product.stock_quantity) {
        setErrorMessage(`Only ${product.stock_quantity} ${product.unit} available in stock for '${product.name}'`);
        return;
      }

      const updatedCart = [...cart];
      updatedCart[existingIndex] = {
        ...existingItem,
        quantity: newQty,
        line_total: Math.max(0, (newQty * existingItem.unit_price) - existingItem.discount)
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

    setSearchQuery('');
    setShowSearchDropdown(false);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
  };

  const updateQuantity = (index: number, newQty: number) => {
    if (isNaN(newQty)) newQty = 0;

    const item = cart[index];
    if (newQty > item.product.stock_quantity) {
      setErrorMessage(`Only ${item.product.stock_quantity} ${item.product.unit} available for '${item.product.name}'`);
    } else {
      setErrorMessage('');
    }

    const updatedCart = [...cart];
    updatedCart[index] = {
      ...item,
      quantity: newQty,
      line_total: Math.max(0, (newQty * item.unit_price) - item.discount)
    };
    setCart(updatedCart);
  };

  const updateUnitPrice = (index: number, newPrice: number) => {
    if (isNaN(newPrice)) newPrice = 0;
    const item = cart[index];

    const updatedCart = [...cart];
    updatedCart[index] = {
      ...item,
      unit_price: newPrice,
      line_total: Math.max(0, (item.quantity * newPrice) - item.discount)
    };
    setCart(updatedCart);
  };

  const updateDiscount = (index: number, discountAmt: number) => {
    if (isNaN(discountAmt)) discountAmt = 0;
    const item = cart[index];
    const maxDiscount = item.quantity * item.unit_price;
    const safeDisc = Math.min(discountAmt, maxDiscount);

    const updatedCart = [...cart];
    updatedCart[index] = {
      ...item,
      discount: safeDisc,
      line_total: Math.max(0, (item.quantity * item.unit_price) - safeDisc)
    };
    setCart(updatedCart);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  // Calculations
  const totalQty = cart.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cart.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);
  const itemsDiscount = cart.reduce((acc, item) => acc + item.discount, 0);
  const totalDiscount = itemsDiscount + overallDiscount;
  const grandTotal = Math.max(0, subtotal - totalDiscount);
  const changeReturn = Math.max(0, amountPaid - grandTotal);

  useEffect(() => {
    if (!isAmountPaidCustom) {
      setAmountPaid(grandTotal);
    }
  }, [grandTotal, isAmountPaidCustom]);

  const clearCart = () => {
    setCart([]);
    setOverallDiscount(0);
    setAmountPaid(0);
    setIsAmountPaidCustom(false);
    setErrorMessage('');
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  const openCheckoutModal = () => {
    if (cart.length === 0) {
      setErrorMessage('Cart is empty. Please search & add products first.');
      return;
    }

    const validItems = cart.filter(i => i.quantity > 0);
    if (validItems.length === 0) {
      setErrorMessage('Please enter a valid quantity for items in cart.');
      return;
    }

    setErrorMessage('');
    setCheckoutError('');
    setShowCheckoutModal(true);
    setTimeout(() => {
      checkoutCustNameRef.current?.focus();
    }, 100);
  };

  const handleFinalizeSaleAndPrint = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!custName.trim()) {
      setCheckoutError('⚠️ Customer Name is required for invoice');
      return;
    }

    if (!custPhone.trim()) {
      setCheckoutError('⚠️ Customer Phone Number is required for invoice');
      return;
    }

    if (amountPaid < grandTotal) {
      setCheckoutError(`Amount paid (Rs ${amountPaid}) is less than Grand Total (Rs ${grandTotal})`);
      return;
    }

    setCheckoutError('');

    let finalCustId = selectedCustomerId;
    if (!finalCustId && custPhone.trim() !== '0300 0000000') {
      const existing = customers.find(c => c.phone.trim() === custPhone.trim());
      if (existing) {
        finalCustId = existing.id;
      } else {
        const addRes = await window.api.addCustomer({
          name: custName.trim(),
          phone: custPhone.trim()
        });
        if (addRes.success && addRes.id) {
          finalCustId = addRes.id;
        }
      }
    }

    const validItems = cart.filter(i => i.quantity > 0);
    const saleInput = {
      customer_id: finalCustId,
      subtotal,
      discount: totalDiscount,
      total: grandTotal,
      amount_paid: amountPaid,
      payment_method: paymentMethod,
      created_by: currentUser ? currentUser.id : 1,
      items: validItems.map(item => ({
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
        setCheckoutError(res.error || 'Sale failed to complete');
        return;
      }

      const fullSale = await window.api.getSaleById(res.saleId);
      setShowCheckoutModal(false);
      clearCart();
      setCustName('Walk-in Customer');
      setCustPhone('0300 0000000');
      setSelectedCustomerId(null);
      loadInitialData();

      if (fullSale) onSaleSuccess(fullSale);
    } catch (err: any) {
      setCheckoutError(err.message);
    }
  };

  // Search Results for Autocomplete Live Dropdown
  const searchResults = products.filter((p: Product) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesCat = selectedCategory === 'ALL' || p.category_id === parseInt(selectedCategory);
    const matchesSubCat = selectedSubcategory === 'ALL' || (p.subcategory_id && p.subcategory_id === parseInt(selectedSubcategory));

    if (!q) {
      return matchesCat && matchesSubCat;
    }

    const matchesQuery = p.name.toLowerCase().includes(q) ||
                         p.sku.toLowerCase().includes(q) ||
                         (p.category_name && p.category_name.toLowerCase().includes(q)) ||
                         (p.subcategory_name && p.subcategory_name.toLowerCase().includes(q));

    return matchesQuery && matchesCat && matchesSubCat;
  });

  const handleKeyDownSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults.length > 0) {
        const topItem = searchResults.find(p => p.stock_quantity > 0) || searchResults[0];
        addToCart(topItem);
      }
    } else if (e.key === 'Escape') {
      setShowSearchDropdown(false);
    }
  };

  // Subcategories available for selected category filter
  const filterAvailableSubcategories = selectedCategory === 'ALL'
    ? subcategories
    : subcategories.filter(sc => sc.category_id === parseInt(selectedCategory));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', overflow: 'hidden', backgroundColor: '#090d16', padding: '14px', boxSizing: 'border-box' }}>
      
      {/* TOP SEARCH BAR & FILTERS */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px', width: '100%' }}>
        
        {/* MEDICAL STORE STYLE SMART SEARCH INPUT */}
        <div style={{ flex: 1, position: 'relative' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={18} color="#38bdf8" style={{ position: 'absolute', left: '12px', top: '11px', pointerEvents: 'none' }} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="⚡ Search product by name, model, SKU or scan barcode... (Press Enter to add)"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setShowSearchDropdown(true);
                }}
                onFocus={() => {
                  if (searchQuery.trim().length > 0) setShowSearchDropdown(true);
                }}
                onKeyDown={handleKeyDownSearch}
                autoFocus
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 40px',
                  backgroundColor: '#1e293b',
                  border: showSearchDropdown && searchQuery ? '2px solid #38bdf8' : '1px solid #334155',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setShowSearchDropdown(false);
                    searchInputRef.current?.focus();
                  }}
                  style={{ position: 'absolute', right: '10px', top: '10px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Parent Category Filter */}
            <select
              value={selectedCategory}
              onChange={e => {
                setSelectedCategory(e.target.value);
                setSelectedSubcategory('ALL');
              }}
              style={{
                padding: '10px 12px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '12px'
              }}
            >
              <option value="ALL">📁 All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id.toString()}>{cat.name}</option>
              ))}
            </select>

            {/* Subcategory Filter */}
            <select
              value={selectedSubcategory}
              onChange={e => setSelectedSubcategory(e.target.value)}
              style={{
                padding: '10px 12px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '12px'
              }}
            >
              <option value="ALL">📂 All Subcategories</option>
              {filterAvailableSubcategories.map(sc => (
                <option key={sc.id} value={sc.id.toString()}>{sc.name}</option>
              ))}
            </select>

            {/* Catalog Trigger */}
            <button
              onClick={() => setShowFullCatalogModal(true)}
              style={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                color: '#38bdf8',
                padding: '10px 14px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 'bold',
                whiteSpace: 'nowrap'
              }}
            >
              <PackageCheck size={16} /> Catalog
            </button>
          </div>

          {/* LIVE SEARCH RESULTS DROPDOWN */}
          {showSearchDropdown && searchQuery.trim().length > 0 && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              right: 0,
              backgroundColor: '#0f172a',
              border: '2px solid #38bdf8',
              borderRadius: '8px',
              boxShadow: '0 12px 32px rgba(0,0,0,0.8)',
              maxHeight: '380px',
              overflowY: 'auto',
              zIndex: 1000
            }}>
              <div style={{ padding: '8px 12px', backgroundColor: '#1e293b', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', fontWeight: 'bold' }}>
                <span>FOUND {searchResults.length} MATCHING PRODUCTS</span>
                <span>Click item or press Enter to add</span>
              </div>

              {searchResults.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ color: '#94a3b8', borderBottom: '1px solid #1e293b', textAlign: 'left', backgroundColor: '#0f172a' }}>
                      <th style={{ padding: '8px 12px' }}>SKU</th>
                      <th style={{ padding: '8px 12px' }}>Product Name</th>
                      <th style={{ padding: '8px 12px' }}>Category / Subcategory</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center' }}>Stock</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Price (Rs)</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.map((prod, idx) => {
                      const isOut = prod.stock_quantity <= 0;
                      return (
                        <tr
                          key={prod.id}
                          onClick={() => !isOut && addToCart(prod)}
                          style={{
                            borderBottom: '1px solid #1e293b',
                            backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                            cursor: isOut ? 'not-allowed' : 'pointer',
                            opacity: isOut ? 0.5 : 1
                          }}
                        >
                          <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#60a5fa', fontSize: '11px' }}>{prod.sku}</td>
                          <td style={{ padding: '10px 12px', color: '#f8fafc', fontWeight: 'bold' }}>{prod.name}</td>
                          <td style={{ padding: '10px 12px', color: '#94a3b8', fontSize: '12px' }}>
                            {prod.category_name} {prod.subcategory_name && `(${prod.subcategory_name})`}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              backgroundColor: isOut ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)',
                              color: isOut ? '#ef4444' : '#10b981'
                            }}>
                              {prod.stock_quantity} {prod.unit}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 'bold', color: '#10b981' }}>
                            Rs {prod.selling_price.toLocaleString()}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <button
                              disabled={isOut}
                              style={{
                                padding: '4px 10px',
                                backgroundColor: isOut ? '#334155' : '#2563eb',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                cursor: isOut ? 'not-allowed' : 'pointer'
                              }}
                            >
                              {isOut ? 'Out' : '+ Add'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                  No active products match "{searchQuery}".
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Error Alert Message */}
      {errorMessage && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#ef4444', padding: '8px 14px', borderRadius: '6px', marginBottom: '8px', fontSize: '13px', fontWeight: 'bold' }}>
          {errorMessage}
        </div>
      )}

      {/* MAIN FULL-WIDTH CART TABLE SECTION */}
      <div style={{
        flex: 1,
        minHeight: 0,
        backgroundColor: '#0f172a',
        border: '1px solid #334155',
        borderRadius: '8px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        marginBottom: '12px'
      }}>
        {/* Cart Headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '40px 3fr 1.5fr 1.2fr 1.2fr 1.2fr 1.5fr 50px',
          backgroundColor: '#1e293b',
          padding: '10px 16px',
          borderBottom: '1px solid #334155',
          color: '#94a3b8',
          fontSize: '12px',
          fontWeight: 'bold',
          alignItems: 'center'
        }}>
          <div>#</div>
          <div>Item Description</div>
          <div>SKU / Model</div>
          <div style={{ textAlign: 'center' }}>Qty / Meter</div>
          <div style={{ textAlign: 'right' }}>Price / Rate (Rs)</div>
          <div style={{ textAlign: 'right' }}>Disc (Rs)</div>
          <div style={{ textAlign: 'right' }}>Total (Rs)</div>
          <div style={{ textAlign: 'center' }}>Action</div>
        </div>

        {/* Cart Rows */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {cart.length > 0 ? (
            cart.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '40px 3fr 1.5fr 1.2fr 1.2fr 1.2fr 1.5fr 50px',
                  padding: '10px 16px',
                  borderBottom: '1px solid #1e293b',
                  alignItems: 'center',
                  backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)'
                }}
              >
                <div style={{ color: '#64748b', fontSize: '12px', fontWeight: 'bold' }}>{idx + 1}</div>

                <div>
                  <div style={{ fontWeight: 'bold', color: '#f8fafc', fontSize: '13px' }}>{item.product.name}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Category: {item.product.category_name} {item.product.subcategory_name && `(${item.product.subcategory_name})`}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '11px', color: '#60a5fa', fontFamily: 'monospace', display: 'block' }}>{item.product.sku}</span>
                  <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 'bold' }}>Stock: {item.product.stock_quantity} {item.product.unit}</span>
                </div>

                {/* Quantity Input with auto-select onFocus */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <button
                    onClick={() => updateQuantity(idx, Math.max(0.1, parseFloat((item.quantity - 1).toFixed(2))))}
                    style={{ background: '#334155', border: 'none', color: '#fff', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    value={item.quantity === 0 ? '' : item.quantity}
                    onFocus={e => e.target.select()}
                    onChange={e => updateQuantity(idx, e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                    style={{
                      width: '65px',
                      padding: '5px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #475569',
                      borderRadius: '4px',
                      color: '#ffffff',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      fontSize: '13px'
                    }}
                  />
                  <button
                    onClick={() => updateQuantity(idx, parseFloat((item.quantity + 1).toFixed(2)))}
                    style={{ background: '#334155', border: 'none', color: '#fff', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                  >
                    +
                  </button>
                </div>

                {/* Unit Price with auto-select onFocus */}
                <div style={{ textAlign: 'right' }}>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={item.unit_price === 0 ? '' : item.unit_price}
                    onFocus={e => e.target.select()}
                    onChange={e => updateUnitPrice(idx, e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                    style={{
                      width: '85px',
                      padding: '5px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #475569',
                      borderRadius: '4px',
                      color: '#38bdf8',
                      fontWeight: 'bold',
                      textAlign: 'right',
                      fontSize: '13px'
                    }}
                  />
                </div>

                {/* Discount with auto-select onFocus */}
                <div style={{ textAlign: 'right' }}>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={item.discount === 0 ? '' : item.discount}
                    onFocus={e => e.target.select()}
                    onChange={e => updateDiscount(idx, e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                    style={{
                      width: '75px',
                      padding: '5px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #475569',
                      borderRadius: '4px',
                      color: '#ef4444',
                      fontWeight: 'bold',
                      textAlign: 'right',
                      fontSize: '13px'
                    }}
                  />
                </div>

                <div style={{ textAlign: 'right', fontWeight: 'bold', color: '#10b981', fontSize: '14px' }}>
                  Rs {item.line_total.toLocaleString()}
                </div>

                <div style={{ textAlign: 'center' }}>
                  <button
                    onClick={() => removeFromCart(idx)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                    title="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', padding: '40px' }}>
              <ShoppingCart size={56} style={{ marginBottom: '12px', opacity: 0.3 }} />
              <h3 style={{ color: '#f8fafc', fontSize: '16px', fontWeight: 'bold', margin: '0 0 4px 0' }}>Billing Cart is Empty</h3>
              <p style={{ fontSize: '13px', margin: 0, color: '#64748b' }}>
                Type product name, model or SKU in search bar above to add items to invoice.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM FULL-WIDTH CALCULATION & BILLING SUMMARY PANEL */}
      <div style={{
        backgroundColor: '#1e293b',
        borderRadius: '8px',
        border: '1px solid #334155',
        padding: '14px 18px',
        display: 'grid',
        gridTemplateColumns: '1fr 1.5fr 1.5fr',
        gap: '20px',
        alignItems: 'center'
      }}>
        {/* Left Stats & Clear Cart */}
        <div>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
            <div>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Total Items</span>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#f8fafc' }}>{cart.length} Types</span>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Total Quantity</span>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#38bdf8' }}>{totalQty} Units/Meters</span>
            </div>
          </div>

          {cart.length > 0 && (
            <button
              onClick={clearCart}
              style={{
                backgroundColor: 'rgba(239,68,68,0.15)',
                color: '#ef4444',
                border: '1px solid rgba(239,68,68,0.3)',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            >
              <RotateCcw size={14} /> Clear All Items
            </button>
          )}
        </div>

        {/* Center Calculations & Payment Method */}
        <div style={{ borderLeft: '1px solid #334155', borderRight: '1px solid #334155', padding: '0 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px', color: '#cbd5e1' }}>
            <span>Subtotal Amount:</span>
            <span style={{ fontWeight: 'bold', color: '#f8fafc' }}>Rs {subtotal.toLocaleString()}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#cbd5e1' }}>Overall Discount (Rs):</span>
            <input
              type="number"
              min="0"
              value={overallDiscount === 0 ? '' : overallDiscount}
              onFocus={e => e.target.select()}
              onChange={e => {
                const disc = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                setOverallDiscount(disc);
                setIsAmountPaidCustom(false);
              }}
              style={{
                width: '100px',
                padding: '4px 8px',
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '4px',
                color: '#ef4444',
                fontWeight: 'bold',
                textAlign: 'right',
                fontSize: '13px'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', width: '60px' }}>Payment:</span>
            {(['CASH', 'BANK', 'OTHER'] as PaymentMethod[]).map(m => (
              <button
                key={m}
                onClick={() => setPaymentMethod(m)}
                style={{
                  flex: 1,
                  padding: '5px 8px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  borderRadius: '4px',
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
        </div>

        {/* Right Grand Total & Checkout Modal Trigger */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div>
              <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Grand Total</span>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#10b981', lineHeight: '1.1' }}>
                Rs {grandTotal.toLocaleString()}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '2px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Amount Paid:</span>
                <button
                  type="button"
                  onClick={() => {
                    setAmountPaid(grandTotal);
                    setIsAmountPaidCustom(false);
                  }}
                  style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Exact Cash
                </button>
              </div>
              <input
                type="number"
                min="0"
                value={amountPaid === 0 ? '' : amountPaid}
                onFocus={e => e.target.select()}
                onChange={e => {
                  setAmountPaid(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0);
                  setIsAmountPaidCustom(true);
                }}
                style={{
                  width: '120px',
                  padding: '6px 8px',
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '4px',
                  color: '#f8fafc',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  textAlign: 'right'
                }}
              />
            </div>
          </div>

          {amountPaid > grandTotal && (
            <div style={{ textAlign: 'right', fontSize: '12px', color: '#10b981', fontWeight: 'bold', marginBottom: '6px' }}>
              Change to return: Rs {changeReturn.toLocaleString()}
            </div>
          )}

          <button
            onClick={openCheckoutModal}
            disabled={cart.length === 0}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: cart.length === 0 ? '#334155' : '#059669',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              fontSize: '14px',
              cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: cart.length > 0 ? '0 4px 14px rgba(5, 150, 105, 0.35)' : 'none'
            }}
          >
            <Printer size={18} /> Complete Sale & Print Invoice
          </button>
        </div>
      </div>

      {/* CHECKOUT & CUSTOMER DETAILS MODAL */}
      {showCheckoutModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#1e293b', border: '2px solid #38bdf8', borderRadius: '12px', width: '480px', padding: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 'bold', color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Printer size={20} color="#38bdf8" /> Customer Details & Invoice Printing
              </h3>
              <button onClick={() => setShowCheckoutModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {checkoutError && (
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#ef4444', padding: '10px', borderRadius: '6px', marginBottom: '14px', fontSize: '13px', fontWeight: 'bold' }}>
                {checkoutError}
              </div>
            )}

            {/* Bill Summary Card */}
            <div style={{ backgroundColor: '#0f172a', padding: '12px 16px', borderRadius: '8px', border: '1px solid #334155', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Total Bill Amount</span>
                <span style={{ fontSize: '22px', fontWeight: '900', color: '#10b981' }}>Rs {grandTotal.toLocaleString()}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Items Count</span>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#38bdf8' }}>{cart.length} Products ({totalQty} Qty)</span>
              </div>
            </div>

            <form onSubmit={handleFinalizeSaleAndPrint}>
              {/* Optional Saved Customer Selector */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Pick Existing Customer (Optional)</label>
                <select
                  value={selectedCustomerId || ''}
                  onChange={e => handleSelectCustomer(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px' }}
                >
                  <option value="">👤 Walk-in Customer (or type custom below)</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                  ))}
                </select>
              </div>

              {/* Customer Name */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Customer Name on Invoice *</label>
                <input
                  ref={checkoutCustNameRef}
                  type="text"
                  required
                  placeholder="Customer Name (e.g. Ali Raza / Walk-in)"
                  value={custName}
                  onFocus={e => e.target.select()}
                  onChange={e => setCustName(e.target.value)}
                  style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#ffffff', fontSize: '14px', fontWeight: 'bold' }}
                />
              </div>

              {/* Customer Phone */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Customer Phone Number on Invoice *</label>
                <input
                  type="text"
                  required
                  placeholder="Phone Number (e.g. 0300 1234567)"
                  value={custPhone}
                  onFocus={e => e.target.select()}
                  onChange={e => setCustPhone(e.target.value)}
                  style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#38bdf8', fontSize: '14px', fontWeight: 'bold' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: '#059669',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(5, 150, 105, 0.4)'
                  }}
                >
                  <Printer size={18} /> Confirm & Print Invoice
                </button>

                <button
                  type="button"
                  onClick={() => setShowCheckoutModal(false)}
                  style={{ padding: '12px 18px', backgroundColor: '#334155', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL CATALOG BROWSE MODAL */}
      {showFullCatalogModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', width: '850px', height: '600px', display: 'flex', flexDirection: 'column', padding: '20px', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #1e293b', paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PackageCheck size={20} color="#38bdf8" /> Full Product Inventory Catalog
              </h3>
              <button onClick={() => setShowFullCatalogModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ color: '#94a3b8', borderBottom: '1px solid #334155', textAlign: 'left', backgroundColor: '#1e293b' }}>
                    <th style={{ padding: '10px' }}>SKU</th>
                    <th style={{ padding: '10px' }}>Product Name</th>
                    <th style={{ padding: '10px' }}>Category</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>Stock</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Selling Price</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((prod, idx) => {
                    const isOut = prod.stock_quantity <= 0;
                    return (
                      <tr key={prod.id} style={{ borderBottom: '1px solid #1e293b', backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '10px', fontFamily: 'monospace', color: '#60a5fa' }}>{prod.sku}</td>
                        <td style={{ padding: '10px', color: '#f8fafc', fontWeight: 'bold' }}>{prod.name}</td>
                        <td style={{ padding: '10px', color: '#94a3b8' }}>{prod.category_name}</td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', backgroundColor: isOut ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)', color: isOut ? '#ef4444' : '#10b981' }}>
                            {prod.stock_quantity} {prod.unit}
                          </span>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#10b981' }}>Rs {prod.selling_price.toLocaleString()}</td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <button
                            disabled={isOut}
                            onClick={() => {
                              addToCart(prod);
                              setShowFullCatalogModal(false);
                            }}
                            style={{ padding: '5px 12px', backgroundColor: isOut ? '#334155' : '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', cursor: isOut ? 'not-allowed' : 'pointer' }}
                          >
                            {isOut ? 'Out of Stock' : '+ Add to Cart'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
