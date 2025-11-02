-- Add photo unlock system tables and columns

-- Create photo_unlocks table
CREATE TABLE IF NOT EXISTS photo_unlocks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id INTEGER REFERENCES listings(id) ON DELETE SET NULL,
  photo_count INTEGER NOT NULL CHECK (photo_count >= 2 AND photo_count <= 25),
  amount_cents INTEGER NOT NULL DEFAULT 99,
  stripe_payment_intent_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_photo_unlocks_user_id ON photo_unlocks(user_id);
CREATE INDEX IF NOT EXISTS idx_photo_unlocks_listing_id ON photo_unlocks(listing_id);
CREATE INDEX IF NOT EXISTS idx_photo_unlocks_status ON photo_unlocks(status);
CREATE INDEX IF NOT EXISTS idx_photo_unlocks_stripe_payment_intent ON photo_unlocks(stripe_payment_intent_id);

-- Add photo_unlock_paid column to listings table
ALTER TABLE listings ADD COLUMN IF NOT EXISTS photo_unlock_paid BOOLEAN DEFAULT FALSE;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS photo_unlock_id INTEGER REFERENCES photo_unlocks(id) ON DELETE SET NULL;

-- Add index for photo unlock status on listings
CREATE INDEX IF NOT EXISTS idx_listings_photo_unlock_paid ON listings(photo_unlock_paid);

-- Add updated_at trigger for photo_unlocks
CREATE OR REPLACE FUNCTION update_photo_unlocks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER photo_unlocks_updated_at
BEFORE UPDATE ON photo_unlocks
FOR EACH ROW
EXECUTE FUNCTION update_photo_unlocks_updated_at();

COMMENT ON TABLE photo_unlocks IS 'Tracks photo unlock payments - $0.99 for 2-25 photos per listing';
COMMENT ON COLUMN photo_unlocks.photo_count IS 'Number of photos being unlocked (2-25)';
COMMENT ON COLUMN photo_unlocks.amount_cents IS 'Amount in cents, default 99 ($0.99)';
COMMENT ON COLUMN photo_unlocks.status IS 'Payment status: pending, completed, failed, refunded';
