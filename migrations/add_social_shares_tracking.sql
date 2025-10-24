-- Create social shares tracking table
CREATE TABLE IF NOT EXISTS social_shares (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id VARCHAR REFERENCES listings(id) ON DELETE CASCADE,
  user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
  platform VARCHAR(20) NOT NULL,
  share_type VARCHAR(20) NOT NULL,
  share_url VARCHAR(500) NOT NULL,
  user_agent VARCHAR(500),
  referrer VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_social_shares_listing_id ON social_shares(listing_id);
CREATE INDEX IF NOT EXISTS idx_social_shares_user_id ON social_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_social_shares_platform ON social_shares(platform);
CREATE INDEX IF NOT EXISTS idx_social_shares_created_at ON social_shares(created_at);

-- Add share_count column to listings table for quick access
ALTER TABLE listings ADD COLUMN IF NOT EXISTS share_count INTEGER DEFAULT 0;

-- Create a function to update share count
CREATE OR REPLACE FUNCTION update_listing_share_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE listings 
    SET share_count = share_count + 1 
    WHERE id = NEW.listing_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE listings 
    SET share_count = GREATEST(share_count - 1, 0) 
    WHERE id = OLD.listing_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update share count
DROP TRIGGER IF EXISTS trigger_update_listing_share_count ON social_shares;
CREATE TRIGGER trigger_update_listing_share_count
AFTER INSERT OR DELETE ON social_shares
FOR EACH ROW
EXECUTE FUNCTION update_listing_share_count();
