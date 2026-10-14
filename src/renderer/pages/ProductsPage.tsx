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
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', padding: '16px 20px', boxSizing: 'border-box', backgroundColor: '#0f172a', overflow: 'hidden' }}>

      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={22} color="#cbd5e1" /> Products & Inventory Management
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '3px 0 0 0' }}>
            Manage catalog, categories, pricing and stock levels.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowCategoryModal(true)}
            style={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              color: '#e2e8f0',
              padding: '9px 15px',
              borderRadius: '6px',
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Boxes size={16} color="#94a3b8" /> Manage Categories & Subcategories
          </button>

          <button
            onClick={openAddModal}
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              padding: '9px 16px',
              borderRadius: '6px',
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div style={{ backgroundColor: '#1e293b', padding: '12px 14px', borderRadius: '8px', border: '1px solid #334155', marginBottom: '14px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', flexShrink: 0 }}>
        {/* Search */}
        <div style={{ flex: 2, minWidth: '220px', position: 'relative' }}>
          <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
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
              padding: '7px 10px 7px 32px',
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
              setCurrentPage(1);
            }}
            style={{
              width: '100%',
              padding: '7px 10px',
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#f8fafc',
              fontSize: '13px'
            }}
          >
            <option value="ALL">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id.toString()}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Subcategory Filter */}
        <div style={{ flex: 1, minWidth: '160px' }}>
          <select
            value={selectedSubcategory}
            onChange={e => {
              setSelectedSubcategory(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              width: '100%',
              padding: '7px 10px',
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#f8fafc',
              fontSize: '13px'
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
            padding: '7px 12px',
            borderRadius: '6px',
            border: lowStockOnly ? '1px solid #ef4444' : '1px solid #334155',
            backgroundColor: lowStockOnly ? 'rgba(239, 68, 68, 0.12)' : '#0f172a',
            color: lowStockOnly ? '#ef4444' : '#94a3b8',
            fontWeight: '600',
            fontSize: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <AlertCircle size={14} /> Low Stock Only
        </button>

        {/* Total Count Badge */}
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #334155', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', color: '#cbd5e1', fontWeight: '500' }}>
          Total: <strong style={{ color: '#f8fafc' }}>{filteredProducts.length}</strong>
        </div>
      </div>

      {/* PRODUCTS TABLE CONTAINER WITH SCROLL */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', backgroundColor: '#1e293b', borderRadius: '8px', border: '1px solid #334155', overflow: 'hidden' }}>

        {/* Scrollable Table Area */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 5, backgroundColor: '#0f172a' }}>
              <tr style={{ color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                <th style={{ padding: '10px 14px', fontWeight: '600', fontSize: '12px' }}>SKU</th>
                <th style={{ padding: '10px 14px', fontWeight: '600', fontSize: '12px' }}>Product Name</th>
                <th style={{ padding: '10px 14px', fontWeight: '600', fontSize: '12px' }}>Category & Subcategory</th>
                <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '600', fontSize: '12px' }}>Cost Price</th>
                <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '600', fontSize: '12px' }}>Sell Price</th>
                <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: '600', fontSize: '12px' }}>Stock</th>
                <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: '600', fontSize: '12px' }}>Actions</th>
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
                        borderBottom: '1px solid #293548',
                        backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)'
                      }}
                    >
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#94a3b8', fontSize: '12px' }}>{p.sku}</td>
                      <td style={{ padding: '10px 14px', color: '#f8fafc', fontWeight: '600' }}>
                        {p.name}
                        {p.description && <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'normal' }}>{p.description}</div>}
                      </td>
                      <td style={{ padding: '10px 14px', color: '#cbd5e1' }}>
                        <span>{p.category_name}</span>
                        {p.subcategory_name && <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>↳ {p.subcategory_name}</span>}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: '#94a3b8' }}>Rs {p.purchase_price.toLocaleString()}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: '#f8fafc', fontWeight: 'bold' }}>Rs {p.selling_price.toLocaleString()}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '600',
                          backgroundColor: isOut ? 'rgba(239, 68, 68, 0.15)' : isLow ? 'rgba(245, 158, 11, 0.15)' : '#0f172a',
                          border: isOut ? '1px solid rgba(239, 68, 68, 0.3)' : isLow ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid #334155',
                          color: isOut ? '#ef4444' : isLow ? '#f59e0b' : '#cbd5e1'
                        }}>
                          {p.stock_quantity} {p.unit}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            onClick={() => {
                              setStockAdjustProd(p);
                              setStockAddQty(0);
                              setStockNote('');
                              setShowStockModal(true);
                            }}
                            style={{ backgroundColor: '#0f172a', color: '#cbd5e1', border: '1px solid #334155', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            title="Adjust Stock"
                          >
                            <ArrowUpDown size={12} /> Stock
                          </button>

                          <button
                            onClick={() => openEditModal(p)}
                            style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            title="Edit Product"
                          >
                            <Edit3 size={12} /> Edit
                          </button>

                          <button
                            onClick={() => handleDeleteProduct(p)}
                            style={{ backgroundColor: '#334155', color: '#f87171', border: '1px solid #475569', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
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

        {/* Table Footer & View Pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: '#0f172a', borderTop: '1px solid #334155', fontSize: '12px', color: '#94a3b8', flexShrink: 0 }}>
          <div>
            Showing <strong style={{ color: '#f8fafc' }}>{displayedProducts.length}</strong> of <strong style={{ color: '#f8fafc' }}>{filteredProducts.length}</strong> products
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
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  color: '#f8fafc',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '12px'
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
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    color: safeCurrentPage <= 1 ? '#475569' : '#cbd5e1',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    cursor: safeCurrentPage <= 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  <ChevronLeft size={14} />
                </button>
                <span>Page {safeCurrentPage} of {totalPages}</span>
                <button
                  disabled={safeCurrentPage >= totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  style={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    color: safeCurrentPage >= totalPages ? '#475569' : '#cbd5e1',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    cursor: safeCurrentPage >= totalPages ? 'not-allowed' : 'pointer'
                  }}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ADD / EDIT PRODUCT MODAL */}
      {showProductModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', width: '640px', maxHeight: '90vh', overflowY: 'auto', padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#f8fafc', margin: 0 }}>
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button onClick={() => setShowProductModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {errorMessage && (
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#ef4444', padding: '9px 12px', borderRadius: '6px', marginBottom: '14px', fontSize: '12px' }}>
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSaveProduct}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>

                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Product Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HDMI Cable 5 Meter"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px' }}
                  />
                </div>
              </div>

              {/* Category & Subcategory Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
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

                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Subcategory</label>
                  <select
                    value={formData.subcategory_id || ''}
                    onChange={e => setFormData({ ...formData, subcategory_id: e.target.value ? parseInt(e.target.value) : null })}
                    style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#cbd5e1', fontSize: '13px' }}
                  >
                    <option value="">Select any one </option>
                    {formFilteredSubcategories.map(sc => (
                      <option key={sc.id} value={sc.id}>{sc.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Prices & Stock Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Cost Price (Rs)</label>
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
                    style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontWeight: 'bold', fontSize: '13px' }}
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

              {/* Profit Calculation Info Box */}
              <div style={{ backgroundColor: '#0f172a', padding: '8px 12px', borderRadius: '6px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8' }}>
                <span>Profit per Unit: <strong style={{ color: '#f8fafc' }}>Rs {(formData.selling_price - formData.purchase_price).toLocaleString()}</strong></span>
                <span>Margin: <strong style={{ color: '#cbd5e1' }}>{profitMarginPercent}%</strong></span>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Description / Specification</label>
                <input
                  type="text"
                  placeholder=""
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" style={{ flex: 1, padding: '9px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
                <button type="button" onClick={() => setShowProductModal(false)} style={{ padding: '9px 16px', backgroundColor: '#334155', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE CATEGORIES & SUBCATEGORIES MODAL */}
      {showCategoryModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '10px', width: '740px', height: '560px', display: 'flex', flexDirection: 'column', padding: '20px', boxSizing: 'border-box' }}>

            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #1e293b', paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Boxes size={18} color="#cbd5e1" /> Category & Subcategory Management
              </h3>
              <button onClick={() => setShowCategoryModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {/* Sub-tabs Header */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', borderBottom: '1px solid #334155', paddingBottom: '8px' }}>
              <button
                onClick={() => setMgmtTab('SUBCATEGORIES')}
                style={{
                  padding: '7px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: mgmtTab === 'SUBCATEGORIES' ? '#2563eb' : '#1e293b',
                  color: '#ffffff',
                  fontWeight: '600',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Subcategories ({subcategories.length})
              </button>
              <button
                onClick={() => setMgmtTab('CATEGORIES')}
                style={{
                  padding: '7px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: mgmtTab === 'CATEGORIES' ? '#2563eb' : '#1e293b',
                  color: '#ffffff',
                  fontWeight: '600',
                  fontSize: '12px',
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
                <div style={{ backgroundColor: '#1e293b', padding: '10px 12px', borderRadius: '6px', border: '1px solid #334155', marginBottom: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <select
                    value={subCatParentIdInput}
                    onChange={e => setSubCatParentIdInput(parseInt(e.target.value))}
                    style={{ padding: '7px 10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '12px', width: '160px' }}
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
                    style={{ flex: 1, padding: '7px 10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px' }}
                  />

                  <button
                    onClick={handleAddSubcategory}
                    style={{ padding: '7px 14px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    + Add Subcategory
                  </button>
                </div>

                {/* Subcategories List with Direct Inline Editing */}
                <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #334155', borderRadius: '6px', backgroundColor: '#1e293b' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                    <thead style={{ position: 'sticky', top: 0, backgroundColor: '#0f172a', zIndex: 2 }}>
                      <tr style={{ color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                        <th style={{ padding: '9px 12px', fontWeight: '600', fontSize: '12px', width: '220px' }}>Parent Category</th>
                        <th style={{ padding: '9px 12px', fontWeight: '600', fontSize: '12px' }}>Subcategory Name</th>
                        <th style={{ padding: '9px 12px', textAlign: 'center', fontWeight: '600', fontSize: '12px', width: '130px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subcategories.map((sc, idx) => {
                        const isEditing = sc.id === editingSubCatId;

                        return (
                          <tr
                            key={sc.id}
                            style={{
                              borderBottom: '1px solid #293548',
                              backgroundColor: isEditing ? 'rgba(37, 99, 235, 0.12)' : idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)'
                            }}
                          >
                            {isEditing ? (
                              <>
                                <td style={{ padding: '6px 10px' }}>
                                  <select
                                    value={inlineSubCatParentId}
                                    onChange={e => setInlineSubCatParentId(parseInt(e.target.value))}
                                    style={{ width: '100%', padding: '6px 8px', backgroundColor: '#0f172a', border: '1px solid #2563eb', borderRadius: '4px', color: '#f8fafc', fontSize: '12px' }}
                                  >
                                    {categories.map(c => (
                                      <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                  </select>
                                </td>
                                <td style={{ padding: '6px 10px' }}>
                                  <input
                                    type="text"
                                    autoFocus
                                    value={inlineSubCatName}
                                    onChange={e => setInlineSubCatName(e.target.value)}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') handleSaveInlineSubcategory();
                                      if (e.key === 'Escape') cancelEditSubcategory();
                                    }}
                                    style={{ width: '100%', padding: '6px 8px', backgroundColor: '#0f172a', border: '1px solid #2563eb', borderRadius: '4px', color: '#f8fafc', fontSize: '13px' }}
                                  />
                                </td>
                                <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                    <button
                                      onClick={handleSaveInlineSubcategory}
                                      style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 'bold' }}
                                      title="Save"
                                    >
                                      <Check size={13} /> Save
                                    </button>
                                    <button
                                      onClick={cancelEditSubcategory}
                                      style={{ backgroundColor: '#334155', color: '#cbd5e1', border: 'none', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '11px' }}
                                      title="Cancel"
                                    >
                                      <X size={13} />
                                    </button>
                                  </div>
                                </td>
                              </>
                            ) : (
                              <>
                                <td style={{ padding: '9px 12px', color: '#cbd5e1' }}>{sc.category_name}</td>
                                <td style={{ padding: '9px 12px', color: '#f8fafc', fontWeight: '500' }}>{sc.name}</td>
                                <td style={{ padding: '9px 12px', textAlign: 'center' }}>
                                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                    <button
                                      onClick={() => startEditSubcategory(sc)}
                                      style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '3px' }}
                                      title="Edit Subcategory"
                                    >
                                      <Edit3 size={15} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteSubcategory(sc.id)}
                                      style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '3px' }}
                                      title="Delete Subcategory"
                                    >
                                      <Trash2 size={15} />
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
                <div style={{ backgroundColor: '#1e293b', padding: '10px 12px', borderRadius: '6px', border: '1px solid #334155', marginBottom: '12px', display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="New category name (e.g. Cable, Mouse, Camera)..."
                    value={catNameInput}
                    onChange={e => setCatNameInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleAddCategory();
                    }}
                    style={{ flex: 1, padding: '7px 10px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px' }}
                  />

                  <button
                    onClick={handleAddCategory}
                    style={{ padding: '7px 14px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    + Add Category
                  </button>
                </div>

                {/* Categories List with Direct Inline Editing */}
                <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #334155', borderRadius: '6px', backgroundColor: '#1e293b' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                    <thead style={{ position: 'sticky', top: 0, backgroundColor: '#0f172a', zIndex: 2 }}>
                      <tr style={{ color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                        <th style={{ padding: '9px 12px', fontWeight: '600', fontSize: '12px', width: '80px' }}>ID</th>
                        <th style={{ padding: '9px 12px', fontWeight: '600', fontSize: '12px' }}>Category Name</th>
                        <th style={{ padding: '9px 12px', textAlign: 'center', fontWeight: '600', fontSize: '12px', width: '130px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((cat, idx) => {
                        const isEditing = cat.id === editingCatId;

                        return (
                          <tr
                            key={cat.id}
                            style={{
                              borderBottom: '1px solid #293548',
                              backgroundColor: isEditing ? 'rgba(37, 99, 235, 0.12)' : idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)'
                            }}
                          >
                            {isEditing ? (
                              <>
                                <td style={{ padding: '6px 10px', color: '#94a3b8', fontSize: '12px' }}>#{cat.id}</td>
                                <td style={{ padding: '6px 10px' }}>
                                  <input
                                    type="text"
                                    autoFocus
                                    value={inlineCatName}
                                    onChange={e => setInlineCatName(e.target.value)}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') handleSaveInlineCategory();
                                      if (e.key === 'Escape') cancelEditCategory();
                                    }}
                                    style={{ width: '100%', padding: '6px 8px', backgroundColor: '#0f172a', border: '1px solid #2563eb', borderRadius: '4px', color: '#f8fafc', fontSize: '13px' }}
                                  />
                                </td>
                                <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                    <button
                                      onClick={handleSaveInlineCategory}
                                      style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 'bold' }}
                                      title="Save"
                                    >
                                      <Check size={13} /> Save
                                    </button>
                                    <button
                                      onClick={cancelEditCategory}
                                      style={{ backgroundColor: '#334155', color: '#cbd5e1', border: 'none', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '11px' }}
                                      title="Cancel"
                                    >
                                      <X size={13} />
                                    </button>
                                  </div>
                                </td>
                              </>
                            ) : (
                              <>
                                <td style={{ padding: '9px 12px', color: '#94a3b8', fontSize: '12px' }}>#{cat.id}</td>
                                <td style={{ padding: '9px 12px', color: '#f8fafc', fontWeight: '500' }}>{cat.name}</td>
                                <td style={{ padding: '9px 12px', textAlign: 'center' }}>
                                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                    <button
                                      onClick={() => startEditCategory(cat)}
                                      style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '3px' }}
                                      title="Edit / Rename Category"
                                    >
                                      <Edit3 size={15} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteCategory(cat.id)}
                                      style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '3px' }}
                                      title="Delete Category"
                                    >
                                      <Trash2 size={15} />
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
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', width: '420px', padding: '22px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#f8fafc', marginBottom: '6px' }}>Adjust Stock Level</h3>
            <p style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '14px', fontWeight: '500' }}>
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
                placeholder="e.g. 10 to add stock, -5 to subtract"
                style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Adjustment Note / Reference</label>
              <input
                type="text"
                value={stockNote}
                onChange={e => setStockNote(e.target.value)}
                placeholder="e.g. Stock shipment received"
                style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleAdjustStock} style={{ flex: 1, padding: '9px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
                Confirm Stock Change
              </button>
              <button onClick={() => setShowStockModal(false)} style={{ padding: '9px 16px', backgroundColor: '#334155', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
