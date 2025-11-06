/**
 * Restore 169 AI credits to user account
 * 
 * Background: The database was migrated from old schema (ai_generation_credits) 
 * to new schema (creditsRemaining), but the user's 169 credits were not transferred.
 * 
 * This script adds 169 credits back to the user's account.
 */

import { db } from './server/db';
import { userCredits } from './shared/schema';
import { eq, sql } from 'drizzle-orm';

const USER_ID = '9ed23ff1-ec6f-4295-a973-24420523fb2f';
const CREDITS_TO_RESTORE = 169;

async function restoreCredits() {
  console.log(`\n🔧 Restoring ${CREDITS_TO_RESTORE} credits to user ${USER_ID}\n`);

  try {
    // Check current balance
    const [current] = await db
      .select()
      .from(userCredits)
      .where(eq(userCredits.userId, USER_ID))
      .limit(1);

    if (!current) {
      console.error('❌ User credits record not found!');
      process.exit(1);
    }

    console.log('📊 Current balance:');
    console.log(`   - Credits Remaining: ${current.creditsRemaining}`);
    console.log(`   - Credits Purchased: ${current.creditsPurchased}`);
    console.log(`   - Credits Used: ${current.creditsUsed}`);

    // Add credits
    const [updated] = await db
      .update(userCredits)
      .set({
        creditsRemaining: sql`${userCredits.creditsRemaining} + ${CREDITS_TO_RESTORE}`,
        creditsPurchased: sql`${userCredits.creditsPurchased} + ${CREDITS_TO_RESTORE}`,
        updatedAt: new Date(),
      })
      .where(eq(userCredits.userId, USER_ID))
      .returning();

    console.log('\n✅ Credits restored successfully!');
    console.log('📊 New balance:');
    console.log(`   - Credits Remaining: ${updated.creditsRemaining}`);
    console.log(`   - Credits Purchased: ${updated.creditsPurchased}`);
    console.log(`   - Credits Used: ${updated.creditsUsed}`);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

restoreCredits();
