// Transaction System Schema for Escrow Functionality
// Handles secure payment processing with Stripe

import { sql } from "drizzle-orm";
import { pgTable, text, decimal, timestamp, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Transaction Status Enum
export const TransactionStatus = {
  PENDING: "pending",           // Transaction created, payment not captured
  PAYMENT_CAPTURED: "payment_captured", // Payment captured, funds held in escrow
  SHIPPED: "shipped",           // Seller marked as shipped
  DELIVERED: "delivered",       // Buyer confirmed delivery
  COMPLETED: "completed",       // Funds released to seller
  DISPUTED: "disputed",         // Dispute raised
  REFUNDED: "refunded",         // Refunded to buyer
  CANCELLED: "cancelled",       // Transaction cancelled
} as const;

// ============================================
// TRANSACTIONS TABLE
// ============================================
export const transactions = pgTable("transactions", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Parties
  buyerId: text("buyer_id").notNull(),
  sellerId: text("seller_id").notNull(),
  listingId: text("listing_id").notNull(),
  
  // Payment Details
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // Total transaction amount
  platformFee: decimal("platform_fee", { precision: 10, scale: 2 }).notNull(), // Platform's 5% fee
  sellerPayout: decimal("seller_payout", { precision: 10, scale: 2 }).notNull(), // Amount seller receives
  
  // Stripe Payment Details
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
  stripeChargeId: varchar("stripe_charge_id", { length: 255 }),
  
  // Transaction Status
  status: varchar("status", { length: 30 }).notNull().default(TransactionStatus.PENDING),
  
  // Meetup Details
  meetupScheduledAt: timestamp("meetup_scheduled_at"),
  meetupLocation: text("meetup_location"),
  
  // Shipping/Delivery
  shippedAt: timestamp("shipped_at"),
  deliveredAt: timestamp("delivered_at"),
  autoReleaseAt: timestamp("auto_release_at"), // 48 hours after delivery confirmation
  
  // Dispute Handling
  disputeReason: text("dispute_reason"),
  disputeOpenedAt: timestamp("dispute_opened_at"),
  disputeResolvedAt: timestamp("dispute_resolved_at"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  cancelledAt: timestamp("cancelled_at"),
}, (table) => ({
  buyerIdIdx: index("transactions_buyer_id_idx").on(table.buyerId),
  sellerIdIdx: index("transactions_seller_id_idx").on(table.sellerId),
  listingIdIdx: index("transactions_listing_id_idx").on(table.listingId),
  statusIdx: index("transactions_status_idx").on(table.status),
  createdAtIdx: index("transactions_created_at_idx").on(table.createdAt),
}));

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
  cancelledAt: true,
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
