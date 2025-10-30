-- Add account tier fields to users table
-- Run this manually in Railway database or via migration tool

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS stripe_account_type VARCHAR(20),
ADD COLUMN IF NOT EXISTS account_tier VARCHAR(20) NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS charges_enabled BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS payouts_enabled BOOLEAN NOT NULL DEFAULT false;

-- Create index for faster queries on account tier
CREATE INDEX IF NOT EXISTS idx_users_account_tier ON users(account_tier);
CREATE INDEX IF NOT EXISTS idx_users_stripe_account_id ON users(stripe_account_id);

