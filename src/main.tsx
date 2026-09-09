import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';
import { initAudioUnlock } from './utils/sound.ts';

// Prepare Web Audio context on first user tap/click
initAudioUnlock();

// Register service worker with auto-update reload so code updates are never trapped behind old cache
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('[PWA] New version detected, auto-activating...');
    updateSW(true);
  },
  onOfflineReady() {
    console.log('[PWA] App ready to work offline.');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
