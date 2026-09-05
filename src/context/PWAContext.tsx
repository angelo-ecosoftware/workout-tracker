import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// import { processOfflineQueue, getQueuedOfflineSessions } from '../utils/offlineQueue.ts';

interface PWAContextType {
  installPrompt: BeforeInstallPromptEvent | null;
  setInstallPrompt: (prompt: BeforeInstallPromptEvent | null) => void;
  isStandalone: boolean;
  isIOS: boolean;
  isMobile: boolean;
  isOnline: boolean;
  pendingSyncCount: number;
  triggerManualSync: () => Promise<void>;
}

const PWAContext = createContext<PWAContextType>({
  installPrompt: null,
  setInstallPrompt: () => {},
  isStandalone: false,
  isIOS: false,
  isMobile: false,
  isOnline: true,
  pendingSyncCount: 0,
  triggerManualSync: async () => {},
});

export const usePWA = () => useContext(PWAContext);

export const PWAProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    return typeof window !== 'undefined' ? (window.deferredInstallPrompt ?? null) : null;
  });
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

  const refreshPendingCount = async () => {
    // Offline queue temporarily disabled
    /*
    try {
      const queued = await getQueuedOfflineSessions();
      setPendingSyncCount(queued.length);
    } catch (e) {
      console.warn('Failed to inspect offline queue count:', e);
    }
    */
    setPendingSyncCount(0);
  };

  const triggerManualSync = async () => {
    // Offline queue temporarily disabled
    /*
    if (!navigator.onLine) return;
    try {
      await processOfflineQueue();
      await refreshPendingCount();
    } catch (e) {
      console.warn('Manual sync trigger failed:', e);
    }
    */
  };

  useEffect(() => {
    // Online / Offline network listeners
    const handleOnline = async () => {
      setIsOnline(true);
      // Offline queue auto-flush disabled for now
      /*
      await processOfflineQueue();
      await refreshPendingCount();
      */
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleQueueUpdate = () => {
      refreshPendingCount();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('offline_queue_updated', handleQueueUpdate);

    // Initial check
    refreshPendingCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('offline_queue_updated', handleQueueUpdate);
    };
  }, []);

  useEffect(() => {
    // Check if app is already installed / opened in standalone mode
    const standaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches || 
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.navigator.standalone === true;
    setIsStandalone(standaloneMode);

    // Detect mobile / iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    const mobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent) ||
      (window.matchMedia && window.matchMedia('(max-width: 768px)').matches && 'ontouchstart' in window);
    setIsIOS(iosDevice);
    setIsMobile(mobileDevice);

    // If early script captured the event before React mounted
    if (window.deferredInstallPrompt) {
      setInstallPrompt(window.deferredInstallPrompt);
    }

    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      window.deferredInstallPrompt = e;
      setInstallPrompt(e);
    };

    const handlePromptReady = () => {
      if (window.deferredInstallPrompt) {
        setInstallPrompt(window.deferredInstallPrompt);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('deferredpromptready', handlePromptReady);

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      window.deferredInstallPrompt = null;
      setIsStandalone(true);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('deferredpromptready', handlePromptReady);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  return (
    <PWAContext.Provider value={{
      installPrompt,
      setInstallPrompt,
      isStandalone,
      isIOS,
      isMobile,
      isOnline,
      pendingSyncCount,
      triggerManualSync,
    }}>
      {children}
    </PWAContext.Provider>
  );
};
