import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface PWAContextType {
  installPrompt: any;
  setInstallPrompt: (prompt: any) => void;
}

const PWAContext = createContext<PWAContextType>({
  installPrompt: null,
  setInstallPrompt: () => {},
});

export const usePWA = () => useContext(PWAContext);

export const PWAProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  return (
    <PWAContext.Provider value={{ installPrompt, setInstallPrompt }}>
      {children}
    </PWAContext.Provider>
  );
};
