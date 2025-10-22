// Fix user profiles - ensure firstName and lastName are populated
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, isNull, or, sql } from 'drizzle-orm';
import pg from 'pg';
import { users } from './shared/schema.ts';

const { Client } = pg;

async function fixUserProfiles() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL
  });

  await client.connect();
  const db = drizzle(client);

  console.log('🔍 Checking for users with missing profile information...');

  // Find users with missing names
  const usersWithoutNames = await db
    .select()
    .from(users)
    .where(
      or(
        isNull(users.firstName),
        isNull(users.lastName),
        eq(users.firstName, ''),
        eq(users.lastName, '')
      )
    );

  console.log(`Found ${usersWithoutNames.length} users with missing names`);

  for (const user of usersWithoutNames) {
    // Extract name from email if available
    if (user.email) {
      const emailName = user.email.split('@')[0];
      const nameParts = emailName.split(/[._-]/);
      
      const firstName = nameParts[0] 
        ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1)
        : 'User';
      
      const lastName = nameParts[1]
        ? nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1)
        : emailName.charAt(0).toUpperCase();

      await db
        .update(users)
        .set({
          firstName: user.firstName || firstName,
          lastName: user.lastName || lastName,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      console.log(`✅ Updated user ${user.id}: ${firstName} ${lastName}`);
    }
  }

  console.log('✨ Done! All users now have profile information.');
  await client.end();
}

fixUserProfiles().catch(console.error);

