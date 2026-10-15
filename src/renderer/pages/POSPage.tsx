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

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('ALL');
  const [showSearchDropdown, setShowSearchDropdown] = useState<boolean>(false);
  const [showFullCatalogModal, setShowFullCatalogModal] = useState<boolean>(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);

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
      setCheckoutError('Customer Name is required for invoice');
      return;
    }

    if (!custPhone.trim()) {
      setCheckoutError('Customer Phone Number is required for invoice');
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

  // Reset highlight on query or filter change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchQuery, selectedCategory, selectedSubcategory]);

  // Auto-scroll highlighted search row into view
  useEffect(() => {
    if (showSearchDropdown && searchResults.length > 0) {
      const el = document.getElementById(`pos-search-item-${highlightedIndex}`);
      if (el) {
        el.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, showSearchDropdown]);

  // Arrow Keys Navigation in Search Input
  const handleKeyDownSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!showSearchDropdown) {
        setShowSearchDropdown(true);
      } else if (searchResults.length > 0) {
        setHighlightedIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!showSearchDropdown) {
        setShowSearchDropdown(true);
      } else if (searchResults.length > 0) {
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : searchResults.length - 1));
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (showSearchDropdown && searchResults.length > 0) {
        const item = searchResults[highlightedIndex] || searchResults[0];
        if (item) {
          addToCart(item);
        }
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setShowSearchDropdown(false);
    }
  };

  // Subcategories available for selected category filter
  const filterAvailableSubcategories = selectedCategory === 'ALL'
    ? subcategories
    : subcategories.filter(sc => sc.category_id === parseInt(selectedCategory));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', overflow: 'hidden', backgroundColor: '#f1f5f9', padding: '16px 20px', boxSizing: 'border-box' }}>
      
      {/* TOP SEARCH BAR & FILTERS */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '14px', width: '100%' }}>
        
        {/* SEARCH INPUT */}
        <div style={{ flex: 1, position: 'relative' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={18} color="#64748b" style={{ position: 'absolute', left: '14px', top: '13px', pointerEvents: 'none' }} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search product by name, model, SKU or scan barcode... (Use ↑ ↓ arrow keys & Enter)"
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
                  padding: '12px 14px 12px 42px',
                  backgroundColor: '#ffffff',
                  border: showSearchDropdown && searchQuery ? '1px solid #2563eb' : '1px solid #cbd5e1',
                  borderRadius: '8px',
                  color: '#0f172a',
                  fontSize: '14px',
                  fontWeight: '500',
                  boxSizing: 'border-box',
                  outline: 'none',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setShowSearchDropdown(false);
                    searchInputRef.current?.focus();
                  }}
                  style={{ position: 'absolute', right: '12px', top: '12px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                >
                  <X size={18} />
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
                padding: '12px 14px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                color: '#0f172a',
                fontSize: '13px',
                fontWeight: '500',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
              }}
            >
              <option value="ALL">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id.toString()}>{cat.name}</option>
              ))}
            </select>

            {/* Subcategory Filter */}
            <select
              value={selectedSubcategory}
              onChange={e => setSelectedSubcategory(e.target.value)}
              style={{
                padding: '12px 14px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                color: '#0f172a',
                fontSize: '14px',
                fontWeight: '500',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
              }}
            >
              <option value="ALL">All Subcategories</option>
              {filterAvailableSubcategories.map(sc => (
                <option key={sc.id} value={sc.id.toString()}>{sc.name}</option>
              ))}
            </select>

            {/* Catalog Trigger */}
            <button
              onClick={() => setShowFullCatalogModal(true)}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#0f172a',
                padding: '12px 18px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '600',
                whiteSpace: 'nowrap',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
              }}
            >
              <PackageCheck size={18} color="#2563eb" /> Catalog
            </button>
          </div>

          {/* LIVE SEARCH RESULTS DROPDOWN WITH ARROW KEYS SUPPORT */}
          {showSearchDropdown && searchQuery.trim().length > 0 && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              maxHeight: '400px',
              overflowY: 'auto',
              zIndex: 1000
            }}>
              <div style={{ padding: '10px 16px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', color: '#475569', fontWeight: '600' }}>
                <span>FOUND {searchResults.length} MATCHING PRODUCTS</span>
                <span style={{ color: '#64748b', fontSize: '13px' }}>
                  Use <strong style={{ color: '#0f172a' }}>↑ ↓</strong> arrow keys to select, press <strong style={{ color: '#2563eb' }}>Enter</strong> to add
                </span>
              </div>

              {searchResults.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14.5px' }}>
                  <thead>
                    <tr style={{ color: '#475569', borderBottom: '1px solid #e2e8f0', textAlign: 'left', backgroundColor: '#f1f5f9' }}>
                      <th style={{ padding: '10px 16px', fontWeight: '600', fontSize: '13.5px' }}>SKU</th>
                      <th style={{ padding: '10px 16px', fontWeight: '600', fontSize: '13.5px' }}>Product Name</th>
                      <th style={{ padding: '10px 16px', fontWeight: '600', fontSize: '13.5px' }}>Category / Subcategory</th>
                      <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: '600', fontSize: '13.5px' }}>Stock</th>
                      <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: '600', fontSize: '13.5px' }}>Price</th>
                      <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: '600', fontSize: '13.5px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.map((prod, idx) => {
                      const isOut = prod.stock_quantity <= 0;
                      const isSelected = idx === highlightedIndex;

                      return (
                        <tr
                          key={prod.id}
                          id={`pos-search-item-${idx}`}
                          onClick={() => !isOut && addToCart(prod)}
                          onMouseEnter={() => setHighlightedIndex(idx)}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            backgroundColor: isSelected
                              ? '#2563eb'
                              : idx % 2 === 0
                                ? '#ffffff'
                                : '#f8fafc',
                            cursor: isOut ? 'not-allowed' : 'pointer',
                            opacity: isOut ? 0.6 : 1,
                            transition: 'background-color 0.1s ease'
                          }}
                        >
                          <td style={{
                            padding: '12px 16px',
                            fontFamily: 'monospace',
                            color: isSelected ? '#ffffff' : '#64748b',
                            fontSize: '13.5px',
                            fontWeight: isSelected ? '600' : 'normal'
                          }}>
                            {prod.sku}
                          </td>
                          <td style={{
                            padding: '12px 16px',
                            color: isSelected ? '#ffffff' : '#0f172a',
                            fontWeight: '600',
                            fontSize: '15px'
                          }}>
                            {prod.name}
                          </td>
                          <td style={{
                            padding: '12px 16px',
                            color: isSelected ? '#e0e7ff' : '#64748b',
                            fontSize: '13.5px'
                          }}>
                            {prod.category_name} {prod.subcategory_name && `(${prod.subcategory_name})`}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <span style={{
                              padding: '3px 10px',
                              borderRadius: '4px',
                              fontSize: '13px',
                              fontWeight: '600',
                              backgroundColor: isSelected
                                ? 'rgba(255, 255, 255, 0.25)'
                                : isOut
                                  ? '#fee2e2'
                                  : '#dcfce7',
                              color: isSelected
                                ? '#ffffff'
                                : isOut
                                  ? '#dc2626'
                                  : '#15803d'
                            }}>
                              {prod.stock_quantity} {prod.unit}
                            </span>
                          </td>
                          <td style={{
                            padding: '12px 16px',
                            textAlign: 'right',
                            fontWeight: 'bold',
                            fontSize: '15.5px',
                            color: isSelected ? '#ffffff' : '#16a34a'
                          }}>
                            Rs {prod.selling_price.toLocaleString()}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <button
                              disabled={isOut}
                              style={{
                                padding: '6px 14px',
                                backgroundColor: isSelected ? '#ffffff' : (isOut ? '#e2e8f0' : '#2563eb'),
                                color: isSelected ? '#2563eb' : (isOut ? '#94a3b8' : '#ffffff'),
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '13px',
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
                <div style={{ padding: '28px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                  No active products match "{searchQuery}".
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Error Alert Message */}
      {errorMessage && (
        <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', padding: '10px 16px', borderRadius: '6px', marginBottom: '12px', fontSize: '13px', fontWeight: '600' }}>
          {errorMessage}
        </div>
      )}

      {/* MAIN FULL-WIDTH CART TABLE SECTION */}
      <div style={{
        flex: 1,
        minHeight: 0,
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        marginBottom: '14px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        {/* Cart Headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '40px 3fr 1.5fr 1.4fr 1.3fr 1.2fr 1.5fr 50px',
          backgroundColor: '#f8fafc',
          padding: '12px 18px',
          borderBottom: '1px solid #e2e8f0',
          color: '#475569',
          fontSize: '13.5px',
          fontWeight: '600',
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
                  gridTemplateColumns: '40px 3fr 1.5fr 1.4fr 1.3fr 1.2fr 1.5fr 50px',
                  padding: '12px 18px',
                  borderBottom: '1px solid #f1f5f9',
                  alignItems: 'center',
                  backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa'
                }}
              >
                <div style={{ color: '#64748b', fontSize: '13px', fontWeight: '600' }}>{idx + 1}</div>

                <div style={{ paddingRight: '12px' }}>
                  <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '15px' }}>{item.product.name}</div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                    {item.product.category_name} {item.product.subcategory_name && `(${item.product.subcategory_name})`}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '13.5px', color: '#475569', fontFamily: 'monospace', display: 'block' }}>{item.product.sku}</span>
                  <span style={{ fontSize: '12.5px', color: '#16a34a', fontWeight: '600' }}>Stock: {item.product.stock_quantity} {item.product.unit}</span>
                </div>

                {/* Quantity Input */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                  <button
                    onClick={() => updateQuantity(idx, Math.max(0.1, parseFloat((item.quantity - 1).toFixed(2))))}
                    style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#0f172a', padding: '6px 11px', borderRadius: '4px', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold' }}
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
                      width: '74px',
                      padding: '7px 8px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                      color: '#0f172a',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      fontSize: '15px'
                    }}
                  />
                  <button
                    onClick={() => updateQuantity(idx, parseFloat((item.quantity + 1).toFixed(2)))}
                    style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#0f172a', padding: '6px 11px', borderRadius: '4px', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold' }}
                  >
                    +
                  </button>
                </div>

                {/* Unit Price */}
                <div style={{ textAlign: 'right' }}>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={item.unit_price === 0 ? '' : item.unit_price}
                    onFocus={e => e.target.select()}
                    onChange={e => updateUnitPrice(idx, e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                    style={{
                      width: '100px',
                      padding: '7px 10px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                      color: '#0f172a',
                      fontWeight: 'bold',
                      textAlign: 'right',
                      fontSize: '15px'
                    }}
                  />
                </div>

                {/* Discount */}
                <div style={{ textAlign: 'right' }}>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={item.discount === 0 ? '' : item.discount}
                    onFocus={e => e.target.select()}
                    onChange={e => updateDiscount(idx, e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                    style={{
                      width: '90px',
                      padding: '7px 10px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                      color: '#dc2626',
                      fontWeight: 'bold',
                      textAlign: 'right',
                      fontSize: '15px'
                    }}
                  />
                </div>

                <div style={{ textAlign: 'right', fontWeight: 'bold', color: '#16a34a', fontSize: '15.5px' }}>
                  Rs {item.line_total.toLocaleString()}
                </div>

                <div style={{ textAlign: 'center' }}>
                  <button
                    onClick={() => removeFromCart(idx)}
                    style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '6px' }}
                    title="Remove item"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', padding: '40px' }}>
              <ShoppingCart size={56} style={{ marginBottom: '14px', opacity: 0.3 }} />
              <h3 style={{ color: '#0f172a', fontSize: '17px', fontWeight: '600', margin: '0 0 6px 0' }}>Billing Cart is Empty</h3>
              <p style={{ fontSize: '14px', margin: 0, color: '#64748b' }}>
                Type product name or model in search bar above and press Enter to add items to invoice.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM FULL-WIDTH CALCULATION & BILLING SUMMARY PANEL */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        padding: '16px 22px',
        display: 'grid',
        gridTemplateColumns: '1.1fr 1.5fr 1.4fr',
        gap: '24px',
        alignItems: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        {/* Left Stats & Clear Cart */}
        <div>
          <div style={{ display: 'flex', gap: '22px', marginBottom: '10px' }}>
            <div>
              <span style={{ fontSize: '13px', color: '#64748b', display: 'block' }}>Total Items</span>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>{cart.length} Types</span>
            </div>
            <div>
              <span style={{ fontSize: '13px', color: '#64748b', display: 'block' }}>Total Quantity</span>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#2563eb' }}>{totalQty} Units/Meters</span>
            </div>
          </div>

          {cart.length > 0 && (
            <button
              onClick={clearCart}
              style={{
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                border: '1px solid #fecaca',
                padding: '8px 14px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: '600'
              }}
            >
              <RotateCcw size={15} /> Clear All Items
            </button>
          )}
        </div>

        {/* Center Calculations & Payment Method */}
        <div style={{ borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', padding: '0 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14.5px', color: '#475569' }}>
            <span>Subtotal Amount:</span>
            <span style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '16px' }}>Rs {subtotal.toLocaleString()}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '14px', color: '#475569' }}>Overall Discount (Rs):</span>
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
                width: '115px',
                padding: '7px 10px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                color: '#dc2626',
                fontWeight: 'bold',
                textAlign: 'right',
                fontSize: '15px'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#64748b', width: '65px' }}>Payment:</span>
            {(['CASH', 'BANK', 'OTHER'] as PaymentMethod[]).map(m => (
              <button
                key={m}
                onClick={() => setPaymentMethod(m)}
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  fontSize: '13px',
                  fontWeight: '600',
                  borderRadius: '4px',
                  border: paymentMethod === m ? '1px solid #2563eb' : '1px solid #cbd5e1',
                  backgroundColor: paymentMethod === m ? '#2563eb' : '#f1f5f9',
                  color: paymentMethod === m ? '#ffffff' : '#334155',
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div>
              <span style={{ fontSize: '13px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Grand Total</span>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#16a34a', lineHeight: '1.1' }}>
                Rs {grandTotal.toLocaleString()}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '4px' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Amount Paid:</span>
                <button
                  type="button"
                  onClick={() => {
                    setAmountPaid(grandTotal);
                    setIsAmountPaidCustom(false);
                  }}
                  style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '13px', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}
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
                  width: '135px',
                  padding: '7px 10px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  color: '#0f172a',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  textAlign: 'right'
                }}
              />
            </div>
          </div>

          {amountPaid > grandTotal && (
            <div style={{ textAlign: 'right', fontSize: '14px', color: '#16a34a', fontWeight: '600', marginBottom: '8px' }}>
              Change to return: Rs {changeReturn.toLocaleString()}
            </div>
          )}

          <button
            onClick={openCheckoutModal}
            disabled={cart.length === 0}
            style={{
              width: '100%',
              padding: '13px',
              backgroundColor: cart.length === 0 ? '#94a3b8' : '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              fontSize: '15.5px',
              cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Printer size={20} /> Complete Sale & Print Invoice
          </button>
        </div>
      </div>

      {/* CHECKOUT & CUSTOMER DETAILS MODAL */}
      {showCheckoutModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', width: '520px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 'bold', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Printer size={20} color="#2563eb" /> Customer Details & Invoice Printing
              </h3>
              <button onClick={() => setShowCheckoutModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {checkoutError && (
              <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', padding: '10px 14px', borderRadius: '6px', marginBottom: '14px', fontSize: '14px', fontWeight: 'bold' }}>
                {checkoutError}
              </div>
            )}

            {/* Bill Summary Card */}
            <div style={{ backgroundColor: '#f8fafc', padding: '16px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '13px', color: '#64748b', display: 'block', fontWeight: '500' }}>Total Bill Amount</span>
                <span style={{ fontSize: '26px', fontWeight: '800', color: '#16a34a' }}>Rs {grandTotal.toLocaleString()}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '13px', color: '#64748b', display: 'block', fontWeight: '500' }}>Items Count</span>
                <span style={{ fontSize: '15px', fontWeight: '600', color: '#2563eb' }}>{cart.length} Products ({totalQty} Qty)</span>
              </div>
            </div>

            <form onSubmit={handleFinalizeSaleAndPrint}>
              {/* Optional Saved Customer Selector */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13.5px', color: '#334155', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Pick Existing Customer (Optional)</label>
                <select
                  value={selectedCustomerId || ''}
                  onChange={e => handleSelectCustomer(e.target.value)}
                  style={{ width: '100%', padding: '11px 12px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a', fontSize: '14.5px' }}
                >
                  <option value="">Walk-in Customer (or type custom below)</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                  ))}
                </select>
              </div>

              {/* Customer Name */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13.5px', color: '#334155', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Customer Name on Invoice *</label>
                <input
                  ref={checkoutCustNameRef}
                  type="text"
                  required
                  placeholder="Customer Name (e.g. Ali Raza / Walk-in)"
                  value={custName}
                  onFocus={e => e.target.select()}
                  onChange={e => setCustName(e.target.value)}
                  style={{ width: '100%', padding: '11px 12px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a', fontSize: '15px', fontWeight: '600', boxSizing: 'border-box' }}
                />
              </div>

              {/* Customer Phone */}
              <div style={{ marginBottom: '22px' }}>
                <label style={{ fontSize: '13.5px', color: '#334155', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Customer Phone Number on Invoice *</label>
                <input
                  type="text"
                  required
                  placeholder="Phone Number (e.g. 0300 1234567)"
                  value={custPhone}
                  onFocus={e => e.target.select()}
                  onChange={e => setCustPhone(e.target.value)}
                  style={{ width: '100%', padding: '11px 12px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a', fontSize: '15px', fontWeight: '600', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '13px',
                    backgroundColor: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '600',
                    fontSize: '15px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Printer size={18} /> Confirm & Print Invoice
                </button>

                <button
                  type="button"
                  onClick={() => setShowCheckoutModal(false)}
                  style={{ padding: '13px 20px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '14.5px' }}
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
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', width: '900px', height: '620px', display: 'flex', flexDirection: 'column', padding: '22px', boxSizing: 'border-box', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 'bold', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PackageCheck size={22} color="#2563eb" /> Full Product Inventory Catalog
              </h3>
              <button onClick={() => setShowFullCatalogModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ color: '#475569', borderBottom: '1px solid #e2e8f0', textAlign: 'left', backgroundColor: '#f8fafc' }}>
                    <th style={{ padding: '12px 16px', fontWeight: '600', fontSize: '13.5px' }}>SKU</th>
                    <th style={{ padding: '12px 16px', fontWeight: '600', fontSize: '13.5px' }}>Product Name</th>
                    <th style={{ padding: '12px 16px', fontWeight: '600', fontSize: '13.5px' }}>Category</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', fontSize: '13.5px' }}>Stock</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', fontSize: '13.5px' }}>Selling Price</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', fontSize: '13.5px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((prod, idx) => {
                    const isOut = prod.stock_quantity <= 0;
                    return (
                      <tr key={prod.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                        <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#64748b', fontSize: '13.5px' }}>{prod.sku}</td>
                        <td style={{ padding: '12px 16px', color: '#0f172a', fontWeight: '600', fontSize: '15px' }}>{prod.name}</td>
                        <td style={{ padding: '12px 16px', color: '#475569', fontSize: '13.5px' }}>{prod.category_name}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{ padding: '3px 10px', borderRadius: '4px', fontSize: '12.5px', fontWeight: 'bold', backgroundColor: isOut ? '#fee2e2' : '#dcfce7', color: isOut ? '#dc2626' : '#15803d' }}>
                            {prod.stock_quantity} {prod.unit}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 'bold', color: '#16a34a', fontSize: '15.5px' }}>Rs {prod.selling_price.toLocaleString()}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <button
                            disabled={isOut}
                            onClick={() => {
                              addToCart(prod);
                              setShowFullCatalogModal(false);
                            }}
                            style={{ padding: '7px 14px', backgroundColor: isOut ? '#e2e8f0' : '#2563eb', color: isOut ? '#94a3b8' : '#fff', border: 'none', borderRadius: '5px', fontSize: '13px', fontWeight: 'bold', cursor: isOut ? 'not-allowed' : 'pointer' }}
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
