/**
 * Auto-migrations that run on server startup
 * Safely adds new columns if they don't exist
 */

import { db } from "./storage";
import { sql } from "drizzle-orm";

export async function runMigrations() {
  console.log("🔄 Running database migrations...");

  try {
    // Add location fields to users table (safe - uses IF NOT EXISTS)
    await db.execute(sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS location_city varchar(100);
    `);
    
    await db.execute(sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS location_region varchar(100);
    `);
    
    await db.execute(sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS location_country varchar(100);
    `);
    
    await db.execute(sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS location_postal_code varchar(20);
    `);
    
    await db.execute(sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS location_latitude numeric(10, 7);
    `);
    
    await db.execute(sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS location_longitude numeric(10, 7);
    `);
    
    await db.execute(sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS location_display_precision varchar(20) DEFAULT 'city';
    `);
    
    // Add contact preference fields
    await db.execute(sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS contact_email varchar(255);
    `);
    
    await db.execute(sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS contact_preference varchar(20) DEFAULT 'in_app';
    `);
    
    await db.execute(sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS show_email_publicly boolean DEFAULT false;
    `);

    console.log("✅ Database migrations completed successfully");
  } catch (error) {
    console.error("❌ Migration error:", error);
    // Don't crash the server if migrations fail
    // The columns might already exist
  }
}

