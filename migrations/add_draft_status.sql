-- Add draft status support for listings
-- This allows users to save incomplete listings and publish them later

-- Update the status column to allow 'draft' as a valid value
-- Current values: 'active', 'sold'
-- New value: 'draft'

-- Note: PostgreSQL doesn't have ENUM constraints on varchar, so no ALTER needed
-- Just update the default and add a comment

COMMENT ON COLUMN listings.status IS 'Listing status: draft, active, sold, or deleted';

-- Add index for faster draft queries
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_user_status ON listings(user_id, status);

-- Update any existing listings with empty/invalid status to 'active'
UPDATE listings SET status = 'active' WHERE status IS NULL OR status = '';
