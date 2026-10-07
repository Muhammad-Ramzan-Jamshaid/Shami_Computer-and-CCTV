import { contextBridge, ipcRenderer } from 'electron';

export const api = {
  // Auth
  login: (username: string, password: string) => ipcRenderer.invoke('auth:login', { username, password }),
  getUsers: () => ipcRenderer.invoke('auth:getUsers'),
  createUser: (data: any) => ipcRenderer.invoke('auth:createUser', data),
  updateUser: (data: any) => ipcRenderer.invoke('auth:updateUser', data),

  // Categories
  getCategories: () => ipcRenderer.invoke('categories:get'),
  addCategory: (name: string, description?: string) => ipcRenderer.invoke('categories:add', { name, description }),
  updateCategory: (id: number, name: string, description?: string) => ipcRenderer.invoke('categories:update', { id, name, description }),
  deleteCategory: (id: number) => ipcRenderer.invoke('categories:delete', { id }),

  // Subcategories
  getSubcategories: (categoryId?: number) => ipcRenderer.invoke('subcategories:get', { categoryId }),
  addSubcategory: (categoryId: number, name: string, description?: string) => ipcRenderer.invoke('subcategories:add', { categoryId, name, description }),
  updateSubcategory: (id: number, categoryId: number, name: string, description?: string) => ipcRenderer.invoke('subcategories:update', { id, categoryId, name, description }),
  deleteSubcategory: (id: number) => ipcRenderer.invoke('subcategories:delete', { id }),

  // Products
  getProducts: () => ipcRenderer.invoke('products:get'),
  addProduct: (productData: any) => ipcRenderer.invoke('products:add', productData),
  updateProduct: (id: number, productData: any) => ipcRenderer.invoke('products:update', { id, productData }),
  deleteProduct: (id: number) => ipcRenderer.invoke('products:delete', { id }),
  adjustStock: (productId: number, quantityToAdd: number, note: string, userId: number) =>
    ipcRenderer.invoke('products:adjustStock', { productId, quantityToAdd, note, userId }),
  getLowStockProducts: () => ipcRenderer.invoke('products:getLowStock'),

  // Customers
  getCustomers: () => ipcRenderer.invoke('customers:get'),
  addCustomer: (data: any) => ipcRenderer.invoke('customers:add', data),
  updateCustomer: (data: any) => ipcRenderer.invoke('customers:update', data),

  // Sales
  createSale: (saleInput: any) => ipcRenderer.invoke('sales:create', saleInput),
  getSales: (filter?: any) => ipcRenderer.invoke('sales:get', filter),
  getSaleById: (id: number) => ipcRenderer.invoke('sales:getById', { id }),
  cancelSale: (saleId: number, userId: number, reason?: string) => ipcRenderer.invoke('sales:cancel', { saleId, userId, reason }),
  deleteSale: (saleId: number, userId: number) => ipcRenderer.invoke('sales:delete', { saleId, userId }),

  // Reports
  getDashboardStats: () => ipcRenderer.invoke('reports:getDashboard'),
  getDailyReport: (targetDate?: string) => ipcRenderer.invoke('reports:getDaily', { targetDate }),
  getProductSalesReport: (startDate?: string, endDate?: string) => ipcRenderer.invoke('reports:getProductSales', { startDate, endDate }),

  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSettings: (settings: any) => ipcRenderer.invoke('settings:update', settings),

  // Backup
  createBackup: (targetFolder?: string) => ipcRenderer.invoke('backup:create', { targetFolder }),
  restoreBackup: (filePath: string) => ipcRenderer.invoke('backup:restore', { filePath }),

  // Print
  printInvoice: () => ipcRenderer.invoke('print:invoice'),

  // Auto Updater
  checkForUpdates: () => ipcRenderer.invoke('app:checkForUpdates'),
  downloadUpdate: () => ipcRenderer.invoke('app:downloadUpdate'),
  quitAndInstall: () => ipcRenderer.invoke('app:quitAndInstall'),
  onUpdateAvailable: (callback: (info: any) => void) => {
    ipcRenderer.on('app:update-available', (_, info) => callback(info));
  },
  onUpdateProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on('app:update-progress', (_, progress) => callback(progress));
  },
  onUpdateDownloaded: (callback: (info: any) => void) => {
    ipcRenderer.on('app:update-downloaded', (_, info) => callback(info));
  }
};

contextBridge.exposeInMainWorld('api', api);
