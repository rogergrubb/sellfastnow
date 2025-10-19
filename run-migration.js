import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { readFileSync } from 'fs';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:PFBReUdwWVYAzKWptvxtcMaEodviMKqh@postgres.railway.internal:5432/railway';

async function runMigration() {
  console.log('🔄 Connecting to database...');
  
  const sql = postgres(DATABASE_URL, { max: 1 });
  
  try {
    console.log('📄 Reading migration file...');
    const migrationSQL = readFileSync('./migrations/add_location_fields.sql', 'utf-8');
    
    console.log('🚀 Running migration...');
    await sql.unsafe(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigration();

