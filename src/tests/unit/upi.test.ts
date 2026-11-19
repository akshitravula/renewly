import { describe, it, expect } from "vitest";
import { generateUpiUri, generateUpiQrCodeDataUrl } from "../../modules/billing/upi";

describe("UPI Deep Link & QR Engine", () => {
  it("formats compliant NPCI UPI payment deep link", () => {
    const uri = generateUpiUri({
      payeeVpa: "ironforge@icici",
      payeeName: "IronForge Fitness",
      amount: 2499,
      transactionRef: "INV-26-27-0042",
      transactionNote: "Monthly Renewal",
    });

    expect(uri).toContain("upi://pay?");
    expect(uri).toContain("pa=ironforge@icici");
    expect(uri).toContain("pn=IronForge%20Fitness");
    expect(uri).toContain("am=2499.00");
    expect(uri).toContain("cu=INR");
    expect(uri).toContain("tr=INV-26-27-0042");
  });

  it("generates valid QR code data URL", async () => {
    const qrDataUrl = await generateUpiQrCodeDataUrl({
      payeeVpa: "ironforge@icici",
      payeeName: "IronForge Fitness",
      amount: 2499,
      transactionRef: "INV-26-27-0042",
    });

    expect(qrDataUrl.startsWith("data:image/png;base64,")).toBe(true);
    expect(qrDataUrl.length).toBeGreaterThan(100);
  });
});
