-- Add SMS preference columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS sms_weekly_updates BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sms_monthly_updates BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sms_credit_giveaways BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sms_promotional BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sms_opt_in_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS sms_offer_received BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sms_offer_response BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sms_payment_confirmed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sms_new_message BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sms_listing_published BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sms_listing_engagement BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sms_listing_sold BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sms_review_received BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sms_meetup_reminder BOOLEAN DEFAULT false;

-- Add analytics columns to listings table
ALTER TABLE listings
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS quality_score INTEGER;

-- Add SMS tracking to search_alert_notifications table
ALTER TABLE search_alert_notifications
ADD COLUMN IF NOT EXISTS sms_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sms_sent_at TIMESTAMP;

-- Add SMS notifications to saved_searches table
ALTER TABLE saved_searches
ADD COLUMN IF NOT EXISTS sms_notifications BOOLEAN DEFAULT false;

-- Create index for view tracking
CREATE INDEX IF NOT EXISTS idx_listings_view_count ON listings(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_listings_last_viewed ON listings(last_viewed_at DESC);

