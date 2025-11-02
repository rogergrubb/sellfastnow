import { pgTable, varchar, decimal, integer, boolean, timestamp, text, index, serial } from "drizzle-orm/pg-core";
import { users, listings } from "./schema";

// ============================================
// PRICING TIERS & CREDITS SYSTEM
// ============================================

// Table to track pricing tier purchases
export const pricingTierPurchases = pgTable(
  "pricing_tier_purchases",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    tierName: varchar("tier_name", { length: 100 }).notNull(),
    tierPrice: decimal("tier_price", { precision: 10, scale: 2 }).notNull(),
    listingsIncluded: integer("listings_included").notNull(),
    photosPerListing: integer("photos_per_listing").notNull(),
    aiCreditsIncluded: integer("ai_credits_included").notNull(),
    isMonthly: boolean("is_monthly").default(false),
    stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
    stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
    status: varchar("status", { length: 50 }).default("pending"), // pending, completed, failed, refunded, cancelled
    purchasedAt: timestamp("purchased_at").defaultNow(),
    expiresAt: timestamp("expires_at"), // For monthly subscriptions
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_pricing_tier_purchases_user_id").on(table.userId),
    index("idx_pricing_tier_purchases_status").on(table.status),
    index("idx_pricing_tier_purchases_stripe_payment_intent").on(table.stripePaymentIntentId),
    index("idx_pricing_tier_purchases_stripe_subscription").on(table.stripeSubscriptionId),
  ]
);

// Table to track user credits (photo unlocks and AI generations)
export const userCredits = pgTable(
  "user_credits",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
    photoUnlockCredits: integer("photo_unlock_credits").default(0), // Number of listings that can have 20+ photos
    aiGenerationCredits: integer("ai_generation_credits").default(0), // Number of AI generations available
    totalPhotoUnlocksPurchased: integer("total_photo_unlocks_purchased").default(0), // Lifetime tracking
    totalAiCreditsPurchased: integer("total_ai_credits_purchased").default(0), // Lifetime tracking
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_user_credits_user_id").on(table.userId),
  ]
);

// Table to track credit usage history
export const creditUsageHistory = pgTable(
  "credit_usage_history",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    creditType: varchar("credit_type", { length: 50 }).notNull(), // 'photo_unlock' or 'ai_generation'
    creditsUsed: integer("credits_used").notNull(),
    listingId: integer("listing_id").references(() => listings.id, { onDelete: "set null" }),
    purchaseId: integer("purchase_id").references(() => pricingTierPurchases.id, { onDelete: "set null" }),
    description: text("description"),
    usedAt: timestamp("used_at").defaultNow(),
  },
  (table) => [
    index("idx_credit_usage_history_user_id").on(table.userId),
    index("idx_credit_usage_history_listing_id").on(table.listingId),
  ]
);
