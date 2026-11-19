import { NextResponse } from "next/server";
import {
  db,
  attendanceLogs,
  members,
  memberships,
  plans,
  gyms,
} from "@/db";
import { eq, desc, and } from "drizzle-orm";
import { validateCheckInAdmission } from "@/modules/attendance";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gymSlug = searchParams.get("gymSlug") || "ironforge-fitness";

    const [gym] = await db.select().from(gyms).where(eq(gyms.slug, gymSlug)).limit(1);
    if (!gym) {
      return NextResponse.json({ error: "Gym not found" }, { status: 404 });
    }

    // Recent check-in feed (last 50 check-ins)
    const logs = await db
      .select({
        id: attendanceLogs.id,
        checkInTime: attendanceLogs.checkInTime,
        checkOutTime: attendanceLogs.checkOutTime,
        method: attendanceLogs.method,
        memberId: members.id,
        firstName: members.firstName,
        lastName: members.lastName,
        phone: members.phone,
        memberStatus: members.status,
      })
      .from(attendanceLogs)
      .innerJoin(members, eq(attendanceLogs.memberId, members.id))
      .where(eq(attendanceLogs.gymId, gym.id))
      .orderBy(desc(attendanceLogs.checkInTime))
      .limit(50);

    // Active members currently in gym (checked in within last 90 minutes with no checkout)
    const ninetyMinutesAgo = new Date(Date.now() - 90 * 60 * 1000);
    const activeCurrently = logs.filter(
      (l) => new Date(l.checkInTime) >= ninetyMinutesAgo && !l.checkOutTime
    ).length;

    return NextResponse.json({
      activeCurrently,
      recentCheckIns: logs,
    });
  } catch (error: any) {
    console.error("Attendance feed error:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance data", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      gymSlug = "ironforge-fitness",
      memberPhoneOrId,
      method = "MANUAL_STAFF",
    } = body;

    if (!memberPhoneOrId) {
      return NextResponse.json(
        { error: "Phone number or Member ID is required" },
        { status: 400 }
      );
    }

    const [gym] = await db.select().from(gyms).where(eq(gyms.slug, gymSlug)).limit(1);
    if (!gym) {
      return NextResponse.json({ error: "Gym not found" }, { status: 404 });
    }

    // Find member by ID or Phone
    const cleanPhone = memberPhoneOrId.replace(/[^0-9]/g, "");
    const memberMatches = await db
      .select()
      .from(members)
      .where(
        cleanPhone.length >= 10
          ? and(eq(members.gymId, gym.id), eq(members.phone, cleanPhone.slice(-10)))
          : and(eq(members.gymId, gym.id), eq(members.id, memberPhoneOrId))
      )
      .limit(1);

    const member = memberMatches[0];
    if (!member) {
      return NextResponse.json(
        {
          allowed: false,
          error: "Member not found with this phone number or ID in this gym.",
        },
        { status: 404 }
      );
    }

    // Get active membership
    const [membership] = await db
      .select({
        id: memberships.id,
        planId: memberships.planId,
        endDate: memberships.endDate,
        status: memberships.status,
        planName: plans.name,
      })
      .from(memberships)
      .innerJoin(plans, eq(memberships.planId, plans.id))
      .where(and(eq(memberships.gymId, gym.id), eq(memberships.memberId, member.id)))
      .orderBy(desc(memberships.endDate))
      .limit(1);

    // Validate Admission
    const admission = validateCheckInAdmission(
      {
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
        phone: member.phone,
        status: member.status,
      },
      membership
        ? {
            id: membership.id,
            planName: membership.planName,
            endDate: membership.endDate,
            status: membership.status,
          }
        : undefined
    );

    // If allowed, write log
    if (admission.allowed) {
      await db.insert(attendanceLogs).values({
        gymId: gym.id,
        memberId: member.id,
        method,
      });
    }

    return NextResponse.json(admission);
  } catch (error: any) {
    console.error("Check-in error:", error);
    return NextResponse.json(
      { error: "Failed to process check-in", details: error.message },
      { status: 500 }
    );
  }
}
