import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import { CREATE_TABLES_SQL } from './schema';
import crypto from 'crypto';

let dbInstance: SqlJsDatabaseWrapper | null = null;

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_shami_salt').digest('hex');
}

export function getDatabasePath(): string {
  let userDataPath: string;
  try {
    userDataPath = app ? app.getPath('userData') : path.join(process.env.APPDATA || process.cwd(), 'ShamiComputer');
  } catch {
    userDataPath = path.join(process.cwd(), 'data');
  }
  const dbFolder = path.join(userDataPath, 'ShamiComputerData');
  if (!fs.existsSync(dbFolder)) {
    fs.mkdirSync(dbFolder, { recursive: true });
  }
  return path.join(dbFolder, 'shami_pos.db');
}

export class SqlJsDatabaseWrapper {
  private db: SqlJsDatabase;
  private dbPath: string;

  constructor(db: SqlJsDatabase, dbPath: string) {
    this.db = db;
    this.dbPath = dbPath;
  }

  save() {
    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(this.dbPath, buffer);
    } catch (err) {
      console.error('[DB] Failed to persist SQLite file:', err);
    }
  }

  exec(sql: string) {
    this.db.exec(sql);
    this.save();
    return this;
  }

  pragma(statement: string) {
    try {
      this.db.exec(`PRAGMA ${statement};`);
    } catch {}
    return this;
  }

  prepare(sql: string) {
    const wrapper = this;
    const db = this.db;

    return {
      run(...params: any[]) {
        const flattened = params.flat();
        db.run(sql, flattened);
        
        // Get last insert rowid
        let lastInsertRowid = 0;
        try {
          const res = db.exec('SELECT last_insert_rowid() as id');
          if (res.length > 0 && res[0].values.length > 0) {
            lastInsertRowid = Number(res[0].values[0][0]);
          }
        } catch {}

        wrapper.save();
        return { lastInsertRowid, changes: 1 };
      },
      get(...params: any[]) {
        const flattened = params.flat();
        const stmt = db.prepare(sql);
        stmt.bind(flattened);
        let result: any = undefined;
        if (stmt.step()) {
          const rowObj: any = {};
          const colNames = stmt.getColumnNames();
          const values = stmt.get();
          colNames.forEach((name, idx) => {
            rowObj[name] = values[idx];
          });
          result = rowObj;
        }
        stmt.free();
        return result;
      },
      all(...params: any[]) {
        const flattened = params.flat();
        const stmt = db.prepare(sql);
        stmt.bind(flattened);
        const rows: any[] = [];
        const colNames = stmt.getColumnNames();
        while (stmt.step()) {
          const rowObj: any = {};
          const values = stmt.get();
          colNames.forEach((name, idx) => {
            rowObj[name] = values[idx];
          });
          rows.push(rowObj);
        }
        stmt.free();
        return rows;
      }
    };
  }

  transaction<T>(fn: () => T): () => T {
    const wrapper = this;
    return () => {
      wrapper.db.exec('BEGIN TRANSACTION;');
      try {
        const result = fn();
        wrapper.db.exec('COMMIT;');
        wrapper.save();
        return result;
      } catch (err) {
        wrapper.db.exec('ROLLBACK;');
        throw err;
      }
    };
  }

  close() {
    this.save();
    this.db.close();
  }
}

export async function initDatabaseAsync(customPath?: string): Promise<SqlJsDatabaseWrapper> {
  if (dbInstance) return dbInstance;

  const dbPath = customPath || getDatabasePath();
  console.log('[DB] Connecting sql.js SQLite database at:', dbPath);

  const SQL = await initSqlJs();

  let sqliteDb: SqlJsDatabase;
  if (fs.existsSync(dbPath)) {
    const filebuffer = fs.readFileSync(dbPath);
    sqliteDb = new SQL.Database(filebuffer);
  } else {
    sqliteDb = new SQL.Database();
  }

  dbInstance = new SqlJsDatabaseWrapper(sqliteDb, dbPath);

  // Execute Schema & Seed
  dbInstance.exec(CREATE_TABLES_SQL);
  seedInitialData(dbInstance);

  return dbInstance;
}

export function initDatabase(customPath?: string): SqlJsDatabaseWrapper {
  if (dbInstance) return dbInstance;
  throw new Error('Database not initialized yet. Call initDatabaseAsync first.');
}

export function getDb(): SqlJsDatabaseWrapper {
  if (!dbInstance) {
    throw new Error('Database not initialized');
  }
  return dbInstance;
}

function seedInitialData(database: SqlJsDatabaseWrapper) {
  // 1. Default Admin User
  const userCheck = database.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (!userCheck || userCheck.count === 0) {
    const adminPass = hashPassword('admin123');
    database.prepare(`
      INSERT INTO users (name, username, password_hash, role, active)
      VALUES (?, ?, ?, ?, 1)
    `).run('Admin', 'admin', adminPass, 'ADMIN');

    const cashierPass = hashPassword('cashier123');
    database.prepare(`
      INSERT INTO users (name, username, password_hash, role, active)
      VALUES (?, ?, ?, ?, 1)
    `).run('Cashier Staff', 'cashier', cashierPass, 'CASHIER');
    console.log('[DB] Default users seeded (admin/admin123, cashier/cashier123)');
  }

  // 2. Default Categories
  const categoryCheck = database.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
  if (!categoryCheck || categoryCheck.count === 0) {
    const defaultCategories = [
      'Computer',
      'Laptop',
      'Monitor',
      'Keyboard',
      'Mouse',
      'Printer',
      'Printer accessories',
      'CCTV Camera',
      'DVR/NVR',
      'Hard Disk',
      'SSD',
      'RAM',
      'Cable',
      'Power Supply',
      'Networking',
      'Other'
    ];

    const insertStmt = database.prepare('INSERT INTO categories (name, description) VALUES (?, ?)');
    for (const cat of defaultCategories) {
      insertStmt.run(cat, `${cat} equipment & accessories`);
    }
    console.log('[DB] Default categories seeded.');
  }

  // 3. Default Shop Settings
  const settingsCheck = database.prepare('SELECT COUNT(*) as count FROM settings').get() as { count: number };
  if (!settingsCheck || settingsCheck.count === 0) {
    const defaultSettings: Record<string, string> = {
      shop_name: 'Shami Computer and CCTV',
      address: 'Safa Wala Chowk, near Habib Shah Hospital, Farooqabad, District Sheikhupura',
      phone: '0306 4565908',
      invoice_footer: 'Thank you for your business! Please check items upon purchase.',
      return_policy: 'Warranty claim requires original invoice within 7 days.',
      show_sku: 'true',
      show_customer: 'true',
      show_discount: 'true',
      allow_negative_stock: 'false',
      backup_location: '',
      auto_backup: 'true'
    };

    const insertSetting = database.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
    for (const [key, value] of Object.entries(defaultSettings)) {
      insertSetting.run(key, value);
    }
    console.log('[DB] Default shop settings seeded.');
  }
}
