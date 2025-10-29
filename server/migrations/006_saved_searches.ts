import { db } from "../db";
import { sql } from "drizzle-orm";

export async function up() {
  console.log("🔄 Running migration: 006_saved_searches");
  
  // Create saved_searches table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS saved_searches (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      
      -- Search criteria
      search_query TEXT,
      category TEXT,
      condition TEXT,
      price_min INTEGER,
      price_max INTEGER,
      location TEXT,
      distance INTEGER,
      
      -- Notification preferences
      email_notifications BOOLEAN NOT NULL DEFAULT true,
      sms_notifications BOOLEAN NOT NULL DEFAULT false,
      notification_frequency TEXT NOT NULL DEFAULT 'instant',
      
      -- Tracking
      is_active BOOLEAN NOT NULL DEFAULT true,
      last_notified_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  
  // Create search_alert_notifications table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS search_alert_notifications (
      id SERIAL PRIMARY KEY,
      saved_search_id INTEGER NOT NULL REFERENCES saved_searches(id) ON DELETE CASCADE,
      listing_id VARCHAR NOT NULL,
      
      -- Notification status
      email_sent BOOLEAN NOT NULL DEFAULT false,
      email_sent_at TIMESTAMP,
      sms_sent BOOLEAN NOT NULL DEFAULT false,
      sms_sent_at TIMESTAMP,
      
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  
  // Create indexes for performance
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON saved_searches(user_id);
    CREATE INDEX IF NOT EXISTS idx_saved_searches_is_active ON saved_searches(is_active);
    CREATE INDEX IF NOT EXISTS idx_search_alert_notifications_saved_search_id ON search_alert_notifications(saved_search_id);
    CREATE INDEX IF NOT EXISTS idx_search_alert_notifications_listing_id ON search_alert_notifications(listing_id);
  `);
  
  console.log("✅ Migration 006_saved_searches completed");
}

export async function down() {
  console.log("🔄 Rolling back migration: 006_saved_searches");
  
  await db.execute(sql`DROP TABLE IF EXISTS search_alert_notifications CASCADE`);
  await db.execute(sql`DROP TABLE IF EXISTS saved_searches CASCADE`);
  
  console.log("✅ Migration 006_saved_searches rolled back");
}

