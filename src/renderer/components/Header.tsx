import React, { useState, useEffect } from 'react';
import { WifiOff, Clock, UserCheck, Sun, Moon, Download, RefreshCw, CheckCircle2 } from 'lucide-react';
import { User, ShopSettings } from '../../shared/types';

interface HeaderProps {
  currentUser: User | null;
  shopSettings: ShopSettings | null;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentUser, shopSettings, theme, onToggleTheme }) => {
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

  const isLight = theme === 'light';

  return (
    <header style={{
      height: '60px',
      backgroundColor: 'var(--bg-header)',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      transition: 'background-color 0.2s ease, border-color 0.2s ease'
    }}>
      <div>
        <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-main)' }}>
          {shopSettings?.shop_name || 'Shami Computer and CCTV'}
        </h2>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
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
              padding: '6px 14px',
              borderRadius: '20px',
              border: 'none',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            <CheckCircle2 size={15} /> Update Ready! Click to Restart
          </button>
        ) : downloadProgress !== null ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            <RefreshCw size={14} className="animate-spin" /> Downloading Update {downloadProgress}%
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
              padding: '6px 14px',
              borderRadius: '20px',
              border: 'none',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            <Download size={14} /> New Version Available — Download
          </button>
        ) : null}

        {/* Dark / Bright Mode Toggle Button */}
        <button
          onClick={onToggleTheme}
          title={isLight ? 'Switch to Dark Mode' : 'Switch to Bright Mode'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--bg-input)',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            padding: '6px 14px',
            color: 'var(--text-main)',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          {isLight ? (
            <>
              <Moon size={15} color="#f59e0b" />
              <span>Dark Mode</span>
            </>
          ) : (
            <>
              <Sun size={15} color="#f59e0b" />
              <span>Bright Mode</span>
            </>
          )}
        </button>

        {/* Offline indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: 'var(--bg-input)',
          padding: '6px 12px',
          borderRadius: '20px',
          border: '1px solid var(--border-color)',
          fontSize: '12px',
          color: '#10b981',
          fontWeight: '500'
        }}>
          <WifiOff size={14} color="#10b981" />
          <span>Local DB</span>
        </div>

        {/* Current Time */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '13px',
          color: 'var(--text-sub)',
          fontFamily: 'monospace'
        }}>
          <Clock size={15} color="#3b82f6" />
          <span>{timeStr}</span>
        </div>

        {/* User profile info */}
        {currentUser && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--bg-input)',
            padding: '6px 14px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)'
          }}>
            <UserCheck size={16} color="#60a5fa" />
            <span style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: '600' }}>{currentUser.name}</span>
          </div>
        )}
      </div>
    </header>
  );
};
