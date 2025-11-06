import { Router } from "express";
import { db } from "../db";
import { userCredits } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

const router = Router();

/**
 * POST /api/admin/restore-credits-simple
 * 
 * Simple one-time endpoint to restore 10,000 credits using a secret key.
 * No authentication required - uses secret key instead.
 * 
 * Usage:
 * POST https://sellfast.now/api/admin/restore-credits-simple
 * Body: { "secret": "restore-credits-2024" }
 */
router.post("/restore-credits-simple", async (req, res) => {
  try {
    const { secret } = req.body;
    const TARGET_USER_ID = '60861352-09f2-4a59-b033-51f0bac2906b';
    const CREDITS_TO_RESTORE = 10000;
    const EXPECTED_SECRET = 'restore-credits-2024';

    console.log(`🔧 Simple credit restoration request received`);

    // Security: Check secret key
    if (secret !== EXPECTED_SECRET) {
      console.log(`❌ Invalid secret key provided`);
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'Invalid secret key'
      });
    }

    // Get current balance
    const [current] = await db
      .select()
      .from(userCredits)
      .where(eq(userCredits.userId, TARGET_USER_ID))
      .limit(1);

    if (!current) {
      console.error('❌ User credits record not found');
      return res.status(404).json({ 
        error: 'Not found',
        message: 'User credits record not found'
      });
    }

    console.log(`📊 Current balance: ${current.creditsRemaining} remaining, ${current.creditsPurchased} purchased`);

    // Idempotency check: If user already has >= 10000 credits, don't add more
    if (current.creditsRemaining >= CREDITS_TO_RESTORE) {
      console.log(`✅ Credits already restored (${current.creditsRemaining} >= ${CREDITS_TO_RESTORE})`);
      return res.json({
        success: true,
        message: 'Credits already restored',
        alreadyRestored: true,
        balance: {
          creditsRemaining: current.creditsRemaining,
          creditsPurchased: current.creditsPurchased,
          creditsUsed: current.creditsUsed,
        }
      });
    }

    // Restore credits
    const [updated] = await db
      .update(userCredits)
      .set({
        creditsRemaining: sql`${userCredits.creditsRemaining} + ${CREDITS_TO_RESTORE}`,
        creditsPurchased: sql`${userCredits.creditsPurchased} + ${CREDITS_TO_RESTORE}`,
        updatedAt: new Date(),
      })
      .where(eq(userCredits.userId, TARGET_USER_ID))
      .returning();

    console.log(`✅ Credits restored! New balance: ${updated.creditsRemaining} remaining`);

    res.json({
      success: true,
      message: `Successfully restored ${CREDITS_TO_RESTORE} credits`,
      restored: CREDITS_TO_RESTORE,
      previousBalance: {
        creditsRemaining: current.creditsRemaining,
        creditsPurchased: current.creditsPurchased,
        creditsUsed: current.creditsUsed,
      },
      newBalance: {
        creditsRemaining: updated.creditsRemaining,
        creditsPurchased: updated.creditsPurchased,
        creditsUsed: updated.creditsUsed,
      }
    });

  } catch (error: any) {
    console.error('❌ Error restoring credits:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to restore credits',
      details: error.message 
    });
  }
});

export default router;
