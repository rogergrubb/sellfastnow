import { Router } from "express";
import { db } from "../db";
import { sql } from "drizzle-orm";

const router = Router();

/**
 * Mark baseline migrations as complete
 * POST /api/mark-migrations-complete
 */
router.post("/", async (req, res) => {
  try {
    console.log("🔧 Marking baseline migrations as complete...");

    // Create the drizzle migrations table if it doesn't exist
    await db.execute(sql`
      CREATE SCHEMA IF NOT EXISTS drizzle
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      )
    `);
    
    console.log("✅ Created/verified __drizzle_migrations table");

    // Check if baseline migration is already marked as complete
    const existing = await db.execute(sql`
      SELECT * FROM drizzle.__drizzle_migrations 
      WHERE hash = '0000_odd_ma_gnuci'
    `);

    if (existing.rows.length > 0) {
      console.log("ℹ️  Baseline migration already marked as complete");
      return res.json({
        success: true,
        message: "Baseline migration already marked as complete",
        alreadyMarked: true,
      });
    }

    // Mark the baseline migration as complete
    await db.execute(sql`
      INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
      VALUES ('0000_odd_ma_gnuci', ${Date.now()})
    `);
    
    console.log("✅ Marked baseline migration (0000_odd_ma_gnuci) as complete");

    res.json({
      success: true,
      message: "Baseline migration marked as complete. Future deployments will skip this migration.",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("❌ Failed to mark migrations:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark migrations as complete",
      error: error.message,
    });
  }
});

export default router;

