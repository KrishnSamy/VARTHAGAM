import { describe, it, expect } from 'vitest';
import {
  rupeesToPaise,
  paiseToRupees,
  formatPaise,
  addPaise,
  subPaise,
  multiplyPaise,
  calculatePercentage,
} from '../src/lib/money';

describe('Money Utilities (Integer Paise Math)', () => {
  it('correctly converts decimal rupees to integer paise', () => {
    expect(rupeesToPaise(10)).toBe(1000);
    expect(rupeesToPaise(12.5)).toBe(1250);
    expect(rupeesToPaise(0.25)).toBe(25);
    expect(rupeesToPaise(0.01)).toBe(1);
    expect(rupeesToPaise(99.99)).toBe(9999);
    expect(rupeesToPaise(NaN)).toBe(0);
  });

  it('correctly converts integer paise to decimal rupees', () => {
    expect(paiseToRupees(1000)).toBe(10);
    expect(paiseToRupees(1250)).toBe(12.5);
    expect(paiseToRupees(25)).toBe(0.25);
    expect(paiseToRupees(0)).toBe(0);
  });

  it('formats paise in Indian currency convention without floating point artifacts', () => {
    expect(formatPaise(1000)).toBe('₹10');
    expect(formatPaise(1250)).toBe('₹12.50');
    expect(formatPaise(100000)).toBe('₹1,000');
    expect(formatPaise(15000000)).toBe('₹1,50,000'); // Indian numbering: 1,50,000
    expect(formatPaise(-5000)).toBe('-₹50');
    expect(formatPaise(0)).toBe('₹0');
  });

  it('safely adds multiple paise amounts', () => {
    expect(addPaise(1000, 2000, 3500)).toBe(6500);
    expect(addPaise(50, 50)).toBe(100);
    expect(addPaise(100, NaN, 200)).toBe(300);
  });

  it('safely subtracts paise amounts', () => {
    expect(subPaise(5000, 1500)).toBe(3500);
    expect(subPaise(1000, 2000)).toBe(-1000);
  });

  it('multiplies integer paise by factor and rounds to integer paise', () => {
    expect(multiplyPaise(1200, 3)).toBe(3600); // 3 teas at ₹12
    expect(multiplyPaise(1500, 0.5)).toBe(750); // half portion
    expect(multiplyPaise(100, 1.333)).toBe(133);
  });

  it('calculates percentage accurately', () => {
    expect(calculatePercentage(2500, 10000)).toBe(25);
    expect(calculatePercentage(1, 3)).toBe(33.3);
    expect(calculatePercentage(0, 0)).toBe(0);
  });
});
