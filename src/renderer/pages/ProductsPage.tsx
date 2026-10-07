import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Edit3, 
  AlertCircle, 
  ArrowUpDown,
  X,
  Boxes,
  Trash2
} from 'lucide-react';
import { Product, Category, Subcategory, User } from '../../shared/types';

interface ProductsPageProps {
  currentUser: User | null;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({ currentUser }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('ALL');
  const [lowStockOnly, setLowStockOnly] = useState<boolean>(false);

  // Modals
  const [showProductModal, setShowProductModal] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);
  const [showStockModal, setShowStockModal] = useState<boolean>(false);
  const [stockAdjustProd, setStockAdjustProd] = useState<Product | null>(null);
  const [stockAddQty, setStockAddQty] = useState<number>(0);
  const [stockNote, setStockNote] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Management Modal Active Tab ('SUBCATEGORIES' | 'CATEGORIES')
  const [mgmtTab, setMgmtTab] = useState<'SUBCATEGORIES' | 'CATEGORIES'>('SUBCATEGORIES');

  // Add / Edit Category State
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catNameInput, setCatNameInput] = useState<string>('');

  // Add / Edit Subcategory State
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [subCatParentIdInput, setSubCatParentIdInput] = useState<number>(1);
  const [subCatNameInput, setSubCatNameInput] = useState<string>('');

  // Product Form State
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category_id: 1,
    subcategory_id: null as number | null,
    purchase_price: 0,
    selling_price: 0,
    stock_quantity: 0,
    minimum_stock: 5,
    unit: 'pcs',
    description: '',
    active: true
  });

  const loadData = async () => {
    try {
      if (window.api) {
        const prods = await window.api.getProducts();
        const cats = await window.api.getCategories();
        const subcats = await window.api.getSubcategories();

        setProducts(prods || []);
        setCategories(cats || []);
        setSubcategories(subcats || []);

        if (cats && cats.length > 0 && !formData.category_id) {
          setFormData(prev => ({ ...prev, category_id: cats[0].id }));
          setSubCatParentIdInput(cats[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    const defaultCatId = categories.length > 0 ? categories[0].id : 1;

    setFormData({
      sku: `PRD-${Math.floor(10000 + Math.random() * 90000)}`,
      name: '',
      category_id: defaultCatId,
      subcategory_id: null,
      purchase_price: 0,
      selling_price: 0,
      stock_quantity: 0,
      minimum_stock: 5,
      unit: 'pcs',
      description: '',
      active: true
    });
    setErrorMessage('');
    setShowProductModal(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setFormData({
      sku: prod.sku,
      name: prod.name,
      category_id: prod.category_id,
      subcategory_id: prod.subcategory_id || null,
      purchase_price: prod.purchase_price,
      selling_price: prod.selling_price,
      stock_quantity: prod.stock_quantity,
      minimum_stock: prod.minimum_stock,
      unit: prod.unit || 'pcs',
      description: prod.description || '',
      active: prod.active
    });
    setErrorMessage('');
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.sku.trim()) {
      setErrorMessage('Product Name and SKU are required');
      return;
    }

    try {
      if (editingProduct) {
        const res = await window.api.updateProduct(editingProduct.id, formData);
        if (!res.success) {
          setErrorMessage(res.error || 'Failed to update product');
          return;
        }
      } else {
        const res = await window.api.addProduct(formData);
        if (!res.success) {
          setErrorMessage(res.error || 'Failed to add product');
          return;
        }
      }
      setShowProductModal(false);
      loadData();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  // Category Add / Edit / Delete
  const handleSaveCategory = async () => {
    if (!catNameInput.trim()) return;
    if (editingCategory) {
      const res = await window.api.updateCategory(editingCategory.id, catNameInput.trim());
      if (res.success) {
        setEditingCategory(null);
        setCatNameInput('');
        loadData();
      } else {
        alert(res.error || 'Failed to update category');
      }
    } else {
      const res = await window.api.addCategory(catNameInput.trim());
      if (res.success) {
        setCatNameInput('');
        loadData();
      } else {
        alert(res.error || 'Failed to add category');
      }
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    const res = await window.api.deleteCategory(id);
    if (res.success) {
      loadData();
    } else {
      alert(res.error || 'Failed to delete category');
    }
  };

  // Subcategory Add / Edit / Delete
  const handleSaveSubcategory = async () => {
    if (!subCatNameInput.trim() || !subCatParentIdInput) return;
    if (editingSubcategory) {
      const res = await window.api.updateSubcategory(editingSubcategory.id, subCatParentIdInput, subCatNameInput.trim());
      if (res.success) {
        setEditingSubcategory(null);
        setSubCatNameInput('');
        loadData();
      } else {
        alert(res.error || 'Failed to update subcategory');
      }
    } else {
      const res = await window.api.addSubcategory(subCatParentIdInput, subCatNameInput.trim());
      if (res.success) {
        setSubCatNameInput('');
        loadData();
      } else {
        alert(res.error || 'Failed to add subcategory');
      }
    }
  };

  const handleDeleteSubcategory = async (id: number) => {
    if (!confirm('Are you sure you want to delete this subcategory?')) return;
    const res = await window.api.deleteSubcategory(id);
    if (res.success) {
      loadData();
    } else {
      alert(res.error || 'Failed to delete subcategory');
    }
  };

  // Stock Adjustment
  const handleAdjustStock = async () => {
    if (!stockAdjustProd || stockAddQty === 0) return;
    try {
      const res = await window.api.adjustStock(
        stockAdjustProd.id,
        stockAddQty,
        stockNote || 'Manual Stock Adjustment',
        currentUser ? currentUser.id : 1
      );
      if (res.success) {
        setShowStockModal(false);
        setStockAdjustProd(null);
        setStockAddQty(0);
        setStockNote('');
        loadData();
      } else {
        alert(res.error || 'Stock adjustment failed');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Product Delete
  const handleDeleteProduct = async (prod: Product) => {
    if (window.confirm(`Are you sure you want to delete product "${prod.name}" (SKU: ${prod.sku})? This action cannot be undone.`)) {
      try {
        const res = await window.api.deleteProduct(prod.id);
        if (res.success) {
          loadData();
        } else {
          alert(res.error || 'Failed to delete product');
        }
      } catch (err: any) {
        alert(err.message || 'Error deleting product');
      }
    }
  };

  // Filtered Subcategories based on chosen Category in Form or Filter
  const formFilteredSubcategories = subcategories.filter(sc => sc.category_id === formData.category_id);
  const filterAvailableSubcategories = selectedCategory === 'ALL'
    ? subcategories
    : subcategories.filter(sc => sc.category_id === parseInt(selectedCategory));

  // Product List Filtering
  const filteredProducts = products.filter(p => {
    const matchesQuery = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCat = selectedCategory === 'ALL' || p.category_id === parseInt(selectedCategory);
    const matchesSubCat = selectedSubcategory === 'ALL' || (p.subcategory_id && p.subcategory_id === parseInt(selectedSubcategory));
    const matchesLowStock = !lowStockOnly || p.stock_quantity <= p.minimum_stock;

    return matchesQuery && matchesCat && matchesSubCat && matchesLowStock;
  });

  const profitMarginPercent = formData.purchase_price > 0 && formData.selling_price > 0
    ? (((formData.selling_price - formData.purchase_price) / formData.purchase_price) * 100).toFixed(1)
    : '0';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', padding: '20px', boxSizing: 'border-box', backgroundColor: '#0f172a', overflowY: 'auto' }}>
      
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package color="#38bdf8" /> Product & Inventory Management
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0 0' }}>
            Manage stock catalog, subcategories, cost prices, and stock movements.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowCategoryModal(true)}
            style={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              color: '#38bdf8',
              padding: '10px 16px',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Boxes size={16} /> Manage Categories & Subcategories
          </button>

          <button
            onClick={openAddModal}
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Plus size={18} /> Add New Product
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div style={{ backgroundColor: '#1e293b', padding: '14px', borderRadius: '10px', border: '1px solid #334155', marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ flex: 2, minWidth: '220px', position: 'relative' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
          <input
            type="text"
            placeholder="Search by SKU, product name, model..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px 8px 34px',
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#f8fafc',
              fontSize: '13px'
            }}
          />
        </div>

        {/* Parent Category Filter */}
        <div style={{ flex: 1, minWidth: '150px' }}>
          <select
            value={selectedCategory}
            onChange={e => {
              setSelectedCategory(e.target.value);
              setSelectedSubcategory('ALL');
            }}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#f8fafc',
              fontSize: '13px'
            }}
          >
            <option value="ALL">📁 All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id.toString()}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Subcategory Filter */}
        <div style={{ flex: 1, minWidth: '160px' }}>
          <select
            value={selectedSubcategory}
            onChange={e => setSelectedSubcategory(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#f8fafc',
              fontSize: '13px'
            }}
          >
            <option value="ALL">📂 All Subcategories</option>
            {filterAvailableSubcategories.map(sc => (
              <option key={sc.id} value={sc.id.toString()}>{sc.name}</option>
            ))}
          </select>
        </div>

        {/* Low Stock Toggle */}
        <button
          onClick={() => setLowStockOnly(!lowStockOnly)}
          style={{
            padding: '8px 14px',
            borderRadius: '6px',
            border: lowStockOnly ? '1px solid #ef4444' : '1px solid #334155',
            backgroundColor: lowStockOnly ? 'rgba(239, 68, 68, 0.15)' : '#0f172a',
            color: lowStockOnly ? '#ef4444' : '#94a3b8',
            fontWeight: 'bold',
            fontSize: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <AlertCircle size={14} /> Low Stock Only
        </button>
      </div>

      {/* PRODUCTS TABLE */}
      <div style={{ backgroundColor: '#1e293b', borderRadius: '10px', border: '1px solid #334155', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#0f172a', color: '#94a3b8', borderBottom: '1px solid #334155' }}>
              <th style={{ padding: '12px' }}>SKU</th>
              <th style={{ padding: '12px' }}>Product Name</th>
              <th style={{ padding: '12px' }}>Category & Subcategory</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Cost Price</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Sell Price</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Stock</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((p, idx) => {
                const isLow = p.stock_quantity <= p.minimum_stock;
                const isOut = p.stock_quantity <= 0;

                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #334155', backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)' }}>
                    <td style={{ padding: '12px', fontFamily: 'monospace', color: '#60a5fa', fontWeight: 'bold' }}>{p.sku}</td>
                    <td style={{ padding: '12px', color: '#f8fafc', fontWeight: 'bold' }}>
                      {p.name}
                      {p.description && <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'normal' }}>{p.description}</div>}
                    </td>
                    <td style={{ padding: '12px', color: '#cbd5e1' }}>
                      <span style={{ fontWeight: 'bold' }}>{p.category_name}</span>
                      {p.subcategory_name && <span style={{ fontSize: '11px', color: '#38bdf8', display: 'block' }}>↳ {p.subcategory_name}</span>}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#94a3b8' }}>Rs {p.purchase_price.toLocaleString()}</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#10b981', fontWeight: 'bold' }}>Rs {p.selling_price.toLocaleString()}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        backgroundColor: isOut ? 'rgba(239, 68, 68, 0.2)' : isLow ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                        color: isOut ? '#ef4444' : isLow ? '#f59e0b' : '#10b981'
                      }}>
                        {p.stock_quantity} {p.unit}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button
                          onClick={() => {
                            setStockAdjustProd(p);
                            setStockAddQty(0);
                            setStockNote('');
                            setShowStockModal(true);
                          }}
                          style={{ backgroundColor: '#334155', color: '#38bdf8', border: 'none', padding: '5px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                          title="Adjust Stock"
                        >
                          <ArrowUpDown size={12} /> Stock
                        </button>

                        <button
                          onClick={() => openEditModal(p)}
                          style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Edit3 size={12} /> Edit
                        </button>

                        <button
                          onClick={() => handleDeleteProduct(p)}
                          style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                          title="Delete Product"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                  No products found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ADD / EDIT PRODUCT MODAL */}
      {showProductModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', width: '650px', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#f8fafc', margin: 0 }}>
                {editingProduct ? '✏️ Edit Product' : '➕ Add New Product'}
              </h3>
              <button onClick={() => setShowProductModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {errorMessage && (
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#ef4444', padding: '10px', borderRadius: '6px', marginBottom: '14px', fontSize: '12px' }}>
                ⚠️ {errorMessage}
              </div>
            )}

            <form onSubmit={handleSaveProduct}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Product SKU / Barcode *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={e => setFormData({ ...formData, sku: e.target.value })}
                    style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px', fontFamily: 'monospace' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Product Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HDMI Cable 5 Meter 4K Braided"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px' }}
                  />
                </div>
              </div>

              {/* Category & Subcategory Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                {/* Category */}
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Parent Category *</label>
                  <select
                    value={formData.category_id}
                    onChange={e => {
                      const newCatId = parseInt(e.target.value);
                      setFormData({ ...formData, category_id: newCatId, subcategory_id: null });
                    }}
                    style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px' }}
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Subcategory */}
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Subcategory (Type)</label>
                  <select
                    value={formData.subcategory_id || ''}
                    onChange={e => setFormData({ ...formData, subcategory_id: e.target.value ? parseInt(e.target.value) : null })}
                    style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#38bdf8', fontSize: '13px' }}
                  >
                    <option value="">-- None / General --</option>
                    {formFilteredSubcategories.map(sc => (
                      <option key={sc.id} value={sc.id}>{sc.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Prices & Stock Row with onFocus select */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Purchase Cost (Rs)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.purchase_price === 0 ? '' : formData.purchase_price}
                    onFocus={e => e.target.select()}
                    onChange={e => setFormData({ ...formData, purchase_price: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Selling Price (Rs) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.selling_price === 0 ? '' : formData.selling_price}
                    onFocus={e => e.target.select()}
                    onChange={e => setFormData({ ...formData, selling_price: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#10b981', fontWeight: 'bold', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Initial Stock</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    disabled={!!editingProduct}
                    value={formData.stock_quantity === 0 ? '' : formData.stock_quantity}
                    onFocus={e => e.target.select()}
                    onChange={e => setFormData({ ...formData, stock_quantity: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '8px', backgroundColor: editingProduct ? '#334155' : '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Unit Type</label>
                  <select
                    value={formData.unit}
                    onChange={e => setFormData({ ...formData, unit: e.target.value })}
                    style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px' }}
                  >
                    <option value="pcs">pcs (Pieces)</option>
                    <option value="meter">meter (Length/Meters)</option>
                    <option value="Roll">Roll (Cable Roll)</option>
                    <option value="Box">Box</option>
                    <option value="Set">Set</option>
                  </select>
                </div>
              </div>

              {/* Profit Margin Info Badge */}
              <div style={{ backgroundColor: '#0f172a', padding: '8px 12px', borderRadius: '6px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8' }}>
                <span>Calculated Profit per Unit: <strong style={{ color: '#10b981' }}>Rs {(formData.selling_price - formData.purchase_price).toLocaleString()}</strong></span>
                <span>Margin: <strong style={{ color: '#38bdf8' }}>{profitMarginPercent}%</strong></span>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Product Description / Specification (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Copper braided, 4K 60Hz supported, 1 year warranty"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" style={{ flex: 1, padding: '10px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
                <button type="button" onClick={() => setShowProductModal(false)} style={{ padding: '10px 16px', backgroundColor: '#334155', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE CATEGORIES & SUBCATEGORIES MODAL (WITH EDIT / UPDATE FEATURE) */}
      {showCategoryModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', width: '750px', height: '580px', display: 'flex', flexDirection: 'column', padding: '20px', boxSizing: 'border-box' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #1e293b', paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Boxes size={20} color="#38bdf8" /> Category & Subcategory Management
              </h3>
              <button onClick={() => setShowCategoryModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Sub-tabs Header */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', borderBottom: '1px solid #334155', paddingBottom: '8px' }}>
              <button
                onClick={() => setMgmtTab('SUBCATEGORIES')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: mgmtTab === 'SUBCATEGORIES' ? '#2563eb' : '#1e293b',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                📂 Subcategories ({subcategories.length})
              </button>
              <button
                onClick={() => setMgmtTab('CATEGORIES')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: mgmtTab === 'CATEGORIES' ? '#2563eb' : '#1e293b',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                📁 Parent Categories ({categories.length})
              </button>
            </div>

            {/* TAB CONTENT: SUBCATEGORIES */}
            {mgmtTab === 'SUBCATEGORIES' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                {/* Add / Edit Subcategory Bar */}
                <div style={{ backgroundColor: '#1e293b', padding: '12px', borderRadius: '8px', border: '1px solid #334155', marginBottom: '14px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <select
                    value={subCatParentIdInput}
                    onChange={e => setSubCatParentIdInput(parseInt(e.target.value))}
                    style={{ padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '12px', width: '180px' }}
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder="Subcategory name (e.g. HDMI 4K, Wireless Mouse, etc.)"
                    value={subCatNameInput}
                    onChange={e => setSubCatNameInput(e.target.value)}
                    style={{ flex: 1, padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px' }}
                  />

                  <button
                    onClick={handleSaveSubcategory}
                    style={{ padding: '8px 16px', backgroundColor: editingSubcategory ? '#2563eb' : '#059669', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    {editingSubcategory ? 'Update Subcategory' : '+ Add Subcategory'}
                  </button>

                  {editingSubcategory && (
                    <button
                      onClick={() => {
                        setEditingSubcategory(null);
                        setSubCatNameInput('');
                      }}
                      style={{ padding: '8px 12px', backgroundColor: '#334155', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  )}
                </div>

                {/* Subcategories List */}
                <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #334155', borderRadius: '8px', backgroundColor: '#1e293b' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#0f172a', color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                        <th style={{ padding: '10px' }}>Parent Category</th>
                        <th style={{ padding: '10px' }}>Subcategory Name</th>
                        <th style={{ padding: '10px', textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subcategories.map((sc, idx) => (
                        <tr key={sc.id} style={{ borderBottom: '1px solid #334155', backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                          <td style={{ padding: '10px', color: '#f8fafc', fontWeight: 'bold' }}>{sc.category_name}</td>
                          <td style={{ padding: '10px', color: '#38bdf8' }}>{sc.name}</td>
                          <td style={{ padding: '10px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                              <button
                                onClick={() => {
                                  setEditingSubcategory(sc);
                                  setSubCatParentIdInput(sc.category_id);
                                  setSubCatNameInput(sc.name);
                                }}
                                style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer' }}
                                title="Edit / Update Subcategory"
                              >
                                <Edit3 size={15} />
                              </button>
                              <button onClick={() => handleDeleteSubcategory(sc.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }} title="Delete Subcategory">
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB CONTENT: PARENT CATEGORIES */}
            {mgmtTab === 'CATEGORIES' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                {/* Add / Edit Category Bar */}
                <div style={{ backgroundColor: '#1e293b', padding: '12px', borderRadius: '8px', border: '1px solid #334155', marginBottom: '14px', display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    placeholder="Category Name (e.g. Cable, Mouse, Camera...)"
                    value={catNameInput}
                    onChange={e => setCatNameInput(e.target.value)}
                    style={{ flex: 1, padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px' }}
                  />

                  <button
                    onClick={handleSaveCategory}
                    style={{ padding: '8px 16px', backgroundColor: editingCategory ? '#2563eb' : '#059669', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
                  >
                    {editingCategory ? 'Update Category' : '+ Add Category'}
                  </button>

                  {editingCategory && (
                    <button
                      onClick={() => {
                        setEditingCategory(null);
                        setCatNameInput('');
                      }}
                      style={{ padding: '8px 12px', backgroundColor: '#334155', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  )}
                </div>

                {/* Categories List */}
                <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #334155', borderRadius: '8px', backgroundColor: '#1e293b' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#0f172a', color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                        <th style={{ padding: '10px' }}>ID</th>
                        <th style={{ padding: '10px' }}>Category Name</th>
                        <th style={{ padding: '10px', textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((cat, idx) => (
                        <tr key={cat.id} style={{ borderBottom: '1px solid #334155', backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                          <td style={{ padding: '10px', color: '#94a3b8' }}>#{cat.id}</td>
                          <td style={{ padding: '10px', color: '#f8fafc', fontWeight: 'bold' }}>{cat.name}</td>
                          <td style={{ padding: '10px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                              <button
                                onClick={() => {
                                  setEditingCategory(cat);
                                  setCatNameInput(cat.name);
                                }}
                                style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer' }}
                                title="Edit / Rename Category"
                              >
                                <Edit3 size={15} />
                              </button>
                              <button onClick={() => handleDeleteCategory(cat.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }} title="Delete Category">
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STOCK ADJUSTMENT MODAL */}
      {showStockModal && stockAdjustProd && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', width: '420px', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#f8fafc', marginBottom: '8px' }}>Adjust Stock Level</h3>
            <p style={{ fontSize: '13px', color: '#38bdf8', marginBottom: '16px', fontWeight: 'bold' }}>
              Product: {stockAdjustProd.name} (Current: {stockAdjustProd.stock_quantity} {stockAdjustProd.unit})
            </p>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Quantity to Add / Subtract</label>
              <input
                type="number"
                step="any"
                value={stockAddQty === 0 ? '' : stockAddQty}
                onFocus={e => e.target.select()}
                onChange={e => setStockAddQty(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                placeholder="Use +10 to add stock, -5 to subtract"
                style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '14px', fontWeight: 'bold' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Adjustment Note / Reference</label>
              <input
                type="text"
                value={stockNote}
                onChange={e => setStockNote(e.target.value)}
                placeholder="e.g. New stock received"
                style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleAdjustStock} style={{ flex: 1, padding: '10px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                Confirm Stock Change
              </button>
              <button onClick={() => setShowStockModal(false)} style={{ padding: '10px 16px', backgroundColor: '#334155', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
