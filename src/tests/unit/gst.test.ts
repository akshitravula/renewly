import { describe, it, expect } from "vitest";
import {
  calculateGstExclusive,
  calculateGstInclusive,
  getCurrentFinancialYear,
  formatInvoiceNumber,
  SAC_GYM_SERVICES,
} from "../../modules/billing/gst";

describe("Indian GST Billing Engine (SAC 999723)", () => {
  it("calculates intra-state GST (CGST 9% + SGST 9%) correctly on exclusive base price", () => {
    // Karnataka (29) to Karnataka (29)
    const result = calculateGstExclusive(10000, "29", "29", 18);

    expect(result.isIntraState).toBe(true);
    expect(result.subtotal).toBe(10000);
    expect(result.cgstRatePercent).toBe(9);
    expect(result.cgstAmount).toBe(900);
    expect(result.sgstRatePercent).toBe(9);
    expect(result.sgstAmount).toBe(900);
    expect(result.igstAmount).toBe(0);
    expect(result.totalTax).toBe(1800);
    expect(result.grandTotal).toBe(11800);
    expect(result.hsnSacCode).toBe(SAC_GYM_SERVICES);
  });

  it("calculates inter-state GST (IGST 18%) correctly on exclusive base price", () => {
    // Karnataka (29) to Maharashtra (27)
    const result = calculateGstExclusive(5000, "29", "27", 18);

    expect(result.isIntraState).toBe(false);
    expect(result.subtotal).toBe(5000);
    expect(result.cgstAmount).toBe(0);
    expect(result.sgstAmount).toBe(0);
    expect(result.igstRatePercent).toBe(18);
    expect(result.igstAmount).toBe(900);
    expect(result.totalTax).toBe(900);
    expect(result.grandTotal).toBe(5900);
  });

  it("calculates backward tax breakdown for all-inclusive pricing", () => {
    // When member pays an all-inclusive ₹2,360
    const result = calculateGstInclusive(2360, "29", "29", 18);

    expect(result.grandTotal).toBe(2360);
    expect(result.subtotal).toBe(2000);
    expect(result.totalTax).toBe(360);
    expect(result.cgstAmount).toBe(180);
    expect(result.sgstAmount).toBe(180);
    expect(result.cgstAmount + result.sgstAmount).toBe(result.totalTax);
  });

  it("handles odd paisa fractions without 1-paisa drift", () => {
    // ₹1,999 inclusive
    const result = calculateGstInclusive(1999, "29", "29", 18);

    expect(result.grandTotal).toBe(1999);
    expect(result.subtotal + result.totalTax).toBe(1999);
    expect(result.cgstAmount + result.sgstAmount).toBe(result.totalTax);
  });

  it("generates correct Indian Financial Year string", () => {
    const oct2026 = new Date(2026, 9, 20); // Oct 2026
    expect(getCurrentFinancialYear(oct2026)).toBe("26-27");

    const feb2027 = new Date(2027, 1, 15); // Feb 2027
    expect(getCurrentFinancialYear(feb2027)).toBe("26-27");

    const apr2027 = new Date(2027, 3, 1); // Apr 2027
    expect(getCurrentFinancialYear(apr2027)).toBe("27-28");
  });

  it("formats compliant sequential tax invoice numbers", () => {
    expect(formatInvoiceNumber("RNW", 1, "26-27")).toBe("RNW/26-27/0001");
    expect(formatInvoiceNumber("IRON", 42, "26-27")).toBe("IRON/26-27/0042");
    expect(formatInvoiceNumber("SPORTS-FIT", 1500, "26-27")).toBe("SPORT/26-27/1500");
  });
});
