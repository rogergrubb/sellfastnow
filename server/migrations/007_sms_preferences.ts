import { db } from "../db";
import { sql } from "drizzle-orm";

export async function up() {
  console.log("Running migration 007: Add SMS marketing preferences");
  
  await db.execute(sql`
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS sms_weekly_updates BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS sms_monthly_updates BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS sms_credit_giveaways BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS sms_promotional BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS sms_opt_in_date TIMESTAMP;
  `);
  
  console.log("✅ Migration 007 complete: SMS marketing preferences added");
}

