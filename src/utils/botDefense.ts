/**
 * Bot Defense & Device/IP Ban Utility
 * 
 * Enforces immediate, permanent hardware/device bans and logs offending IP addresses
 * when automated scrapers, malicious actors, or bots trip hidden honeypots.
 */

const BOT_BAN_STORAGE_KEY = 'security_defense_device_banned';
const BOT_BAN_TIMESTAMP_KEY = 'security_defense_banned_at';
const BOT_BAN_REASON_KEY = 'security_defense_ban_reason';
const BOT_FINGERPRINT_KEY = 'security_defense_device_fp';

/**
 * Generates a stable client-side device/browser fingerprint for permanent blocking.
 */
export function getDeviceFingerprint(): string {
  if (typeof window === 'undefined') return 'unknown_node_env';

  try {
    const existing = localStorage.getItem(BOT_FINGERPRINT_KEY);
    if (existing) return existing;

    const screenData = typeof window.screen !== 'undefined'
      ? `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`
      : 'no_screen';
    const nav = typeof navigator !== 'undefined'
      ? `${navigator.userAgent || ''}|${navigator.language || ''}|${navigator.hardwareConcurrency || ''}|${navigator.platform || ''}`
      : 'no_nav';
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'no_tz';

    const raw = `${screenData}_${nav}_${tz}`;
    // Fast hash
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = (hash << 5) - hash + raw.charCodeAt(i);
      hash |= 0;
    }
    const fp = `dev_fp_${Math.abs(hash).toString(36)}_${Date.now().toString(36)}`;
    localStorage.setItem(BOT_FINGERPRINT_KEY, fp);
    return fp;
  } catch {
    return `dev_fp_fallback_${Math.random().toString(36).substring(2, 9)}`;
  }
}

/**
 * Checks if the current device or browser session is permanently banned.
 */
export function isDeviceBanned(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const localBan = localStorage.getItem(BOT_BAN_STORAGE_KEY);
    const sessionBan = sessionStorage.getItem(BOT_BAN_STORAGE_KEY);
    const cookieBan = document.cookie.includes(`${BOT_BAN_STORAGE_KEY}=true`);

    return localBan === 'true' || sessionBan === 'true' || cookieBan;
  } catch {
    return false;
  }
}

/**
 * Executes a permanent, merciless ban on the current device and notifies server defense.
 */
export async function banDeviceAndIP(reason: string = 'Automated bot attack / Honeypot triggered'): Promise<void> {
  const timestamp = new Date().toISOString();
  const fp = getDeviceFingerprint();

  try {
    // 1. Permanently ban in localStorage
    localStorage.setItem(BOT_BAN_STORAGE_KEY, 'true');
    localStorage.setItem(BOT_BAN_TIMESTAMP_KEY, timestamp);
    localStorage.setItem(BOT_BAN_REASON_KEY, reason);

    // 2. Ban in sessionStorage
    sessionStorage.setItem(BOT_BAN_STORAGE_KEY, 'true');
    sessionStorage.setItem(BOT_BAN_TIMESTAMP_KEY, timestamp);

    // 3. Ban in secure persistent Cookie
    document.cookie = `${BOT_BAN_STORAGE_KEY}=true; path=/; max-age=315360000; SameSite=Strict`;
  } catch (e) {
    console.error('Failed to write local ban flags:', e);
  }

  // 4. Report the ban and client IP/fingerprint to the backend defense endpoint
  try {
    const payload = {
      deviceFingerprint: fp,
      reason,
      timestamp,
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    };

    fetch('/api/block-ip', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }).catch(() => {
      // Ignore network errors on reporting
    });
  } catch {
    // Ignore network errors
  }
}
