import { sql } from "drizzle-orm";
import { db } from "../db";

export async function up() {
  console.log("Running migration: 005_free_listings_tracking");
  
  await db.execute(sql`
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS free_listings_used_this_month INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS free_listings_reset_date TIMESTAMP NOT NULL DEFAULT NOW()
  `);
  
  console.log("✅ Added free_listings_used_this_month and free_listings_reset_date columns to users table");
}

export async function down() {
  await db.execute(sql`
    ALTER TABLE users 
    DROP COLUMN IF EXISTS free_listings_used_this_month,
    DROP COLUMN IF EXISTS free_listings_reset_date
  `);
}

