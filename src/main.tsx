import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';
import { initAudioUnlock } from './utils/sound.ts';

// Prepare Web Audio context on first user tap/click
initAudioUnlock();

// Register service worker for PWA installability
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('New PWA update available.');
  },
  onOfflineReady() {
    console.log('App ready to work offline.');
  },
});

declare global {
  interface Window {
    deferredPrompt?: any;
    deferredInstallPrompt?: any;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
