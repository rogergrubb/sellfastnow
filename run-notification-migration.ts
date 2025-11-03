// Run notification system migration
import { db } from "./server/db";
import { sql } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

async function runMigration() {
  try {
    console.log("🔄 Running notification system migration...");
    
    // Read the migration file
    const migrationPath = path.join(__dirname, "db/migrations/20250104_notifications_system.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");
    
    // Execute the migration
    await db.execute(sql.raw(migrationSQL));
    
    console.log("✅ Notification system migration completed successfully!");
    console.log("✅ Created tables: notifications, notification_preferences, notification_delivery_log");
    
    // Create default preferences for existing users
    console.log("🔄 Creating default preferences for existing users...");
    await db.execute(sql`
      INSERT INTO notification_preferences (user_id)
      SELECT id FROM users
      WHERE id NOT IN (SELECT user_id FROM notification_preferences)
      ON CONFLICT (user_id) DO NOTHING
    `);
    
    console.log("✅ Default preferences created for all users!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
