/**
 * Utility functions for luxury bill numbering and formatting.
 * Ensures every bill starts with the shop code (e.g., KAI101-261005-001).
 */

export function generateBillNumber(
  shopCode: string | undefined,
  tokenNumber: string | number,
  date: Date = new Date()
): string {
  const cleanShopCode = (shopCode || 'VT').trim().toUpperCase().replace(/[^A-Z0-9]/g, '') || 'VT';
  
  // Format date as YYMMDD (e.g. 261005)
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const dateStr = `${yy}${mm}${dd}`;

  // Extract clean number from token (e.g. "T-014" -> "014", or 14 -> "014")
  const rawTokenStr = String(tokenNumber).replace(/\D/g, '') || '1';
  const paddedToken = rawTokenStr.padStart(3, '0');

  return `${cleanShopCode}-${dateStr}-${paddedToken}`;
}

export function formatBillDate(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleDateString('ta-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatBillTime(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}
