import { describe, it, expect } from 'vitest';
import { generateBillNumber, formatBillDate, formatBillTime } from '../src/lib/billUtils';

describe('Bill Utils & Shop Code Prefix Enforcement', () => {
  it('generates bill number starting strictly with shop code', () => {
    const fixedDate = new Date('2026-10-05T10:30:00Z');
    const bill = generateBillNumber('KAI101', 14, fixedDate);
    expect(bill).toBe('KAI101-261005-014');
  });

  it('handles string tokens with letters e.g. T-005', () => {
    const fixedDate = new Date('2026-10-05T10:30:00Z');
    const bill = generateBillNumber('MDU09', 'T-005', fixedDate);
    expect(bill).toBe('MDU09-261005-005');
  });

  it('falls back gracefully to VT prefix when shop code is undefined or empty', () => {
    const fixedDate = new Date('2026-10-05T10:30:00Z');
    const bill = generateBillNumber(undefined, 1, fixedDate);
    expect(bill).toBe('VT-261005-001');
  });
});
