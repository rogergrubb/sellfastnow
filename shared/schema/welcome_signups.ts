import { pgTable, varchar, text, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Welcome Modal Signups - tracks first-time visitor preferences
export const welcomeSignups = pgTable("welcome_signups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull().unique(),
  
  // Search preferences
  keywordAlerts: boolean("keyword_alerts").notNull().default(false),
  keywords: text("keywords"), // Comma-separated keywords
  bulkSalesAlerts: boolean("bulk_sales_alerts").notNull().default(false),
  estateSalesAlerts: boolean("estate_sales_alerts").notNull().default(false),
  
  // Marketing preferences
  giveawayEntry: boolean("giveaway_entry").notNull().default(false),
  newsletter: boolean("newsletter").notNull().default(false),
  
  // Metadata
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  referrer: text("referrer"),
  
  // Status
  emailVerified: boolean("email_verified").notNull().default(false),
  verifiedAt: timestamp("verified_at"),
  unsubscribedAt: timestamp("unsubscribed_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertWelcomeSignupSchema = createInsertSchema(welcomeSignups).omit({
  id: true,
  emailVerified: true,
  verifiedAt: true,
  unsubscribedAt: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertWelcomeSignup = z.infer<typeof insertWelcomeSignupSchema>;
export type WelcomeSignup = typeof welcomeSignups.$inferSelect;

// Giveaway Entries - monthly drawing for AI credits
export const giveawayEntries = pgTable("giveaway_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull(),
  month: varchar("month", { length: 7 }).notNull(), // Format: YYYY-MM
  
  // Entry details
  entrySource: varchar("entry_source", { length: 50 }).notNull().default("welcome_modal"), // welcome_modal, referral, purchase, etc.
  isWinner: boolean("is_winner").notNull().default(false),
  wonAt: timestamp("won_at"),
  creditsClaimed: boolean("credits_claimed").notNull().default(false),
  claimedAt: timestamp("claimed_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGiveawayEntrySchema = createInsertSchema(giveawayEntries).omit({
  id: true,
  isWinner: true,
  wonAt: true,
  creditsClaimed: true,
  claimedAt: true,
  createdAt: true,
});

export type InsertGiveawayEntry = z.infer<typeof insertGiveawayEntrySchema>;
export type GiveawayEntry = typeof giveawayEntries.$inferSelect;

