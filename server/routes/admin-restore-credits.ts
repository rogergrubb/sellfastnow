import { Router } from "express";
import { isAuthenticated } from "../supabaseAuth";
import { db } from "../db";
import { userCredits } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

const router = Router();

/**
 * POST /api/admin/restore-credits
 * 
 * One-time admin endpoint to restore 169 credits that were lost during schema migration.
 * 
 * Security:
 * - Requires authentication
 * - Only works for the specific user ID
 * - Can only be called once (idempotent - checks if already restored)
 * 
 * Usage:
 * POST https://sellfast.now/api/admin/restore-credits
 * Headers: Authorization: Bearer <your-token>
 */
router.post("/restore-credits", isAuthenticated, async (req: any, res) => {
  try {
    const requestingUserId = req.auth.userId;
    const TARGET_USER_ID = '9ed23ff1-ec6f-4295-a973-24420523fb2f';
    const CREDITS_TO_RESTORE = 169;

    console.log(`🔧 Credit restoration request from user: ${requestingUserId}`);

    // Security: Only allow the target user to restore their own credits
    if (requestingUserId !== TARGET_USER_ID) {
      console.log(`❌ Unauthorized: User ${requestingUserId} attempted to restore credits`);
      return res.status(403).json({ 
        error: 'Unauthorized',
        message: 'You do not have permission to perform this action'
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

    // Idempotency check: If user already has >= 169 credits, don't add more
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
