/**
 * Indian GST Billing & Calculation Engine
 * SAC Code: 999723 (Gym and physical fitness centre services)
 * Standard Rate: 18% (9% CGST + 9% SGST for intra-state, 18% IGST for inter-state)
 */

export interface GstCalculationResult {
  subtotal: number;
  cgstRatePercent: number;
  cgstAmount: number;
  sgstRatePercent: number;
  sgstAmount: number;
  igstRatePercent: number;
  igstAmount: number;
  totalTax: number;
  grandTotal: number;
  isIntraState: boolean;
  hsnSacCode: string;
}

export const SAC_GYM_SERVICES = "999723";
export const DEFAULT_GST_RATE_PERCENT = 18.0;

/**
 * Rounds a number to 2 decimal places using standard financial half-up rounding.
 */
export function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Calculates GST when base price is exclusive of tax.
 * Example: Base ₹2,000 + 18% GST = ₹360 tax => ₹2,360 grand total.
 */
export function calculateGstExclusive(
  basePrice: number,
  gymStateCode: string,
  customerStateCode: string,
  gstRatePercent: number = DEFAULT_GST_RATE_PERCENT
): GstCalculationResult {
  const isIntraState = gymStateCode.trim() === customerStateCode.trim();
  const subtotal = round2(basePrice);
  const totalTax = round2((subtotal * gstRatePercent) / 100);
  const grandTotal = round2(subtotal + totalTax);

  if (isIntraState) {
    const halfRate = gstRatePercent / 2;
    const cgstAmount = round2(totalTax / 2);
    // Ensure sum of CGST and SGST exactly matches totalTax to prevent 1-paisa drift
    const sgstAmount = round2(totalTax - cgstAmount);

    return {
      subtotal,
      cgstRatePercent: halfRate,
      cgstAmount,
      sgstRatePercent: halfRate,
      sgstAmount,
      igstRatePercent: 0,
      igstAmount: 0,
      totalTax,
      grandTotal,
      isIntraState: true,
      hsnSacCode: SAC_GYM_SERVICES,
    };
  } else {
    return {
      subtotal,
      cgstRatePercent: 0,
      cgstAmount: 0,
      sgstRatePercent: 0,
      sgstAmount: 0,
      igstRatePercent: gstRatePercent,
      igstAmount: totalTax,
      totalTax,
      grandTotal,
      isIntraState: false,
      hsnSacCode: SAC_GYM_SERVICES,
    };
  }
}

/**
 * Calculates GST when customer pays an all-inclusive price.
 * Example: Total ₹2,360 inclusive of 18% GST => Base ₹2,000, Tax ₹360.
 */
export function calculateGstInclusive(
  inclusiveTotal: number,
  gymStateCode: string,
  customerStateCode: string,
  gstRatePercent: number = DEFAULT_GST_RATE_PERCENT
): GstCalculationResult {
  const isIntraState = gymStateCode.trim() === customerStateCode.trim();
  const grandTotal = round2(inclusiveTotal);
  const subtotal = round2(grandTotal / (1 + gstRatePercent / 100));
  const totalTax = round2(grandTotal - subtotal);

  if (isIntraState) {
    const halfRate = gstRatePercent / 2;
    const cgstAmount = round2(totalTax / 2);
    const sgstAmount = round2(totalTax - cgstAmount);

    return {
      subtotal,
      cgstRatePercent: halfRate,
      cgstAmount,
      sgstRatePercent: halfRate,
      sgstAmount,
      igstRatePercent: 0,
      igstAmount: 0,
      totalTax,
      grandTotal,
      isIntraState: true,
      hsnSacCode: SAC_GYM_SERVICES,
    };
  } else {
    return {
      subtotal,
      cgstRatePercent: 0,
      cgstAmount: 0,
      sgstRatePercent: 0,
      sgstAmount: 0,
      igstRatePercent: gstRatePercent,
      igstAmount: totalTax,
      totalTax,
      grandTotal,
      isIntraState: false,
      hsnSacCode: SAC_GYM_SERVICES,
    };
  }
}

/**
 * Generates formatted Financial Year string for India (April - March).
 * E.g., Date in Oct 2026 => "26-27"
 */
export function getCurrentFinancialYear(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed: Jan=0, Mar=2, Apr=3
  if (month >= 3) {
    // April or later
    const start = year % 100;
    const end = (year + 1) % 100;
    return `${start.toString().padStart(2, "0")}-${end.toString().padStart(2, "0")}`;
  } else {
    // Before April (Jan-Mar)
    const start = (year - 1) % 100;
    const end = year % 100;
    return `${start.toString().padStart(2, "0")}-${end.toString().padStart(2, "0")}`;
  }
}

/**
 * Generates sequential GST invoice number formatted per Indian rules.
 * Format: {PREFIX}/{FY}/{SEQUENCE_PADDED}
 * Example: RNW/26-27/0042
 */
export function formatInvoiceNumber(
  prefix: string,
  sequenceNumber: number,
  fy: string = getCurrentFinancialYear()
): string {
  const cleanPrefix = prefix.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 5) || "INV";
  const padded = sequenceNumber.toString().padStart(4, "0");
  return `${cleanPrefix}/${fy}/${padded}`;
}
