import { runDraftCollectionsMigration } from "./001_draft_collections";
import { runDraftFoldersMigration } from "./002_draft_folders";
import { up as runWelcomeSignupsMigration } from "./003_welcome_signups";
import { up as runImageRotationsMigration } from "./004_image_rotations";
import { up as runFreeListingsTrackingMigration } from "./005_free_listings_tracking";

/**
 * Run all pending migrations
 * Called on app startup to ensure database schema is up to date
 */
export async function runMigrations() {
  console.log("🚀 Starting database migrations...");

  try {
    await runDraftCollectionsMigration();
    await runDraftFoldersMigration();
    await runWelcomeSignupsMigration();
    await runImageRotationsMigration();
    await runFreeListingsTrackingMigration();
    console.log("✅ All migrations completed successfully");
  } catch (error) {
    console.error("❌ Migration error:", error);
    // Don't crash the app - log and continue
  }
}

