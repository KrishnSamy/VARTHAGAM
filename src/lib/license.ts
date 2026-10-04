/**
 * Cryptographic Offline License Management for Kadai Kanakku (Section 7.5).
 * Uses Ed25519 digital signatures.
 * Token format: base64url(JSON(payload)) + "." + base64url(signatureBytes)
 */

import * as ed from '@noble/ed25519';

export interface LicensePayload {
  shopCode: string;
  plan: 'monthly' | 'quarterly' | 'yearly';
  issuedAt: number; // Unix timestamp in ms
  validUntil: number; // Unix timestamp in ms
  nonce: string; // Anti-replay random string
}

export type SubscriptionStatus = 'trial' | 'active' | 'grace' | 'expired' | 'suspended';

export interface SubscriptionState {
  status: SubscriptionStatus;
  daysRemaining: number;
  validUntil: number;
  isReadOnly: boolean;
  isInGracePeriod: boolean;
  clockTampered: boolean;
  messageTa: string;
  messageEn: string;
}

// Default embedded public key (Overridden by VITE_LICENSE_PUBLIC_KEY in .env)
export const DEFAULT_PUBLIC_KEY_HEX =
  import.meta.env.VITE_LICENSE_PUBLIC_KEY ||
  '24116fea73d3d53bcd7c2e39738a6094257e46d4e838fad1a74c3b3e86d4d576';

const STORAGE_KEYS = {
  TOKEN: 'kk_license_token',
  LATEST_TIME: 'kk_latest_time_seen',
  TRIAL_START: 'kk_trial_start_time',
  GRACE_DAYS: 'kk_grace_days',
  TRIAL_DAYS: 'kk_trial_days',
};

// Base64URL helpers
export function base64UrlEncode(data: string | Uint8Array): string {
  let base64 = '';
  if (typeof data === 'string') {
    base64 = btoa(unescape(encodeURIComponent(data)));
  } else {
    let binary = '';
    const bytes = data;
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    base64 = btoa(binary);
  }
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return decodeURIComponent(escape(atob(base64)));
}

export function base64UrlToBytes(str: string): Uint8Array {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.replace(/[^0-9a-fA-F]/g, '');
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return bytes;
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Clock Tamper Protection (Section 7.5):
 * Checks monotonic time. If system time moves backwards by more than 24 hours, flag as tampered.
 */
export function checkAndRecordClock(currentTimeMs: number = Date.now()): { isTampered: boolean; effectiveTime: number } {
  try {
    const rawStored = localStorage.getItem(STORAGE_KEYS.LATEST_TIME);
    const lastSeen = rawStored ? parseInt(rawStored, 10) : 0;

    // If device time shifted back by > 24 hours (86,400,000 ms)
    if (lastSeen > 0 && currentTimeMs < lastSeen - 86400000) {
      return { isTampered: true, effectiveTime: lastSeen };
    }

    // Advance monotonic clock
    if (currentTimeMs > lastSeen) {
      localStorage.setItem(STORAGE_KEYS.LATEST_TIME, currentTimeMs.toString());
    }

    return { isTampered: false, effectiveTime: Math.max(currentTimeMs, lastSeen) };
  } catch (e) {
    return { isTampered: false, effectiveTime: currentTimeMs };
  }
}

/**
 * Updates monotonic clock from trusted server time (e.g. HTTP Date header)
 */
export function updateTrustedTime(serverTimestampMs: number): void {
  try {
    const rawStored = localStorage.getItem(STORAGE_KEYS.LATEST_TIME);
    const lastSeen = rawStored ? parseInt(rawStored, 10) : 0;
    if (serverTimestampMs > lastSeen) {
      localStorage.setItem(STORAGE_KEYS.LATEST_TIME, serverTimestampMs.toString());
    }
  } catch (e) {
    // Ignore storage issues
  }
}

/**
 * Parses and verifies an Ed25519 signed license token for a given shopCode.
 */
export async function verifyLicenseToken(
  token: string,
  expectedShopCode: string,
  publicKeyHex = DEFAULT_PUBLIC_KEY_HEX
): Promise<{ valid: boolean; payload?: LicensePayload; error?: string }> {
  try {
    if (!token || !token.includes('.')) {
      return { valid: false, error: 'வடிவம் தவறானது (Invalid token format)' };
    }

    const [payloadB64, signatureB64] = token.split('.');
    const payloadJson = base64UrlDecode(payloadB64);
    const payload = JSON.parse(payloadJson) as LicensePayload;

    // Verify shopCode matches
    if (payload.shopCode.trim().toUpperCase() !== expectedShopCode.trim().toUpperCase()) {
      return { valid: false, error: 'கடை குறியீடு பொருந்தவில்லை (Shop code mismatch)' };
    }

    // Verify Ed25519 signature
    const messageBytes = new TextEncoder().encode(payloadB64);
    const signatureBytes = base64UrlToBytes(signatureB64);
    const pubKeyBytes = hexToBytes(publicKeyHex);

    const isSigValid = await ed.verifyAsync(signatureBytes, messageBytes, pubKeyBytes);
    if (!isSigValid) {
      return { valid: false, error: 'கையொப்பம் தவறானது (Invalid signature)' };
    }

    return { valid: true, payload };
  } catch (err: any) {
    return { valid: false, error: err?.message || 'Verification failed' };
  }
}

/**
 * Saves verified license token to local storage.
 */
export function saveLicenseToken(token: string): void {
  localStorage.setItem(STORAGE_KEYS.TOKEN, token.trim());
}

/**
 * Retrieves the currently stored license token.
 */
export function getStoredLicenseToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.TOKEN);
}

/**
 * Initializes or gets the trial start timestamp.
 */
export function getOrCreateTrialStartTime(): number {
  let start = localStorage.getItem(STORAGE_KEYS.TRIAL_START);
  if (!start) {
    const now = Date.now();
    localStorage.setItem(STORAGE_KEYS.TRIAL_START, now.toString());
    return now;
  }
  return parseInt(start, 10);
}

/**
 * Computes current comprehensive subscription state for the shop.
 */
export async function computeSubscriptionState(
  shopCode: string,
  trialDays = 14,
  graceDays = 3,
  publicKeyHex = DEFAULT_PUBLIC_KEY_HEX
): Promise<SubscriptionState> {
  const clockCheck = checkAndRecordClock();
  const now = clockCheck.effectiveTime;

  if (clockCheck.isTampered) {
    return {
      status: 'expired',
      daysRemaining: 0,
      validUntil: now,
      isReadOnly: true,
      isInGracePeriod: false,
      clockTampered: true,
      messageTa: 'போன் தேதி மற்றும் நேரம் தவறாக உள்ளது. தயவுசெய்து சரிசெய்யவும்.',
      messageEn: 'Device date & time is tampered. Please correct device time.',
    };
  }

  // 1. Check if valid license token exists
  const token = getStoredLicenseToken();
  if (token) {
    const verification = await verifyLicenseToken(token, shopCode, publicKeyHex);
    if (verification.valid && verification.payload) {
      const validUntil = verification.payload.validUntil;
      const gracePeriodEnd = validUntil + (graceDays * 86400000);

      if (now <= validUntil) {
        const msLeft = validUntil - now;
        const daysLeft = Math.ceil(msLeft / 86400000);
        return {
          status: 'active',
          daysRemaining: daysLeft,
          validUntil,
          isReadOnly: false,
          isInGracePeriod: false,
          clockTampered: false,
          messageTa: `செயலில் உள்ளது (${daysLeft} நாட்கள் மீதம்)`,
          messageEn: `Active subscription (${daysLeft} days remaining)`,
        };
      } else if (now <= gracePeriodEnd) {
        const msLeft = gracePeriodEnd - now;
        const graceDaysLeft = Math.ceil(msLeft / 86400000);
        return {
          status: 'grace',
          daysRemaining: graceDaysLeft,
          validUntil,
          isReadOnly: false,
          isInGracePeriod: true,
          clockTampered: false,
          messageTa: `சலுகை காலம் (${graceDaysLeft} நாட்கள் மீதம்). உடனே புதுப்பிக்கவும்!`,
          messageEn: `Grace period (${graceDaysLeft} days remaining). Please renew now!`,
        };
      } else {
        return {
          status: 'expired',
          daysRemaining: 0,
          validUntil,
          isReadOnly: true,
          isInGracePeriod: false,
          clockTampered: false,
          messageTa: 'சந்தா காலம் முடிந்தது. வாசிப்பு மட்டுமே அனுமதிக்கப்படும்.',
          messageEn: 'Subscription expired. Read-only mode active.',
        };
      }
    }
  }

  // 2. Fall back to free trial
  const trialStart = getOrCreateTrialStartTime();
  const trialEnd = trialStart + (trialDays * 86400000);

  if (now <= trialEnd) {
    const msLeft = trialEnd - now;
    const daysLeft = Math.min(trialDays, Math.max(0, Math.ceil(msLeft / 86400000)));
    return {
      status: 'trial',
      daysRemaining: daysLeft,
      validUntil: trialEnd,
      isReadOnly: false,
      isInGracePeriod: false,
      clockTampered: false,
      messageTa: `இலவச சோதனை காலம் (${daysLeft} நாட்கள் மீதம்)`,
      messageEn: `Free Trial (${daysLeft} days remaining)`,
    };
  }

  // Trial expired
  return {
    status: 'expired',
    daysRemaining: 0,
    validUntil: trialEnd,
    isReadOnly: true,
    isInGracePeriod: false,
    clockTampered: false,
    messageTa: 'சோதனை காலம் முடிந்தது. புதிய பில் போட சந்தா செலுத்தவும்.',
    messageEn: 'Free trial ended. Please subscribe to create new bills.',
  };
}
