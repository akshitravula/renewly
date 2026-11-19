import { describe, it, expect } from "vitest";
import {
  draftRenewalMessage,
  normalizePhoneForWhatsApp,
} from "../../modules/renewals/message-drafter";

describe("Retention Message Drafter", () => {
  it("normalizes various Indian phone formats to 91XXXXXXXXXX", () => {
    expect(normalizePhoneForWhatsApp("9876543210")).toBe("919876543210");
    expect(normalizePhoneForWhatsApp("+91 98765 43210")).toBe("919876543210");
    expect(normalizePhoneForWhatsApp("09876543210")).toBe("919876543210");
    expect(normalizePhoneForWhatsApp("919876543210")).toBe("919876543210");
  });

  it("drafts Hinglish message with comeback offer for lapsed members", () => {
    const draft = draftRenewalMessage({
      memberName: "Rahul",
      phone: "9876543210",
      gymName: "IronForge Fitness",
      planName: "Quarterly Pro",
      expiryDateStr: "25 Oct 2026",
      daysUntilExpiry: -2,
      renewalPrice: 5999,
      recommendedAction: "CALL_DIRECTLY",
      preferredLanguage: "hinglish",
    });

    expect(draft.language).toBe("hinglish");
    expect(draft.offerType).toBe("SPECIAL_COMEBACK_DISCOUNT");
    expect(draft.body).toContain("kaafi din se IronForge Fitness nahi aa rahe");
    expect(draft.body).toContain("comeback discount");
    expect(draft.whatsappUrl).toContain("https://wa.me/919876543210?text=");
  });

  it("drafts Hindi message with pause benefit for travelers", () => {
    const draft = draftRenewalMessage({
      memberName: "Pooja",
      phone: "+91 9811122233",
      gymName: "Shakti Fitness",
      planName: "Annual Elite",
      expiryDateStr: "30 Oct 2026",
      daysUntilExpiry: 10,
      renewalPrice: 18000,
      recommendedAction: "OFFER_PAUSE_BENEFIT",
      preferredLanguage: "hi",
    });

    expect(draft.language).toBe("hi");
    expect(draft.offerType).toBe("PAUSE_PROTECTION");
    expect(draft.body).toContain("15 दिन की पॉज़ सुविधा");
  });

  it("drafts gentle reminder in English for regular active renewals", () => {
    const draft = draftRenewalMessage({
      memberName: "Karan",
      phone: "9988776655",
      gymName: "IronForge Fitness",
      planName: "Monthly Pass",
      expiryDateStr: "27 Oct 2026",
      daysUntilExpiry: 7,
      renewalPrice: 2499,
      recommendedAction: "REMIND_GENTLY",
      preferredLanguage: "en",
    });

    expect(draft.language).toBe("en");
    expect(draft.offerType).toBe("STANDARD_RENEWAL");
    expect(draft.body).toContain("7 days left");
  });
});
