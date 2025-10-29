import { sql } from "drizzle-orm";
import { db } from "../db";

export async function up() {
  console.log("Running migration: 003_welcome_signups");

  // Create welcome_signups table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS welcome_signups (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR NOT NULL UNIQUE,
      keyword_alerts BOOLEAN NOT NULL DEFAULT false,
      keywords TEXT,
      bulk_sales_alerts BOOLEAN NOT NULL DEFAULT false,
      estate_sales_alerts BOOLEAN NOT NULL DEFAULT false,
      giveaway_entry BOOLEAN NOT NULL DEFAULT false,
      newsletter BOOLEAN NOT NULL DEFAULT false,
      ip_address VARCHAR(45),
      user_agent TEXT,
      referrer TEXT,
      email_verified BOOLEAN NOT NULL DEFAULT false,
      verified_at TIMESTAMP,
      unsubscribed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  console.log("✅ Created welcome_signups table");

  // Create giveaway_entries table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS giveaway_entries (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR NOT NULL,
      month VARCHAR(7) NOT NULL,
      entry_source VARCHAR(50) NOT NULL DEFAULT 'welcome_modal',
      is_winner BOOLEAN NOT NULL DEFAULT false,
      won_at TIMESTAMP,
      credits_claimed BOOLEAN NOT NULL DEFAULT false,
      claimed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  console.log("✅ Created giveaway_entries table");

  // Create index on email for faster lookups
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_welcome_signups_email ON welcome_signups(email);
  `);

  // Create index on giveaway entries for monthly queries
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_giveaway_entries_month ON giveaway_entries(month);
  `);

  console.log("✅ Created indexes");
  console.log("Migration 003_welcome_signups completed successfully");
}

export async function down() {
  console.log("Rolling back migration: 003_welcome_signups");
  
  await db.execute(sql`DROP TABLE IF EXISTS giveaway_entries;`);
  await db.execute(sql`DROP TABLE IF EXISTS welcome_signups;`);
  
  console.log("Migration 003_welcome_signups rolled back successfully");
}

