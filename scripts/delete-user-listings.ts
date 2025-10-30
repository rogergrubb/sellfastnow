import { db } from "../server/db";
import { users, listings } from "../shared/schema";
import { eq } from "drizzle-orm";

async function deleteUserListings() {
  try {
    // Find user by email
    const [user] = await db.select().from(users).where(eq(users.email, "roger@grubb.net"));
    
    if (!user) {
      console.log("❌ User not found: roger@grubb.net");
      return;
    }
    
    console.log(`✅ Found user: ${user.email} (ID: ${user.id})`);
    
    // Get all listings for this user
    const userListings = await db.select().from(listings).where(eq(listings.userId, user.id));
    
    console.log(`📋 Found ${userListings.length} listings for this user`);
    
    if (userListings.length === 0) {
      console.log("✅ No listings to delete");
      return;
    }
    
    // Delete all listings
    const result = await db.delete(listings).where(eq(listings.userId, user.id));
    
    console.log(`✅ Successfully deleted all listings for roger@grubb.net`);
    console.log(`📊 Total deleted: ${userListings.length} listings`);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

deleteUserListings();
