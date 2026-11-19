import { describe, it, expect } from "vitest";
import { calculateRenewalRisk } from "../../modules/renewals/risk-score";

describe("Rules-Based Renewal Risk Score Engine", () => {
  it("scores active loyal members with LOW risk and recommends gentle reminder", () => {
    const result = calculateRenewalRisk({
      memberId: "mem-1",
      daysSinceLastVisit: 1, // Visited yesterday
      visitsLast30Days: 16,
      visitsPrevious30Days: 15,
      membershipTenureMonths: 14,
      renewalCount: 3, // Renewed 3 times
      planDurationMonths: 12, // Annual
      daysUntilExpiry: 5,
    });

    expect(result.riskTier).toBe("LOW");
    expect(result.riskScore).toBeLessThanOrEqual(30);
    expect(result.recommendedAction).toBe("REMIND_GENTLY");
    expect(result.explanation).toContain("Active on gym floor");
    expect(result.explanation).toContain("Long-term loyalist");
  });

  it("scores severely inactive members with CRITICAL risk and recommends direct call", () => {
    const result = calculateRenewalRisk({
      memberId: "mem-2",
      daysSinceLastVisit: 28, // 4 weeks inactive
      visitsLast30Days: 0,
      visitsPrevious30Days: 8,
      membershipTenureMonths: 1,
      renewalCount: 0, // First time renewal
      planDurationMonths: 1, // Monthly plan
      daysUntilExpiry: 3,
    });

    expect(result.riskTier).toBe("CRITICAL");
    expect(result.riskScore).toBeGreaterThanOrEqual(75);
    expect(result.recommendedAction).toBe("CALL_DIRECTLY");
    expect(result.factors.some((f) => f.factor === "CRITICAL_RECENCY_LAPSE")).toBe(true);
    expect(result.factors.some((f) => f.factor === "ZERO_RECENT_ATTENDANCE")).toBe(true);
  });

  it("recommends pause benefit for moderately lapsed members with prior habit", () => {
    const result = calculateRenewalRisk({
      memberId: "mem-3",
      daysSinceLastVisit: 16, // > 14 days
      visitsLast30Days: 4,
      visitsPrevious30Days: 12, // 66% drop
      membershipTenureMonths: 6,
      renewalCount: 1,
      planDurationMonths: 3,
      daysUntilExpiry: 7,
    });

    expect(result.riskTier).toBe("HIGH");
    expect(result.recommendedAction).toBe("OFFER_PAUSE_BENEFIT");
  });

  it("clamps score strictly between 0 and 100", () => {
    const extremeLow = calculateRenewalRisk({
      memberId: "mem-super-loyal",
      daysSinceLastVisit: 0,
      visitsLast30Days: 28,
      visitsPrevious30Days: 10,
      membershipTenureMonths: 36,
      renewalCount: 10,
      planDurationMonths: 12,
      daysUntilExpiry: 10,
    });
    expect(extremeLow.riskScore).toBeGreaterThanOrEqual(0);

    const extremeHigh = calculateRenewalRisk({
      memberId: "mem-super-churn",
      daysSinceLastVisit: 60,
      visitsLast30Days: 0,
      visitsPrevious30Days: 20,
      membershipTenureMonths: 1,
      renewalCount: 0,
      planDurationMonths: 1,
      daysUntilExpiry: 0,
    });
    expect(extremeHigh.riskScore).toBeLessThanOrEqual(100);
  });
});
