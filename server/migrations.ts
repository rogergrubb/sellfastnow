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

    // Create referrals table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS referrals (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        referrer_id VARCHAR NOT NULL,
        referred_email VARCHAR NOT NULL,
        referred_user_id VARCHAR,
        status VARCHAR(20) DEFAULT 'pending' NOT NULL,
        credits_awarded BOOLEAN DEFAULT false NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        completed_at TIMESTAMP,
        awarded_at TIMESTAMP
      );
    `);
    console.log("✅ Referrals table created");

    // Create index on referred_email for faster lookups
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_referrals_referred_email ON referrals(referred_email);
    `);
    console.log("✅ Referrals index created");

    // Create analytics_events table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS analytics_events (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR,
        user_email VARCHAR,
        ip_address VARCHAR NOT NULL,
        session_id VARCHAR NOT NULL,
        event_type VARCHAR(50) NOT NULL,
        event_name VARCHAR(100) NOT NULL,
        page_path VARCHAR(500) NOT NULL,
        page_title VARCHAR(200),
        referrer VARCHAR(500),
        element_id VARCHAR(100),
        element_class VARCHAR(200),
        element_text VARCHAR(500),
        element_type VARCHAR(50),
        metadata JSONB,
        user_agent VARCHAR(500),
        device_type VARCHAR(20),
        browser VARCHAR(50),
        os VARCHAR(50),
        timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
        experiment_id VARCHAR(100),
        variant_id VARCHAR(100)
      );
    `);
    console.log("✅ Analytics events table created");

    // Create analytics indexes
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics_events(user_id);
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_analytics_email ON analytics_events(user_email);
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_analytics_ip ON analytics_events(ip_address);
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_analytics_session ON analytics_events(session_id);
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics_events(timestamp);
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_analytics_page_path ON analytics_events(page_path);
    `);
    console.log("✅ Analytics indexes created");

    // Create business_partners table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS business_partners (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL,
        business_name VARCHAR NOT NULL,
        business_type VARCHAR NOT NULL,
        business_description TEXT,
        business_email VARCHAR NOT NULL,
        business_phone VARCHAR,
        business_website VARCHAR,
        logo_url VARCHAR,
        banner_url VARCHAR,
        primary_color VARCHAR DEFAULT '#3b82f6',
        secondary_color VARCHAR DEFAULT '#1e40af',
        custom_domain VARCHAR UNIQUE,
        street_address VARCHAR,
        city VARCHAR,
        state VARCHAR,
        postal_code VARCHAR,
        country VARCHAR DEFAULT 'US',
        stripe_account_id VARCHAR UNIQUE,
        platform_fee_percent DECIMAL(5, 2) DEFAULT 3.00,
        payout_schedule VARCHAR DEFAULT 'weekly',
        status VARCHAR DEFAULT 'pending',
        verification_status VARCHAR DEFAULT 'unverified',
        verified_at TIMESTAMP,
        settings JSONB DEFAULT '{}',
        features JSONB DEFAULT '{"bulkUpload":true,"emailCampaigns":true,"smsCampaigns":false,"analytics":true,"customBranding":true}',
        total_listings INTEGER DEFAULT 0,
        total_sales INTEGER DEFAULT 0,
        total_revenue DECIMAL(12, 2) DEFAULT 0.00,
        total_commission_earned DECIMAL(12, 2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        last_active_at TIMESTAMP
      );
    `);
    console.log("✅ Business partners table created");

    // Create partner_clients table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS partner_clients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        partner_id UUID NOT NULL REFERENCES business_partners(id),
        email VARCHAR NOT NULL,
        first_name VARCHAR,
        last_name VARCHAR,
        phone VARCHAR,
        total_purchases INTEGER DEFAULT 0,
        total_spent DECIMAL(12, 2) DEFAULT 0.00,
        last_purchase_at TIMESTAMP,
        email_opt_in BOOLEAN DEFAULT true,
        sms_opt_in BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log("✅ Partner clients table created");

    // Create partner_listings table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS partner_listings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        partner_id UUID NOT NULL REFERENCES business_partners(id),
        listing_id VARCHAR NOT NULL,
        batch_id VARCHAR,
        uploaded_at TIMESTAMP DEFAULT NOW(),
        status VARCHAR DEFAULT 'active',
        sold_at TIMESTAMP,
        sold_price DECIMAL(10, 2),
        platform_fee DECIMAL(10, 2),
        partner_earnings DECIMAL(10, 2),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log("✅ Partner listings table created");

    // Create partner_campaigns table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS partner_campaigns (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        partner_id UUID NOT NULL REFERENCES business_partners(id),
        name VARCHAR NOT NULL,
        subject VARCHAR NOT NULL,
        html_content TEXT NOT NULL,
        plain_text_content TEXT,
        target_audience VARCHAR DEFAULT 'all',
        recipient_count INTEGER DEFAULT 0,
        status VARCHAR DEFAULT 'draft',
        scheduled_for TIMESTAMP,
        sent_at TIMESTAMP,
        opens INTEGER DEFAULT 0,
        clicks INTEGER DEFAULT 0,
        conversions INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log("✅ Partner campaigns table created");

    // Create indexes for partner tables
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_business_partners_user_id ON business_partners(user_id);
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_business_partners_custom_domain ON business_partners(custom_domain);
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_partner_clients_partner_id ON partner_clients(partner_id);
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_partner_listings_partner_id ON partner_listings(partner_id);
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_partner_listings_listing_id ON partner_listings(listing_id);
    `);
    console.log("✅ Partner indexes created");

    // Create notifications system tables
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        related_id VARCHAR,
        related_type VARCHAR(50),
        action_url VARCHAR(500),
        is_read BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        read_at TIMESTAMP
      );
    `);
    console.log("✅ Notifications table created");

    // Create notification indexes
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
    `);
    console.log("✅ Notification indexes created");

    // Create notification preferences table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS notification_preferences (
        user_id VARCHAR PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        in_app_messages BOOLEAN NOT NULL DEFAULT true,
        in_app_offers BOOLEAN NOT NULL DEFAULT true,
        in_app_reviews BOOLEAN NOT NULL DEFAULT true,
        in_app_transactions BOOLEAN NOT NULL DEFAULT true,
        in_app_sales BOOLEAN NOT NULL DEFAULT true,
        in_app_purchases BOOLEAN NOT NULL DEFAULT true,
        in_app_system BOOLEAN NOT NULL DEFAULT true,
        email_messages BOOLEAN NOT NULL DEFAULT true,
        email_offers BOOLEAN NOT NULL DEFAULT true,
        email_reviews BOOLEAN NOT NULL DEFAULT true,
        email_transactions BOOLEAN NOT NULL DEFAULT true,
        email_sales BOOLEAN NOT NULL DEFAULT true,
        email_purchases BOOLEAN NOT NULL DEFAULT true,
        email_system BOOLEAN NOT NULL DEFAULT false,
        email_daily_digest BOOLEAN NOT NULL DEFAULT false,
        email_weekly_digest BOOLEAN NOT NULL DEFAULT false,
        sms_messages BOOLEAN NOT NULL DEFAULT false,
        sms_offers BOOLEAN NOT NULL DEFAULT false,
        sms_reviews BOOLEAN NOT NULL DEFAULT false,
        sms_transactions BOOLEAN NOT NULL DEFAULT false,
        sms_sales BOOLEAN NOT NULL DEFAULT false,
        sms_purchases BOOLEAN NOT NULL DEFAULT false,
        sms_system BOOLEAN NOT NULL DEFAULT false,
        quiet_hours_enabled BOOLEAN NOT NULL DEFAULT false,
        quiet_hours_start TIME,
        quiet_hours_end TIME,
        timezone VARCHAR(100),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log("✅ Notification preferences table created");

    // Create notification delivery log table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS notification_delivery_log (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        notification_id VARCHAR NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
        delivery_method VARCHAR(20) NOT NULL,
        status VARCHAR(20) NOT NULL,
        recipient VARCHAR(255),
        error_message TEXT,
        sent_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log("✅ Notification delivery log table created");

    // Create default preferences for existing users
    await db.execute(sql`
      INSERT INTO notification_preferences (user_id)
      SELECT id FROM users
      WHERE id NOT IN (SELECT user_id FROM notification_preferences)
      ON CONFLICT (user_id) DO NOTHING;
    `);
    console.log("✅ Default notification preferences created for existing users");

    console.log("✅ Database migrations completed successfully");
  } catch (error) {
    console.error("❌ Migration error:", error);
    // Don't crash the server if migrations fail
    // The columns might already exist
  }
}

