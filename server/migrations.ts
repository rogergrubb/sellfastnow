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

    console.log("✅ Database migrations completed successfully");
  } catch (error) {
    console.error("❌ Migration error:", error);
    // Don't crash the server if migrations fail
    // The columns might already exist
  }
}

