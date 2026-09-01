import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface PWAContextType {
  installPrompt: any;
  setInstallPrompt: (prompt: any) => void;
  isStandalone: boolean;
  isIOS: boolean;
  isMobile: boolean;
}

const PWAContext = createContext<PWAContextType>({
  installPrompt: null,
  setInstallPrompt: () => {},
  isStandalone: false,
  isIOS: false,
  isMobile: false,
});

export const usePWA = () => useContext(PWAContext);

export const PWAProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [installPrompt, setInstallPrompt] = useState<any>(() => (typeof window !== 'undefined' ? (window as any).deferredInstallPrompt : null));
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    // Check if app is already installed / opened in standalone mode
    const standaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches || 
      window.matchMedia('(display-mode: fullscreen)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standaloneMode);

    // Detect mobile / iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    const mobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent) ||
      (window.matchMedia && window.matchMedia('(max-width: 768px)').matches && 'ontouchstart' in window);
    setIsIOS(iosDevice);
    setIsMobile(mobileDevice);

    // If early script captured the event before React mounted
    if ((window as any).deferredInstallPrompt) {
      setInstallPrompt((window as any).deferredInstallPrompt);
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      (window as any).deferredInstallPrompt = e;
      setInstallPrompt(e);
    };

    const handlePromptReady = () => {
      if ((window as any).deferredInstallPrompt) {
        setInstallPrompt((window as any).deferredInstallPrompt);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('deferredpromptready', handlePromptReady);

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      (window as any).deferredInstallPrompt = null;
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
    <PWAContext.Provider value={{ installPrompt, setInstallPrompt, isStandalone, isIOS, isMobile }}>
      {children}
    </PWAContext.Provider>
  );
};
