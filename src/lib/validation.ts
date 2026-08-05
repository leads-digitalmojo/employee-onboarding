/** Shared field validation — used by both the client form and the API route. */

export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
export const AADHAAR_REGEX = /^[2-9][0-9]{11}$/;
export const UAN_REGEX = /^[0-9]{12}$/;
export const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
export const PHONE_REGEX = /^[6-9][0-9]{9}$/;

/** Aadhaar numbers carry a Verhoeff check digit; reject typo'd numbers early. */
const D_TABLE = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];
const P_TABLE = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

export function isValidAadhaar(value: string): boolean {
  if (!AADHAAR_REGEX.test(value)) return false;
  let c = 0;
  const digits = value.split("").reverse().map(Number);
  digits.forEach((digit, i) => {
    c = D_TABLE[c][P_TABLE[i % 8][digit]];
  });
  return c === 0;
}

export type KycInput = {
  pan_number: string;
  aadhaar_number: string;
  uan_number: string;
  pf_number: string;
  esic_number: string;
  bank_name: string;
  account_number: string;
  ifsc_code: string;
  emergency_name: string;
  emergency_phone: string;
  emergency_relation: string;
};

/** Returns a map of field -> error message. Empty map means valid. */
export function validateKyc(input: Partial<KycInput>): Record<string, string> {
  const errors: Record<string, string> = {};
  const v = (k: keyof KycInput) => (input[k] ?? "").toString().trim();

  if (!PAN_REGEX.test(v("pan_number").toUpperCase())) {
    errors.pan_number = "Enter a valid PAN, e.g. ABCDE1234F";
  }

  const aadhaar = v("aadhaar_number").replace(/\s/g, "");
  if (!AADHAAR_REGEX.test(aadhaar)) {
    errors.aadhaar_number = "Aadhaar must be 12 digits and cannot start with 0 or 1";
  } else if (!isValidAadhaar(aadhaar)) {
    errors.aadhaar_number = "This Aadhaar number failed the checksum — please re-check it";
  }

  // UAN is blank for first-time employees, but must be well formed when given.
  const uan = v("uan_number");
  if (uan && !UAN_REGEX.test(uan)) {
    errors.uan_number = "UAN must be exactly 12 digits";
  }

  if (!v("bank_name")) errors.bank_name = "Bank name is required";

  const account = v("account_number");
  if (!/^[0-9]{9,18}$/.test(account)) {
    errors.account_number = "Account number must be 9–18 digits";
  }

  if (!IFSC_REGEX.test(v("ifsc_code").toUpperCase())) {
    errors.ifsc_code = "Enter a valid IFSC, e.g. HDFC0001234";
  }

  if (!v("emergency_name")) errors.emergency_name = "Emergency contact name is required";
  if (!PHONE_REGEX.test(v("emergency_phone"))) {
    errors.emergency_phone = "Enter a valid 10-digit Indian mobile number";
  }
  if (!v("emergency_relation")) errors.emergency_relation = "Relationship is required";

  return errors;
}

/** Masks all but the last 4 characters — used when showing saved KYC back to the user. */
export function maskId(value: string | null | undefined): string {
  if (!value) return "—";
  if (value.length <= 4) return value;
  return "•".repeat(value.length - 4) + value.slice(-4);
}
