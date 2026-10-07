import { getDb } from '../database/db';
import { Product } from '../../shared/types';

export class ProductService {
  static getProducts(): Product[] {
    const db = getDb();
    const rows = db.prepare(`
      SELECT p.*, 
             c.name as category_name,
             sc.name as subcategory_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
      ORDER BY p.name ASC
    `).all();

    return rows as Product[];
  }

  static getProductById(id: number): Product | undefined {
    const db = getDb();
    return db.prepare(`
      SELECT p.*, 
             c.name as category_name,
             sc.name as subcategory_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
      WHERE p.id = ?
    `).get(id) as Product | undefined;
  }

  static addProduct(productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>): { success: boolean; id?: number; error?: string } {
    const db = getDb();
    try {
      const info = db.prepare(`
        INSERT INTO products (sku, name, category_id, subcategory_id, purchase_price, selling_price, stock_quantity, minimum_stock, unit, description, active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        productData.sku.trim(),
        productData.name.trim(),
        productData.category_id,
        productData.subcategory_id || null,
        productData.purchase_price || 0,
        productData.selling_price || 0,
        productData.stock_quantity || 0,
        productData.minimum_stock || 5,
        productData.unit || 'pcs',
        productData.description || '',
        productData.active ? 1 : 0
      );

      // Record initial stock movement
      if (productData.stock_quantity > 0) {
        db.prepare(`
          INSERT INTO stock_movements (product_id, movement_type, quantity, note, created_by)
          VALUES (?, 'PURCHASE/IN', ?, 'Initial stock registration', 1)
        `).run(info.lastInsertRowid, productData.stock_quantity);
      }

      return { success: true, id: info.lastInsertRowid as number };
    } catch (err: any) {
      if (err.message?.includes('UNIQUE')) {
        return { success: false, error: 'Product SKU already exists' };
      }
      return { success: false, error: err.message };
    }
  }

  static updateProduct(id: number, productData: Partial<Product>): { success: boolean; error?: string } {
    const db = getDb();
    try {
      db.prepare(`
        UPDATE products SET
          sku = COALESCE(?, sku),
          name = COALESCE(?, name),
          category_id = COALESCE(?, category_id),
          subcategory_id = ?,
          purchase_price = COALESCE(?, purchase_price),
          selling_price = COALESCE(?, selling_price),
          minimum_stock = COALESCE(?, minimum_stock),
          unit = COALESCE(?, unit),
          description = COALESCE(?, description),
          active = COALESCE(?, active),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        productData.sku,
        productData.name,
        productData.category_id,
        productData.subcategory_id !== undefined ? productData.subcategory_id : null,
        productData.purchase_price,
        productData.selling_price,
        productData.minimum_stock,
        productData.unit,
        productData.description,
        productData.active !== undefined ? (productData.active ? 1 : 0) : undefined,
        id
      );
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  static adjustStock(productId: number, quantityToAdd: number, note: string, userId: number): { success: boolean; newStock?: number; error?: string } {
    const db = getDb();
    try {
      const transaction = db.transaction(() => {
        const prod = db.prepare('SELECT stock_quantity FROM products WHERE id = ?').get(productId) as { stock_quantity: number };
        if (!prod) throw new Error('Product not found');

        const newStock = prod.stock_quantity + quantityToAdd;
        if (newStock < 0) throw new Error('Stock cannot become negative');

        db.prepare('UPDATE products SET stock_quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newStock, productId);

        const movementType = quantityToAdd >= 0 ? 'PURCHASE/IN' : 'MANUAL_ADJUSTMENT';
        db.prepare(`
          INSERT INTO stock_movements (product_id, movement_type, quantity, note, created_by)
          VALUES (?, ?, ?, ?, ?)
        `).run(productId, movementType, quantityToAdd, note, userId);

        return newStock;
      });

      const newStock = transaction();
      return { success: true, newStock };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  static deleteProduct(id: number): { success: boolean; error?: string } {
    const db = getDb();
    try {
      const transaction = db.transaction(() => {
        db.prepare('DELETE FROM stock_movements WHERE product_id = ?').run(id);
        db.prepare('DELETE FROM products WHERE id = ?').run(id);
      });
      transaction();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  static getLowStockProducts(): Product[] {
    const db = getDb();
    return db.prepare(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.stock_quantity <= p.minimum_stock AND p.active = 1
      ORDER BY p.stock_quantity ASC
    `).all() as Product[];
  }
}
