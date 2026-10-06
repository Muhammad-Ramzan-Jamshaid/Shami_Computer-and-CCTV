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
    <div style={{ padding: '24px', height: '100%', overflowY: 'auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#f8fafc' }}>Database Backup & Restore</h1>
        <p style={{ fontSize: '13px', color: '#94a3b8' }}>Protect your business data with offline database backups</p>
      </div>

      {statusMessage && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#10b981', padding: '14px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', whiteSpace: 'pre-wrap' }}>
          <CheckCircle2 size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
          {statusMessage}
        </div>
      )}

      {errorMessage && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#ef4444', padding: '14px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px' }}>
          <ShieldAlert size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
          {errorMessage}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Backup Now Card */}
        <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ backgroundColor: 'rgba(37, 99, 235, 0.2)', padding: '12px', borderRadius: '10px' }}>
              <Download size={24} color="#3b82f6" />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#f8fafc' }}>Create Backup Now</h2>
              <p style={{ fontSize: '12px', color: '#94a3b8' }}>Generate instant SQLite database snapshot file</p>
            </div>
          </div>

          <p style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '20px', lineHeight: '1.5' }}>
            Creates a timestamped backup copy (e.g. <code>ShamiComputer_Backup_2026-10-06.db</code>) inside your local application directory.
          </p>

          <button
            onClick={handleBackupNow}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Database size={18} /> Backup Database Now
          </button>
        </div>

        {/* Restore Backup Card */}
        <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', padding: '12px', borderRadius: '10px' }}>
              <Upload size={24} color="#ef4444" />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#f8fafc' }}>Restore Backup</h2>
              <p style={{ fontSize: '12px', color: '#94a3b8' }}>Restore database from a saved .db file</p>
            </div>
          </div>

          <p style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '20px', lineHeight: '1.5' }}>
            A safety backup of the active database will automatically be created before any restore operation.
          </p>

          <button
            onClick={() => setShowRestoreModal(true)}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#334155',
              color: '#f8fafc',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Upload size={18} /> Restore Database File...
          </button>
        </div>
      </div>

      {/* Restore Warning Modal */}
      {showRestoreModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#1e293b', border: '1px solid #ef4444', borderRadius: '12px', width: '460px', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#ef4444', marginBottom: '12px' }}>
              ⚠️ Restore Database Warning
            </h3>
            <p style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '16px' }}>
              Restoring a backup will replace current live data. A safety copy of your current active data will be saved automatically first.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Backup File Absolute Path (.db)</label>
              <input
                type="text"
                placeholder="C:\Users\...\ShamiComputer_Backup.db"
                value={restoreFilePath}
                onChange={e => setRestoreFilePath(e.target.value)}
                style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '12px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleConfirmRestore}
                style={{ flex: 1, padding: '10px', backgroundColor: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Confirm Restore
              </button>
              <button
                onClick={() => setShowRestoreModal(false)}
                style={{ padding: '10px 16px', backgroundColor: '#334155', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
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
