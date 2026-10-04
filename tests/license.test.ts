import { describe, it, expect, beforeEach } from 'vitest';
import * as ed from '@noble/ed25519';
import {
  base64UrlEncode,
  hexToBytes,
  verifyLicenseToken,
  checkAndRecordClock,
  computeSubscriptionState,
  DEFAULT_PUBLIC_KEY_HEX,
} from '../src/lib/license';

describe('Cryptographic License & Offline Enforcement (Section 7.5)', () => {
  // Mock localStorage for node/vitest environment
  let store: Record<string, string> = {};

  beforeEach(() => {
    store = {};
    global.localStorage = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, val: string) => { store[key] = val; },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { store = {}; },
      length: 0,
      key: () => null,
    } as any;
  });

  it('generates a valid Ed25519 token and successfully verifies it', async () => {
    const privKeyBytes = ed.utils.randomPrivateKey();
    const pubKeyBytes = await ed.getPublicKeyAsync(privKeyBytes);
    const pubKeyHex = Array.from(pubKeyBytes).map(b => b.toString(16).padStart(2, '0')).join('');

    const payload = {
      shopCode: 'KK-CH-001',
      plan: 'monthly' as const,
      issuedAt: Date.now(),
      validUntil: Date.now() + (30 * 86400000),
      nonce: 'testnonce123',
    };

    const payloadB64 = base64UrlEncode(JSON.stringify(payload));
    const messageBytes = new TextEncoder().encode(payloadB64);
    const signatureBytes = await ed.signAsync(messageBytes, privKeyBytes);
    const signatureB64 = base64UrlEncode(signatureBytes);

    const token = `${payloadB64}.${signatureB64}`;

    // Verify valid token
    const result = await verifyLicenseToken(token, 'KK-CH-001', pubKeyHex);
    expect(result.valid).toBe(true);
    expect(result.payload?.shopCode).toBe('KK-CH-001');
    expect(result.payload?.plan).toBe('monthly');
  });

  it('rejects a license token signed for a different shop code', async () => {
    const privKeyBytes = ed.utils.randomPrivateKey();
    const pubKeyBytes = await ed.getPublicKeyAsync(privKeyBytes);
    const pubKeyHex = Array.from(pubKeyBytes).map(b => b.toString(16).padStart(2, '0')).join('');

    const payload = {
      shopCode: 'KK-CH-001', // Intended for shop 1
      plan: 'monthly' as const,
      issuedAt: Date.now(),
      validUntil: Date.now() + (30 * 86400000),
      nonce: 'nonce1',
    };

    const payloadB64 = base64UrlEncode(JSON.stringify(payload));
    const messageBytes = new TextEncoder().encode(payloadB64);
    const signatureBytes = await ed.signAsync(messageBytes, privKeyBytes);
    const signatureB64 = base64UrlEncode(signatureBytes);
    const token = `${payloadB64}.${signatureB64}`;

    // Attempting to verify on shop 2 (KK-MD-999)
    const result = await verifyLicenseToken(token, 'KK-MD-999', pubKeyHex);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('பொருந்தவில்லை');
  });

  it('rejects a tampered or forged license token', async () => {
    const privKeyBytes = ed.utils.randomPrivateKey();
    const pubKeyBytes = await ed.getPublicKeyAsync(privKeyBytes);
    const pubKeyHex = Array.from(pubKeyBytes).map(b => b.toString(16).padStart(2, '0')).join('');

    const payload = {
      shopCode: 'KK-CH-001',
      plan: 'monthly' as const,
      issuedAt: Date.now(),
      validUntil: Date.now() + (30 * 86400000),
      nonce: 'nonce1',
    };

    const payloadB64 = base64UrlEncode(JSON.stringify(payload));
    const messageBytes = new TextEncoder().encode(payloadB64);
    const signatureBytes = await ed.signAsync(messageBytes, privKeyBytes);
    const signatureB64 = base64UrlEncode(signatureBytes);

    // Tamper with payload to extend validity by 10 years
    const tamperedPayload = { ...payload, validUntil: payload.validUntil + (3650 * 86400000) };
    const tamperedPayloadB64 = base64UrlEncode(JSON.stringify(tamperedPayload));
    const forgedToken = `${tamperedPayloadB64}.${signatureB64}`;

    const result = await verifyLicenseToken(forgedToken, 'KK-CH-001', pubKeyHex);
    expect(result.valid).toBe(false);
  });

  it('detects backwards clock tampering when system clock is set back by > 24 hours', () => {
    const fixedNow = 1760000000000;
    // Advance clock
    const firstCheck = checkAndRecordClock(fixedNow);
    expect(firstCheck.isTampered).toBe(false);

    // User moves device clock backward by 30 days
    const tamperedTime = fixedNow - (30 * 86400000);
    const tamperCheck = checkAndRecordClock(tamperedTime);
    expect(tamperCheck.isTampered).toBe(true);
    expect(tamperCheck.effectiveTime).toBe(fixedNow); // Does not allow moving backward
  });

  it('computes free trial state correctly for newly installed shop', async () => {
    const state = await computeSubscriptionState('KK-NEW-01', 14, 3);
    expect(state.status).toBe('trial');
    expect(state.daysRemaining).toBe(14);
    expect(state.isReadOnly).toBe(false);
  });
});
