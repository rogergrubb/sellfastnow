import { Router } from "express";
import { db } from "../db";
import { users, listings } from "@shared/schema";
import { eq } from "drizzle-orm";

const router = Router();

/**
 * Delete all listings for a specific user by email
 * POST /api/admin/delete-user-listings
 * Body: { email: string }
 */
router.post("/delete-user-listings", async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    
    // Find user by email
    const [user] = await db.select().from(users).where(eq(users.email, email));
    
    if (!user) {
      return res.status(404).json({ message: `User not found: ${email}` });
    }
    
    console.log(`✅ Found user: ${user.email} (ID: ${user.id})`);
    
    // Get all listings for this user
    const userListings = await db.select().from(listings).where(eq(listings.userId, user.id));
    
    console.log(`📋 Found ${userListings.length} listings for user ${email}`);
    
    if (userListings.length === 0) {
      return res.json({
        success: true,
        message: "No listings to delete",
        deletedCount: 0,
      });
    }
    
    // Delete all listings
    await db.delete(listings).where(eq(listings.userId, user.id));
    
    console.log(`✅ Successfully deleted ${userListings.length} listings for ${email}`);
    
    res.json({
      success: true,
      message: `Successfully deleted all listings for ${email}`,
      deletedCount: userListings.length,
      userId: user.id,
    });
  } catch (error) {
    console.error("❌ Error deleting user listings:", error);
    res.status(500).json({ message: "Failed to delete listings" });
  }
});

export default router;

