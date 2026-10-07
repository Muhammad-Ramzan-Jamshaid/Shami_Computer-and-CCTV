import { getDb } from '../database/db';
import { Subcategory } from '../../shared/types';

export class SubcategoryService {
  static getSubcategories(categoryId?: number): Subcategory[] {
    const db = getDb();
    if (categoryId) {
      return db.prepare(`
        SELECT sc.*, c.name as category_name
        FROM subcategories sc
        LEFT JOIN categories c ON sc.category_id = c.id
        WHERE sc.category_id = ?
        ORDER BY sc.name ASC
      `).all(categoryId) as Subcategory[];
    }

    return db.prepare(`
      SELECT sc.*, c.name as category_name
      FROM subcategories sc
      LEFT JOIN categories c ON sc.category_id = c.id
      ORDER BY c.name ASC, sc.name ASC
    `).all() as Subcategory[];
  }

  static addSubcategory(categoryId: number, name: string, description?: string): { success: boolean; id?: number; error?: string } {
    const db = getDb();
    try {
      const info = db.prepare('INSERT INTO subcategories (category_id, name, description) VALUES (?, ?, ?)').run(categoryId, name.trim(), description || '');
      return { success: true, id: info.lastInsertRowid as number };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  static updateSubcategory(id: number, categoryId: number, name: string, description?: string): { success: boolean; error?: string } {
    const db = getDb();
    try {
      db.prepare('UPDATE subcategories SET category_id = ?, name = ?, description = ? WHERE id = ?').run(categoryId, name.trim(), description || '', id);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  static deleteSubcategory(id: number): { success: boolean; error?: string } {
    const db = getDb();
    try {
      db.prepare('DELETE FROM subcategories WHERE id = ?').run(id);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}
