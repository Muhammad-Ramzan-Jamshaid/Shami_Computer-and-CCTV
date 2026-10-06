import fs from 'fs';
import path from 'path';
import { getDatabasePath, getDb } from '../database/db';
import { SettingsService } from './SettingsService';

export class BackupService {
  static createBackup(targetFolder?: string): { success: boolean; filePath?: string; error?: string } {
    try {
      const dbPath = getDatabasePath();
      const db = getDb();
      db.save();

      if (!fs.existsSync(dbPath)) {
        return { success: false, error: 'Database file not found' };
      }

      const settings = SettingsService.getSettings();
      const destDir = targetFolder || settings.backup_location || path.dirname(dbPath);

      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      const dateStr = new Date().toISOString().slice(0, 10);
      const timestamp = new Date().getTime();
      const fileName = `ShamiComputer_Backup_${dateStr}_${timestamp}.db`;
      const targetPath = path.join(destDir, fileName);

      fs.copyFileSync(dbPath, targetPath);
      console.log('[Backup] Created backup at:', targetPath);
      return { success: true, filePath: targetPath };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  static restoreBackup(backupFilePath: string): { success: boolean; safetyBackupPath?: string; error?: string } {
    try {
      if (!fs.existsSync(backupFilePath)) {
        return { success: false, error: 'Selected backup file does not exist' };
      }

      const dbPath = getDatabasePath();
      const db = getDb();
      db.save();

      // 1. Create a safety backup of current active database before overwrite
      const dateStr = new Date().toISOString().slice(0, 10);
      const timestamp = new Date().getTime();
      const safetyBackupPath = path.join(path.dirname(dbPath), `SAFETY_BACKUP_BEFORE_RESTORE_${dateStr}_${timestamp}.db`);

      fs.copyFileSync(dbPath, safetyBackupPath);
      console.log('[Restore] Safety backup created at:', safetyBackupPath);

      // 2. Close existing db connection safely
      db.close();

      // 3. Overwrite current db file with backup file
      fs.copyFileSync(backupFilePath, dbPath);

      // Re-init database connection
      process.exit(0); // App restart after restore is standard & safe in Electron
      return { success: true, safetyBackupPath };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}
