import { pgTable, varchar, timestamp, boolean, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const referrals = pgTable("referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referrerId: varchar("referrer_id").notNull(), // User who sent the referral
  referredEmail: varchar("referred_email").notNull(), // Email of friend being referred
  referredUserId: varchar("referred_user_id"), // Set when friend creates account
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, completed, expired
  creditsAwarded: boolean("credits_awarded").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"), // When referred friend signed up
  awardedAt: timestamp("awarded_at"), // When credits were given to referrer
});

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;

