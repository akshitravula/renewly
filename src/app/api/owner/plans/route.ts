import { NextResponse } from "next/server";
import { db, plans, gyms, listings } from "@/db";
import { eq, desc, asc, min } from "drizzle-orm";
import { calculateGstExclusive } from "@/modules/billing/gst";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gymSlug = searchParams.get("gymSlug") || "ironforge-fitness";

    const [gym] = await db.select().from(gyms).where(eq(gyms.slug, gymSlug)).limit(1);
    if (!gym) {
      return NextResponse.json({ error: "Gym not found" }, { status: 404 });
    }

    const planList = await db
      .select()
      .from(plans)
      .where(eq(plans.gymId, gym.id))
      .orderBy(asc(plans.durationMonths));

    return NextResponse.json({ plans: planList });
  } catch (error: any) {
    console.error("Error fetching plans:", error);
    return NextResponse.json(
      { error: "Failed to fetch plans", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      gymSlug = "ironforge-fitness",
      name,
      planType = "GYM",
      durationMonths = 1,
      durationDays = 30,
      basePrice,
      isPublic = true,
    } = body;

    if (!name || !basePrice) {
      return NextResponse.json(
        { error: "Plan name and base price are required" },
        { status: 400 }
      );
    }

    const [gym] = await db.select().from(gyms).where(eq(gyms.slug, gymSlug)).limit(1);
    if (!gym) {
      return NextResponse.json({ error: "Gym not found" }, { status: 404 });
    }

    const basePriceNum = parseFloat(basePrice);
    const gstResult = calculateGstExclusive(basePriceNum, gym.stateCode, "29", 18);

    const [newPlan] = await db
      .insert(plans)
      .values({
        gymId: gym.id,
        name,
        planType,
        durationMonths: parseInt(durationMonths.toString()),
        durationDays: parseInt(durationDays.toString()),
        basePrice: gstResult.subtotal.toString(),
        joiningFee: "0.00",
        gstRatePercent: "18.00",
        totalPrice: gstResult.grandTotal.toString(),
        isPublic: Boolean(isPublic),
        isActive: true,
      })
      .returning();

    // If public, update the gym's public starting_price_monthly in the listing
    if (newPlan.isPublic) {
      const publicPlans = await db
        .select()
        .from(plans)
        .where(eq(plans.gymId, gym.id));

      const monthlyRates = publicPlans
        .filter((p) => p.isPublic && p.isActive)
        .map((p) => parseFloat(p.totalPrice) / (p.durationMonths || 1));

      if (monthlyRates.length > 0) {
        const lowestMonthly = Math.min(...monthlyRates).toFixed(2);
        await db
          .update(listings)
          .set({ startingPriceMonthly: lowestMonthly, updatedAt: new Date() })
          .where(eq(listings.gymId, gym.id));
      }
    }

    return NextResponse.json({ success: true, plan: newPlan });
  } catch (error: any) {
    console.error("Error creating plan:", error);
    return NextResponse.json(
      { error: "Failed to create plan", details: error.message },
      { status: 500 }
    );
  }
}
