import { db } from "@db";
import { sql } from "drizzle-orm";

export async function autoApplyLocationSchema() {
  console.log('🔧 Auto-applying location schema...');
  
  try {
    // Check if columns already exist
    const checkQuery = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'listings' 
      AND column_name = 'location_precision_level'
    `);
    
    if (checkQuery.rows.length > 0) {
      console.log('✅ Location schema already applied');
      return;
    }

    console.log('📝 Applying location schema columns...');

    // Add all location columns
    await db.execute(sql`
      ALTER TABLE listings
      ADD COLUMN IF NOT EXISTS location_precision_level TEXT,
      ADD COLUMN IF NOT EXISTS location_privacy_radius INTEGER,
      ADD COLUMN IF NOT EXISTS location_neighborhood TEXT,
      ADD COLUMN IF NOT EXISTS location_street_address TEXT,
      ADD COLUMN IF NOT EXISTS location_formatted_address TEXT,
      ADD COLUMN IF NOT EXISTS location_place_id TEXT,
      ADD COLUMN IF NOT EXISTS location_timezone TEXT,
      ADD COLUMN IF NOT EXISTS location_geocoded BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS location_geocoded_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS location_geocoding_service TEXT,
      ADD COLUMN IF NOT EXISTS location_geocoding_accuracy TEXT,
      ADD COLUMN IF NOT EXISTS pickup_available BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS delivery_available BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS shipping_available BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS meeting_points_available BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS location_metadata JSONB DEFAULT '{}'::jsonb
    `);

    console.log('✅ Location schema applied successfully!');
    console.log('📊 Added 16 location columns to listings table');
    
  } catch (error: any) {
    console.error('❌ Error applying location schema:', error.message);
    // Don't throw - let the server start even if schema application fails
  }
}

