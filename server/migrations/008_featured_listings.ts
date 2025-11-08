import { sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

export async function up(db: PostgresJsDatabase) {
  console.log("Running migration: 008_featured_listings");
  
  // Add featured listing fields to listings table
  await db.execute(sql`
    ALTER TABLE listings
    ADD COLUMN IF NOT EXISTS featured_until TIMESTAMP,
    ADD COLUMN IF NOT EXISTS featured_payment_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS featured_created_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS featured_duration VARCHAR(10);
  `);
  
  // Create index for faster queries on featured listings
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_listings_featured_until 
    ON listings(featured_until) 
    WHERE featured_until IS NOT NULL;
  `);
  
  console.log("Migration 008_featured_listings completed successfully");
}

export async function down(db: PostgresJsDatabase) {
  console.log("Rolling back migration: 008_featured_listings");
  
  // Drop index
  await db.execute(sql`
    DROP INDEX IF EXISTS idx_listings_featured_until;
  `);
  
  // Remove featured listing fields
  await db.execute(sql`
    ALTER TABLE listings
    DROP COLUMN IF EXISTS featured_until,
    DROP COLUMN IF EXISTS featured_payment_id,
    DROP COLUMN IF EXISTS featured_created_at,
    DROP COLUMN IF EXISTS featured_duration;
  `);
  
  console.log("Migration 008_featured_listings rolled back successfully");
}
