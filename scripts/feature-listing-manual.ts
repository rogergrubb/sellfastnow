import { db } from "../server/db";
import { listings } from "@shared/schema";
import { eq, and } from "drizzle-orm";

/**
 * Manually feature a listing for testing purposes
 * This simulates what happens after a successful boost payment
 */
async function featureListing(listingId: string, durationHours: number = 168) {
  try {
    console.log(`Attempting to feature listing: ${listingId}`);
    
    // Get the listing first to verify it exists
    const [listing] = await db
      .select()
      .from(listings)
      .where(eq(listings.id, listingId))
      .limit(1);

    if (!listing) {
      console.error(`❌ Listing ${listingId} not found`);
      process.exit(1);
    }

    console.log(`✅ Found listing: ${listing.title}`);
    console.log(`   Status: ${listing.status}`);
    console.log(`   Price: ${listing.price}`);

    // Calculate featured_until timestamp
    const now = new Date();
    const featuredUntil = new Date(now.getTime() + durationHours * 60 * 60 * 1000);

    console.log(`Setting featured until: ${featuredUntil.toISOString()}`);

    // Update the listing
    await db
      .update(listings)
      .set({
        featuredUntil,
        featuredPaymentId: "manual_test_" + Date.now(),
        featuredCreatedAt: now,
        featuredDuration: `${durationHours}h`,
      })
      .where(eq(listings.id, listingId));

    console.log(`✅ Successfully featured listing ${listingId} until ${featuredUntil}`);
    console.log(`   Duration: ${durationHours} hours`);
    
  } catch (error) {
    console.error("❌ Error featuring listing:", error);
    process.exit(1);
  }
}

// Get listing ID from command line argument or use a default
const listingId = process.argv[2];

if (!listingId) {
  console.error("Usage: tsx scripts/feature-listing-manual.ts <listing-id>");
  console.log("\nTo find a listing ID, run:");
  console.log("  SELECT id, title FROM listings WHERE status = 'active' LIMIT 5;");
  process.exit(1);
}

featureListing(listingId)
  .then(() => {
    console.log("\n✅ Done! The listing should now appear in the featured carousel.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Failed:", error);
    process.exit(1);
  });
