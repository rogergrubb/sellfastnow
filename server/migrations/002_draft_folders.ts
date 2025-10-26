import { db } from "../db";
import { sql } from "drizzle-orm";

/**
 * Migration: Draft Folders
 * Adds batch_id and batch_title columns to listings table
 * for organizing drafts into named folders
 */
export async function runDraftFoldersMigration() {
  console.log("🔄 Running Draft Folders migration...");

  try {
    // Add batch_id column
    await db.execute(sql`
      ALTER TABLE listings 
      ADD COLUMN IF NOT EXISTS batch_id VARCHAR(100);
    `);

    console.log("✅ Added batch_id column");

    // Add batch_title column
    await db.execute(sql`
      ALTER TABLE listings 
      ADD COLUMN IF NOT EXISTS batch_title VARCHAR(200);
    `);

    console.log("✅ Added batch_title column");

    // Create index on batch_id for faster folder queries
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS listings_batch_id_idx 
      ON listings(batch_id);
    `);

    console.log("✅ Created batch_id index");

    // Create index on batch_id + status for draft folder queries
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS listings_batch_id_status_idx 
      ON listings(batch_id, status);
    `);

    console.log("✅ Created batch_id + status composite index");

    console.log("🎉 Draft Folders migration completed successfully!");
    return true;
  } catch (error: any) {
    console.error("❌ Draft Folders migration failed:", error);
    // Don't throw - allow app to continue even if migration fails
    return false;
  }
}

