import { Router } from "express";
import { db } from "../db";
import { sql } from "drizzle-orm";

const router = Router();

/**
 * POST /api/admin/run-migration
 * Manually run the featured listings migration
 * This is a temporary endpoint to fix the deployment issue
 */
router.post("/run-migration", async (req, res) => {
  try {
    console.log("🔧 Starting manual migration for featured listings...");
    
    // Add featured listing fields to listings table
    await db.execute(sql`
      ALTER TABLE listings
      ADD COLUMN IF NOT EXISTS featured_until TIMESTAMP,
      ADD COLUMN IF NOT EXISTS featured_payment_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS featured_created_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS featured_duration VARCHAR(10);
    `);
    
    console.log("✅ Columns added successfully");
    
    // Create index for faster queries on featured listings
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_listings_featured_until 
      ON listings(featured_until) 
      WHERE featured_until IS NOT NULL;
    `);
    
    console.log("✅ Index created successfully");
    
    res.json({
      success: true,
      message: "Featured listings migration completed successfully!",
      details: {
        columnsAdded: [
          "featured_until (TIMESTAMP)",
          "featured_payment_id (VARCHAR(255))",
          "featured_created_at (TIMESTAMP)",
          "featured_duration (VARCHAR(10))"
        ],
        indexCreated: "idx_listings_featured_until"
      }
    });
  } catch (error: any) {
    console.error("❌ Migration error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      details: error.toString()
    });
  }
});

/**
 * GET /api/admin/check-migration
 * Check if the migration has been run
 */
router.get("/check-migration", async (req, res) => {
  try {
    // Try to query the featured_until column
    const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'listings' 
      AND column_name IN ('featured_until', 'featured_payment_id', 'featured_created_at', 'featured_duration')
    `);
    
    const columns = result.rows.map((row: any) => row.column_name);
    const allColumnsExist = columns.length === 4;
    
    res.json({
      migrationComplete: allColumnsExist,
      columnsFound: columns,
      missingColumns: ['featured_until', 'featured_payment_id', 'featured_created_at', 'featured_duration']
        .filter(col => !columns.includes(col))
    });
  } catch (error: any) {
    console.error("Error checking migration:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
