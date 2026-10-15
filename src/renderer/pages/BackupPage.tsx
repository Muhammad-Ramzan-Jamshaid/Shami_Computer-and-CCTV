import React, { useState } from 'react';
import { Database, Download, Upload, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const BackupPage: React.FC = () => {
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [restoreFilePath, setRestoreFilePath] = useState<string>('');
  const [showRestoreModal, setShowRestoreModal] = useState<boolean>(false);

  const handleBackupNow = async () => {
    setStatusMessage('');
    setErrorMessage('');
    try {
      const res = await window.api.createBackup();
      if (res.success && res.filePath) {
        setStatusMessage(`Backup created successfully at:\n${res.filePath}`);
      } else {
        setErrorMessage(res.error || 'Backup failed');
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleConfirmRestore = async () => {
    if (!restoreFilePath.trim()) {
      setErrorMessage('Please enter valid backup file path');
      return;
    }
    setStatusMessage('');
    setErrorMessage('');
    try {
      const res = await window.api.restoreBackup(restoreFilePath.trim());
      if (res.success) {
        setStatusMessage('Database restored successfully! Application will restart.');
      } else {
        setErrorMessage(res.error || 'Restore failed');
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  return (
    <div style={{ padding: '24px', height: '100%', overflowY: 'auto', backgroundColor: '#f1f5f9' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a' }}>Database Backup & Restore</h1>
        <p style={{ fontSize: '14px', color: '#64748b', marginTop: '3px' }}>Protect your business data with offline database backups</p>
      </div>

      {statusMessage && (
        <div style={{ backgroundColor: '#dcfce7', border: '1px solid #86efac', color: '#15803d', padding: '14px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', whiteSpace: 'pre-wrap' }}>
          <CheckCircle2 size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
          {statusMessage}
        </div>
      )}

      {errorMessage && (
        <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '14px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
          <ShieldAlert size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
          {errorMessage}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Backup Now Card */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ backgroundColor: '#eff6ff', padding: '12px', borderRadius: '10px' }}>
              <Download size={26} color="#2563eb" />
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 'bold', color: '#0f172a' }}>Create Backup Now</h2>
              <p style={{ fontSize: '13.5px', color: '#64748b' }}>Generate instant SQLite database snapshot file</p>
            </div>
          </div>

          <p style={{ fontSize: '14px', color: '#475569', marginBottom: '20px', lineHeight: '1.5' }}>
            Creates a timestamped backup copy (e.g. <code>ShamiComputer_Backup_2026-10-06.db</code>) inside your local application directory.
          </p>

          <button
            onClick={handleBackupNow}
            style={{
              width: '100%',
              padding: '13px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '15px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 1px 2px rgba(37,99,235,0.2)'
            }}
          >
            <Database size={18} /> Backup Database Now
          </button>
        </div>

        {/* Restore Backup Card */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ backgroundColor: '#fef2f2', padding: '12px', borderRadius: '10px' }}>
              <Upload size={26} color="#dc2626" />
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 'bold', color: '#0f172a' }}>Restore Backup</h2>
              <p style={{ fontSize: '13.5px', color: '#64748b' }}>Restore database from a saved .db file</p>
            </div>
          </div>

          <p style={{ fontSize: '14px', color: '#475569', marginBottom: '20px', lineHeight: '1.5' }}>
            A safety backup of the active database will automatically be created before any restore operation.
          </p>

          <button
            onClick={() => setShowRestoreModal(true)}
            style={{
              width: '100%',
              padding: '13px',
              backgroundColor: '#ffffff',
              color: '#dc2626',
              border: '1px solid #fca5a5',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '15px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
            }}
          >
            <Upload size={18} /> Restore Database File...
          </button>
        </div>
      </div>

      {/* Restore Warning Modal */}
      {showRestoreModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', width: '480px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 'bold', color: '#dc2626', marginBottom: '12px' }}>
              ⚠️ Restore Database Warning
            </h3>
            <p style={{ fontSize: '14px', color: '#475569', marginBottom: '16px' }}>
              Restoring a backup will replace current live data. A safety copy of your current active data will be saved automatically first.
            </p>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '13.5px', color: '#334155', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Backup File Absolute Path (.db)</label>
              <input
                type="text"
                placeholder="C:\Users\...\ShamiComputer_Backup.db"
                value={restoreFilePath}
                onChange={e => setRestoreFilePath(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#0f172a', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleConfirmRestore}
                style={{ flex: 1, padding: '12px', backgroundColor: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '14.5px', cursor: 'pointer' }}
              >
                Confirm Restore
              </button>
              <button
                onClick={() => setShowRestoreModal(false)}
                style={{ padding: '12px 18px', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
