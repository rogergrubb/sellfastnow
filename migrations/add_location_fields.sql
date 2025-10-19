-- Add structured location fields to users table
-- Migration: Add worldwide location support
-- Date: 2025-10-19

-- Add new location fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS location_city varchar(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS location_region varchar(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS location_country varchar(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS location_postal_code varchar(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS location_latitude numeric(10, 7);
ALTER TABLE users ADD COLUMN IF NOT EXISTS location_longitude numeric(10, 7);
ALTER TABLE users ADD COLUMN IF NOT EXISTS location_display_precision varchar(20) DEFAULT 'city';

-- Add comment for documentation
COMMENT ON COLUMN users.location_city IS 'City name for user location';
COMMENT ON COLUMN users.location_region IS 'State/Province/Region for user location';
COMMENT ON COLUMN users.location_country IS 'Country name for user location';
COMMENT ON COLUMN users.location_postal_code IS 'Postal/ZIP code for user location';
COMMENT ON COLUMN users.location_latitude IS 'Latitude coordinate for distance calculations';
COMMENT ON COLUMN users.location_longitude IS 'Longitude coordinate for distance calculations';
COMMENT ON COLUMN users.location_display_precision IS 'Privacy setting: exact, neighborhood, city, or region';

