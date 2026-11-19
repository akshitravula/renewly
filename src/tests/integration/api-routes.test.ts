import { describe, it, expect } from "vitest";
import { GET as getGyms } from "../../app/api/gyms/route";
import { GET as getGymBySlug } from "../../app/api/gyms/[slug]/route";
import { GET as getRenewals } from "../../app/api/owner/renewals/route";
import { POST as checkIn } from "../../app/api/owner/attendance/route";

describe("RepSync Platform API Integration Tests", () => {
  it("GET /api/gyms returns Bengaluru launch gyms with photos and starting rates", async () => {
    const req = new Request("http://localhost:3000/api/gyms?city=Bengaluru");
    const res = await getGyms(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.city).toBe("Bengaluru");
    expect(data.count).toBeGreaterThanOrEqual(3);

    const ironforge = data.gyms.find((g: any) => g.slug === "ironforge-fitness");
    expect(ironforge).toBeDefined();
    expect(ironforge.isVerified).toBe(true);
    expect(ironforge.locality).toBe("Koramangala");
    expect(ironforge.coverPhoto).toBeDefined();
    expect(parseFloat(ironforge.startingPriceMonthly)).toBeGreaterThan(0);
  });

  it("GET /api/gyms/[slug] returns complete public profile projected from operational data", async () => {
    const req = new Request("http://localhost:3000/api/gyms/ironforge-fitness");
    const res = await getGymBySlug(req, {
      params: Promise.resolve({ slug: "ironforge-fitness" }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.gym.slug).toBe("ironforge-fitness");
    expect(data.branch.locality).toBe("Koramangala");
    expect(data.plans.length).toBeGreaterThanOrEqual(3);
    expect(data.trainers.length).toBeGreaterThanOrEqual(2);
    expect(data.photos.length).toBeGreaterThanOrEqual(1);
    expect(data.busyness.length).toBeGreaterThanOrEqual(5);

    // Verify 18% GST in public plans
    const monthlyPlan = data.plans.find((p: any) => p.durationMonths === 1);
    expect(monthlyPlan).toBeDefined();
    expect(parseFloat(monthlyPlan.gstRatePercent)).toBe(18);
  });

  it("GET /api/owner/renewals returns Renewals Desk with risk scores and WhatsApp drafts", async () => {
    const req = new Request("http://localhost:3000/api/owner/renewals?gymSlug=ironforge-fitness");
    const res = await getRenewals(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.summary).toBeDefined();
    expect(data.summary.totalMoneyAtRisk7Days).toBeGreaterThan(0);

    // Verify presence of cards with risk scores & drafts
    const card = data.expiring7Days[0] || data.expired[0];
    expect(card).toBeDefined();
    expect(card.riskScore).toBeGreaterThanOrEqual(0);
    expect(card.riskScore).toBeLessThanOrEqual(100);
    expect(card.drafts.hinglish.whatsappUrl).toContain("https://wa.me/");
  });

  it("POST /api/owner/attendance correctly validates check-in admission", async () => {
    // Valid member
    const validReq = new Request("http://localhost:3000/api/owner/attendance", {
      method: "POST",
      body: JSON.stringify({
        gymSlug: "ironforge-fitness",
        memberPhoneOrId: "9845011111", // Aditya Nambiar
        method: "MANUAL_STAFF",
      }),
    });
    const validRes = await checkIn(validReq);
    const validData = await validRes.json();
    expect(validData.allowed).toBe(true);
    expect(validData.message).toContain("Check-in successful");

    // Invalid non-existent member
    const invalidReq = new Request("http://localhost:3000/api/owner/attendance", {
      method: "POST",
      body: JSON.stringify({
        gymSlug: "ironforge-fitness",
        memberPhoneOrId: "9999999999",
      }),
    });
    const invalidRes = await checkIn(invalidReq);
    expect(invalidRes.status).toBe(404);
  });
});
