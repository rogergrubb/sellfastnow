/**
 * Mark existing migrations as complete without running them
 * Use this for existing databases where migrations were applied manually
 */

import postgres from "postgres";

async function markMigrationsComplete() {
  console.log("🔧 Marking baseline migrations as complete...");
  
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error("❌ DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  const sql = postgres(databaseUrl);

  try {
    // Create the drizzle migrations table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      )
    `;
    
    console.log("✅ Created/verified __drizzle_migrations table");

    // Check if baseline migration is already marked as complete
    const existing = await sql`
      SELECT * FROM drizzle.__drizzle_migrations 
      WHERE hash = '0000_odd_ma_gnuci'
    `;

    if (existing.length > 0) {
      console.log("ℹ️  Baseline migration already marked as complete");
    } else {
      // Mark the baseline migration as complete
      await sql`
        INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
        VALUES ('0000_odd_ma_gnuci', ${Date.now()})
      `;
      
      console.log("✅ Marked baseline migration (0000_odd_ma_gnuci) as complete");
    }

    console.log("🎉 Migration tracking setup complete!");
    
  } catch (error) {
    console.error("❌ Failed to mark migrations:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Run the script
markMigrationsComplete();

