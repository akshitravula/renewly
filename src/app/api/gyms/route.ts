import { NextResponse } from "next/server";
import { db, gyms, branches, listings, listingPhotos, plans } from "@/db";
import { eq, and } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city") || "Bengaluru";

    const allGyms = await db
      .select({
        id: gyms.id,
        name: gyms.name,
        slug: gyms.slug,
        phone: gyms.phone,
        status: gyms.status,
        isClaimed: gyms.isClaimed,
        headline: listings.headline,
        description: listings.description,
        genderPolicy: listings.genderPolicy,
        startingPriceMonthly: listings.startingPriceMonthly,
        isVerified: listings.isVerified,
        isFeatured: listings.isFeatured,
        listingQualityScore: listings.listingQualityScore,
        branchId: branches.id,
        branchName: branches.name,
        locality: branches.locality,
        city: branches.city,
        state: branches.state,
        pincode: branches.pincode,
        latitude: branches.latitude,
        longitude: branches.longitude,
      })
      .from(gyms)
      .innerJoin(listings, eq(gyms.id, listings.gymId))
      .innerJoin(branches, eq(gyms.id, branches.gymId))
      .where(and(eq(gyms.status, "ACTIVE"), eq(branches.city, city)));

    // Fetch cover photos for each gym
    const photos = await db
      .select({
        gymId: listingPhotos.gymId,
        photoUrl: listingPhotos.photoUrl,
        isCover: listingPhotos.isCover,
      })
      .from(listingPhotos);

    const gymsWithPhotos = allGyms.map((g) => {
      const coverPhoto =
        photos.find((p) => p.gymId === g.id && p.isCover)?.photoUrl ||
        photos.find((p) => p.gymId === g.id)?.photoUrl ||
        "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80";

      return {
        ...g,
        coverPhoto,
      };
    });

    return NextResponse.json({
      city,
      count: gymsWithPhotos.length,
      gyms: gymsWithPhotos,
    });
  } catch (error: any) {
    console.error("Error fetching gyms:", error);
    return NextResponse.json(
      { error: "Failed to fetch gyms", details: error.message },
      { status: 500 }
    );
  }
}
