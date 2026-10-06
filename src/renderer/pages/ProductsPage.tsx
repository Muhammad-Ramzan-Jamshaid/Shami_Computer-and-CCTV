import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Edit3, 
  Layers, 
  AlertCircle, 
  ArrowUpDown,
  X
} from 'lucide-react';
import { Product, Category, User } from '../../shared/types';

interface ProductsPageProps {
  currentUser: User | null;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({ currentUser }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
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

  // Form State
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category_id: 1,
    brand: '',
    purchase_price: 0,
    selling_price: 0,
    stock_quantity: 0,
    minimum_stock: 5,
    unit: 'pcs',
    description: '',
    active: true
  });

  const [newCatName, setNewCatName] = useState<string>('');

  const loadData = async () => {
    try {
      if (window.api) {
        const prods = await window.api.getProducts();
        const cats = await window.api.getCategories();
        setProducts(prods || []);
        setCategories(cats || []);
        if (cats && cats.length > 0 && !formData.category_id) {
          setFormData(prev => ({ ...prev, category_id: cats[0].id }));
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
    setFormData({
      sku: `PRD-${Math.floor(1000 + Math.random() * 9000)}`,
      name: '',
      category_id: categories.length > 0 ? categories[0].id : 1,
      brand: '',
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
      brand: prod.brand || '',
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

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    const res = await window.api.addCategory(newCatName.trim());
    if (res.success) {
      setNewCatName('');
      loadData();
    } else {
      alert(res.error || 'Failed to add category');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    const res = await window.api.deleteCategory(id);
    if (res.success) {
      loadData();
    } else {
      alert(res.error || 'Cannot delete category');
    }
  };

  const handleStockAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockAdjustProd || stockAddQty === 0) return;
    const res = await window.api.adjustStock(
      stockAdjustProd.id,
      stockAddQty,
      stockNote || 'Stock manual update',
      currentUser ? currentUser.id : 1
    );

    if (res.success) {
      setShowStockModal(false);
      loadData();
    } else {
      alert(res.error || 'Failed to update stock');
    }
  };

  // Filtered Products
  const filteredProducts = products.filter(prod => {
    const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          prod.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (prod.brand && prod.brand.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'ALL' || prod.category_id === parseInt(selectedCategory);
    const matchesLowStock = !lowStockOnly || prod.stock_quantity <= prod.minimum_stock;

    return matchesSearch && matchesCategory && matchesLowStock;
  });

  return (
    <div style={{ padding: '24px', height: '100%', overflowY: 'auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#f8fafc' }}>Products & Inventory</h1>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>Manage shop inventory, prices, stock levels & categories</p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setShowCategoryModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#334155',
              color: '#f8fafc',
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid #475569',
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            <Layers size={16} /> Manage Categories
          </button>

          <button
            onClick={openAddModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              padding: '10px 18px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '20px',
        backgroundColor: '#1e293b',
        padding: '16px',
        borderRadius: '10px',
        border: '1px solid #334155',
        alignItems: 'center'
      }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '10px' }} />
          <input
            type="text"
            placeholder="Search by Product Name, SKU code or Brand..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 38px',
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#f8fafc',
              fontSize: '13px'
            }}
          />
        </div>

        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          style={{
            padding: '8px 14px',
            backgroundColor: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '6px',
            color: '#f8fafc',
            fontSize: '13px'
          }}
        >
          <option value="ALL">All Categories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f8fafc', fontSize: '13px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={e => setLowStockOnly(e.target.checked)}
          />
          <span style={{ color: lowStockOnly ? '#ef4444' : '#cbd5e1', fontWeight: lowStockOnly ? 'bold' : 'normal' }}>
            Low Stock Only
          </span>
        </label>
      </div>

      {/* Products Table */}
      <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#0f172a', color: '#94a3b8', textAlign: 'left' }}>
              <th style={{ padding: '12px' }}>SKU</th>
              <th style={{ padding: '12px' }}>Product Name</th>
              <th style={{ padding: '12px' }}>Category</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Cost (Rs)</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Selling Price (Rs)</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Stock</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length > 0 ? (
              filteredProducts.map(prod => {
                const isLow = prod.stock_quantity <= prod.minimum_stock;

                return (
                  <tr key={prod.id} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '12px', fontFamily: 'monospace', color: '#60a5fa' }}>{prod.sku}</td>
                    <td style={{ padding: '12px', fontWeight: '600', color: '#f8fafc' }}>
                      {prod.name}
                      {prod.brand && <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Brand: {prod.brand}</span>}
                    </td>
                    <td style={{ padding: '12px', color: '#cbd5e1' }}>{prod.category_name}</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#94a3b8' }}>{prod.purchase_price.toLocaleString()}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#10b981' }}>{prod.selling_price.toLocaleString()}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        backgroundColor: isLow ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                        color: isLow ? '#ef4444' : '#10b981'
                      }}>
                        {prod.stock_quantity} {prod.unit}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{
                        fontSize: '11px',
                        color: prod.active ? '#10b981' : '#64748b'
                      }}>
                        {prod.active ? '● Active' : '○ Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        <button
                          onClick={() => {
                            setStockAdjustProd(prod);
                            setStockAddQty(0);
                            setStockNote('');
                            setShowStockModal(true);
                          }}
                          title="Stock In / Update"
                          style={{
                            backgroundColor: '#334155',
                            border: 'none',
                            color: '#38bdf8',
                            padding: '6px 10px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px'
                          }}
                        >
                          <ArrowUpDown size={14} /> Stock
                        </button>
                        <button
                          onClick={() => openEditModal(prod)}
                          title="Edit Product"
                          style={{
                            backgroundColor: '#334155',
                            border: 'none',
                            color: '#f8fafc',
                            padding: '6px',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          <Edit3 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                  No products found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Product Modal */}
      {showProductModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '12px',
            width: '560px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#f8fafc' }}>
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button onClick={() => setShowProductModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {errorMessage && (
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#ef4444', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSaveProduct} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>SKU / Product Code *</label>
                <input
                  type="text"
                  required
                  value={formData.sku}
                  onChange={e => setFormData({ ...formData, sku: e.target.value })}
                  style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Category *</label>
                <select
                  value={formData.category_id}
                  onChange={e => setFormData({ ...formData, category_id: parseInt(e.target.value) })}
                  style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px' }}
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dahua 2MP HD CCTV Camera"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Brand (Optional)</label>
                <input
                  type="text"
                  placeholder="Dahua, Hikvision, WD, Kingston"
                  value={formData.brand}
                  onChange={e => setFormData({ ...formData, brand: e.target.value })}
                  style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Unit</label>
                <select
                  value={formData.unit}
                  onChange={e => setFormData({ ...formData, unit: e.target.value })}
                  style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px' }}
                >
                  <option value="pcs">Pieces (pcs)</option>
                  <option value="box">Box</option>
                  <option value="meter">Meter</option>
                  <option value="set">Set</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Purchase Cost (Rs)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.purchase_price}
                  onChange={e => setFormData({ ...formData, purchase_price: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Selling Price (Rs) *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.selling_price}
                  onChange={e => setFormData({ ...formData, selling_price: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px', fontWeight: 'bold' }}
                />
              </div>

              {!editingProduct && (
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Initial Stock Qty</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock_quantity}
                    onChange={e => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px' }}
                  />
                </div>
              )}

              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Minimum Stock Limit</label>
                <input
                  type="number"
                  min="0"
                  value={formData.minimum_stock}
                  onChange={e => setFormData({ ...formData, minimum_stock: parseInt(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px' }}
                />
              </div>

              <div style={{ gridColumn: 'span 2', display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '10px', backgroundColor: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Save Product
                </button>
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  style={{ padding: '10px 20px', backgroundColor: '#334155', color: '#f8fafc', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Categories Modal */}
      {showCategoryModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', width: '450px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#f8fafc' }}>Manage Categories</h2>
              <button onClick={() => setShowCategoryModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="New Category Name..."
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                style={{ flex: 1, padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px' }}
              />
              <button onClick={handleAddCategory} style={{ padding: '8px 16px', backgroundColor: '#059669', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                Add
              </button>
            </div>

            <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
              {categories.map(cat => (
                <div key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid #334155', fontSize: '13px', color: '#f8fafc' }}>
                  <span>{cat.name}</span>
                  <button onClick={() => handleDeleteCategory(cat.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}>
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stock Adjust Modal */}
      {showStockModal && stockAdjustProd && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', width: '400px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#f8fafc' }}>Update Stock — {stockAdjustProd.name}</h2>
              <button onClick={() => setShowStockModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleStockAdjust}>
              <div style={{ marginBottom: '12px' }}>
                <p style={{ fontSize: '13px', color: '#94a3b8' }}>Current Stock: <strong style={{ color: '#f8fafc' }}>{stockAdjustProd.stock_quantity} {stockAdjustProd.unit}</strong></p>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Stock Quantity to Add (+) or Subtract (-)</label>
                <input
                  type="number"
                  required
                  value={stockAddQty}
                  onChange={e => setStockAddQty(parseInt(e.target.value) || 0)}
                  style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px', fontWeight: 'bold' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Note / Reference</label>
                <input
                  type="text"
                  placeholder="e.g. New stock shipment from vendor"
                  value={stockNote}
                  onChange={e => setStockNote(e.target.value)}
                  style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px' }}
                />
              </div>

              <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                Confirm Stock Change
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
