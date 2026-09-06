/**
 * GS1 Barcode Normalization & Checksum Verification Utilities
 * Supports EAN-8, UPC-A (12-digit), EAN-13 (13-digit), and GTIN-14.
 */

/**
 * Calculates standard GS1 modulo-10 check digit for any payload string (7, 11, 12, or 13 digits).
 */
export function calculateGtinCheckDigit(payload: string): number {
  let sum = 0;
  let multiplier = 3;

  for (let i = payload.length - 1; i >= 0; i--) {
    const digit = parseInt(payload[i], 10);
    if (isNaN(digit)) return -1;
    sum += digit * multiplier;
    multiplier = multiplier === 3 ? 1 : 3;
  }

  const remainder = sum % 10;
  return remainder === 0 ? 0 : 10 - remainder;
}

/**
 * Validates whether a barcode string has valid GS1 GTIN length and checksum.
 */
export function isValidGtinChecksum(barcode: string): boolean {
  const clean = barcode.replace(/[\s-]/g, '').trim();
  if (!/^\d+$/.test(clean)) return false;
  if (![8, 12, 13, 14].includes(clean.length)) return false;

  const payload = clean.slice(0, -1);
  const checkDigit = parseInt(clean.slice(-1), 10);
  const calculated = calculateGtinCheckDigit(payload);

  return calculated === checkDigit;
}

/**
 * Normalizes a raw scanned barcode by stripping spaces, hyphens, and leading noise.
 */
export function sanitizeBarcode(raw: string): string {
  if (!raw) return '';
  return raw.replace(/[\s-]/g, '').trim();
}

/**
 * Generates all valid representation variants for a given barcode so lookups
 * can match cross-format database records and retailer systems (e.g. 12-digit UPC <-> 13-digit EAN-13 <-> 14-digit GTIN-14).
 */
export function generateBarcodeVariants(rawBarcode: string): string[] {
  const clean = sanitizeBarcode(rawBarcode);
  if (!clean || !/^\d+$/.test(clean)) return clean ? [clean] : [];

  const variants = new Set<string>();
  variants.add(clean);

  // 12-digit UPC-A -> 13-digit EAN-13 (prefixed with 0) & 14-digit GTIN-14 (prefixed with 00)
  if (clean.length === 12) {
    variants.add(`0${clean}`);
    variants.add(`00${clean}`);
  }

  // 13-digit EAN-13 starting with 0 -> 12-digit UPC-A (stripped leading 0) & 14-digit GTIN-14
  if (clean.length === 13) {
    if (clean.startsWith('0')) {
      variants.add(clean.slice(1));
    }
    variants.add(`0${clean}`);
  }

  // 14-digit GTIN-14 starting with 0 / 00
  if (clean.length === 14) {
    if (clean.startsWith('00')) {
      variants.add(clean.slice(2)); // 12-digit UPC
      variants.add(clean.slice(1)); // 13-digit EAN
    } else if (clean.startsWith('0')) {
      variants.add(clean.slice(1)); // 13-digit EAN
    }
  }

  // 8-digit EAN-8 -> zero-padded 13-digit & 14-digit representation
  if (clean.length === 8) {
    variants.add(`00000${clean}`);
    variants.add(`000000${clean}`);
  }

  return Array.from(variants);
}
