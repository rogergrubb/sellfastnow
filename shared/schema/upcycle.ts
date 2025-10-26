import { serial, integer, varchar, boolean, timestamp, pgTable, decimal } from "drizzle-orm/pg-core";
import { users, listings } from "../schema";

export const upcycleListings = pgTable("upcycle_listings", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  giverId: integer("giver_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 20 }).notNull().default("available"), // available, claimed, completed
  claimedBy: integer("claimed_by").references(() => users.id),
  claimedAt: timestamp("claimed_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const gratitudeGifts = pgTable("gratitude_gifts", {
  id: serial("id").primaryKey(),
  upcycleListingId: integer("upcycle_listing_id").notNull().references(() => upcycleListings.id),
  giverId: integer("giver_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  platformFee: decimal("platform_fee", { precision: 10, scale: 2 }).notNull(),
  finalAmount: decimal("final_amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }), // stripe, apple_pay, google_pay, venmo, cash_app
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, succeeded, failed
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

