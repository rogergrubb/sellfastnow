-- Add Stripe Connect account ID to users table
-- This allows sellers to receive payments directly to their bank account

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS stripe_account_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_users_stripe_account_id ON users(stripe_account_id);

COMMENT ON COLUMN users.stripe_account_id IS 'Stripe Connect Express account ID for sellers to receive payments';

