#!/usr/bin/env node

/**
 * Check if database migration is needed and provide SQL to run manually
 */

import pg from 'pg';
const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function checkMigration() {
  const client = new Client({ connectionString: DATABASE_URL });
  
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check if the new columns exist
    const result = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('account_tier', 'onboarding_complete', 'charges_enabled', 'payouts_enabled', 'stripe_account_type')
      ORDER BY column_name;
    `);

    const existingColumns = result.rows.map(row => row.column_name);
    const requiredColumns = ['account_tier', 'charges_enabled', 'onboarding_complete', 'payouts_enabled', 'stripe_account_type'];
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

    console.log('📊 Migration Status Check');
    console.log('='.repeat(50));
    console.log(`Required columns: ${requiredColumns.length}`);
    console.log(`Existing columns: ${existingColumns.length}`);
    console.log(`Missing columns: ${missingColumns.length}\n`);

    if (missingColumns.length === 0) {
      console.log('✅ All required columns exist!');
      console.log('✅ Database migration is complete\n');
      
      console.log('Existing columns:');
      existingColumns.forEach(col => console.log(`  ✓ ${col}`));
    } else {
      console.log('⚠️  Missing columns detected:\n');
      missingColumns.forEach(col => console.log(`  ✗ ${col}`));
      
      console.log('\n📝 Run this SQL in Railway to fix:');
      console.log('='.repeat(50));
      console.log(`
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS stripe_account_type VARCHAR(20),
ADD COLUMN IF NOT EXISTS account_tier VARCHAR(20) NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS charges_enabled BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS payouts_enabled BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_users_account_tier ON users(account_tier);
CREATE INDEX IF NOT EXISTS idx_users_stripe_account_id ON users(stripe_account_id);
      `.trim());
      console.log('\n' + '='.repeat(50));
    }

  } catch (error) {
    console.error('❌ Error checking migration:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

checkMigration();

