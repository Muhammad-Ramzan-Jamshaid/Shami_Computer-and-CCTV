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
  Trash2,
  ChevronLeft,
  ChevronRight,
  Check
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

  // Pagination / Page Size View
  const [pageSize, setPageSize] = useState<number | 'ALL'>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);

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

  // Add Category State
  const [catNameInput, setCatNameInput] = useState<string>('');
  // Inline Edit Category State
  const [editingCatId, setEditingCatId] = useState<number | null>(null);
  const [inlineCatName, setInlineCatName] = useState<string>('');

  // Add Subcategory State
  const [subCatParentIdInput, setSubCatParentIdInput] = useState<number>(1);
  const [subCatNameInput, setSubCatNameInput] = useState<string>('');
  // Inline Edit Subcategory State
  const [editingSubCatId, setEditingSubCatId] = useState<number | null>(null);
  const [inlineSubCatParentId, setInlineSubCatParentId] = useState<number>(1);
  const [inlineSubCatName, setInlineSubCatName] = useState<string>('');

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

  // Add Category
  const handleAddCategory = async () => {
    if (!catNameInput.trim()) return;
    try {
      const res = await window.api.addCategory(catNameInput.trim());
      if (res.success) {
        setCatNameInput('');
        loadData();
      } else {
        alert(res.error || 'Failed to add category');
      }
    } catch (err: any) {
      alert(err.message || 'Error adding category');
    }
  };

  // Start Inline Edit Category
  const startEditCategory = (cat: Category) => {
    setEditingCatId(cat.id);
    setInlineCatName(cat.name);
  };

  const cancelEditCategory = () => {
    setEditingCatId(null);
    setInlineCatName('');
  };

  const handleSaveInlineCategory = async () => {
    if (!inlineCatName.trim() || !editingCatId) return;
    try {
      const res = await window.api.updateCategory(editingCatId, inlineCatName.trim());
      if (res.success) {
        setEditingCatId(null);
        setInlineCatName('');
        loadData();
      } else {
        alert(res.error || 'Failed to update category');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating category');
    }
  };

  // Delete Category
  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      const res = await window.api.deleteCategory(id);
      if (res.success) {
        loadData();
      } else {
        alert(res.error || 'Failed to delete category');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting category');
    }
  };

  // Add Subcategory
  const handleAddSubcategory = async () => {
    if (!subCatNameInput.trim() || !subCatParentIdInput) return;
    try {
      const res = await window.api.addSubcategory(subCatParentIdInput, subCatNameInput.trim());
      if (res.success) {
        setSubCatNameInput('');
        loadData();
      } else {
        alert(res.error || 'Failed to add subcategory');
      }
    } catch (err: any) {
      alert(err.message || 'Error adding subcategory');
    }
  };

  // Start Inline Edit Subcategory
  const startEditSubcategory = (sc: Subcategory) => {
    setEditingSubCatId(sc.id);
    setInlineSubCatParentId(sc.category_id);
    setInlineSubCatName(sc.name);
  };

  const cancelEditSubcategory = () => {
    setEditingSubCatId(null);
    setInlineSubCatName('');
  };

  const handleSaveInlineSubcategory = async () => {
    if (!inlineSubCatName.trim() || !inlineSubCatParentId || !editingSubCatId) return;
    try {
      const res = await window.api.updateSubcategory(editingSubCatId, inlineSubCatParentId, inlineSubCatName.trim());
      if (res.success) {
        setEditingSubCatId(null);
        setInlineSubCatName('');
        loadData();
      } else {
        alert(res.error || 'Failed to update subcategory');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating subcategory');
    }
  };

  // Delete Subcategory
  const handleDeleteSubcategory = async (id: number) => {
    if (!confirm('Are you sure you want to delete this subcategory?')) return;
    try {
      const res = await window.api.deleteSubcategory(id);
      if (res.success) {
        loadData();
      } else {
        alert(res.error || 'Failed to delete subcategory');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting subcategory');
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

  // Pagination calculation
  const totalItems = filteredProducts.length;
  const totalPages = pageSize === 'ALL' ? 1 : Math.ceil(totalItems / (pageSize as number)) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages) || 1;

  const displayedProducts = pageSize === 'ALL'
    ? filteredProducts
    : filteredProducts.slice((safeCurrentPage - 1) * (pageSize as number), safeCurrentPage * (pageSize as number));

  const profitMarginPercent = formData.purchase_price > 0 && formData.selling_price > 0
    ? (((formData.selling_price - formData.purchase_price) / formData.purchase_price) * 100).toFixed(1)
    : '0';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', padding: '16px 20px', boxSizing: 'border-box', backgroundColor: '#f1f5f9', overflow: 'hidden' }}>

      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={24} color="#2563eb" /> Products & Inventory Management
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>
            Manage catalog, categories, pricing and stock levels.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowCategoryModal(true)}
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#1e293b',
              padding: '10px 16px',
              borderRadius: '6px',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <Boxes size={18} color="#64748b" /> Manage Categories & Subcategories
          </button>

          <button
            onClick={openAddModal}
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '6px',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 1px 2px rgba(37,99,235,0.2)'
            }}
          >
            <Plus size={18} /> Add Product
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div style={{ backgroundColor: '#ffffff', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '14px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        {/* Search */}
        <div style={{ flex: 2, minWidth: '240px', position: 'relative' }}>
          <Search size={17} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '11px' }} />
          <input
            type="text"
            placeholder="Search by SKU, product name, model..."
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              width: '100%',
              padding: '9px 12px 9px 38px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              color: '#0f172a',
              fontSize: '14.5px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Parent Category Filter */}
        <div style={{ flex: 1, minWidth: '160px' }}>
          <select
            value={selectedCategory}
            onChange={e => {
              setSelectedCategory(e.target.value);
              setSelectedSubcategory('ALL');
              setCurrentPage(1);
            }}
            style={{
              width: '100%',
              padding: '9px 12px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              color: '#0f172a',
              fontSize: '14px'
            }}
          >
            <option value="ALL">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id.toString()}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Subcategory Filter */}
        <div style={{ flex: 1, minWidth: '170px' }}>
          <select
            value={selectedSubcategory}
            onChange={e => {
              setSelectedSubcategory(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              width: '100%',
              padding: '9px 12px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              color: '#0f172a',
              fontSize: '14px'
            }}
          >
            <option value="ALL">All Subcategories</option>
            {filterAvailableSubcategories.map(sc => (
              <option key={sc.id} value={sc.id.toString()}>{sc.name}</option>
            ))}
          </select>
        </div>

        {/* Low Stock Toggle */}
        <button
          onClick={() => {
            setLowStockOnly(!lowStockOnly);
            setCurrentPage(1);
          }}
          style={{
            padding: '9px 14px',
            borderRadius: '6px',
            border: lowStockOnly ? '1px solid #ef4444' : '1px solid #cbd5e1',
            backgroundColor: lowStockOnly ? '#fee2e2' : '#ffffff',
            color: lowStockOnly ? '#b91c1c' : '#475569',
            fontWeight: '600',
            fontSize: '13.5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <AlertCircle size={15} /> Low Stock Only
        </button>

        {/* Total Count Badge */}
        <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '8px 14px', borderRadius: '6px', fontSize: '13.5px', color: '#64748b', fontWeight: '500' }}>
          Total: <strong style={{ color: '#0f172a' }}>{filteredProducts.length}</strong>
        </div>
      </div>

      {/* PRODUCTS TABLE CONTAINER WITH SCROLL */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>

        {/* Scrollable Table Area */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 5, backgroundColor: '#f8fafc' }}>
              <tr style={{ color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px', fontWeight: '600', fontSize: '13.5px' }}>SKU</th>
                <th style={{ padding: '12px 16px', fontWeight: '600', fontSize: '13.5px' }}>Product Name</th>
                <th style={{ padding: '12px 16px', fontWeight: '600', fontSize: '13.5px' }}>Category & Subcategory</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', fontSize: '13.5px' }}>Cost Price</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', fontSize: '13.5px' }}>Sell Price</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', fontSize: '13.5px' }}>Stock</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', fontSize: '13.5px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedProducts.length > 0 ? (
                displayedProducts.map((p, idx) => {
                  const isLow = p.stock_quantity <= p.minimum_stock;
                  const isOut = p.stock_quantity <= 0;

                  return (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc'
                      }}
                    >
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#64748b', fontSize: '13.5px' }}>{p.sku}</td>
                      <td style={{ padding: '12px 16px', color: '#0f172a', fontWeight: '600', fontSize: '15px' }}>
                        {p.name}
                        {p.description && <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 'normal', marginTop: '3px' }}>{p.description}</div>}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#334155', fontSize: '14px' }}>
                        <span>{p.category_name}</span>
                        {p.subcategory_name && <span style={{ fontSize: '12.5px', color: '#64748b', display: 'block', marginTop: '2px' }}>↳ {p.subcategory_name}</span>}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: '#64748b', fontSize: '14.5px' }}>Rs {p.purchase_price.toLocaleString()}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: '#0f172a', fontWeight: 'bold', fontSize: '15.5px' }}>Rs {p.selling_price.toLocaleString()}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 11px',
                          borderRadius: '4px',
                          fontSize: '13px',
                          fontWeight: '600',
                          backgroundColor: isOut ? '#fee2e2' : isLow ? '#fef3c7' : '#f1f5f9',
                          border: isOut ? '1px solid #fca5a5' : isLow ? '1px solid #fcd34d' : '1px solid #e2e8f0',
                          color: isOut ? '#991b1b' : isLow ? '#92400e' : '#334155'
                        }}>
                          {p.stock_quantity} {p.unit}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            onClick={() => {
                              setStockAdjustProd(p);
                              setStockAddQty(0);
                              setStockNote('');
                              setShowStockModal(true);
                            }}
                            style={{ backgroundColor: '#ffffff', color: '#334155', border: '1px solid #cbd5e1', padding: '6px 11px', borderRadius: '4px', fontSize: '12.5px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            title="Adjust Stock"
                          >
                            <ArrowUpDown size={14} /> Stock
                          </button>

                          <button
                            onClick={() => openEditModal(p)}
                            style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '6px 11px', borderRadius: '4px', fontSize: '12.5px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            title="Edit Product"
                          >
                            <Edit3 size={14} /> Edit
                          </button>

                          <button
                            onClick={() => handleDeleteProduct(p)}
                            style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', padding: '6px 11px', borderRadius: '4px', fontSize: '12.5px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            title="Delete Product"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                    No products found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer & View Pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', fontSize: '13.5px', color: '#64748b', flexShrink: 0 }}>
          <div>
            Showing <strong style={{ color: '#0f172a' }}>{displayedProducts.length}</strong> of <strong style={{ color: '#0f172a' }}>{filteredProducts.length}</strong> products
            {products.length !== filteredProducts.length && (
              <span> (Filtered from total {products.length})</span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Page Size Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Show:</span>
              <select
                value={pageSize}
                onChange={e => {
                  const val = e.target.value;
                  setPageSize(val === 'ALL' ? 'ALL' : parseInt(val));
                  setCurrentPage(1);
                }}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#0f172a',
                  padding: '5px 10px',
                  borderRadius: '4px',
                  fontSize: '13.5px'
                }}
              >
                <option value="ALL">All ({filteredProducts.length})</option>
                <option value="25">25 per page</option>
                <option value="50">50 per page</option>
                <option value="100">100 per page</option>
              </select>
            </div>

            {/* Pagination Controls (when not ALL) */}
            {pageSize !== 'ALL' && totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  disabled={safeCurrentPage <= 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: safeCurrentPage <= 1 ? '#94a3b8' : '#334155',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    cursor: safeCurrentPage <= 1 ? 'not-allowed' : 'pointer',
                    fontSize: '13.5px'
                  }}
                >
                  <ChevronLeft size={16} />
                </button>
                <span>Page {safeCurrentPage} of {totalPages}</span>
                <button
                  disabled={safeCurrentPage >= totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: safeCurrentPage >= totalPages ? '#94a3b8' : '#334155',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    cursor: safeCurrentPage >= totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '13.5px'
                  }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ADD / EDIT PRODUCT MODAL */}
      {showProductModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', width: '680px', maxHeight: '90vh', overflowY: 'auto', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button onClick={() => setShowProductModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {errorMessage && (
              <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', padding: '10px 14px', borderRadius: '6px', marginBottom: '14px', fontSize: '13.5px' }}>
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSaveProduct}>
              {/* Product Name Full Width */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13.5px', color: '#334155', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDMI Cable 5 Meter / A4Tech Wireless Mouse"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a', fontSize: '14.5px', fontWeight: '500', boxSizing: 'border-box' }}
                />
              </div>

              {/* Category & Subcategory Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '13.5px', color: '#334155', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Parent Category *</label>
                  <select
                    value={formData.category_id}
                    onChange={e => {
                      const newCatId = parseInt(e.target.value);
                      setFormData({ ...formData, category_id: newCatId, subcategory_id: null });
                    }}
                    style={{ width: '100%', padding: '10px 12px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a', fontSize: '14px', boxSizing: 'border-box' }}
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '13.5px', color: '#334155', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Subcategory</label>
                  <select
                    value={formData.subcategory_id || ''}
                    onChange={e => setFormData({ ...formData, subcategory_id: e.target.value ? parseInt(e.target.value) : null })}
                    style={{ width: '100%', padding: '10px 12px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a', fontSize: '14px', boxSizing: 'border-box' }}
                  >
                    <option value="">Select subcategory...</option>
                    {formFilteredSubcategories.map(sc => (
                      <option key={sc.id} value={sc.id}>{sc.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Prices & Stock Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '13.5px', color: '#334155', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Cost Price (Rs)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.purchase_price === 0 ? '' : formData.purchase_price}
                    onFocus={e => e.target.select()}
                    onChange={e => setFormData({ ...formData, purchase_price: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '10px 12px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a', fontSize: '14.5px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '13.5px', color: '#334155', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Selling Price (Rs) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.selling_price === 0 ? '' : formData.selling_price}
                    onFocus={e => e.target.select()}
                    onChange={e => setFormData({ ...formData, selling_price: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '10px 12px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a', fontWeight: 'bold', fontSize: '14.5px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '13.5px', color: '#334155', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Initial Stock</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    disabled={!!editingProduct}
                    value={formData.stock_quantity === 0 ? '' : formData.stock_quantity}
                    onFocus={e => e.target.select()}
                    onChange={e => setFormData({ ...formData, stock_quantity: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '10px 12px', backgroundColor: editingProduct ? '#f1f5f9' : '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: editingProduct ? '#94a3b8' : '#0f172a', fontSize: '14.5px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '13.5px', color: '#334155', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Unit Type</label>
                  <select
                    value={formData.unit}
                    onChange={e => setFormData({ ...formData, unit: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a', fontSize: '14px', boxSizing: 'border-box' }}
                  >
                    <option value="pcs">pcs (Pieces)</option>
                    <option value="meter">meter (Length/Meters)</option>
                    <option value="Roll">Roll (Cable Roll)</option>
                    <option value="Box">Box</option>
                    <option value="Set">Set</option>
                  </select>
                </div>
              </div>

              {/* Profit Calculation Info Box */}
              <div style={{ backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '6px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#475569', border: '1px solid #e2e8f0' }}>
                <span>Profit per Unit: <strong style={{ color: '#0f172a' }}>Rs {(formData.selling_price - formData.purchase_price).toLocaleString()}</strong></span>
                <span>Margin: <strong style={{ color: '#16a34a' }}>{profitMarginPercent}%</strong></span>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '22px' }}>
                <label style={{ fontSize: '13.5px', color: '#334155', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Description / Specification (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Copper wire, 1 Year warranty, Gold plated"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a', fontSize: '14.5px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" style={{ flex: 1, padding: '13px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '15px', cursor: 'pointer' }}>
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
                <button type="button" onClick={() => setShowProductModal(false)} style={{ padding: '13px 22px', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '14.5px' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE CATEGORIES & SUBCATEGORIES MODAL */}
      {showCategoryModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', width: '780px', height: '600px', display: 'flex', flexDirection: 'column', padding: '22px', boxSizing: 'border-box', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>

            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 'bold', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Boxes size={20} color="#2563eb" /> Category & Subcategory Management
              </h3>
              <button onClick={() => setShowCategoryModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Sub-tabs Header */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
              <button
                onClick={() => setMgmtTab('SUBCATEGORIES')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: mgmtTab === 'SUBCATEGORIES' ? '#2563eb' : '#f1f5f9',
                  color: mgmtTab === 'SUBCATEGORIES' ? '#ffffff' : '#475569',
                  fontWeight: '600',
                  fontSize: '13.5px',
                  cursor: 'pointer'
                }}
              >
                Subcategories ({subcategories.length})
              </button>
              <button
                onClick={() => setMgmtTab('CATEGORIES')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: mgmtTab === 'CATEGORIES' ? '#2563eb' : '#f1f5f9',
                  color: mgmtTab === 'CATEGORIES' ? '#ffffff' : '#475569',
                  fontWeight: '600',
                  fontSize: '13.5px',
                  cursor: 'pointer'
                }}
              >
                Parent Categories ({categories.length})
              </button>
            </div>

            {/* TAB CONTENT: SUBCATEGORIES */}
            {mgmtTab === 'SUBCATEGORIES' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                {/* Add Subcategory Bar */}
                <div style={{ backgroundColor: '#f8fafc', padding: '12px 14px', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '12px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <select
                    value={subCatParentIdInput}
                    onChange={e => setSubCatParentIdInput(parseInt(e.target.value))}
                    style={{ padding: '8px 12px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a', fontSize: '13.5px', width: '180px' }}
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder="New subcategory name (e.g. HDMI 4K, Wireless Mouse)..."
                    value={subCatNameInput}
                    onChange={e => setSubCatNameInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleAddSubcategory();
                    }}
                    style={{ flex: 1, padding: '8px 12px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a', fontSize: '14px' }}
                  />

                  <button
                    onClick={handleAddSubcategory}
                    style={{ padding: '8px 16px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '13.5px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    + Add Subcategory
                  </button>
                </div>

                {/* Subcategories List with Direct Inline Editing */}
                <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: '#ffffff' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
                    <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 2 }}>
                      <tr style={{ color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '10px 14px', fontWeight: '600', fontSize: '13px', width: '220px' }}>Parent Category</th>
                        <th style={{ padding: '10px 14px', fontWeight: '600', fontSize: '13px' }}>Subcategory Name</th>
                        <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: '600', fontSize: '13px', width: '130px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subcategories.map((sc, idx) => {
                        const isEditing = sc.id === editingSubCatId;

                        return (
                          <tr
                            key={sc.id}
                            style={{
                              borderBottom: '1px solid #f1f5f9',
                              backgroundColor: isEditing ? '#eff6ff' : idx % 2 === 0 ? '#ffffff' : '#f8fafc'
                            }}
                          >
                            {isEditing ? (
                              <>
                                <td style={{ padding: '8px 12px' }}>
                                  <select
                                    value={inlineSubCatParentId}
                                    onChange={e => setInlineSubCatParentId(parseInt(e.target.value))}
                                    style={{ width: '100%', padding: '7px 10px', backgroundColor: '#ffffff', border: '1px solid #2563eb', borderRadius: '4px', color: '#0f172a', fontSize: '13.5px' }}
                                  >
                                    {categories.map(c => (
                                      <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                  </select>
                                </td>
                                <td style={{ padding: '8px 12px' }}>
                                  <input
                                    type="text"
                                    autoFocus
                                    value={inlineSubCatName}
                                    onChange={e => setInlineSubCatName(e.target.value)}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') handleSaveInlineSubcategory();
                                      if (e.key === 'Escape') cancelEditSubcategory();
                                    }}
                                    style={{ width: '100%', padding: '7px 10px', backgroundColor: '#ffffff', border: '1px solid #2563eb', borderRadius: '4px', color: '#0f172a', fontSize: '14px', boxSizing: 'border-box' }}
                                  />
                                </td>
                                <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                    <button
                                      onClick={handleSaveInlineSubcategory}
                                      style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12.5px', fontWeight: 'bold' }}
                                      title="Save"
                                    >
                                      <Check size={14} /> Save
                                    </button>
                                    <button
                                      onClick={cancelEditSubcategory}
                                      style={{ backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '12.5px' }}
                                      title="Cancel"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                </td>
                              </>
                            ) : (
                              <>
                                <td style={{ padding: '10px 14px', color: '#334155' }}>{sc.category_name}</td>
                                <td style={{ padding: '10px 14px', color: '#0f172a', fontWeight: '500' }}>{sc.name}</td>
                                <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                    <button
                                      onClick={() => startEditSubcategory(sc)}
                                      style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', padding: '4px' }}
                                      title="Edit Subcategory"
                                    >
                                      <Edit3 size={16} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteSubcategory(sc.id)}
                                      style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '4px' }}
                                      title="Delete Subcategory"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB CONTENT: PARENT CATEGORIES */}
            {mgmtTab === 'CATEGORIES' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                {/* Add Category Bar */}
                <div style={{ backgroundColor: '#f8fafc', padding: '12px 14px', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '12px', display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    placeholder="New category name (e.g. Cable, Mouse, Camera)..."
                    value={catNameInput}
                    onChange={e => setCatNameInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleAddCategory();
                    }}
                    style={{ flex: 1, padding: '8px 12px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a', fontSize: '14px' }}
                  />

                  <button
                    onClick={handleAddCategory}
                    style={{ padding: '8px 16px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '13.5px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    + Add Category
                  </button>
                </div>

                {/* Categories List with Direct Inline Editing */}
                <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: '#ffffff' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
                    <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 2 }}>
                      <tr style={{ color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '10px 14px', fontWeight: '600', fontSize: '13px', width: '80px' }}>ID</th>
                        <th style={{ padding: '10px 14px', fontWeight: '600', fontSize: '13px' }}>Category Name</th>
                        <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: '600', fontSize: '13px', width: '130px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((cat, idx) => {
                        const isEditing = cat.id === editingCatId;

                        return (
                          <tr
                            key={cat.id}
                            style={{
                              borderBottom: '1px solid #f1f5f9',
                              backgroundColor: isEditing ? '#eff6ff' : idx % 2 === 0 ? '#ffffff' : '#f8fafc'
                            }}
                          >
                            {isEditing ? (
                              <>
                                <td style={{ padding: '8px 12px', color: '#64748b', fontSize: '13px' }}>#{cat.id}</td>
                                <td style={{ padding: '8px 12px' }}>
                                  <input
                                    type="text"
                                    autoFocus
                                    value={inlineCatName}
                                    onChange={e => setInlineCatName(e.target.value)}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') handleSaveInlineCategory();
                                      if (e.key === 'Escape') cancelEditCategory();
                                    }}
                                    style={{ width: '100%', padding: '7px 10px', backgroundColor: '#ffffff', border: '1px solid #2563eb', borderRadius: '4px', color: '#0f172a', fontSize: '14px', boxSizing: 'border-box' }}
                                  />
                                </td>
                                <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                    <button
                                      onClick={handleSaveInlineCategory}
                                      style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12.5px', fontWeight: 'bold' }}
                                      title="Save"
                                    >
                                      <Check size={14} /> Save
                                    </button>
                                    <button
                                      onClick={cancelEditCategory}
                                      style={{ backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '12.5px' }}
                                      title="Cancel"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                </td>
                              </>
                            ) : (
                              <>
                                <td style={{ padding: '10px 14px', color: '#64748b', fontSize: '13px' }}>#{cat.id}</td>
                                <td style={{ padding: '10px 14px', color: '#0f172a', fontWeight: '500' }}>{cat.name}</td>
                                <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                    <button
                                      onClick={() => startEditCategory(cat)}
                                      style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', padding: '4px' }}
                                      title="Edit / Rename Category"
                                    >
                                      <Edit3 size={16} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteCategory(cat.id)}
                                      style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '4px' }}
                                      title="Delete Category"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}
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
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', width: '450px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}>Adjust Stock Level</h3>
            <p style={{ fontSize: '14px', color: '#475569', marginBottom: '16px', fontWeight: '500' }}>
              Product: {stockAdjustProd.name} (Current: {stockAdjustProd.stock_quantity} {stockAdjustProd.unit})
            </p>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '13.5px', color: '#334155', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Quantity to Add / Subtract</label>
              <input
                type="number"
                step="any"
                value={stockAddQty === 0 ? '' : stockAddQty}
                onFocus={e => e.target.select()}
                onChange={e => setStockAddQty(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                placeholder="e.g. 10 to add stock, -5 to subtract"
                style={{ width: '100%', padding: '10px 12px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a', fontSize: '14.5px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13.5px', color: '#334155', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Adjustment Note / Reference</label>
              <input
                type="text"
                value={stockNote}
                onChange={e => setStockNote(e.target.value)}
                placeholder="e.g. Stock shipment received"
                style={{ width: '100%', padding: '10px 12px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a', fontSize: '14.5px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={handleAdjustStock} style={{ flex: 1, padding: '12px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '14.5px', cursor: 'pointer' }}>
                Confirm Stock Change
              </button>
              <button onClick={() => setShowStockModal(false)} style={{ padding: '12px 18px', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
