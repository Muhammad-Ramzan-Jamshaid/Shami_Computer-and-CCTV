import { getDb } from '../database/db';
import { ShopSettings } from '../../shared/types';

export class SettingsService {
  static getSettings(): ShopSettings {
    const db = getDb();
    const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
    const map: Record<string, string> = {};
    for (const r of rows) {
      map[r.key] = r.value;
    }

    return {
      shop_name: map.shop_name || 'Shami Computer and CCTV',
      address: map.address || 'Safa Wala Chowk, near Habib Shah Hospital, Farooqabad, District Sheikhupura',
      phone: map.phone || '0306 4565908',
      invoice_footer: map.invoice_footer || 'Thank you for your business!',
      return_policy: map.return_policy || '7 Days warranty with original invoice.',
      show_sku: map.show_sku === 'true',
      show_customer: map.show_customer === 'true',
      show_discount: map.show_discount === 'true',
      allow_negative_stock: map.allow_negative_stock === 'true',
      backup_location: map.backup_location || '',
      auto_backup: map.auto_backup !== 'false'
    };
  }

  static updateSettings(settings: Partial<ShopSettings>): { success: boolean; error?: string } {
    const db = getDb();
    try {
      const updateStmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
      const tx = db.transaction(() => {
        for (const [key, val] of Object.entries(settings)) {
          updateStmt.run(key, String(val));
        }
      });
      tx();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}
