import { describe, it, expect } from 'vitest';
import { generateOwnerUniqueKey, verifyOwnerUniqueKey, verifyOwnerAuth, hashPin } from '../src/lib/security';

describe('Security & Owner Authentication Module', () => {
  it('generates consistent unique keys for the same shop code', () => {
    const key1 = generateOwnerUniqueKey('KK-CH-001');
    const key2 = generateOwnerUniqueKey('KK-CH-001');
    const keyCase = generateOwnerUniqueKey('kk-ch-001');

    expect(key1).toBe(key2);
    expect(key1).toBe(keyCase);
    expect(key1).toMatch(/^VTK-[0-9A-F]{4}-[0-9A-F]{4}$/);
  });

  it('generates different unique keys for different shop codes', () => {
    const keyA = generateOwnerUniqueKey('KK-CH-001');
    const keyB = generateOwnerUniqueKey('KK-MD-002');
    expect(keyA).not.toBe(keyB);
  });

  it('verifies valid unique keys successfully with or without hyphens', () => {
    const shopCode = 'VT-9921';
    const validKey = generateOwnerUniqueKey(shopCode);

    expect(verifyOwnerUniqueKey(shopCode, validKey)).toBe(true);
    expect(verifyOwnerUniqueKey(shopCode, validKey.replace(/-/g, ''))).toBe(true);
    expect(verifyOwnerUniqueKey(shopCode, validKey.toLowerCase())).toBe(true);
    expect(verifyOwnerUniqueKey(shopCode, 'VTK-0000-0000')).toBe(false);
  });

  it('verifies owner authentication via default PIN or custom PIN hash', () => {
    const defaultRes = verifyOwnerAuth('1234', 'somehash', 'VT-100');
    expect(defaultRes.success).toBe(true);
    expect(defaultRes.method).toBe('pin');

    const customPin = '8899';
    const customHash = hashPin(customPin);
    const customRes = verifyOwnerAuth(customPin, customHash, 'VT-100');
    expect(customRes.success).toBe(true);
    expect(customRes.method).toBe('pin');

    const wrongPin = verifyOwnerAuth('9999', customHash, 'VT-100');
    expect(wrongPin.success).toBe(false);
  });

  it('verifies owner authentication via Super Admin Unique Key', () => {
    const shopCode = 'VT-100';
    const uniqueKey = generateOwnerUniqueKey(shopCode);

    const keyRes = verifyOwnerAuth(uniqueKey, 'somehash', shopCode);
    expect(keyRes.success).toBe(true);
    expect(keyRes.method).toBe('unique_key');
  });
});
