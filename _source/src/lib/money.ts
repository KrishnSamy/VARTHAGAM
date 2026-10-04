/**
 * Money utilities for Kadai Kanakku.
 * All monetary amounts are stored as integers in paise (1 INR = 100 paise).
 * Floating-point numbers are NEVER stored or used for persistent money calculations.
 */

/**
 * Converts a floating-point rupee amount into integer paise with safe rounding.
 * e.g., 45.5 -> 4550, 10 -> 1000
 */
export function rupeesToPaise(rupees: number): number {
  if (isNaN(rupees) || !isFinite(rupees)) return 0;
  return Math.round(rupees * 100);
}

/**
 * Converts integer paise into decimal rupees for display.
 * e.g., 4550 -> 45.5, 1000 -> 10
 */
export function paiseToRupees(paise: number): number {
  if (isNaN(paise) || !isFinite(paise)) return 0;
  return paise / 100;
}

/**
 * Formats integer paise into Indian currency string.
 * e.g., 100000 paise -> "₹1,000"
 * e.g., 4550 paise -> "₹45.50"
 */
export function formatPaise(paise: number, showDecimalsIfZero = false): string {
  if (isNaN(paise) || !isFinite(paise)) return '₹0';
  const isNegative = paise < 0;
  const absPaise = Math.abs(paise);
  const rupees = absPaise / 100;

  let formatted: string;
  const hasSubRupee = absPaise % 100 !== 0;

  if (hasSubRupee || showDecimalsIfZero) {
    formatted = rupees.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } else {
    formatted = Math.floor(rupees).toLocaleString('en-IN', {
      maximumFractionDigits: 0,
    });
  }

  return `${isNegative ? '-' : ''}₹${formatted}`;
}

/**
 * Adds two or more paise amounts safely.
 */
export function addPaise(...amounts: number[]): number {
  return amounts.reduce((acc, curr) => acc + (isNaN(curr) ? 0 : Math.round(curr)), 0);
}

/**
 * Subtracts b from a in paise.
 */
export function subPaise(a: number, b: number): number {
  return (isNaN(a) ? 0 : Math.round(a)) - (isNaN(b) ? 0 : Math.round(b));
}

/**
 * Multiplies an integer paise amount by a quantity or factor and rounds to integer paise.
 */
export function multiplyPaise(paise: number, factor: number): number {
  if (isNaN(paise) || isNaN(factor)) return 0;
  return Math.round(paise * factor);
}

/**
 * Calculates percentage of part over total safely (returns float percentage, e.g., 25.5 for 25.5%).
 */
export function calculatePercentage(partPaise: number, totalPaise: number): number {
  if (!totalPaise || totalPaise === 0) return 0;
  return Number(((partPaise / totalPaise) * 100).toFixed(1));
}
