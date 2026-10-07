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

  const [selectedBrand, setSelectedBrand] = useState<string>('ALL');

  // Preset templates helper for CCTV & Computer shop items
  const COMMON_BRANDS = [
    'Dahua',
    'Hikvision',
    'Western Digital',
    'Seagate',
    'Tensun',
    'A4Tech',
    'Lexar',
    'Kingston',
    'TP-Link',
    'D-Link',
    'Dell',
    'HP',
    'Lenovo',
    'Huntkey',
    'Generic'
  ];

  const PRESET_TEMPLATES: Record<string, Array<{ name: string; unit: string; skuPrefix: string; defaultCost?: number; defaultPrice?: number }>> = {
    'Cable': [
      { name: 'Cat6 UTP Network Cable 305m Full Roll', unit: 'Roll', skuPrefix: 'CBL-CAT6', defaultCost: 11000, defaultPrice: 14500 },
      { name: 'Cat5e UTP Network Cable 305m Roll', unit: 'Roll', skuPrefix: 'CBL-CAT5', defaultCost: 8500, defaultPrice: 11500 },
      { name: '3+1 CCTV Coaxial Cable 90m Copper Roll', unit: 'Roll', skuPrefix: 'CBL-CCTV31', defaultCost: 4200, defaultPrice: 5800 },
      { name: 'HDMI Cable 1.5 Meter 4K Ultra HD', unit: 'pcs', skuPrefix: 'CBL-HDMI15', defaultCost: 250, defaultPrice: 450 },
      { name: 'HDMI Cable 3 Meter 4K Heavy', unit: 'pcs', skuPrefix: 'CBL-HDMI3M', defaultCost: 380, defaultPrice: 650 },
      { name: 'HDMI Cable 5 Meter 4K Heavy Braided', unit: 'pcs', skuPrefix: 'CBL-HDMI5M', defaultCost: 550, defaultPrice: 950 },
      { name: 'HDMI Cable 10 Meter 4K Heavy Braided', unit: 'pcs', skuPrefix: 'CBL-HDMI10M', defaultCost: 1100, defaultPrice: 1800 },
      { name: 'VGA Cable 3 Meter Double Shielded', unit: 'pcs', skuPrefix: 'CBL-VGA3M', defaultCost: 350, defaultPrice: 600 },
      { name: 'Pre-Made BNC + DC CCTV Cable 20m', unit: 'pcs', skuPrefix: 'CBL-BNC20', defaultCost: 450, defaultPrice: 750 },
      { name: 'PC Power Cord Cable 1.5m Heavy Duty', unit: 'pcs', skuPrefix: 'CBL-PWRPC', defaultCost: 180, defaultPrice: 350 }
    ],
    'Hard Disk': [
      { name: 'Seagate 500GB Desktop 3.5" SATA HDD', unit: 'pcs', skuPrefix: 'HDD-500GB', defaultCost: 2200, defaultPrice: 3200 },
      { name: 'WD Purple 1TB CCTV Surveillance Hard Drive', unit: 'pcs', skuPrefix: 'HDD-1TB', defaultCost: 6500, defaultPrice: 8500 },
      { name: 'WD Purple 2TB CCTV Surveillance Hard Drive', unit: 'pcs', skuPrefix: 'HDD-2TB', defaultCost: 11500, defaultPrice: 14800 },
      { name: 'WD Purple 4TB CCTV Surveillance Hard Drive', unit: 'pcs', skuPrefix: 'HDD-4TB', defaultCost: 21500, defaultPrice: 26500 }
    ],
    'SSD': [
      { name: 'Lexar 128GB 2.5" SATA III Internal SSD', unit: 'pcs', skuPrefix: 'SSD-128GB', defaultCost: 2400, defaultPrice: 3400 },
      { name: 'Kingston 256GB NVMe M.2 High Speed SSD', unit: 'pcs', skuPrefix: 'SSD-256GB', defaultCost: 4200, defaultPrice: 5800 },
      { name: 'Lexar 512GB NVMe M.2 High Speed SSD', unit: 'pcs', skuPrefix: 'SSD-512GB', defaultCost: 7500, defaultPrice: 9800 },
      { name: 'Lexar 1TB NVMe M.2 High Speed SSD', unit: 'pcs', skuPrefix: 'SSD-1TB', defaultCost: 14000, defaultPrice: 17500 }
    ],
    'CCTV Camera': [
      { name: 'Dahua 2MP Outdoor NightVision Bullet Camera', unit: 'pcs', skuPrefix: 'CAM-OUT2', defaultCost: 3500, defaultPrice: 4800 },
      { name: 'Dahua 2MP Indoor HD Dome Camera', unit: 'pcs', skuPrefix: 'CAM-DOM2', defaultCost: 3200, defaultPrice: 4400 },
      { name: 'Hikvision 2MP Turbo HD Bullet Camera', unit: 'pcs', skuPrefix: 'CAM-HIK2', defaultCost: 3600, defaultPrice: 4900 },
      { name: 'Dahua 4MP Audio NightVision IP Camera', unit: 'pcs', skuPrefix: 'CAM-IP4MP', defaultCost: 6500, defaultPrice: 8800 }
    ],
    'DVR/NVR': [
      { name: 'Dahua 4-Channel Cooper XVR / DVR', unit: 'pcs', skuPrefix: 'DVR-4CH', defaultCost: 8500, defaultPrice: 11500 },
      { name: 'Dahua 8-Channel WizSense XVR / DVR', unit: 'pcs', skuPrefix: 'DVR-8CH', defaultCost: 13500, defaultPrice: 17800 },
      { name: 'Dahua 16-Channel WizSense XVR / DVR', unit: 'pcs', skuPrefix: 'DVR-16CH', defaultCost: 22000, defaultPrice: 28500 }
    ],
    'Power Supply': [
      { name: '12V 2A Single CCTV Camera Power Adapter', unit: 'pcs', skuPrefix: 'PWR-12V2A', defaultCost: 300, defaultPrice: 550 },
      { name: '12V 5A CCTV Camera Power Adapter', unit: 'pcs', skuPrefix: 'PWR-12V5A', defaultCost: 750, defaultPrice: 1200 },
      { name: '12V 10A Centralized Metal Power Box 9-Port', unit: 'pcs', skuPrefix: 'PWR-10A9P', defaultCost: 2200, defaultPrice: 3400 },
      { name: '12V 20A Centralized Metal Power Box 18-Port', unit: 'pcs', skuPrefix: 'PWR-20A18P', defaultCost: 3500, defaultPrice: 5200 }
    ],
    'Mouse': [
      { name: 'A4Tech OP-620D USB Optical Mouse', unit: 'pcs', skuPrefix: 'MSE-A4T', defaultCost: 500, defaultPrice: 850 },
      { name: 'A4Tech G3-200N Wireless Optical Mouse', unit: 'pcs', skuPrefix: 'MSE-WLS', defaultCost: 1200, defaultPrice: 1850 }
    ],
    'Keyboard': [
      { name: 'A4Tech KR-85 USB Standard Keyboard', unit: 'pcs', skuPrefix: 'KBD-A4T', defaultCost: 950, defaultPrice: 1450 },
      { name: 'A4Tech Wireless Keyboard & Mouse Combo', unit: 'pcs', skuPrefix: 'KBD-CMB', defaultCost: 2600, defaultPrice: 3600 }
    ]
  };

  // Get unique brands list from active products
  const uniqueBrands = Array.from(new Set([
    ...COMMON_BRANDS,
    ...products.map(p => p.brand).filter(Boolean) as string[]
  ])).sort();

  // Helper to generate a clean SKU code
  const generateAutoSKU = (catId: number, prefix?: string) => {
    const cat = categories.find(c => c.id === catId);
    let codePrefix = prefix || (cat ? cat.name.substring(0, 3).toUpperCase() : 'PRD');
    codePrefix = codePrefix.replace(/[^A-Z0-9]/gi, '').substring(0, 8).toUpperCase();
    const randNum = Math.floor(100 + Math.random() * 900);
    return `${codePrefix}-${randNum}`;
  };

  // Filtered Products
  const filteredProducts = products.filter(prod => {
    const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          prod.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (prod.brand && prod.brand.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'ALL' || prod.category_id === parseInt(selectedCategory);
    const matchesBrand = selectedBrand === 'ALL' || (prod.brand && prod.brand.toLowerCase() === selectedBrand.toLowerCase());
    const matchesLowStock = !lowStockOnly || prod.stock_quantity <= prod.minimum_stock;

    return matchesSearch && matchesCategory && matchesBrand && matchesLowStock;
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
        gap: '12px',
        marginBottom: '20px',
        backgroundColor: '#1e293b',
        padding: '14px',
        borderRadius: '10px',
        border: '1px solid #334155',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
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

        {/* Category Filter */}
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
          <option value="ALL">📂 All Categories ({categories.length})</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        {/* Brand Filter */}
        <select
          value={selectedBrand}
          onChange={e => setSelectedBrand(e.target.value)}
          style={{
            padding: '8px 14px',
            backgroundColor: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '6px',
            color: '#f8fafc',
            fontSize: '13px'
          }}
        >
          <option value="ALL">🏷️ All Brands</option>
          {uniqueBrands.map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>

        {/* Low Stock Checkbox */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f8fafc', fontSize: '13px', cursor: 'pointer', marginLeft: 'auto' }}>
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={e => setLowStockOnly(e.target.checked)}
          />
          <span style={{ color: lowStockOnly ? '#ef4444' : '#cbd5e1', fontWeight: lowStockOnly ? 'bold' : 'normal' }}>
            ⚠️ Low Stock Only
          </span>
        </label>
      </div>

      {/* Products Table */}
      <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#0f172a', color: '#94a3b8', textAlign: 'left' }}>
              <th style={{ padding: '12px' }}>SKU Code</th>
              <th style={{ padding: '12px' }}>Product Name</th>
              <th style={{ padding: '12px' }}>Category</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Cost (Rs)</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Selling Price (Rs)</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Margin</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Stock Qty</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length > 0 ? (
              filteredProducts.map(prod => {
                const isLow = prod.stock_quantity <= prod.minimum_stock;
                const marginPct = prod.selling_price > 0 
                  ? Math.round(((prod.selling_price - prod.purchase_price) / prod.selling_price) * 100) 
                  : 0;

                return (
                  <tr key={prod.id} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '12px', fontFamily: 'monospace', color: '#60a5fa', fontWeight: 'bold' }}>{prod.sku}</td>
                    <td style={{ padding: '12px', fontWeight: '600', color: '#f8fafc' }}>
                      {prod.name}
                      {prod.brand && <span style={{ fontSize: '11px', color: '#94a3b8', display: 'inline-block', marginLeft: '8px', backgroundColor: '#0f172a', padding: '1px 6px', borderRadius: '4px', border: '1px solid #334155' }}>🏷️ {prod.brand}</span>}
                    </td>
                    <td style={{ padding: '12px', color: '#cbd5e1' }}>{prod.category_name}</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#94a3b8' }}>{prod.purchase_price.toLocaleString()}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#10b981' }}>{prod.selling_price.toLocaleString()}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontSize: '12px', color: marginPct > 0 ? '#34d399' : '#f87171' }}>
                      {marginPct}%
                    </td>
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
                <td colSpan={9} style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
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
            width: '620px',
            maxHeight: '92vh',
            overflowY: 'auto',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
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

            {/* Quick Preset Template Suggestions Box */}
            {!editingProduct && (
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #334155', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#60a5fa', marginBottom: '6px' }}>
                  ⚡ Quick Pick Presets for Easy Product Entry:
                </p>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', maxHeight: '100px', overflowY: 'auto' }}>
                  {(() => {
                    const currentCatObj = categories.find(c => c.id === formData.category_id);
                    const catName = currentCatObj ? currentCatObj.name : '';
                    const presets = PRESET_TEMPLATES[catName] || [
                      { name: `${catName} Standard Item`, unit: 'pcs', skuPrefix: catName.substring(0, 3).toUpperCase() }
                    ];

                    return presets.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          const autoSku = generateAutoSKU(formData.category_id, p.skuPrefix);
                          setFormData(prev => ({
                            ...prev,
                            name: p.name,
                            unit: p.unit,
                            sku: autoSku,
                            purchase_price: p.defaultCost || prev.purchase_price,
                            selling_price: p.defaultPrice || prev.selling_price
                          }));
                        }}
                        style={{
                          fontSize: '11px',
                          padding: '4px 10px',
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '14px',
                          color: '#f8fafc',
                          cursor: 'pointer'
                        }}
                      >
                        + {p.name}
                      </button>
                    ));
                  })()}
                </div>
              </div>
            )}

            <form onSubmit={handleSaveProduct} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '12px', color: '#94a3b8' }}>SKU / Product Code *</label>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, sku: generateAutoSKU(prev.category_id) }))}
                    style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    ⚡ Auto SKU
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={formData.sku}
                  onChange={e => setFormData({ ...formData, sku: e.target.value })}
                  style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px', fontFamily: 'monospace' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Category *</label>
                <select
                  value={formData.category_id}
                  onChange={e => {
                    const newCatId = parseInt(e.target.value);
                    setFormData(prev => ({ ...prev, category_id: newCatId, sku: generateAutoSKU(newCatId) }));
                  }}
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
                  placeholder="e.g. Cat6 UTP Network Cable 305m / Dahua 2MP HD Camera"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Brand / Manufacturer</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    placeholder="Type or pick brand..."
                    value={formData.brand}
                    onChange={e => setFormData({ ...formData, brand: e.target.value })}
                    style={{ flex: 1, padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px' }}
                  />
                  <select
                    onChange={e => e.target.value && setFormData({ ...formData, brand: e.target.value })}
                    style={{ width: '80px', padding: '8px 4px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#94a3b8', fontSize: '11px' }}
                  >
                    <option value="">Pick Brand</option>
                    {COMMON_BRANDS.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Unit of Measure</label>
                <select
                  value={formData.unit}
                  onChange={e => setFormData({ ...formData, unit: e.target.value })}
                  style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '13px' }}
                >
                  <option value="pcs">Pieces (pcs)</option>
                  <option value="Roll">Roll</option>
                  <option value="Meter">Meter (m)</option>
                  <option value="box">Box</option>
                  <option value="set">Set</option>
                  <option value="pack">Pack</option>
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
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Minimum Stock Alert Limit</label>
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
