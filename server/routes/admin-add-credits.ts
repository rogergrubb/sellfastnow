import { Router } from "express";
import { db } from "../db";
import { userCredits, users } from "../../shared/schema";
import { eq, sql } from "drizzle-orm";

const router = Router();

/**
 * POST /api/admin/add-credits
 * Add credits to a user account by email
 * 
 * Body:
 * {
 *   "secret": "restore-credits-2024",
 *   "email": "user@example.com",
 *   "credits": 10000
 * }
 */
router.post("/add-credits", async (req, res) => {
  try {
    const { secret, email, credits } = req.body;
    const EXPECTED_SECRET = 'restore-credits-2024';

    console.log(`🔧 Admin credit addition request for ${email}`);

    // Validate secret
    if (secret !== EXPECTED_SECRET) {
      console.log(`❌ Invalid secret provided`);
      return res.status(403).json({ 
        success: false,
        error: 'Forbidden - Invalid secret' 
      });
    }

    // Validate inputs
    if (!email || !credits) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: email, credits'
      });
    }

    if (typeof credits !== 'number' || credits <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Credits must be a positive number'
      });
    }

    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return res.status(404).json({
        success: false,
        error: `User not found: ${email}`
      });
    }

    console.log(`✅ Found user: ${user.id} (${email})`);

    // Get current credit balance
    const [currentCredits] = await db
      .select()
      .from(userCredits)
      .where(eq(userCredits.userId, user.id))
      .limit(1);

    const previousBalance = currentCredits ? {
      creditsRemaining: currentCredits.creditsRemaining || 0,
      creditsPurchased: currentCredits.creditsPurchased || 0,
      creditsUsed: currentCredits.creditsUsed || 0,
    } : {
      creditsRemaining: 0,
      creditsPurchased: 0,
      creditsUsed: 0,
    };

    // Add credits
    if (currentCredits) {
      // Update existing record
      await db
        .update(userCredits)
        .set({
          creditsRemaining: sql`${userCredits.creditsRemaining} + ${credits}`,
          creditsPurchased: sql`${userCredits.creditsPurchased} + ${credits}`,
          updatedAt: new Date(),
        })
        .where(eq(userCredits.userId, user.id));
    } else {
      // Create new record
      await db.insert(userCredits).values({
        userId: user.id,
        creditsRemaining: credits,
        creditsPurchased: credits,
        creditsUsed: 0,
      });
    }

    // Get updated balance
    const [updatedCredits] = await db
      .select()
      .from(userCredits)
      .where(eq(userCredits.userId, user.id))
      .limit(1);

    const newBalance = {
      creditsRemaining: updatedCredits.creditsRemaining || 0,
      creditsPurchased: updatedCredits.creditsPurchased || 0,
      creditsUsed: updatedCredits.creditsUsed || 0,
    };

    console.log(`✅ Successfully added ${credits} credits to ${email}`);
    console.log(`   Previous: ${previousBalance.creditsRemaining} remaining`);
    console.log(`   New: ${newBalance.creditsRemaining} remaining`);

    res.json({
      success: true,
      message: `Successfully added ${credits} credits to ${email}`,
      email,
      userId: user.id,
      creditsAdded: credits,
      previousBalance,
      newBalance,
    });

  } catch (error: any) {
    console.error("❌ Admin add credits error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

export default router;
