import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface PWAContextType {
  installPrompt: any;
  setInstallPrompt: (prompt: any) => void;
  isStandalone: boolean;
  isIOS: boolean;
}

const PWAContext = createContext<PWAContextType>({
  installPrompt: null,
  setInstallPrompt: () => {},
  isStandalone: false,
  isIOS: false,
});

export const usePWA = () => useContext(PWAContext);

export const PWAProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);

  useEffect(() => {
    // Check if app is already installed / opened in standalone mode
    const standaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;
    setIsStandalone(standaloneMode);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(iosDevice);

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  return (
    <PWAContext.Provider value={{ installPrompt, setInstallPrompt, isStandalone, isIOS }}>
      {children}
    </PWAContext.Provider>
  );
};
