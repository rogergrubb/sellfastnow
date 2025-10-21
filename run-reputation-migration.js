// Run this script in Railway's terminal to apply the reputation system migration
// Usage: node run-reputation-migration.js

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected successfully!');

    const migrationPath = path.join(__dirname, 'migrations', 'add_reputation_enhancements.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running reputation system migration...');
    await client.query(migrationSQL);
    console.log('✅ Migration completed successfully!');

    console.log('\nNew fields added:');
    console.log('- reviews.transaction_id');
    console.log('- reviews ratings updated to 1-10 scale');
    console.log('- cancellation_comments.transaction_id');
    console.log('- cancellation_comments.is_last_minute_cancellation');
    console.log('- cancellation_comments.hours_before_meetup');
    console.log('- user_statistics.last_minute_cancels_by_seller');
    console.log('- user_statistics.last_minute_cancels_by_buyer');
    console.log('- transactions.cancelled_by');
    console.log('- transactions.cancellation_reason');
    console.log('- transactions.is_last_minute_cancellation');
    console.log('- transactions.hours_before_meetup');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();

