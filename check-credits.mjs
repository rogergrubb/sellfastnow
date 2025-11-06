import { db } from './server/db.js';
import { userCredits } from './shared/schema.js';
import { eq } from 'drizzle-orm';

const userId = '9ed23ff1-ec6f-4295-a973-24420523fb2f';

console.log(`\n🔍 Checking credits for user: ${userId}\n`);

try {
  const [credits] = await db
    .select()
    .from(userCredits)
    .where(eq(userCredits.userId, userId))
    .limit(1);

  if (credits) {
    console.log('✅ Found credits record:');
    console.log(JSON.stringify(credits, null, 2));
  } else {
    console.log('❌ No credits record found for this user');
    console.log('\nLet me check all credits records...\n');
    
    const allCredits = await db.select().from(userCredits).limit(10);
    console.log(`Found ${allCredits.length} total credit records:`);
    allCredits.forEach((c, i) => {
      console.log(`\n[${i + 1}] User: ${c.userId}`);
      console.log(`    Email: ${c.email}`);
      console.log(`    Credits: ${c.creditsRemaining}/${c.creditsPurchased}`);
    });
  }
} catch (error) {
  console.error('❌ Error:', error.message);
}

process.exit(0);
