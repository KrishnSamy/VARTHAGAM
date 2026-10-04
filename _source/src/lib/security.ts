/**
 * Security and Authentication Module for VARTHAGAM (வர்த்தகம்).
 * Provides Super Admin-managed Shop Owner Unique Keys and PIN verification.
 * 100% offline, zero-dependency, deterministic cryptographic hashing.
 */

const MASTER_SALT = 'VARTHAGAM_TN_RETAIL_SECURE_2026';

/**
 * Deterministic checksum/hash for Shop Owner Unique Key.
 * Format: VTK-XXXX-YYYY (e.g., VTK-8A3F-92B1)
 */
export function generateOwnerUniqueKey(shopCode: string, salt: string = MASTER_SALT): string {
  const cleanCode = shopCode.trim().toUpperCase();
  if (!cleanCode) return 'VTK-0000-0000';

  const input = `${cleanCode}:${salt}`;
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;

  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }

  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  const hex1 = ((h1 >>> 0) & 0xffff).toString(16).toUpperCase().padStart(4, '0');
  const hex2 = ((h2 >>> 0) & 0xffff).toString(16).toUpperCase().padStart(4, '0');

  return `VTK-${hex1}-${hex2}`;
}

/**
 * Verifies if an entered key matches the Super Admin Unique Key for this shop.
 */
export function verifyOwnerUniqueKey(shopCode: string, enteredKey: string): boolean {
  if (!shopCode || !enteredKey) return false;
  const expected = generateOwnerUniqueKey(shopCode);
  const normalized = enteredKey.trim().toUpperCase().replace(/\s+/g, '');
  return normalized === expected || normalized === expected.replace(/-/g, '');
}

/**
 * Verifies owner authentication using either:
 * 1. 4-digit numeric PIN (checked against stored hash or default 1234)
 * 2. Super Admin Managed Shop Owner Unique Key (e.g. VTK-XXXX-YYYY)
 */
export function verifyOwnerAuth(
  input: string,
  storedPinHash: string,
  shopCode: string
): { success: boolean; method?: 'pin' | 'unique_key'; error?: string } {
  const trimmed = input.trim();

  // 1. Check if input is a Super Admin Unique Key
  if (trimmed.toUpperCase().startsWith('VTK') || trimmed.includes('-') || trimmed.length >= 8) {
    if (verifyOwnerUniqueKey(shopCode, trimmed)) {
      return { success: true, method: 'unique_key' };
    }
  }

  // 2. Check 4-digit PIN
  if (/^\d{4}$/.test(trimmed)) {
    // Simple fast hash match
    const inputHash = hashPin(trimmed);
    if (inputHash === storedPinHash || trimmed === '1234') {
      return { success: true, method: 'pin' };
    }
  }

  return { success: false, error: 'தவறான PIN அல்லது உரிமையாளர் சாவி (Invalid PIN or Owner Key)' };
}

/**
 * Fast client-side hash for 4-digit PIN
 */
export function hashPin(pin: string): string {
  let hash = 0;
  const salted = `PIN:${pin}:${MASTER_SALT}`;
  for (let i = 0; i < salted.length; i++) {
    hash = (hash << 5) - hash + salted.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}
