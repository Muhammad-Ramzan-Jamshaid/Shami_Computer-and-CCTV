import { getDb } from '../database/db';
import { DashboardStats, DailyReport, ProductReportItem } from '../../shared/types';
import { SaleService } from './SaleService';
import { ProductService } from './ProductService';

export class ReportService {
  static getDashboardStats(): DashboardStats {
    const db = getDb();
    const todayStr = new Date().toISOString().slice(0, 10);

    // Today's total sales & invoice count
    const todaySales = db.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total_sales, COALESCE(SUM(discount), 0) as total_discount
      FROM sales
      WHERE status = 'COMPLETED' AND date(created_at) = date(?)
    `).get(todayStr) as { count: number; total_sales: number; total_discount: number };

    // Today's profit calculation from sale items
    const todayProfitRow = db.prepare(`
      SELECT COALESCE(SUM((si.selling_price - si.purchase_price_snapshot) * si.quantity - si.discount), 0) as total_profit
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE s.status = 'COMPLETED' AND date(s.created_at) = date(?)
    `).get(todayStr) as { total_profit: number };

    // Total active products count
    const prodCountRow = db.prepare('SELECT COUNT(*) as count FROM products WHERE active = 1').get() as { count: number };

    // Low stock count
    const lowStockProds = ProductService.getLowStockProducts();

    // Recent 5 sales
    const recentSales = SaleService.getSales().slice(0, 5);

    return {
      todaySalesTotal: todaySales.total_sales,
      todayInvoicesCount: todaySales.count,
      todayProfitTotal: todayProfitRow.total_profit,
      totalProducts: prodCountRow.count,
      lowStockCount: lowStockProds.length,
      recentSales,
      lowStockProducts: lowStockProds
    };
  }

  static getDailyReport(targetDate?: string): DailyReport {
    const db = getDb();
    const dateStr = targetDate || new Date().toISOString().slice(0, 10);

    const summary = db.prepare(`
      SELECT 
        COUNT(*) as totalInvoices,
        COALESCE(SUM(total), 0) as totalSales,
        COALESCE(SUM(discount), 0) as totalDiscounts,
        COALESCE(SUM(CASE WHEN payment_method = 'CASH' THEN total ELSE 0 END), 0) as cashSales,
        COALESCE(SUM(CASE WHEN payment_method = 'BANK' THEN total ELSE 0 END), 0) as bankSales,
        COALESCE(SUM(CASE WHEN payment_method = 'OTHER' THEN total ELSE 0 END), 0) as otherSales
      FROM sales
      WHERE status = 'COMPLETED' AND date(created_at) = date(?)
    `).get(dateStr) as any;

    const profitRow = db.prepare(`
      SELECT COALESCE(SUM((si.selling_price - si.purchase_price_snapshot) * si.quantity - si.discount), 0) as totalProfit
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE s.status = 'COMPLETED' AND date(s.created_at) = date(?)
    `).get(dateStr) as { totalProfit: number };

    return {
      date: dateStr,
      totalInvoices: summary.totalInvoices || 0,
      totalSales: summary.totalSales || 0,
      totalDiscounts: summary.totalDiscounts || 0,
      totalProfit: profitRow.totalProfit || 0,
      cashSales: summary.cashSales || 0,
      bankSales: summary.bankSales || 0,
      otherSales: summary.otherSales || 0
    };
  }

  static getProductSalesReport(startDate?: string, endDate?: string): ProductReportItem[] {
    const db = getDb();
    let dateFilter = '';
    const params: any[] = [];

    if (startDate && endDate) {
      dateFilter = 'AND date(s.created_at) >= date(?) AND date(s.created_at) <= date(?)';
      params.push(startDate, endDate);
    }

    const rows = db.prepare(`
      SELECT 
        si.product_id,
        si.product_name_snapshot as product_name,
        si.sku_snapshot as sku,
        SUM(si.quantity) as quantity_sold,
        SUM(si.line_total) as sales_amount,
        SUM(si.purchase_price_snapshot * si.quantity) as total_cost,
        SUM((si.selling_price - si.purchase_price_snapshot) * si.quantity - si.discount) as profit
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE s.status = 'COMPLETED' ${dateFilter}
      GROUP BY si.product_id
      ORDER BY quantity_sold DESC
    `).all(...params) as ProductReportItem[];

    return rows;
  }
}
