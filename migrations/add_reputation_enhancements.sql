-- Migration: Add Reputation System Enhancements
-- Description: Adds transaction references, 0.5 star rating support, and anti-fraud tracking

-- Add transaction reference to reviews table
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS transaction_id VARCHAR REFERENCES transactions(id) ON DELETE SET NULL;

-- Add transaction reference to cancellation_comments table
ALTER TABLE cancellation_comments ADD COLUMN IF NOT EXISTS transaction_id VARCHAR REFERENCES transactions(id) ON DELETE SET NULL;

-- Add last-minute cancellation tracking to cancellation_comments
ALTER TABLE cancellation_comments ADD COLUMN IF NOT EXISTS is_last_minute_cancellation BOOLEAN DEFAULT false;
ALTER TABLE cancellation_comments ADD COLUMN IF NOT EXISTS hours_before_meetup INTEGER;

-- Add last-minute cancellation tracking to userStatistics
ALTER TABLE user_statistics ADD COLUMN IF NOT EXISTS last_minute_cancels_by_seller INTEGER DEFAULT 0;
ALTER TABLE user_statistics ADD COLUMN IF NOT EXISTS last_minute_cancels_by_buyer INTEGER DEFAULT 0;

-- Add cancellation tracking to transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS cancelled_by TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_last_minute_cancellation BOOLEAN DEFAULT false;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS hours_before_meetup INTEGER;

-- Add comments to clarify rating scale (1-10 internally, displayed as 0.5-5.0 stars)
COMMENT ON COLUMN reviews.overall_rating IS 'Rating scale 1-10 (divide by 2 for display as 0.5-5.0 stars)';
COMMENT ON COLUMN reviews.communication_rating IS 'Rating scale 1-10 (divide by 2 for display as 0.5-5.0 stars)';
COMMENT ON COLUMN reviews.as_described_rating IS 'Rating scale 1-10 (divide by 2 for display as 0.5-5.0 stars)';
COMMENT ON COLUMN reviews.punctuality_rating IS 'Rating scale 1-10 (divide by 2 for display as 0.5-5.0 stars)';
COMMENT ON COLUMN reviews.professionalism_rating IS 'Rating scale 1-10 (divide by 2 for display as 0.5-5.0 stars)';

-- Create index on transaction_id for faster lookups
CREATE INDEX IF NOT EXISTS reviews_transaction_id_idx ON reviews(transaction_id);
CREATE INDEX IF NOT EXISTS cancellation_comments_transaction_id_idx ON cancellation_comments(transaction_id);
CREATE INDEX IF NOT EXISTS transactions_cancelled_by_idx ON transactions(cancelled_by);

