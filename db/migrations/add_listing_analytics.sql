-- Add analytics fields to listings table
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMP;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_listings_view_count ON listings(view_count);
CREATE INDEX IF NOT EXISTS idx_listings_last_viewed_at ON listings(last_viewed_at);

-- Update existing listings to have 0 views
UPDATE listings SET view_count = 0 WHERE view_count IS NULL;

