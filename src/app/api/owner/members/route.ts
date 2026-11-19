import { NextResponse } from "next/server";
import {
  db,
  members,
  memberships,
  plans,
  invoices,
  payments,
  renewalRiskScores,
  gyms,
} from "@/db";
import { eq, desc, and } from "drizzle-orm";
import { calculateGstExclusive, formatInvoiceNumber } from "@/modules/billing/gst";
import { calculateRenewalRisk } from "@/modules/renewals/risk-score";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gymSlug = searchParams.get("gymSlug") || "ironforge-fitness";

    const [gym] = await db.select().from(gyms).where(eq(gyms.slug, gymSlug)).limit(1);
    if (!gym) {
      return NextResponse.json({ error: "Gym not found" }, { status: 404 });
    }

    const memberList = await db
      .select({
        id: members.id,
        firstName: members.firstName,
        lastName: members.lastName,
        phone: members.phone,
        email: members.email,
        gender: members.gender,
        status: members.status,
        tags: members.tags,
        createdAt: members.createdAt,
        membershipId: memberships.id,
        planId: memberships.planId,
        startDate: memberships.startDate,
        endDate: memberships.endDate,
        membershipStatus: memberships.status,
        totalAmount: memberships.totalAmount,
        amountPaid: memberships.amountPaid,
        amountDue: memberships.amountDue,
      })
      .from(members)
      .leftJoin(memberships, eq(members.id, memberships.memberId))
      .where(eq(members.gymId, gym.id))
      .orderBy(desc(members.createdAt));

    // Get plan names
    const planList = await db.select().from(plans).where(eq(plans.gymId, gym.id));
    const planMap = new Map(planList.map((p) => [p.id, p]));

    const enriched = memberList.map((m) => {
      const plan = m.planId ? planMap.get(m.planId) : null;
      return {
        ...m,
        planName: plan?.name || "No Active Plan",
      };
    });

    return NextResponse.json({
      gymId: gym.id,
      gymName: gym.name,
      count: enriched.length,
      members: enriched,
    });
  } catch (error: any) {
    console.error("Error fetching members:", error);
    return NextResponse.json(
      { error: "Failed to fetch members", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      gymSlug = "ironforge-fitness",
      firstName,
      lastName = "",
      phone,
      email,
      gender = "MALE",
      planId,
      startDate = new Date().toISOString().split("T")[0],
      tags = [],
    } = body;

    if (!firstName || !phone || !planId) {
      return NextResponse.json(
        { error: "First name, phone number, and plan are required" },
        { status: 400 }
      );
    }

    const [gym] = await db.select().from(gyms).where(eq(gyms.slug, gymSlug)).limit(1);
    if (!gym) {
      return NextResponse.json({ error: "Gym not found" }, { status: 404 });
    }

    const [selectedPlan] = await db.select().from(plans).where(eq(plans.id, planId)).limit(1);
    if (!selectedPlan) {
      return NextResponse.json({ error: "Selected plan not found" }, { status: 404 });
    }

    // Calculate end date based on durationDays
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + selectedPlan.durationDays);
    const endDateStr = end.toISOString().split("T")[0];

    // Check if member already exists by phone
    let [existingMember] = await db
      .select()
      .from(members)
      .where(and(eq(members.gymId, gym.id), eq(members.phone, phone)))
      .limit(1);

    let memberId = existingMember?.id;

    if (!existingMember) {
      const [newMember] = await db
        .insert(members)
        .values({
          gymId: gym.id,
          firstName,
          lastName,
          phone,
          email,
          gender,
          status: "ACTIVE",
          tags,
        })
        .returning();
      memberId = newMember.id;
    } else {
      // Update status to active
      await db
        .update(members)
        .set({ status: "ACTIVE", updatedAt: new Date() })
        .where(eq(members.id, memberId));
    }

    // Create Membership record
    const [membership] = await db
      .insert(memberships)
      .values({
        gymId: gym.id,
        memberId,
        planId: selectedPlan.id,
        startDate,
        endDate: endDateStr,
        originalEndDate: endDateStr,
        status: "ACTIVE",
        totalAmount: selectedPlan.totalPrice,
        amountPaid: selectedPlan.totalPrice,
        amountDue: "0.00",
      })
      .returning();

    // Generate GST Invoice
    const gstCalc = calculateGstExclusive(
      parseFloat(selectedPlan.basePrice),
      gym.stateCode,
      "29", // Customer in Karnataka
      parseFloat(selectedPlan.gstRatePercent)
    );

    const invoiceCount = 100 + Math.floor(Math.random() * 899);
    const invoiceNumber = formatInvoiceNumber("RPS", invoiceCount);

    const [invoice] = await db
      .insert(invoices)
      .values({
        gymId: gym.id,
        invoiceNumber,
        financialYear: "26-27",
        memberId,
        membershipId: membership.id,
        customerName: `${firstName} ${lastName}`.trim(),
        customerPhone: phone,
        customerStateCode: "29",
        subtotal: gstCalc.subtotal.toString(),
        cgstAmount: gstCalc.cgstAmount.toString(),
        sgstAmount: gstCalc.sgstAmount.toString(),
        igstAmount: gstCalc.igstAmount.toString(),
        totalTax: gstCalc.totalTax.toString(),
        grandTotal: gstCalc.grandTotal.toString(),
        hsnSacCode: gstCalc.hsnSacCode,
        status: "PAID",
      })
      .returning();

    // Record Payment
    await db.insert(payments).values({
      gymId: gym.id,
      invoiceId: invoice.id,
      memberId,
      amount: gstCalc.grandTotal.toString(),
      paymentMode: "UPI_QR",
      transactionRef: `UPI-${Date.now()}`,
      status: "SUCCESS",
    });

    // Calculate baseline risk score
    const risk = calculateRenewalRisk({
      memberId,
      daysSinceLastVisit: 0,
      visitsLast30Days: 1,
      visitsPrevious30Days: 0,
      membershipTenureMonths: 1,
      renewalCount: 0,
      planDurationMonths: selectedPlan.durationMonths,
      daysUntilExpiry: selectedPlan.durationDays,
    });

    await db.insert(renewalRiskScores).values({
      gymId: gym.id,
      memberId,
      riskScore: risk.riskScore,
      factors: risk.factors,
      explanation: risk.explanation,
      recommendedAction: risk.recommendedAction,
    });

    return NextResponse.json({
      success: true,
      memberId,
      membershipId: membership.id,
      invoiceNumber: invoice.invoiceNumber,
      grandTotal: gstCalc.grandTotal,
    });
  } catch (error: any) {
    console.error("Error creating member:", error);
    return NextResponse.json(
      { error: "Failed to create member", details: error.message },
      { status: 500 }
    );
  }
}
