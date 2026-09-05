/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// ============================================================================
// PWA & Browser Ambient Type Declarations
// ============================================================================

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface DetectedBarcode {
  boundingBox: DOMRectReadOnly;
  cornerPoints: { x: number; y: number }[];
  format: string;
  rawValue: string;
}

interface BarcodeDetectorOptions {
  formats?: string[];
}

declare class BarcodeDetector {
  constructor(options?: BarcodeDetectorOptions);
  static getSupportedFormats(): Promise<string[]>;
  detect(image: CanvasImageSource | TexImageSource | HTMLVideoElement): Promise<DetectedBarcode[]>;
}

interface WakeLockSentinel extends EventTarget {
  readonly released: boolean;
  readonly type: 'screen';
  release(): Promise<void>;
  onrelease: ((this: WakeLockSentinel, ev: Event) => void) | null;
}

interface WakeLock {
  request(type: 'screen'): Promise<WakeLockSentinel>;
}

interface ExtendedMediaTrackCapabilities extends MediaTrackCapabilities {
  torch?: boolean;
}

interface ExtendedMediaTrackConstraintSet extends MediaTrackConstraintSet {
  torch?: boolean;
}

interface Navigator {
  readonly wakeLock?: WakeLock;
  readonly standalone?: boolean;
}

interface Window {
  deferredPrompt?: BeforeInstallPromptEvent | null;
  deferredInstallPrompt?: BeforeInstallPromptEvent | null;
  webkitAudioContext?: typeof AudioContext;
  BarcodeDetector?: typeof BarcodeDetector;
}

interface WindowEventMap {
  beforeinstallprompt: BeforeInstallPromptEvent;
  deferredpromptready: Event;
  offline_queue_updated: Event;
  workout_settings_updated: Event;
  user_profile_updated: Event;
}

