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
  private inTransaction: boolean = false;

  constructor(db: SqlJsDatabase, dbPath: string) {
    this.db = db;
    this.dbPath = dbPath;
  }

  save() {
    if (this.inTransaction) return;
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

  private sanitizeParams(params: any[]): any[] {
    return params.flat().map(p => (p === undefined ? null : p));
  }

  prepare(sql: string) {
    const wrapper = this;
    const db = this.db;

    return {
      run(...params: any[]) {
        const sanitized = wrapper.sanitizeParams(params);
        db.run(sql, sanitized);
        
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
        const sanitized = wrapper.sanitizeParams(params);
        const stmt = db.prepare(sql);
        stmt.bind(sanitized);
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
        const sanitized = wrapper.sanitizeParams(params);
        const stmt = db.prepare(sql);
        stmt.bind(sanitized);
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
      wrapper.inTransaction = true;
      try {
        const result = fn();
        wrapper.db.exec('COMMIT;');
        wrapper.inTransaction = false;
        wrapper.save();
        return result;
      } catch (err) {
        try {
          wrapper.db.exec('ROLLBACK;');
        } catch {
          // Ignore rollback error if SQLite auto-rolled back
        }
        wrapper.inTransaction = false;
        throw err;
      }
    };
  }

  close() {
    this.save();
    this.db.close();
  }
}

function runSchemaMigrations(database: SqlJsDatabaseWrapper) {
  try {
    database.exec('ALTER TABLE products ADD COLUMN subcategory_id INTEGER;');
  } catch (e) {
    // Column already exists or table freshly created
  }

  try {
    database.exec('ALTER TABLE products ADD COLUMN brand_id INTEGER;');
  } catch (e) {
    // Column already exists or table freshly created
  }
}

export async function initDatabaseAsync(customPath?: string): Promise<SqlJsDatabaseWrapper> {
  if (dbInstance) return dbInstance;

  const dbPath = customPath || getDatabasePath();
  console.log('[DB] Connecting sql.js SQLite database at:', dbPath);

  const SQL = await initSqlJs({
    locateFile: (file) => {
      if (file.endsWith('.wasm')) {
        const candidates = [
          path.join(__dirname, file),
          path.join(process.resourcesPath || '', file),
          path.join(process.cwd(), 'node_modules/sql.js/dist', file),
          path.join(app ? app.getAppPath() : '', 'dist-electron/main', file),
          path.join(app ? app.getAppPath() : '', file),
        ];
        for (const cand of candidates) {
          if (cand && fs.existsSync(cand)) {
            console.log('[DB] Found WASM binary at:', cand);
            return cand;
          }
        }
      }
      return file;
    }
  });

  let sqliteDb: SqlJsDatabase;
  if (fs.existsSync(dbPath)) {
    const filebuffer = fs.readFileSync(dbPath);
    sqliteDb = new SQL.Database(filebuffer);
  } else {
    sqliteDb = new SQL.Database();
  }

  dbInstance = new SqlJsDatabaseWrapper(sqliteDb, dbPath);

  // Execute Schema & Migrations & Seed
  dbInstance.exec(CREATE_TABLES_SQL);
  runSchemaMigrations(dbInstance);
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

  // Seed Default Brands
  const brandCheck = database.prepare('SELECT COUNT(*) as count FROM brands').get() as { count: number };
  if (!brandCheck || brandCheck.count === 0) {
    const defaultBrands = [
      'Dahua', 'Hikvision', 'Tensun', 'Western Digital', 'Seagate',
      'A4Tech', 'TP-Link', 'D-Link', 'Lexar', 'Kingston', 'Huntkey',
      'Generic / China', 'Dell', 'HP', 'Lenovo'
    ];
    const insertBrand = database.prepare('INSERT INTO brands (name, description) VALUES (?, ?)');
    for (const b of defaultBrands) {
      insertBrand.run(b, `${b} products & hardware`);
    }
    console.log('[DB] Default brands seeded.');
  }

  // Seed Default Subcategories
  const subCatCheck = database.prepare('SELECT COUNT(*) as count FROM subcategories').get() as { count: number };
  if (!subCatCheck || subCatCheck.count === 0) {
    // Fetch category IDs map
    const catRows = database.prepare('SELECT id, name FROM categories').all() as { id: number; name: string }[];
    const catMap = new Map(catRows.map(c => [c.name, c.id]));

    const defaultSubcategories: { category: string; name: string }[] = [
      // Cable
      { category: 'Cable', name: 'HDMI Cable 2K / HD' },
      { category: 'Cable', name: 'HDMI Cable 4K Ultra HD' },
      { category: 'Cable', name: 'VGA Cable' },
      { category: 'Cable', name: 'Power Cable (Branded)' },
      { category: 'Cable', name: 'Power Cable (China)' },
      { category: 'Cable', name: 'VCR / BNC CCTV Cable' },
      { category: 'Cable', name: 'Cat6 Network UTP Cable' },
      { category: 'Cable', name: '3+1 CCTV Coaxial Cable' },
      { category: 'Cable', name: 'RJ45 Patch Cord' },

      // Mouse
      { category: 'Mouse', name: 'Wired Optical Mouse' },
      { category: 'Mouse', name: 'Wireless 2.4G Mouse' },
      { category: 'Mouse', name: 'Bluetooth Mouse' },
      { category: 'Mouse', name: 'Gaming RGB Mouse' },
      { category: 'Mouse', name: 'Branded Mouse (A4Tech / Logitech)' },
      { category: 'Mouse', name: 'China / Generic Mouse' },

      // Keyboard
      { category: 'Keyboard', name: 'Standard USB Keyboard' },
      { category: 'Keyboard', name: 'Wireless Keyboard & Mouse Combo' },
      { category: 'Keyboard', name: 'Gaming Keyboard' },

      // Power Supply
      { category: 'Power Supply', name: '12V 2A Single Camera Adapter' },
      { category: 'Power Supply', name: '12V Central Metal Power Box' },
      { category: 'Power Supply', name: 'Branded Power Supply' },
      { category: 'Power Supply', name: 'China Power Supply' },

      // CCTV Camera
      { category: 'CCTV Camera', name: '2MP HD Bullet Camera' },
      { category: 'CCTV Camera', name: '2MP HD Dome Camera' },
      { category: 'CCTV Camera', name: 'IP Network Camera' },
      { category: 'CCTV Camera', name: 'PTZ Speed Dome' },
      { category: 'CCTV Camera', name: 'WiFi Smart Wireless Cam' },

      // DVR/NVR
      { category: 'DVR/NVR', name: '4-Channel XVR / DVR' },
      { category: 'DVR/NVR', name: '8-Channel XVR / DVR' },
      { category: 'DVR/NVR', name: '16-Channel XVR / NVR' },

      // Hard Disk
      { category: 'Hard Disk', name: '3.5" Desktop SATA Hard Drive' },
      { category: 'Hard Disk', name: 'CCTV Surveillance HDD (WD Purple / SkyHawk)' },
      { category: 'Hard Disk', name: '2.5" Laptop Hard Drive' },

      // SSD
      { category: 'SSD', name: '2.5" SATA III SSD' },
      { category: 'SSD', name: 'NVMe M.2 High Speed SSD' },
      { category: 'SSD', name: 'mSATA SSD' }
    ];

    const insertSubCat = database.prepare('INSERT INTO subcategories (category_id, name, description) VALUES (?, ?, ?)');
    for (const item of defaultSubcategories) {
      const catId = catMap.get(item.category);
      if (catId) {
        insertSubCat.run(catId, item.name, `${item.name} under ${item.category}`);
      }
    }
    console.log('[DB] Default subcategories seeded.');
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

  // 4. Default Products Catalog (CCTV, Computer, Cables, Storage, Accessories)
  const productCheck = database.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
  if (!productCheck || productCheck.count === 0) {
    const demoProducts = [
      // Cables
      { sku: 'CBL-CAT6-305', name: 'Cat6 UTP Network Cable 305m Full Roll', category_id: 13, brand: 'Tensun', purchase_price: 11000, selling_price: 14500, stock_quantity: 8, minimum_stock: 2, unit: 'Roll' },
      { sku: 'CBL-CCTV-31', name: '3+1 CCTV Coaxial Cable 90m Copper Roll', category_id: 13, brand: 'Tensun', purchase_price: 4200, selling_price: 5800, stock_quantity: 15, minimum_stock: 3, unit: 'Roll' },
      { sku: 'CBL-HDMI-15M', name: 'HDMI Cable 1.5 Meter 4K Ultra HD', category_id: 13, brand: 'Generic', purchase_price: 250, selling_price: 450, stock_quantity: 40, minimum_stock: 10, unit: 'pcs' },
      { sku: 'CBL-HDMI-5M', name: 'HDMI Cable 5 Meter 4K Heavy Braided', category_id: 13, brand: 'Generic', purchase_price: 550, selling_price: 950, stock_quantity: 25, minimum_stock: 5, unit: 'pcs' },
      { sku: 'CBL-HDMI-10M', name: 'HDMI Cable 10 Meter 4K Heavy Braided', category_id: 13, brand: 'Generic', purchase_price: 1100, selling_price: 1800, stock_quantity: 18, minimum_stock: 4, unit: 'pcs' },
      { sku: 'CBL-VGA-3M', name: 'VGA Cable 3 Meter Double Shielded', category_id: 13, brand: 'Generic', purchase_price: 350, selling_price: 600, stock_quantity: 20, minimum_stock: 5, unit: 'pcs' },
      { sku: 'CBL-BNC-DC', name: 'Pre-Made BNC + DC CCTV Cable 20 Meter', category_id: 13, brand: 'Generic', purchase_price: 450, selling_price: 750, stock_quantity: 30, minimum_stock: 5, unit: 'pcs' },
      { sku: 'CBL-PWR-PC', name: 'PC Power Cord Cable 1.5m Heavy Duty', category_id: 13, brand: 'Generic', purchase_price: 180, selling_price: 350, stock_quantity: 50, minimum_stock: 10, unit: 'pcs' },
      { sku: 'CBL-PATCH-3M', name: 'Cat6 RJ45 Network Patch Cord 3 Meter', category_id: 13, brand: 'D-Link', purchase_price: 150, selling_price: 300, stock_quantity: 60, minimum_stock: 10, unit: 'pcs' },

      // Hard Disks & SSDs
      { sku: 'HDD-500GB', name: 'Seagate 500GB Desktop 3.5" SATA Hard Disk', category_id: 10, brand: 'Seagate', purchase_price: 2200, selling_price: 3200, stock_quantity: 25, minimum_stock: 5, unit: 'pcs' },
      { sku: 'HDD-1TB', name: 'WD Purple 1TB CCTV Surveillance Hard Drive', category_id: 10, brand: 'Western Digital', purchase_price: 6500, selling_price: 8500, stock_quantity: 12, minimum_stock: 3, unit: 'pcs' },
      { sku: 'HDD-2TB', name: 'WD Purple 2TB CCTV Surveillance Hard Drive', category_id: 10, brand: 'Western Digital', purchase_price: 11500, selling_price: 14800, stock_quantity: 8, minimum_stock: 2, unit: 'pcs' },
      { sku: 'SSD-128GB', name: 'Lexar 128GB 2.5" SATA III Internal SSD', category_id: 11, brand: 'Lexar', purchase_price: 2400, selling_price: 3400, stock_quantity: 30, minimum_stock: 5, unit: 'pcs' },
      { sku: 'SSD-256GB', name: 'Kingston 256GB NVMe M.2 SSD High Speed', category_id: 11, brand: 'Kingston', purchase_price: 4200, selling_price: 5800, stock_quantity: 20, minimum_stock: 5, unit: 'pcs' },
      { sku: 'SSD-512GB', name: 'Lexar 512GB NVMe M.2 High Speed SSD', category_id: 11, brand: 'Lexar', purchase_price: 7500, selling_price: 9800, stock_quantity: 14, minimum_stock: 3, unit: 'pcs' },

      // CCTV Cameras & DVRs
      { sku: 'CAM-2MP-OUT', name: 'Dahua 2MP Outdoor NightVision Bullet Camera', category_id: 8, brand: 'Dahua', purchase_price: 3500, selling_price: 4800, stock_quantity: 20, minimum_stock: 5, unit: 'pcs' },
      { sku: 'CAM-2MP-DOM', name: 'Dahua 2MP Indoor HD Dome Camera', category_id: 8, brand: 'Dahua', purchase_price: 3200, selling_price: 4400, stock_quantity: 22, minimum_stock: 5, unit: 'pcs' },
      { sku: 'CAM-HIK-2MP', name: 'Hikvision 2MP Turbo HD Bullet Camera', category_id: 8, brand: 'Hikvision', purchase_price: 3600, selling_price: 4900, stock_quantity: 18, minimum_stock: 4, unit: 'pcs' },
      { sku: 'DVR-4CH', name: 'Dahua 4-Channel Cooper XVR / DVR', category_id: 9, brand: 'Dahua', purchase_price: 8500, selling_price: 11500, stock_quantity: 10, minimum_stock: 2, unit: 'pcs' },
      { sku: 'DVR-8CH', name: 'Dahua 8-Channel WizSense XVR / DVR', category_id: 9, brand: 'Dahua', purchase_price: 13500, selling_price: 17800, stock_quantity: 6, minimum_stock: 2, unit: 'pcs' },

      // Power Supplies & Accessories
      { sku: 'PWR-12V2A', name: '12V 2A Single CCTV Camera Power Adapter', category_id: 14, brand: 'Generic', purchase_price: 300, selling_price: 550, stock_quantity: 50, minimum_stock: 10, unit: 'pcs' },
      { sku: 'PWR-12V10A', name: '12V 10A Centralized Metal Power Box 9-Port', category_id: 14, brand: 'Huntkey', purchase_price: 2200, selling_price: 3400, stock_quantity: 12, minimum_stock: 3, unit: 'pcs' },
      { sku: 'PWR-12V20A', name: '12V 20A Centralized Metal Power Box 18-Port', category_id: 14, brand: 'Huntkey', purchase_price: 3500, selling_price: 5200, stock_quantity: 8, minimum_stock: 2, unit: 'pcs' },
      { sku: 'MSE-A4T', name: 'A4Tech OP-620D USB Optical Mouse', category_id: 5, brand: 'A4Tech', purchase_price: 500, selling_price: 850, stock_quantity: 35, minimum_stock: 10, unit: 'pcs' },
      { sku: 'MSE-WIRELESS', name: 'A4Tech G3-200N Wireless Optical Mouse', category_id: 5, brand: 'A4Tech', purchase_price: 1200, selling_price: 1850, stock_quantity: 15, minimum_stock: 4, unit: 'pcs' },
      { sku: 'KBD-A4T', name: 'A4Tech KR-85 USB Standard Keyboard', category_id: 4, brand: 'A4Tech', purchase_price: 950, selling_price: 1450, stock_quantity: 20, minimum_stock: 5, unit: 'pcs' },
      { sku: 'NET-SW-8P', name: 'TP-Link 8-Port Desktop Network Switch', category_id: 15, brand: 'TP-Link', purchase_price: 1800, selling_price: 2600, stock_quantity: 16, minimum_stock: 4, unit: 'pcs' },
      { sku: 'NET-POE-4P', name: 'Dahua 4-Port PoE Switch for IP Cameras', category_id: 15, brand: 'Dahua', purchase_price: 5500, selling_price: 7800, stock_quantity: 7, minimum_stock: 2, unit: 'pcs' }
    ];

    const insertProd = database.prepare(`
      INSERT INTO products (sku, name, category_id, brand, purchase_price, selling_price, stock_quantity, minimum_stock, unit, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    for (const p of demoProducts) {
      insertProd.run(p.sku, p.name, p.category_id, p.brand, p.purchase_price, p.selling_price, p.stock_quantity, p.minimum_stock, p.unit);
    }
    console.log('[DB] Comprehensive CCTV & Computer shop product catalog seeded.');
  }
}


