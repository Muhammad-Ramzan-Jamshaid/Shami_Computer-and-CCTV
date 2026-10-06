export type UserRole = 'ADMIN' | 'CASHIER';

export interface User {
  id: number;
  name: string;
  username: string;
  role: UserRole;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  category_id: number;
  category_name?: string;
  brand?: string;
  purchase_price: number;
  selling_price: number;
  stock_quantity: number;
  minimum_stock: number;
  unit: string;
  description?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  address?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type PaymentMethod = 'CASH' | 'BANK' | 'OTHER';
export type SaleStatus = 'COMPLETED' | 'CANCELLED';

export interface SaleItemInput {
  product_id: number;
  product_name_snapshot: string;
  sku_snapshot: string;
  quantity: number;
  purchase_price_snapshot: number;
  selling_price: number;
  discount: number;
  line_total: number;
}

export interface SaleItem extends SaleItemInput {
  id: number;
  sale_id: number;
}

export interface SaleInput {
  customer_id?: number | null;
  subtotal: number;
  discount: number;
  total: number;
  amount_paid: number;
  payment_method: PaymentMethod;
  created_by: number;
  items: SaleItemInput[];
}

export interface Sale {
  id: number;
  invoice_number: string;
  customer_id?: number | null;
  customer_name?: string;
  customer_phone?: string;
  subtotal: number;
  discount: number;
  total: number;
  amount_paid: number;
  payment_method: PaymentMethod;
  status: SaleStatus;
  created_by: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
  items?: SaleItem[];
}

export type StockMovementType = 'PURCHASE/IN' | 'SALE/OUT' | 'SALE_CANCEL/RETURN' | 'MANUAL_ADJUSTMENT';

export interface StockMovement {
  id: number;
  product_id: number;
  product_name?: string;
  movement_type: StockMovementType;
  quantity: number;
  reference_type?: string;
  reference_id?: number;
  note?: string;
  created_by: number;
  created_at: string;
}

export interface ShopSettings {
  shop_name: string;
  address: string;
  phone: string;
  invoice_footer: string;
  return_policy: string;
  show_sku: boolean;
  show_customer: boolean;
  show_discount: boolean;
  allow_negative_stock: boolean;
  backup_location: string;
  auto_backup: boolean;
}

export interface DashboardStats {
  todaySalesTotal: number;
  todayInvoicesCount: number;
  todayProfitTotal: number;
  totalProducts: number;
  lowStockCount: number;
  recentSales: Sale[];
  lowStockProducts: Product[];
}

export interface DailyReport {
  date: string;
  totalInvoices: number;
  totalSales: number;
  totalDiscounts: number;
  totalProfit: number;
  cashSales: number;
  bankSales: number;
  otherSales: number;
}

export interface ProductReportItem {
  product_id: number;
  product_name: string;
  sku: string;
  quantity_sold: number;
  sales_amount: number;
  total_cost: number;
  profit: number;
}
