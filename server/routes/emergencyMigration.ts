import { Router } from "express";
import { db } from "../db";
import { sql } from "drizzle-orm";

const router = Router();

/**
 * Emergency migration endpoint to add missing columns
 * POST /api/emergency-migration/run
 */
router.post("/run", async (req, res) => {
  try {
    console.log("Running emergency migration...");

    // Add SMS columns to users table
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS sms_weekly_updates BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS sms_monthly_updates BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS sms_credit_giveaways BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS sms_promotional BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS sms_opt_in_date TIMESTAMP,
      ADD COLUMN IF NOT EXISTS sms_offer_received BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS sms_offer_response BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS sms_payment_confirmed BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS sms_new_message BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS sms_listing_published BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS sms_listing_engagement BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS sms_listing_sold BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS sms_review_received BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS sms_meetup_reminder BOOLEAN DEFAULT false
    `);

    console.log("Added SMS columns to users table");

    // Add analytics columns to listings table
    await db.execute(sql`
      ALTER TABLE listings
      ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS quality_score INTEGER
    `);

    console.log("Added analytics columns to listings table");

    // Add SMS tracking to search_alert_notifications table
    await db.execute(sql`
      ALTER TABLE search_alert_notifications
      ADD COLUMN IF NOT EXISTS sms_sent BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS sms_sent_at TIMESTAMP
    `);

    console.log("Added SMS tracking to search_alert_notifications table");

    // Add SMS notifications to saved_searches table
    await db.execute(sql`
      ALTER TABLE saved_searches
      ADD COLUMN IF NOT EXISTS sms_notifications BOOLEAN DEFAULT false
    `);

    console.log("Added SMS notifications to saved_searches table");

    // Create indexes
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_listings_view_count ON listings(view_count DESC)
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_listings_last_viewed ON listings(last_viewed_at DESC)
    `);

    console.log("Created indexes");

    res.json({
      success: true,
      message: "Migration completed successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Migration error:", error);
    res.status(500).json({
      success: false,
      message: "Migration failed",
      error: error.message,
    });
  }
});

/**
 * Check migration status
 * GET /api/emergency-migration/status
 */
router.get("/status", async (req, res) => {
  try {
    // Check if columns exist
    const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('sms_weekly_updates', 'sms_monthly_updates', 'sms_offer_received')
    `);

    const columnsExist = result.rows.length === 3;

    res.json({
      migrationNeeded: !columnsExist,
      columnsFound: result.rows.length,
      expectedColumns: 3,
      message: columnsExist 
        ? "Migration already completed" 
        : "Migration needed - run POST /api/emergency-migration/run",
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message,
    });
  }
});

export default router;

