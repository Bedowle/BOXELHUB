// IBAN validation - supports all European IBAN formats
export function validateIBAN(iban: string): boolean {
  if (!iban || typeof iban !== "string") return false;
  
  // Remove spaces and convert to uppercase
  const cleanIBAN = iban.replace(/\s/g, "").toUpperCase();
  
  // Check length (min 15, max 34)
  if (cleanIBAN.length < 15 || cleanIBAN.length > 34) return false;
  
  // Check format: 2 letters, 2 digits, then alphanumeric
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(cleanIBAN)) return false;
  
  // Move first 4 characters to end
  const rearranged = cleanIBAN.slice(4) + cleanIBAN.slice(0, 4);
  
  // Replace letters with numbers (A=10, B=11, ... Z=35)
  const numeric = rearranged.replace(/[A-Z]/g, (char) => {
    return (char.charCodeAt(0) - 55).toString();
  });
  
  // Validate using mod-97 algorithm
  let remainder = numeric;
  while (remainder.length > 2) {
    const block = remainder.slice(0, 9);
    remainder = ((parseInt(block, 10) % 97) + remainder.slice(9)).toString();
  }
  
  return parseInt(remainder, 10) % 97 === 1;
}

// Get country code from IBAN
export function getIBANCountry(iban: string): string | null {
  const match = iban.replace(/\s/g, "").toUpperCase().match(/^([A-Z]{2})/);
  return match ? match[1] : null;
}

// Format IBAN with spaces
export function formatIBAN(iban: string): string {
  const clean = iban.replace(/\s/g, "").toUpperCase();
  return clean.replace(/(.{4})/g, "$1 ").trim();
}

// Common IBAN lengths by country
const ibanLengths: Record<string, number> = {
  AD: 24, AE: 23, AL: 28, AT: 20, AZ: 28, BA: 20, BE: 16,
  BG: 22, BH: 22, BR: 29, BY: 28, CH: 21, CR: 22, CY: 28,
  CZ: 24, DE: 22, DK: 18, DO: 28, EE: 20, EG: 29, ES: 24,
  FI: 18, FO: 18, FR: 27, GB: 22, GE: 22, GI: 23, GL: 18,
  GR: 27, GT: 28, HR: 21, HU: 28, IE: 22, IL: 23, IS: 26,
  IT: 27, JO: 30, KW: 30, KZ: 20, LB: 28, LC: 32, LI: 21,
  LT: 20, LU: 20, LV: 21, MC: 27, MD: 24, ME: 22, MK: 19,
  MR: 27, MT: 31, MU: 30, NL: 18, NO: 15, PK: 24, PL: 28,
  PS: 29, PT: 25, QA: 29, RO: 24, RS: 22, SA: 24, SE: 24,
  SI: 19, SK: 24, SM: 27, TN: 24, TR: 26, UA: 29, VA: 22,
  VG: 24, XK: 20
};

export function validateIBANLength(iban: string): boolean {
  const country = getIBANCountry(iban);
  if (!country) return false;
  
  const expectedLength = ibanLengths[country];
  if (!expectedLength) return true; // Unknown country, assume valid
  
  const cleanIBAN = iban.replace(/\s/g, "");
  return cleanIBAN.length === expectedLength;
}
