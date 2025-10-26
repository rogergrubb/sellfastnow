import { pgTable, uuid, text, timestamp, integer, boolean, decimal } from "drizzle-orm/pg-core";
import { users } from "../schema";
import { listings } from "../schema";

// Table to store information about boosted listings
export const promotedListings = pgTable("promoted_listings", {
  id: uuid("id").defaultRandom().primaryKey(),
  listingId: uuid("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  boostType: text("boost_type").notNull(), // e.g., '7_day_boost', '30_day_boost'
  status: text("status", { enum: ["active", "expired", "pending_payment", "cancelled"] }).notNull().default("pending_payment"),
  stripePaymentIntentId: text("stripe_payment_intent_id").unique(),
  startedAt: timestamp("started_at"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Table to track performance metrics for boosted listings
export const promotedListingAnalytics = pgTable("promoted_listing_analytics", {
  id: uuid("id").defaultRandom().primaryKey(),
  promotedListingId: uuid("promoted_listing_id").notNull().references(() => promotedListings.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  impressions: integer("impressions").default(0),
  views: integer("views").default(0),
  clicks: integer("clicks").default(0),
  messages: integer("messages").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

