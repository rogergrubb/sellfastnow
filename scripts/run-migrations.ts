/**
 * Migration runner script
 * Runs all pending database migrations automatically
 */

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

async function runMigrations() {
  console.log("🔄 Starting database migrations...");
  
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error("❌ DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  // Create postgres connection for migrations
  const migrationClient = postgres(databaseUrl, { max: 1 });
  const db = drizzle(migrationClient);

  try {
    console.log("📂 Running migrations from ./migrations folder...");
    
    // Check if migrations folder has any SQL files
    const fs = await import('fs');
    const path = await import('path');
    const migrationsPath = path.resolve('./migrations');
    const files = fs.readdirSync(migrationsPath).filter(f => f.endsWith('.sql'));
    
    if (files.length === 0) {
      console.log("ℹ️  No migration files found, skipping migrations");
      return;
    }
    
    console.log(`Found ${files.length} migration file(s)`);
    
    await migrate(db, { migrationsFolder: "./migrations" });
    
    console.log("✅ All migrations completed successfully!");
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await migrationClient.end();
  }
}

// Run migrations
runMigrations();

