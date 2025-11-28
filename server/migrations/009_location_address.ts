import { db } from "../db";
import { sql } from "drizzle-orm";

export async function up() {
  console.log("Running migration: 009_location_address");
  
  // Add location_address column to users table
  await db.execute(sql`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS location_address VARCHAR(255);
  `);
  
  console.log("✅ Migration 009: Added location_address column to users table");
}
