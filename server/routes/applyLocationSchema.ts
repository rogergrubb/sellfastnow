import { Router } from "express";
import { db } from "../db";
import { sql } from "drizzle-orm";

const router = Router();

/**
 * Apply location schema changes to listings table
 * POST /api/admin/apply-location-schema
 */
router.post("/apply-location-schema", async (req, res) => {
  try {
    console.log("🔄 Starting location schema application...");
    
    // Add all the new location columns
    const columns = [
      // Enhanced location fields
      { name: "location_precision_level", type: "VARCHAR(20)" },
      { name: "location_privacy_radius", type: "INTEGER" },
      { name: "location_neighborhood", type: "VARCHAR(100)" },
      { name: "location_street_address", type: "TEXT" },
      { name: "location_formatted_address", type: "TEXT" },
      { name: "location_place_id", type: "VARCHAR(255)" },
      { name: "location_timezone", type: "VARCHAR(50)" },
      
      // Geocoding metadata
      { name: "location_geocoded", type: "BOOLEAN DEFAULT false" },
      { name: "location_geocoded_at", type: "TIMESTAMP" },
      { name: "location_geocoding_service", type: "VARCHAR(50)" },
      { name: "location_geocoding_accuracy", type: "VARCHAR(20)" },
      
      // Pickup/Delivery options
      { name: "pickup_available", type: "BOOLEAN DEFAULT true" },
      { name: "delivery_available", type: "BOOLEAN DEFAULT false" },
      { name: "shipping_available", type: "BOOLEAN DEFAULT false" },
      { name: "meeting_points_available", type: "BOOLEAN DEFAULT false" },
      
      // Location metadata
      { name: "location_metadata", type: "JSONB DEFAULT '{}'::jsonb" },
    ];
    
    const results = [];
    
    for (const column of columns) {
      try {
        // Check if column exists
        const checkResult = await db.execute(sql`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'listings' 
          AND column_name = ${column.name}
        `);
        
        if (checkResult.rows.length === 0) {
          // Column doesn't exist, add it
          await db.execute(sql.raw(`
            ALTER TABLE listings 
            ADD COLUMN ${column.name} ${column.type}
          `));
          
          console.log(`✅ Added column: ${column.name}`);
          results.push({ column: column.name, status: "added" });
        } else {
          console.log(`⏭️  Column already exists: ${column.name}`);
          results.push({ column: column.name, status: "exists" });
        }
      } catch (error: any) {
        console.error(`❌ Error adding column ${column.name}:`, error.message);
        results.push({ column: column.name, status: "error", error: error.message });
      }
    }
    
    const addedCount = results.filter(r => r.status === "added").length;
    const existsCount = results.filter(r => r.status === "exists").length;
    const errorCount = results.filter(r => r.status === "error").length;
    
    console.log(`✅ Location schema application complete!`);
    console.log(`   Added: ${addedCount} columns`);
    console.log(`   Already existed: ${existsCount} columns`);
    console.log(`   Errors: ${errorCount} columns`);
    
    res.json({
      success: true,
      message: "Location schema applied successfully",
      summary: {
        added: addedCount,
        exists: existsCount,
        errors: errorCount,
      },
      details: results,
    });
  } catch (error: any) {
    console.error("❌ Error applying location schema:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to apply location schema",
      error: error.message 
    });
  }
});

export default router;

