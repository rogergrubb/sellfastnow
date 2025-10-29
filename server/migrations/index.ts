import { runDraftCollectionsMigration } from "./001_draft_collections";
import { runDraftFoldersMigration } from "./002_draft_folders";
import { up as runWelcomeSignupsMigration } from "./003_welcome_signups";

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
    console.log("✅ All migrations completed successfully");
  } catch (error) {
    console.error("❌ Migration error:", error);
    // Don't crash the app - log and continue
  }
}

