import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isDeviceBanned, banDeviceAndIP, getDeviceFingerprint } from '../../../src/utils/botDefense.ts';

describe('Bot Defense & Device/IP Ban Engine', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie = '';
    vi.clearAllMocks();
  });

  it('1. Returns false when device is unbanned', () => {
    expect(isDeviceBanned()).toBe(false);
  });

  it('2. Permanently bans device across localStorage, sessionStorage, and cookies when triggered', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as any)
    );

    await banDeviceAndIP('Honeypot trap triggered');

    expect(isDeviceBanned()).toBe(true);
    expect(localStorage.getItem('security_defense_device_banned')).toBe('true');
    expect(sessionStorage.getItem('security_defense_device_banned')).toBe('true');
    expect(document.cookie).toContain('security_defense_device_banned=true');

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/block-ip',
      expect.objectContaining({
        method: 'POST',
      })
    );

    fetchSpy.mockRestore();
  });

  it('3. Generates and persists a unique hardware/device fingerprint', () => {
    const fp1 = getDeviceFingerprint();
    const fp2 = getDeviceFingerprint();

    expect(fp1).toBeDefined();
    expect(fp1.startsWith('dev_fp_')).toBe(true);
    expect(fp1).toBe(fp2);
  });
});
