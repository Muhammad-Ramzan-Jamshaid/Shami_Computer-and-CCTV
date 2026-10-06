import { getDb } from '../database/db';
import { Sale, SaleInput } from '../../shared/types';

export class SaleService {
  static generateInvoiceNumber(): string {
    const db = getDb();
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `INV-${todayStr}-`;

    const row = db.prepare(`
      SELECT invoice_number FROM sales
      WHERE invoice_number LIKE ?
      ORDER BY id DESC LIMIT 1
    `).get(`${prefix}%`) as { invoice_number: string } | undefined;

    let nextNumber = 1;
    if (row && row.invoice_number) {
      const parts = row.invoice_number.split('-');
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) {
        nextNumber = lastSeq + 1;
      }
    }

    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  }

  static createSale(saleInput: SaleInput): { success: boolean; saleId?: number; invoiceNumber?: string; error?: string } {
    const db = getDb();

    if (!saleInput.items || saleInput.items.length === 0) {
      return { success: false, error: 'Cart is empty. Select at least one product.' };
    }

    try {
      const executeTransaction = db.transaction(() => {
        // 1. Verify stock for all items first
        for (const item of saleInput.items) {
          const product = db.prepare('SELECT stock_quantity, active, name FROM products WHERE id = ?').get(item.product_id) as any;
          if (!product) {
            throw new Error(`Product ID ${item.product_id} no longer exists.`);
          }
          if (!product.active) {
            throw new Error(`Product '${product.name}' is inactive.`);
          }
          if (product.stock_quantity < item.quantity) {
            throw new Error(`Insufficient stock for '${product.name}'. Available: ${product.stock_quantity}, Requested: ${item.quantity}`);
          }
        }

        // 2. Generate Unique Invoice Number
        const invoiceNumber = this.generateInvoiceNumber();

        // 3. Insert Sale Master Record
        const saleStmt = db.prepare(`
          INSERT INTO sales (invoice_number, customer_id, subtotal, discount, total, amount_paid, payment_method, status, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'COMPLETED', ?)
        `);

        const saleInfo = saleStmt.run(
          invoiceNumber,
          saleInput.customer_id || null,
          saleInput.subtotal || 0,
          saleInput.discount || 0,
          saleInput.total || 0,
          saleInput.amount_paid || 0,
          saleInput.payment_method || 'CASH',
          saleInput.created_by || 1
        );

        const saleId = saleInfo.lastInsertRowid as number;

        // 4. Insert Sale Items & Deduct Stock
        const itemStmt = db.prepare(`
          INSERT INTO sale_items (sale_id, product_id, product_name_snapshot, sku_snapshot, quantity, purchase_price_snapshot, selling_price, discount, line_total)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const updateStockStmt = db.prepare(`
          UPDATE products SET stock_quantity = stock_quantity - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
        `);

        const movementStmt = db.prepare(`
          INSERT INTO stock_movements (product_id, movement_type, quantity, reference_type, reference_id, note, created_by)
          VALUES (?, 'SALE/OUT', ?, 'SALE', ?, ?, ?)
        `);

        for (const item of saleInput.items) {
          // Insert sale item snapshot
          itemStmt.run(
            saleId,
            item.product_id,
            item.product_name_snapshot || '',
            item.sku_snapshot || '',
            item.quantity || 1,
            item.purchase_price_snapshot || 0,
            item.selling_price || 0,
            item.discount || 0,
            item.line_total || 0
          );

          // Deduct product stock
          updateStockStmt.run(item.quantity || 1, item.product_id);

          // Record stock movement
          movementStmt.run(
            item.product_id,
            -(item.quantity || 1),
            saleId,
            `Sale Invoice ${invoiceNumber}`,
            saleInput.created_by || 1
          );
        }

        return { saleId, invoiceNumber };
      });

      const result = executeTransaction();
      return { success: true, saleId: result.saleId, invoiceNumber: result.invoiceNumber };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  static getSales(filter?: { startDate?: string; endDate?: string; customerId?: number; paymentMethod?: string; invoiceNumber?: string }): Sale[] {
    const db = getDb();
    let sql = `
      SELECT s.*, 
             c.name as customer_name, c.phone as customer_phone,
             u.name as created_by_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN users u ON s.created_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filter?.invoiceNumber) {
      sql += ` AND s.invoice_number LIKE ?`;
      params.push(`%${filter.invoiceNumber.trim()}%`);
    }

    if (filter?.customerId) {
      sql += ` AND s.customer_id = ?`;
      params.push(filter.customerId);
    }

    if (filter?.paymentMethod) {
      sql += ` AND s.payment_method = ?`;
      params.push(filter.paymentMethod);
    }

    if (filter?.startDate) {
      sql += ` AND s.created_at >= ?`;
      params.push(`${filter.startDate} 00:00:00`);
    }

    if (filter?.endDate) {
      sql += ` AND s.created_at <= ?`;
      params.push(`${filter.endDate} 23:59:59`);
    }

    sql += ` ORDER BY s.id DESC`;

    return db.prepare(sql).all(...params) as Sale[];
  }

  static getSaleById(id: number): Sale | undefined {
    const db = getDb();
    const sale = db.prepare(`
      SELECT s.*, 
             c.name as customer_name, c.phone as customer_phone,
             u.name as created_by_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN users u ON s.created_by = u.id
      WHERE s.id = ?
    `).get(id) as Sale | undefined;

    if (sale) {
      sale.items = db.prepare(`
        SELECT * FROM sale_items WHERE sale_id = ?
      `).all(id) as any[];
    }

    return sale;
  }

  static cancelSale(saleId: number, userId: number, reason?: string): { success: boolean; error?: string } {
    const db = getDb();
    try {
      const transaction = db.transaction(() => {
        const sale = db.prepare('SELECT status, invoice_number FROM sales WHERE id = ?').get(saleId) as any;
        if (!sale) throw new Error('Sale invoice not found');
        if (sale.status === 'CANCELLED') throw new Error('Sale is already cancelled');

        const items = db.prepare('SELECT * FROM sale_items WHERE sale_id = ?').all(saleId) as any[];

        // Restore stock
        const updateStock = db.prepare('UPDATE products SET stock_quantity = stock_quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        const insertMovement = db.prepare(`
          INSERT INTO stock_movements (product_id, movement_type, quantity, reference_type, reference_id, note, created_by)
          VALUES (?, 'SALE_CANCEL/RETURN', ?, 'SALE_CANCEL', ?, ?, ?)
        `);

        for (const item of items) {
          updateStock.run(item.quantity, item.product_id);
          insertMovement.run(item.product_id, item.quantity, saleId, `Cancelled Invoice ${sale.invoice_number}: ${reason || ''}`, userId);
        }

        // Mark sale as cancelled
        db.prepare("UPDATE sales SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(saleId);
      });

      transaction();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}
