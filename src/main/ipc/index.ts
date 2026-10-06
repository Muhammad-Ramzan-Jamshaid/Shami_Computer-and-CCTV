import { ipcMain, BrowserWindow } from 'electron';
import { AuthService } from '../services/AuthService';
import { CategoryService } from '../services/CategoryService';
import { ProductService } from '../services/ProductService';
import { CustomerService } from '../services/CustomerService';
import { SaleService } from '../services/SaleService';
import { ReportService } from '../services/ReportService';
import { SettingsService } from '../services/SettingsService';
import { BackupService } from '../services/BackupService';

export function registerIpcHandlers() {
  // Auth
  ipcMain.handle('auth:login', async (_, { username, password }) => {
    return AuthService.login(username, password);
  });
  ipcMain.handle('auth:getUsers', async () => {
    return AuthService.getUsers();
  });
  ipcMain.handle('auth:createUser', async (_, { name, username, password, role }) => {
    return AuthService.createUser(name, username, password, role);
  });
  ipcMain.handle('auth:updateUser', async (_, { id, name, role, active, password }) => {
    return AuthService.updateUser(id, name, role, active, password);
  });

  // Categories
  ipcMain.handle('categories:get', async () => {
    return CategoryService.getCategories();
  });
  ipcMain.handle('categories:add', async (_, { name, description }) => {
    return CategoryService.addCategory(name, description);
  });
  ipcMain.handle('categories:delete', async (_, { id }) => {
    return CategoryService.deleteCategory(id);
  });

  // Products
  ipcMain.handle('products:get', async () => {
    return ProductService.getProducts();
  });
  ipcMain.handle('products:add', async (_, productData) => {
    return ProductService.addProduct(productData);
  });
  ipcMain.handle('products:update', async (_, { id, productData }) => {
    return ProductService.updateProduct(id, productData);
  });
  ipcMain.handle('products:adjustStock', async (_, { productId, quantityToAdd, note, userId }) => {
    return ProductService.adjustStock(productId, quantityToAdd, note, userId);
  });
  ipcMain.handle('products:getLowStock', async () => {
    return ProductService.getLowStockProducts();
  });

  // Customers
  ipcMain.handle('customers:get', async () => {
    return CustomerService.getCustomers();
  });
  ipcMain.handle('customers:add', async (_, { name, phone, address, notes }) => {
    return CustomerService.addCustomer(name, phone, address, notes);
  });
  ipcMain.handle('customers:update', async (_, { id, name, phone, address, notes }) => {
    return CustomerService.updateCustomer(id, name, phone, address, notes);
  });

  // Sales
  ipcMain.handle('sales:create', async (_, saleInput) => {
    return SaleService.createSale(saleInput);
  });
  ipcMain.handle('sales:get', async (_, filter) => {
    return SaleService.getSales(filter);
  });
  ipcMain.handle('sales:getById', async (_, { id }) => {
    return SaleService.getSaleById(id);
  });
  ipcMain.handle('sales:cancel', async (_, { saleId, userId, reason }) => {
    return SaleService.cancelSale(saleId, userId, reason);
  });

  // Reports
  ipcMain.handle('reports:getDashboard', async () => {
    return ReportService.getDashboardStats();
  });
  ipcMain.handle('reports:getDaily', async (_, { targetDate }) => {
    return ReportService.getDailyReport(targetDate);
  });
  ipcMain.handle('reports:getProductSales', async (_, { startDate, endDate }) => {
    return ReportService.getProductSalesReport(startDate, endDate);
  });

  // Settings
  ipcMain.handle('settings:get', async () => {
    return SettingsService.getSettings();
  });
  ipcMain.handle('settings:update', async (_, settings) => {
    return SettingsService.updateSettings(settings);
  });

  // Backup
  ipcMain.handle('backup:create', async (_, { targetFolder }) => {
    return BackupService.createBackup(targetFolder);
  });
  ipcMain.handle('backup:restore', async (_, { filePath }) => {
    return BackupService.restoreBackup(filePath);
  });

  // Printing A4 Invoice
  ipcMain.handle('print:invoice', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return { success: false, error: 'Window not found' };
    try {
      await win.webContents.print({
        silent: false,
        printBackground: true,
        pageSize: 'A4',
        margins: { marginType: 'default' }
      });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });
}
