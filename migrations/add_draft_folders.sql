-- Add draft folder organization fields to listings table
-- Migration: add_draft_folders.sql
-- Created: 2025-10-25

ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS batch_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS batch_title VARCHAR(200);

-- Add index for faster folder queries
CREATE INDEX IF NOT EXISTS idx_listings_batch_id ON listings(batch_id) WHERE batch_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN listings.batch_id IS 'Unique identifier for draft folder/batch (format: {sanitized_name}_{timestamp})';
COMMENT ON COLUMN listings.batch_title IS 'Human-readable folder name for organizing drafts';

