#!/usr/bin/env node
/**
 * Railway Deployment Fix Script
 * 
 * This script fixes the critical deployment issues by:
 * 1. Running database migrations to add new account tier fields
 * 2. Verifying database connection
 * 3. Checking for missing columns
 * 
 * Run this in Railway using:
 * railway run node fix-deployment.mjs
 */

import pg from 'pg';
const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable not set');
  process.exit(1);
}

async function runMigration() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes('railway.app') ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    // Check if columns already exist
    console.log('\n📋 Checking existing schema...');
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('stripe_account_type', 'account_tier', 'onboarding_complete', 'charges_enabled', 'payouts_enabled');
    `;
    
    const existingColumns = await client.query(checkQuery);
    console.log(`Found ${existingColumns.rows.length} of 5 required columns`);
    
    if (existingColumns.rows.length === 5) {
      console.log('✅ All columns already exist - migration not needed');
      return;
    }

    // Run migration
    console.log('\n🔧 Running migration to add account tier fields...');
    const migrationSQL = `
      -- Add account tier fields to users table
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS stripe_account_type VARCHAR(20),
      ADD COLUMN IF NOT EXISTS account_tier VARCHAR(20) NOT NULL DEFAULT 'none',
      ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS charges_enabled BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS payouts_enabled BOOLEAN NOT NULL DEFAULT false;

      -- Create indexes for faster queries
      CREATE INDEX IF NOT EXISTS idx_users_account_tier ON users(account_tier);
      CREATE INDEX IF NOT EXISTS idx_users_stripe_account_id ON users(stripe_account_id);
    `;

    await client.query(migrationSQL);
    console.log('✅ Migration completed successfully');

    // Verify migration
    console.log('\n🔍 Verifying migration...');
    const verifyQuery = await client.query(checkQuery);
    console.log(`✅ All ${verifyQuery.rows.length} columns now exist`);

    // Show sample data
    console.log('\n📊 Sample user data:');
    const sampleQuery = await client.query(`
      SELECT id, email, account_tier, onboarding_complete, charges_enabled 
      FROM users 
      LIMIT 3
    `);
    console.table(sampleQuery.rows);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

async function checkEnvironmentVariables() {
  console.log('\n🔍 Checking environment variables...');
  
  const required = [
    'DATABASE_URL',
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY',
    'VITE_STRIPE_PUBLISHABLE_KEY',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY'
  ];

  const missing = [];
  const present = [];

  for (const varName of required) {
    if (process.env[varName]) {
      present.push(varName);
      // Show first few characters only for security
      const value = process.env[varName];
      const preview = value.substring(0, 15) + '...';
      console.log(`  ✅ ${varName}: ${preview}`);
    } else {
      missing.push(varName);
      console.log(`  ❌ ${varName}: NOT SET`);
    }
  }

  if (missing.length > 0) {
    console.log('\n⚠️  Missing environment variables:');
    missing.forEach(v => console.log(`  - ${v}`));
    console.log('\nPlease set these in Railway dashboard:');
    console.log('https://railway.app > Your Project > Variables');
  } else {
    console.log('\n✅ All required environment variables are set');
  }

  return missing.length === 0;
}

// Main execution
console.log('🚀 SellFast.Now Deployment Fix\n');
console.log('=' .repeat(50));

try {
  await runMigration();
  await checkEnvironmentVariables();
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Deployment fix completed successfully!');
  console.log('\nNext steps:');
  console.log('1. If any environment variables are missing, set them in Railway');
  console.log('2. Railway will automatically redeploy');
  console.log('3. Test the application at your Railway URL');
  console.log('4. Verify /api/auth/user returns 200 (not 500)');
  console.log('5. Test Stripe payment flow with QR codes');
  
} catch (error) {
  console.error('\n❌ Deployment fix failed');
  console.error(error);
  process.exit(1);
}

