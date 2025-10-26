import { db } from "../db";
import { sql } from "drizzle-orm";

/**
 * Migration: Draft Collections Feature
 * Creates tables for:
 * - draft_collections: Store collection/subset organization
 * - user_segments: Track detected user segments
 * - monetization_events: Log monetization interactions
 */
export async function runDraftCollectionsMigration() {
  console.log("🔄 Running Draft Collections migration...");

  try {
    // Create draft_collections table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS draft_collections (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        collection_name TEXT NOT NULL,
        subset_name TEXT,
        draft_id TEXT NOT NULL,
        metadata JSONB,
        segment_prediction TEXT,
        ai_suggestion_source TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS draft_collections_user_id_idx 
      ON draft_collections(user_id);
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS draft_collections_collection_name_idx 
      ON draft_collections(collection_name);
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS draft_collections_draft_id_idx 
      ON draft_collections(draft_id);
    `);

    console.log("✅ Created draft_collections table");

    // Create user_segments table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_segments (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        segment TEXT NOT NULL,
        confidence TEXT NOT NULL,
        detection_signals JSONB,
        first_detected_at TIMESTAMP DEFAULT NOW() NOT NULL,
        last_detected_at TIMESTAMP DEFAULT NOW() NOT NULL,
        detection_count TEXT DEFAULT '1' NOT NULL
      );
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS user_segments_user_id_idx 
      ON user_segments(user_id);
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS user_segments_segment_idx 
      ON user_segments(segment);
    `);

    console.log("✅ Created user_segments table");

    // Create monetization_events table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS monetization_events (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        segment TEXT NOT NULL,
        offer_type TEXT NOT NULL,
        collection_id TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS monetization_events_user_id_idx 
      ON monetization_events(user_id);
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS monetization_events_event_type_idx 
      ON monetization_events(event_type);
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS monetization_events_segment_idx 
      ON monetization_events(segment);
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS monetization_events_created_at_idx 
      ON monetization_events(created_at);
    `);

    console.log("✅ Created monetization_events table");

    console.log("🎉 Draft Collections migration completed successfully!");
    return true;
  } catch (error: any) {
    console.error("❌ Draft Collections migration failed:", error);
    // Don't throw - allow app to continue even if migration fails
    // (tables might already exist)
    return false;
  }
}

