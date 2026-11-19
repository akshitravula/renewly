import { NextResponse } from "next/server";
import { db, members, memberships, plans, gyms } from "@/db";
import { eq, inArray } from "drizzle-orm";
import { parseMembersCsv } from "@/modules/members/csv-import";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { csvContent, gymSlug = "ironforge-fitness", commit = false } = body;

    if (!csvContent) {
      return NextResponse.json({ error: "No CSV content provided" }, { status: 400 });
    }

    const [gym] = await db.select().from(gyms).where(eq(gyms.slug, gymSlug)).limit(1);
    if (!gym) {
      return NextResponse.json({ error: "Gym not found" }, { status: 404 });
    }

    // Parse CSV
    const summary = parseMembersCsv(csvContent);

    // Check existing phones in DB for this gym
    const validPhones = summary.rows
      .filter((r) => r.isValid)
      .map((r) => r.phone);

    let existingInDbCount = 0;
    const existingPhonesSet = new Set<string>();

    if (validPhones.length > 0) {
      const existingMembers = await db
        .select({ phone: members.phone })
        .from(members)
        .where(eq(members.gymId, gym.id));

      for (const m of existingMembers) {
        existingPhonesSet.add(m.phone);
      }

      for (const row of summary.rows) {
        if (row.isValid && existingPhonesSet.has(row.phone)) {
          existingInDbCount++;
          row.isValid = false;
          row.errors.push(`Phone number already exists in your gym records: ${row.phone}`);
        }
      }
    }

    // If dry-run (preview), return summary directly
    if (!commit) {
      return NextResponse.json({
        preview: true,
        summary: {
          totalRows: summary.totalRows,
          validRows: summary.rows.filter((r) => r.isValid).length,
          invalidRows: summary.rows.filter((r) => !r.isValid).length,
          duplicatePhonesInFile: summary.duplicatePhonesInFile,
          existingInDbCount,
          sampleRows: summary.rows.slice(0, 10),
        },
      });
    }

    // Commit mode: Insert valid rows
    const defaultPlan = (await db.select().from(plans).where(eq(plans.gymId, gym.id)).limit(1))[0];
    const insertedMembers: string[] = [];

    for (const row of summary.rows) {
      if (!row.isValid) continue;

      const [newMem] = await db
        .insert(members)
        .values({
          gymId: gym.id,
          firstName: row.firstName,
          lastName: row.lastName,
          phone: row.phone,
          email: row.email,
          gender: row.gender,
          status: "ACTIVE",
          tags: row.tags || [],
        })
        .returning();

      // If plan/dates provided, create membership
      if (defaultPlan) {
        const start = row.startDate || new Date().toISOString().split("T")[0];
        const end = row.endDate || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split("T")[0];

        await db.insert(memberships).values({
          gymId: gym.id,
          memberId: newMem.id,
          planId: defaultPlan.id,
          startDate: start,
          endDate: end,
          originalEndDate: end,
          status: "ACTIVE",
          totalAmount: (row.amountPaid || parseFloat(defaultPlan.totalPrice)).toString(),
          amountPaid: (row.amountPaid || parseFloat(defaultPlan.totalPrice)).toString(),
          amountDue: "0.00",
        });
      }

      insertedMembers.push(newMem.id);
    }

    return NextResponse.json({
      success: true,
      committed: true,
      importedCount: insertedMembers.length,
      skippedCount: summary.totalRows - insertedMembers.length,
    });
  } catch (error: any) {
    console.error("CSV import error:", error);
    return NextResponse.json(
      { error: "Failed to process CSV import", details: error.message },
      { status: 500 }
    );
  }
}
