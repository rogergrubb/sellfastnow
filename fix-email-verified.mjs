import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import { users } from './shared/schema.ts';
import { eq } from 'drizzle-orm';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
});

const db = drizzle(pool);

async function fixEmailVerified() {
  try {
    console.log('🔍 Finding users with emailVerified = false...');
    
    // Get all users where emailVerified is false
    const unverifiedUsers = await db
      .select()
      .from(users)
      .where(eq(users.emailVerified, false));
    
    console.log(`📊 Found ${unverifiedUsers.length} users with emailVerified = false`);
    
    if (unverifiedUsers.length === 0) {
      console.log('✅ All users already have emailVerified = true');
      await pool.end();
      return;
    }
    
    // Update all users to have emailVerified = true
    // (Since they're authenticated through Clerk, they must have verified emails)
    for (const user of unverifiedUsers) {
      console.log(`📝 Updating user: ${user.email} (${user.id})`);
      
      await db
        .update(users)
        .set({ emailVerified: true })
        .where(eq(users.id, user.id));
      
      console.log(`✅ Updated ${user.email}`);
    }
    
    console.log(`\n🎉 Successfully updated ${unverifiedUsers.length} users!`);
    console.log('✅ All Clerk users now have emailVerified = true');
    
  } catch (error) {
    console.error('❌ Error updating users:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

fixEmailVerified();

