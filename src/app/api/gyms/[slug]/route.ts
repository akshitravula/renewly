import { NextResponse } from "next/server";
import {
  db,
  gyms,
  branches,
  listings,
  listingPhotos,
  plans,
  trainers,
  gymAmenities,
  amenities,
  busyHourAggregates,
} from "@/db";
import { eq, and, asc } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const [gym] = await db
      .select({
        id: gyms.id,
        name: gyms.name,
        slug: gyms.slug,
        legalEntityName: gyms.legalEntityName,
        phone: gyms.phone,
        email: gyms.email,
        status: gyms.status,
        isClaimed: gyms.isClaimed,
        headline: listings.headline,
        description: listings.description,
        genderPolicy: listings.genderPolicy,
        womenOnlySlots: listings.womenOnlySlots,
        startingPriceMonthly: listings.startingPriceMonthly,
        isVerified: listings.isVerified,
        isFeatured: listings.isFeatured,
        listingQualityScore: listings.listingQualityScore,
      })
      .from(gyms)
      .innerJoin(listings, eq(gyms.id, listings.gymId))
      .where(eq(gyms.slug, slug))
      .limit(1);

    if (!gym) {
      return NextResponse.json({ error: "Gym not found" }, { status: 404 });
    }

    // Branch
    const [branch] = await db
      .select()
      .from(branches)
      .where(eq(branches.gymId, gym.id))
      .limit(1);

    // Photos
    const photos = await db
      .select()
      .from(listingPhotos)
      .where(eq(listingPhotos.gymId, gym.id))
      .orderBy(asc(listingPhotos.displayOrder));

    // Public Active Plans
    const activePlans = await db
      .select()
      .from(plans)
      .where(and(eq(plans.gymId, gym.id), eq(plans.isPublic, true), eq(plans.isActive, true)))
      .orderBy(asc(plans.durationMonths));

    // Trainers
    const publicTrainers = await db
      .select()
      .from(trainers)
      .where(and(eq(trainers.gymId, gym.id), eq(trainers.isPublic, true)));

    // Amenities
    const gymAmenitiesList = await db
      .select({
        id: amenities.id,
        name: amenities.name,
        slug: amenities.slug,
        category: amenities.category,
        icon: amenities.icon,
        details: gymAmenities.details,
      })
      .from(gymAmenities)
      .innerJoin(amenities, eq(gymAmenities.amenityId, amenities.id))
      .where(and(eq(gymAmenities.gymId, gym.id), eq(gymAmenities.isAvailable, true)));

    // If no custom gym amenities seeded, fallback to default master list
    const finalAmenities =
      gymAmenitiesList.length > 0
        ? gymAmenitiesList
        : await db.select().from(amenities).limit(8);

    // Busyness data
    const busyness = await db
      .select()
      .from(busyHourAggregates)
      .where(eq(busyHourAggregates.gymId, gym.id))
      .orderBy(asc(busyHourAggregates.hourOfDay));

    return NextResponse.json({
      gym,
      branch,
      photos,
      plans: activePlans,
      trainers: publicTrainers,
      amenities: finalAmenities,
      busyness,
    });
  } catch (error: any) {
    console.error("Error fetching gym profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch gym profile", details: error.message },
      { status: 500 }
    );
  }
}
