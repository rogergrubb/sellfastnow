/**
 * Auto-migrations that run on server startup
 * Safely adds new columns if they don't exist
 */

import { db } from "./storage";
import { sql } from "drizzle-orm";

export async function runMigrations() {
  console.log("🔄 Running database migrations...");

  try {
    // Create messages table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS messages (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        listing_id varchar NOT NULL,
        sender_id varchar NOT NULL,
        receiver_id varchar NOT NULL,
        content text NOT NULL,
        is_read boolean DEFAULT false NOT NULL,
        created_at timestamp DEFAULT now()
      );
    `);
    
    console.log("✅ Messages table created/verified");
    
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
    
    // Add phone and sharing preferences
    await db.execute(sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number varchar(20);
    `);
    
    await db.execute(sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS share_phone_when varchar(20) DEFAULT 'never';
    `);
    
    await db.execute(sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS share_email_when varchar(20) DEFAULT 'after_acceptance';
    `);
    
    // Add privacy settings
    await db.execute(sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_visibility varchar(20) DEFAULT 'public';
    `);
    
    await db.execute(sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS show_last_active boolean DEFAULT true;
    `);
    
    await db.execute(sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS show_items_sold boolean DEFAULT true;
    `);
    
    await db.execute(sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS allow_messages_from varchar(20) DEFAULT 'verified';
    `);
    
    await db.execute(sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS require_verified_to_contact boolean DEFAULT true;
    `);
    
    // Add verification status fields
    await db.execute(sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false;
    `);
    
    await db.execute(sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified boolean DEFAULT false;
    `);
    
    await db.execute(sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS id_verified boolean DEFAULT false;
    `);
    
    await db.execute(sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS address_verified boolean DEFAULT false;
    `);
    
    await db.execute(sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS verified_at timestamp;
    `);
    
    // Add meeting preferences
    await db.execute(sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_meeting_locations text;
    `);
    
    await db.execute(sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS available_times text;
    `);
    
    await db.execute(sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS willing_to_ship boolean DEFAULT false;
    `);
    
    await db.execute(sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS shipping_fee_amount numeric(10, 2);
    `);
    
    // Add location fields to listings table
    await db.execute(sql`
      ALTER TABLE listings ADD COLUMN IF NOT EXISTS location_city varchar(100);
    `);
    
    await db.execute(sql`
      ALTER TABLE listings ADD COLUMN IF NOT EXISTS location_region varchar(100);
    `);
    
    await db.execute(sql`
      ALTER TABLE listings ADD COLUMN IF NOT EXISTS location_country varchar(100);
    `);
    
    await db.execute(sql`
      ALTER TABLE listings ADD COLUMN IF NOT EXISTS location_postal_code varchar(20);
    `);
    
    await db.execute(sql`
      ALTER TABLE listings ADD COLUMN IF NOT EXISTS location_latitude numeric(10, 7);
    `);
    
    await db.execute(sql`
      ALTER TABLE listings ADD COLUMN IF NOT EXISTS location_longitude numeric(10, 7);
    `);
    
    // Add advanced location fields to listings table
    await db.execute(sql`
      ALTER TABLE listings ADD COLUMN IF NOT EXISTS location_precision_level varchar(20);
    `);
    
    await db.execute(sql`
      ALTER TABLE listings ADD COLUMN IF NOT EXISTS location_privacy_radius integer;
    `);
    
    await db.execute(sql`
      ALTER TABLE listings ADD COLUMN IF NOT EXISTS location_neighborhood varchar(200);
    `);
    
    await db.execute(sql`
      ALTER TABLE listings ADD COLUMN IF NOT EXISTS location_street_address text;
    `);
    
    await db.execute(sql`
      ALTER TABLE listings ADD COLUMN IF NOT EXISTS location_formatted_address text;
    `);
    
    await db.execute(sql`
      ALTER TABLE listings ADD COLUMN IF NOT EXISTS location_place_id varchar(200);
    `);
    
    await db.execute(sql`
      ALTER TABLE listings ADD COLUMN IF NOT EXISTS location_timezone varchar(100);
    `);
    
    await db.execute(sql`
      ALTER TABLE listings ADD COLUMN IF NOT EXISTS location_geocoded boolean DEFAULT false;
    `);
    
    await db.execute(sql`
      ALTER TABLE listings ADD COLUMN IF NOT EXISTS location_geocoded_at timestamp;
    `);
    
    await db.execute(sql`
      ALTER TABLE listings ADD COLUMN IF NOT EXISTS location_geocoding_service varchar(100);
    `);
    
    await db.execute(sql`
      ALTER TABLE listings ADD COLUMN IF NOT EXISTS location_geocoding_accuracy varchar(50);
    `);
    
    await db.execute(sql`
      ALTER TABLE listings ADD COLUMN IF NOT EXISTS pickup_available boolean DEFAULT true;
    `);
    
    await db.execute(sql`
      ALTER TABLE listings ADD COLUMN IF NOT EXISTS delivery_available boolean DEFAULT false;
    `);
    
    await db.execute(sql`
      ALTER TABLE listings ADD COLUMN IF NOT EXISTS shipping_available boolean DEFAULT false;
    `);
    
    await db.execute(sql`
      ALTER TABLE listings ADD COLUMN IF NOT EXISTS meeting_points_available boolean DEFAULT false;
    `);
    
    await db.execute(sql`
      ALTER TABLE listings ADD COLUMN IF NOT EXISTS location_metadata jsonb DEFAULT '{}'::jsonb;
    `);
    
    console.log("✅ Advanced location columns added to listings table");
    
    // Add draft folder organization fields to listings table
    await db.execute(sql`
      ALTER TABLE listings ADD COLUMN IF NOT EXISTS batch_id varchar(100);
    `);
    
    await db.execute(sql`
      ALTER TABLE listings ADD COLUMN IF NOT EXISTS batch_title varchar(200);
    `);
    
    // Add index for faster folder queries
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_listings_batch_id ON listings(batch_id) WHERE batch_id IS NOT NULL;
    `);
    
    console.log("✅ Draft folder columns added to listings table");
    
    // Create draft_folders table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS draft_folders (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name varchar(200) NOT NULL,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );
    `);
    
    console.log("✅ Draft folders table created/verified");
    
    // Add folder_id to listings table
    await db.execute(sql`
      ALTER TABLE listings ADD COLUMN IF NOT EXISTS folder_id varchar REFERENCES draft_folders(id) ON DELETE SET NULL;
    `);
    
    // Add index for faster folder queries
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_listings_folder_id ON listings(folder_id) WHERE folder_id IS NOT NULL;
    `);
    
    console.log("✅ Folder ID column added to listings table");

    // Create meetup sessions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS meetup_sessions (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        transaction_id VARCHAR NOT NULL,
        listing_id VARCHAR NOT NULL,
        buyer_id VARCHAR NOT NULL,
        seller_id VARCHAR NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        initiated_by VARCHAR NOT NULL,
        buyer_shared_location BOOLEAN DEFAULT FALSE,
        seller_shared_location BOOLEAN DEFAULT FALSE,
        buyer_latitude DECIMAL(10, 7),
        buyer_longitude DECIMAL(10, 7),
        buyer_last_update TIMESTAMP,
        seller_latitude DECIMAL(10, 7),
        seller_longitude DECIMAL(10, 7),
        seller_last_update TIMESTAMP,
        current_distance DECIMAL(10, 2),
        expires_at TIMESTAMP NOT NULL,
        shared_with_contacts TEXT,
        suggested_meetup_lat DECIMAL(10, 7),
        suggested_meetup_lng DECIMAL(10, 7),
        suggested_meetup_name VARCHAR(200),
        completed_at TIMESTAMP,
        completed_by VARCHAR,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("✅ Meetup sessions table created");

    // Create location history table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS location_history (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id VARCHAR NOT NULL REFERENCES meetup_sessions(id) ON DELETE CASCADE,
        user_id VARCHAR NOT NULL,
        latitude DECIMAL(10, 7) NOT NULL,
        longitude DECIMAL(10, 7) NOT NULL,
        accuracy DECIMAL(10, 2),
        timestamp TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("✅ Location history table created");

    // Create meetup messages table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS meetup_messages (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id VARCHAR NOT NULL REFERENCES meetup_sessions(id) ON DELETE CASCADE,
        sender_id VARCHAR NOT NULL,
        message_type VARCHAR(50) NOT NULL,
        message_text TEXT,
        timestamp TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("✅ Meetup messages table created");

    // Create reliability scores table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS reliability_scores (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL UNIQUE,
        total_meetups INTEGER DEFAULT 0,
        completed_meetups INTEGER DEFAULT 0,
        cancelled_meetups INTEGER DEFAULT 0,
        average_punctuality DECIMAL(5, 2),
        on_time_count INTEGER DEFAULT 0,
        late_count INTEGER DEFAULT 0,
        no_show_count INTEGER DEFAULT 0,
        reliability_score DECIMAL(5, 2),
        last_updated TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("✅ Reliability scores table created");

    console.log("✅ Database migrations completed successfully");
  } catch (error) {
    console.error("❌ Migration error:", error);
    // Don't crash the server if migrations fail
    // The columns might already exist
  }
}

