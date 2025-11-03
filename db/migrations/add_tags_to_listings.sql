-- Add tags field to listings table
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Add index for tags array for better search performance
CREATE INDEX IF NOT EXISTS idx_listings_tags ON listings USING GIN (tags);

-- Add comment
COMMENT ON COLUMN listings.tags IS 'Product tags/keywords for search and categorization';
