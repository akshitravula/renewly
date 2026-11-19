/**
 * Rules-Based Renewal Risk Score Engine
 * Computes an explainable churn/lapse risk score (0-100) from real check-in and membership behaviors.
 */

export type RiskAction =
  | "REMIND_GENTLY"
  | "OFFER_PAUSE_BENEFIT"
  | "OFFER_RENEWAL_DISCOUNT"
  | "CALL_DIRECTLY";

export interface MemberRiskInput {
  memberId: string;
  daysSinceLastVisit: number;
  visitsLast30Days: number;
  visitsPrevious30Days: number;
  membershipTenureMonths: number;
  renewalCount: number;
  planDurationMonths: number;
  daysUntilExpiry: number;
}

export interface RiskFactor {
  factor: string;
  impact: number; // positive increases risk, negative decreases risk
  description: string;
}

export interface MemberRiskResult {
  memberId: string;
  riskScore: number; // 0 to 100
  riskTier: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  factors: RiskFactor[];
  explanation: string;
  recommendedAction: RiskAction;
}

export function calculateRenewalRisk(input: MemberRiskInput): MemberRiskResult {
  const factors: RiskFactor[] = [];
  let baseScore = 20; // Baseline neutral starting risk

  // 1. Recency: Days since last visit
  if (input.daysSinceLastVisit >= 21) {
    factors.push({
      factor: "CRITICAL_RECENCY_LAPSE",
      impact: +35,
      description: `Has not checked in for ${input.daysSinceLastVisit} days (3+ weeks inactive)`,
    });
  } else if (input.daysSinceLastVisit >= 14) {
    factors.push({
      factor: "HIGH_RECENCY_LAPSE",
      impact: +25,
      description: `Has not checked in for ${input.daysSinceLastVisit} days (2+ weeks inactive)`,
    });
  } else if (input.daysSinceLastVisit >= 7) {
    factors.push({
      factor: "MODERATE_RECENCY_LAPSE",
      impact: +15,
      description: `Has not visited in the past ${input.daysSinceLastVisit} days`,
    });
  } else if (input.daysSinceLastVisit <= 3) {
    factors.push({
      factor: "ACTIVE_ATTENDANCE",
      impact: -15,
      description: `Active on gym floor (checked in ${input.daysSinceLastVisit} day(s) ago)`,
    });
  }

  // 2. Frequency Momentum: Last 30 days vs Previous 30 days
  if (input.visitsLast30Days === 0) {
    factors.push({
      factor: "ZERO_RECENT_ATTENDANCE",
      impact: +35,
      description: "0 visits recorded in the last 30 days",
    });
  } else if (input.visitsPrevious30Days > 0) {
    const dropPercent = Math.round(
      ((input.visitsPrevious30Days - input.visitsLast30Days) / input.visitsPrevious30Days) * 100
    );
    if (dropPercent >= 50) {
      factors.push({
        factor: "SEVERE_ATTENDANCE_DECLINE",
        impact: +20,
        description: `Visit frequency declined by ${dropPercent}% (${input.visitsLast30Days} vs ${input.visitsPrevious30Days} prior)`,
      });
    } else if (dropPercent <= -10) {
      factors.push({
        factor: "GROWING_ATTENDANCE_HABIT",
        impact: -10,
        description: `Visit frequency increased to ${input.visitsLast30Days} visits/month`,
      });
    }
  }

  // 3. Renewal Track Record & Tenure
  if (input.renewalCount >= 2) {
    factors.push({
      factor: "PROVEN_LOYALTY",
      impact: -15,
      description: `Long-term loyalist who has renewed ${input.renewalCount} times`,
    });
  } else if (input.renewalCount === 0 && input.membershipTenureMonths <= 2) {
    factors.push({
      factor: "FIRST_TIME_RENEWAL",
      impact: +10,
      description: "First-time renewal hurdle (highest historic churn window)",
    });
  }

  // 4. Plan Duration
  if (input.planDurationMonths === 1) {
    factors.push({
      factor: "SHORT_MONTHLY_PLAN",
      impact: +10,
      description: "On 1-month plan with recurring friction",
    });
  } else if (input.planDurationMonths >= 12) {
    factors.push({
      factor: "ANNUAL_COMMITMENT",
      impact: -10,
      description: "High long-term commitment annual member",
    });
  }

  // Calculate Total Score (clamped between 0 and 100)
  const totalImpact = factors.reduce((sum, f) => sum + f.impact, 0);
  const rawScore = baseScore + totalImpact;
  const riskScore = Math.max(0, Math.min(100, rawScore));

  // Determine Risk Tier
  let riskTier: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  let recommendedAction: RiskAction;

  if (riskScore >= 75) {
    riskTier = "CRITICAL";
    recommendedAction = "CALL_DIRECTLY";
  } else if (riskScore >= 55) {
    riskTier = "HIGH";
    // If they were recently active or paused, offer pause benefit, otherwise renewal discount
    recommendedAction = input.daysSinceLastVisit > 14 ? "OFFER_PAUSE_BENEFIT" : "OFFER_RENEWAL_DISCOUNT";
  } else if (riskScore >= 35) {
    riskTier = "MEDIUM";
    recommendedAction = "OFFER_RENEWAL_DISCOUNT";
  } else {
    riskTier = "LOW";
    recommendedAction = "REMIND_GENTLY";
  }

  // Generate Human-Readable Explanation
  const explanationLines = factors.map((f) => `• ${f.description} (${f.impact > 0 ? "+" : ""}${f.impact} risk)`);
  const explanation = [
    `Risk Score: ${riskScore}/100 (${riskTier})`,
    ...explanationLines,
  ].join("\n");

  return {
    memberId: input.memberId,
    riskScore,
    riskTier,
    factors,
    explanation,
    recommendedAction,
  };
}
