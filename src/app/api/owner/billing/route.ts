import { NextResponse } from "next/server";
import { db, invoices, payments, gyms } from "@/db";
import { eq, desc } from "drizzle-orm";
import { generateUpiQrCodeDataUrl, generateUpiUri } from "@/modules/billing/upi";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gymSlug = searchParams.get("gymSlug") || "ironforge-fitness";

    const [gym] = await db.select().from(gyms).where(eq(gyms.slug, gymSlug)).limit(1);
    if (!gym) {
      return NextResponse.json({ error: "Gym not found" }, { status: 404 });
    }

    const invoiceList = await db
      .select()
      .from(invoices)
      .where(eq(invoices.gymId, gym.id))
      .orderBy(desc(invoices.createdAt));

    let totalCollected = 0;
    let totalTaxCollected = 0;
    let totalDues = 0;

    for (const inv of invoiceList) {
      const grandTotal = parseFloat(inv.grandTotal);
      const tax = parseFloat(inv.totalTax);
      if (inv.status === "PAID") {
        totalCollected += grandTotal;
        totalTaxCollected += tax;
      } else if (inv.status === "ISSUED") {
        totalDues += grandTotal;
      }
    }

    // Generate UPI payment parameters for this gym
    const gymVpa = `${gym.slug.replace(/[^a-z0-9]/g, "")}@icici`;

    return NextResponse.json({
      summary: {
        totalCollected,
        totalTaxCollected,
        totalDues,
        invoiceCount: invoiceList.length,
      },
      invoices: invoiceList,
      gymVpa,
    });
  } catch (error: any) {
    console.error("Billing feed error:", error);
    return NextResponse.json(
      { error: "Failed to fetch billing data", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { payeeVpa, payeeName, amount, invoiceNumber } = body;

    if (!amount || !payeeVpa) {
      return NextResponse.json({ error: "Amount and UPI VPA required" }, { status: 400 });
    }

    const upiUri = generateUpiUri({
      payeeVpa,
      payeeName: payeeName || "RepSync Fitness Partner",
      amount: parseFloat(amount),
      transactionRef: invoiceNumber || `RPS-${Date.now()}`,
      transactionNote: `Payment for Invoice ${invoiceNumber || ""}`,
    });

    const qrDataUrl = await generateUpiQrCodeDataUrl({
      payeeVpa,
      payeeName: payeeName || "RepSync Fitness Partner",
      amount: parseFloat(amount),
      transactionRef: invoiceNumber || `RPS-${Date.now()}`,
      transactionNote: `Payment for Invoice ${invoiceNumber || ""}`,
    });

    return NextResponse.json({
      upiUri,
      qrDataUrl,
    });
  } catch (error: any) {
    console.error("UPI QR generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate UPI QR", details: error.message },
      { status: 500 }
    );
  }
}
