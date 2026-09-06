import type { VercelRequest, VercelResponse } from '@vercel/node';

// In-memory blacklist for blocked IPs and device fingerprints on server runtime
export const blockedIpSet = new Set<string>();
export const blockedFingerprintSet = new Set<string>();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Extract client IP address from proxy / CDN headers
  const forwardedFor = req.headers['x-forwarded-for'];
  const realIp = req.headers['x-real-ip'];
  const socketIp = req.socket?.remoteAddress;

  let clientIp = 'unknown';
  if (typeof forwardedFor === 'string') {
    clientIp = forwardedFor.split(',')[0].trim();
  } else if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
    clientIp = forwardedFor[0].trim();
  } else if (typeof realIp === 'string') {
    clientIp = realIp.trim();
  } else if (socketIp) {
    clientIp = socketIp;
  }

  const { deviceFingerprint, reason, url, userAgent } = (req.body || {}) as {
    deviceFingerprint?: string;
    reason?: string;
    url?: string;
    userAgent?: string;
  };

  if (clientIp && clientIp !== 'unknown') {
    blockedIpSet.add(clientIp);
  }
  if (deviceFingerprint) {
    blockedFingerprintSet.add(deviceFingerprint);
  }

  const banRecord = {
    event: 'MALICIOUS_BOT_HONEYPOT_TRIGGERED',
    action: 'PERMANENT_IP_AND_DEVICE_BLOCK',
    clientIp,
    deviceFingerprint: deviceFingerprint || 'unknown',
    reason: reason || 'Honeypot field tripped',
    url: url || '',
    userAgent: userAgent || req.headers['user-agent'] || '',
    timestamp: new Date().toISOString(),
  };

  console.error('[🚨 SECURITY DEFENSE BAN APPLIED]:', JSON.stringify(banRecord, null, 2));

  return res.status(403).json({
    status: 'FORBIDDEN',
    error: 'Access Denied: Your IP address and device have been permanently blacklisted.',
    ip: clientIp,
  });
}
