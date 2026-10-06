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

  // 4. Default Demo Products (for immediate POS testing)
  const productCheck = database.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
  if (!productCheck || productCheck.count === 0) {
    const demoProducts = [
      { sku: 'CAM-2MP', name: 'Dahua 2MP Outdoor Bullet Camera', category_id: 8, brand: 'Dahua', purchase_price: 3500, selling_price: 4800, stock_quantity: 20, minimum_stock: 5, unit: 'pcs' },
      { sku: 'DVR-4CH', name: 'Hikvision 4-Channel HD DVR', category_id: 9, brand: 'Hikvision', purchase_price: 9000, selling_price: 12500, stock_quantity: 8, minimum_stock: 2, unit: 'pcs' },
      { sku: 'HDD-1TB', name: 'WD Purple 1TB CCTV Hard Drive', category_id: 10, brand: 'Western Digital', purchase_price: 6500, selling_price: 8500, stock_quantity: 12, minimum_stock: 3, unit: 'pcs' },
      { sku: 'MSE-USB', name: 'A4Tech Optical USB Mouse', category_id: 5, brand: 'A4Tech', purchase_price: 500, selling_price: 850, stock_quantity: 35, minimum_stock: 10, unit: 'pcs' },
      { sku: 'PC-I5-6', name: 'Dell Core i5 6th Gen Desktop PC', category_id: 1, brand: 'Dell', purchase_price: 24000, selling_price: 29500, stock_quantity: 6, minimum_stock: 2, unit: 'pcs' }
    ];

    const insertProd = database.prepare(`
      INSERT INTO products (sku, name, category_id, brand, purchase_price, selling_price, stock_quantity, minimum_stock, unit, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    for (const p of demoProducts) {
      insertProd.run(p.sku, p.name, p.category_id, p.brand, p.purchase_price, p.selling_price, p.stock_quantity, p.minimum_stock, p.unit);
    }
    console.log('[DB] Default demo products seeded.');
  }
}

