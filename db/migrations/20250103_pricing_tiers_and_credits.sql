-- Migration: Add pricing tier purchases and credit tracking
-- Date: 2025-01-03

-- Table to track pricing tier purchases
CREATE TABLE IF NOT EXISTS pricing_tier_purchases (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier_name VARCHAR(100) NOT NULL,
  tier_price DECIMAL(10, 2) NOT NULL,
  listings_included INTEGER NOT NULL,
  photos_per_listing INTEGER NOT NULL,
  ai_credits_included INTEGER NOT NULL,
  is_monthly BOOLEAN DEFAULT FALSE,
  stripe_payment_intent_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed, refunded, cancelled
  purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP, -- For monthly subscriptions
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table to track user credits (photo unlocks and AI generations)
CREATE TABLE IF NOT EXISTS user_credits (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  photo_unlock_credits INTEGER DEFAULT 0, -- Number of listings that can have 20+ photos
  ai_generation_credits INTEGER DEFAULT 0, -- Number of AI generations available
  total_photo_unlocks_purchased INTEGER DEFAULT 0, -- Lifetime tracking
  total_ai_credits_purchased INTEGER DEFAULT 0, -- Lifetime tracking
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table to track credit usage history
CREATE TABLE IF NOT EXISTS credit_usage_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credit_type VARCHAR(50) NOT NULL, -- 'photo_unlock' or 'ai_generation'
  credits_used INTEGER NOT NULL,
  listing_id INTEGER REFERENCES listings(id) ON DELETE SET NULL,
  purchase_id INTEGER REFERENCES pricing_tier_purchases(id) ON DELETE SET NULL,
  description TEXT,
  used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pricing_tier_purchases_user_id ON pricing_tier_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_pricing_tier_purchases_status ON pricing_tier_purchases(status);
CREATE INDEX IF NOT EXISTS idx_pricing_tier_purchases_stripe_payment_intent ON pricing_tier_purchases(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_pricing_tier_purchases_stripe_subscription ON pricing_tier_purchases(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_usage_history_user_id ON credit_usage_history(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_usage_history_listing_id ON credit_usage_history(listing_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_pricing_tier_purchases_updated_at BEFORE UPDATE ON pricing_tier_purchases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_credits_updated_at BEFORE UPDATE ON user_credits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Initialize user_credits for existing users
INSERT INTO user_credits (user_id, photo_unlock_credits, ai_generation_credits)
SELECT id, 0, 0 FROM users
ON CONFLICT (user_id) DO NOTHING;

COMMENT ON TABLE pricing_tier_purchases IS 'Tracks all pricing tier purchases by users';
COMMENT ON TABLE user_credits IS 'Tracks available photo unlock and AI generation credits per user';
COMMENT ON TABLE credit_usage_history IS 'Audit trail of credit usage';
