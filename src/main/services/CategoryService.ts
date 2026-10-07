import { getDb } from '../database/db';
import { Category } from '../../shared/types';

export class CategoryService {
  static getCategories(): Category[] {
    const db = getDb();
    return db.prepare('SELECT * FROM categories ORDER BY name ASC').all() as Category[];
  }

  static addCategory(name: string, description?: string): { success: boolean; id?: number; error?: string } {
    const db = getDb();
    try {
      const info = db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)').run(name.trim(), description || '');
      return { success: true, id: info.lastInsertRowid as number };
    } catch (err: any) {
      if (err.message?.includes('UNIQUE')) {
        return { success: false, error: 'Category name already exists' };
      }
      return { success: false, error: err.message };
    }
  }

  static updateCategory(id: number, name: string, description?: string): { success: boolean; error?: string } {
    const db = getDb();
    try {
      db.prepare('UPDATE categories SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(name.trim(), description || '', id);
      return { success: true };
    } catch (err: any) {
      if (err.message?.includes('UNIQUE')) {
        return { success: false, error: 'Category name already exists' };
      }
      return { success: false, error: err.message };
    }
  }

  static deleteCategory(id: number): { success: boolean; error?: string } {
    const db = getDb();
    const count = db.prepare('SELECT COUNT(*) as c FROM products WHERE category_id = ?').get(id) as { c: number };
    if (count && count.c > 0) {
      return { success: false, error: 'Cannot delete category assigned to existing products' };
    }
    db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    return { success: true };
  }
}
