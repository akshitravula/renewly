/**
 * Indian NPCI UPI Deep Link & Dynamic QR Code Generator
 */

import QRCode from "qrcode";

export interface UpiPaymentParams {
  payeeVpa: string;         // e.g. "ironforge@icici" or "repsync.merchant@okaxis"
  payeeName: string;        // e.g. "IronForge Fitness LLP"
  amount: number;           // e.g. 2499.00
  transactionRef: string;   // e.g. "RNW-INV-0042"
  transactionNote?: string; // e.g. "IronForge Gym Membership Renewal"
  currency?: string;        // Default "INR"
}

export function generateUpiUri(params: UpiPaymentParams): string {
  const currency = params.currency || "INR";
  const note = encodeURIComponent(params.transactionNote || `Payment to ${params.payeeName}`);
  const pn = encodeURIComponent(params.payeeName);
  const formattedAmount = params.amount.toFixed(2);

  return `upi://pay?pa=${params.payeeVpa}&pn=${pn}&am=${formattedAmount}&cu=${currency}&tn=${note}&tr=${params.transactionRef}`;
}

export async function generateUpiQrCodeDataUrl(params: UpiPaymentParams): Promise<string> {
  const upiUri = generateUpiUri(params);
  return QRCode.toDataURL(upiUri, {
    errorCorrectionLevel: "M",
    margin: 2,
    scale: 8,
    color: {
      dark: "#0f172a",
      light: "#ffffff",
    },
  });
}
