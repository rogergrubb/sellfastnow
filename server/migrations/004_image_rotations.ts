import { sql } from "drizzle-orm";
import { db } from "../db";

export async function up() {
  console.log("Running migration: 004_image_rotations");

  // Add imageRotations column to listings table
  await db.execute(sql`
    ALTER TABLE listings 
    ADD COLUMN IF NOT EXISTS image_rotations JSONB DEFAULT '[]'::jsonb;
  `);

  console.log("✅ Added image_rotations column to listings table");
  console.log("Migration 004_image_rotations completed successfully");
}

export async function down() {
  console.log("Rolling back migration: 004_image_rotations");
  
  await db.execute(sql`
    ALTER TABLE listings 
    DROP COLUMN IF EXISTS image_rotations;
  `);
  
  console.log("Migration 004_image_rotations rolled back successfully");
}

