import { useState, useRef, useEffect } from 'react';
import styles from './VersionBadge.module.css';

export const VersionBadge = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close the popup if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleReload = async () => {
    if (isReloading) return;
    setIsReloading(true);

    const performReload = () => {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('cb', Date.now().toString());
        window.location.href = url.toString();
        // Fallback reload if href assignment doesn't trigger immediately
        setTimeout(() => {
          window.location.reload();
        }, 150);
      } catch (e) {
        window.location.reload();
      }
    };

    try {
      // 1. Clear Cache Storage with a 1-second timeout
      if ('caches' in window) {
        await Promise.race([
          caches.keys().then(keys => Promise.all(keys.map(key => caches.delete(key)))),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Cache delete timeout')), 1000))
        ]).catch(err => console.warn(err));
      }
      
      // 2. Unregister Service Workers with a 1-second timeout
      if ('serviceWorker' in navigator) {
        await Promise.race([
          navigator.serviceWorker.getRegistrations().then(registrations => 
            Promise.all(registrations.map(r => r.unregister()))
          ),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Service worker unregister timeout')), 1000))
        ]).catch(err => console.warn(err));
      }
    } catch (err) {
      console.error('Error during update preparation:', err);
    } finally {
      performReload();
    }
  };

  const buildTime = typeof __BUILD_TIMESTAMP__ !== 'undefined' ? __BUILD_TIMESTAMP__ : 'Local Dev';
  const version = typeof __LIBRELUDO_VERSION__ !== 'undefined' ? __LIBRELUDO_VERSION__ : '0.0.0';

  return (
    <div className={styles.badgeContainer} ref={containerRef}>
      <button 
        type="button"
        className={styles.badgeButton} 
        onClick={() => setIsOpen(!isOpen)}
        title={`Version: v${version}`}
      >
        v
      </button>

      {isOpen && (
        <div className={styles.popover}>
          <div className={styles.popoverHeader}>
            <span className={styles.title}>BUILD INFO</span>
            <button 
              type="button" 
              className={styles.closeBtn} 
              onClick={() => setIsOpen(false)}
            >
              &times;
            </button>
          </div>
          <div className={styles.content}>
            <div className={styles.row}>
              <span className={styles.label}>Version:</span>
              <span className={styles.value}>v{version}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Build Time:</span>
              <span className={styles.timestampValue}>{buildTime}</span>
            </div>
            <button 
              type="button" 
              className={styles.reloadBtn} 
              onClick={handleReload}
              disabled={isReloading}
            >
              {isReloading ? 'RELOADING...' : 'FORCE UPDATE / RELOAD'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
