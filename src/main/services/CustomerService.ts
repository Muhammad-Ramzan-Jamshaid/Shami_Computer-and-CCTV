import { getDb } from '../database/db';
import { Customer } from '../../shared/types';

export class CustomerService {
  static getCustomers(): Customer[] {
    const db = getDb();
    return db.prepare('SELECT * FROM customers ORDER BY name ASC').all() as Customer[];
  }

  static addCustomer(name: string, phone: string, address?: string, notes?: string): { success: boolean; id?: number; error?: string } {
    const db = getDb();
    try {
      const info = db.prepare(`
        INSERT INTO customers (name, phone, address, notes)
        VALUES (?, ?, ?, ?)
      `).run(name.trim(), phone.trim(), address || '', notes || '');
      return { success: true, id: info.lastInsertRowid as number };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  static updateCustomer(id: number, name: string, phone: string, address?: string, notes?: string): { success: boolean; error?: string } {
    const db = getDb();
    try {
      db.prepare(`
        UPDATE customers SET name = ?, phone = ?, address = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).run(name.trim(), phone.trim(), address || '', notes || '', id);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}
