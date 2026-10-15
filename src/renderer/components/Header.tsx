import React, { useState, useEffect } from 'react';
import { WifiOff, Clock, UserCheck, Sun, Moon, Download, RefreshCw, CheckCircle2 } from 'lucide-react';
import { User, ShopSettings } from '../../shared/types';

interface HeaderProps {
  currentUser: User | null;
  shopSettings: ShopSettings | null;
}

export const Header: React.FC<HeaderProps> = ({ currentUser, shopSettings }) => {
  const [timeStr, setTimeStr] = useState<string>('');
  
  // Auto Updater State
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [updateDownloaded, setUpdateDownloaded] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' - ' + now.toLocaleDateString());
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (window.api) {
      window.api.onUpdateAvailable((info) => {
        setUpdateAvailable(true);
        setUpdateInfo(info);
      });

      window.api.onUpdateProgress((progress) => {
        if (progress?.percent) {
          setDownloadProgress(Math.round(progress.percent));
        }
      });

      window.api.onUpdateDownloaded((info) => {
        setUpdateDownloaded(true);
        setDownloadProgress(null);
      });
    }
  }, []);

  const handleDownload = async () => {
    if (window.api?.downloadUpdate) {
      setDownloadProgress(0);
      await window.api.downloadUpdate();
    }
  };

  const handleInstall = () => {
    if (window.api?.quitAndInstall) {
      window.api.quitAndInstall();
    }
  };

  return (
    <header style={{
      height: '64px',
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px'
    }}>
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>
          {shopSettings?.shop_name || 'Shami Computer and CCTV'}
        </h2>
        <p style={{ fontSize: '13px', color: '#64748b', margin: '3px 0 0 0' }}>
          {shopSettings?.address || 'Safa Wala Chowk, Farooqabad'}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Auto Update Notification Banner */}
        {updateDownloaded ? (
          <button
            onClick={handleInstall}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#10b981',
              color: '#ffffff',
              padding: '7px 16px',
              borderRadius: '20px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            <CheckCircle2 size={16} /> Update Ready! Click to Restart
          </button>
        ) : downloadProgress !== null ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            padding: '7px 16px',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: 'bold'
          }}>
            <RefreshCw size={15} className="animate-spin" /> Downloading Update {downloadProgress}%
          </div>
        ) : updateAvailable ? (
          <button
            onClick={handleDownload}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#f59e0b',
              color: '#ffffff',
              padding: '7px 16px',
              borderRadius: '20px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            <Download size={15} /> New Version Available — Download
          </button>
        ) : null}

        {/* Offline indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: '#f1f5f9',
          padding: '6px 14px',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          fontSize: '13px',
          color: '#059669',
          fontWeight: '600'
        }}>
          <WifiOff size={15} color="#059669" />
          <span>Local DB</span>
        </div>

        {/* Current Time */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '14px',
          color: '#334155',
          fontFamily: 'monospace',
          fontWeight: '500'
        }}>
          <Clock size={16} color="#2563eb" />
          <span>{timeStr}</span>
        </div>

        {/* User profile info */}
        {currentUser && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#f8fafc',
            padding: '7px 16px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <UserCheck size={18} color="#2563eb" />
            <span style={{ fontSize: '14px', color: '#0f172a', fontWeight: '600' }}>{currentUser.name}</span>
          </div>
        )}
      </div>
    </header>
  );
};
