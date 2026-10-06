import { getDb, hashPassword } from '../database/db';
import { User } from '../../shared/types';

export class AuthService {
  static login(username: string, password_input: string): { success: boolean; user?: User; error?: string } {
    const db = getDb();
    const row = db.prepare('SELECT * FROM users WHERE username = ? AND active = 1').get(username) as any;
    if (!row) {
      return { success: false, error: 'Invalid username or inactive account' };
    }

    const hashed = hashPassword(password_input);
    if (row.password_hash !== hashed) {
      return { success: false, error: 'Incorrect password' };
    }

    const { password_hash, ...user } = row;
    return { success: true, user: user as User };
  }

  static getUsers(): User[] {
    const db = getDb();
    const rows = db.prepare('SELECT id, name, username, role, active, created_at, updated_at FROM users ORDER BY id ASC').all();
    return rows as User[];
  }

  static createUser(name: string, username: string, password_input: string, role: 'ADMIN' | 'CASHIER'): { success: boolean; error?: string } {
    const db = getDb();
    try {
      const hash = hashPassword(password_input);
      db.prepare(`
        INSERT INTO users (name, username, password_hash, role, active)
        VALUES (?, ?, ?, ?, 1)
      `).run(name, username, hash, role);
      return { success: true };
    } catch (err: any) {
      if (err.message?.includes('UNIQUE')) {
        return { success: false, error: 'Username already exists' };
      }
      return { success: false, error: err.message };
    }
  }

  static updateUser(id: number, name: string, role: 'ADMIN' | 'CASHIER', active: boolean, password_input?: string): { success: boolean; error?: string } {
    const db = getDb();
    try {
      if (password_input && password_input.trim() !== '') {
        const hash = hashPassword(password_input);
        db.prepare(`
          UPDATE users SET name = ?, role = ?, active = ?, password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
        `).run(name, role, active ? 1 : 0, hash, id);
      } else {
        db.prepare(`
          UPDATE users SET name = ?, role = ?, active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
        `).run(name, role, active ? 1 : 0, id);
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}
