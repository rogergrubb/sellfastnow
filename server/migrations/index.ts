import { runDraftCollectionsMigration } from "./001_draft_collections";
import { runDraftFoldersMigration } from "./002_draft_folders";
import { up as runWelcomeSignupsMigration } from "./003_welcome_signups";
import { up as runImageRotationsMigration } from "./004_image_rotations";
import { up as runFreeListingsTrackingMigration } from "./005_free_listings_tracking";
import { up as runSavedSearchesMigration } from "./006_saved_searches";

/**
 * Run all pending migrations
 * Called on app startup to ensure database schema is up to date
 */
export async function runMigrations() {
  console.log("🚀 Starting database migrations...");

  try {
    console.log("Running migration 001: draft_collections...");
    await runDraftCollectionsMigration();
    
    console.log("Running migration 002: draft_folders...");
    await runDraftFoldersMigration();
    
    console.log("Running migration 003: welcome_signups...");
    await runWelcomeSignupsMigration();
    
    console.log("Running migration 004: image_rotations...");
    await runImageRotationsMigration();
    
    console.log("Running migration 005: free_listings_tracking...");
    await runFreeListingsTrackingMigration();
    
    console.log("Running migration 006: saved_searches...");
    await runSavedSearchesMigration();
    
    console.log("✅ All migrations completed successfully");
  } catch (error) {
    console.error("❌ Migration error:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    // Don't crash the app - log and continue
    // The app will still start but may have issues if migrations failed
  }
}

