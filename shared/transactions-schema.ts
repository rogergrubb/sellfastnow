// Transaction System Schema for Escrow Functionality
// Handles secure payment processing with Stripe

import { sql } from "drizzle-orm";
import { pgTable, text, decimal, timestamp, varchar, index, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Transaction Status Enum
export const TransactionStatus = {
  PENDING: "pending",           // Transaction created, no payment yet
  DEPOSIT_SUBMITTED: "deposit_submitted", // Buyer submitted deposit, awaiting seller acceptance
  DEPOSIT_ACCEPTED: "deposit_accepted",   // Seller accepted deposit, funds in escrow
  DEPOSIT_REJECTED: "deposit_rejected",   // Seller rejected deposit
  IN_ESCROW: "in_escrow",       // Funds held in escrow (same as deposit_accepted)
  MEETUP_SCHEDULED: "meetup_scheduled",   // Meetup time/location confirmed
  IN_PROGRESS: "in_progress",   // Parties are meeting (live location active)
  COMPLETED: "completed",       // Buyer confirmed, funds released to seller
  REFUNDED: "refunded",         // Buyer cancelled, refund processed
  CANCELLED: "cancelled",       // Transaction cancelled before completion
  DISPUTED: "disputed",         // Dispute raised
  // Legacy statuses (kept for compatibility)
  PAYMENT_CAPTURED: "payment_captured",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
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
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // Total transaction amount (deposit amount)
  platformFee: decimal("platform_fee", { precision: 10, scale: 2 }).notNull(), // Platform's 2.5% fee
  sellerPayout: decimal("seller_payout", { precision: 10, scale: 2 }).notNull(), // Amount seller receives
  
  // Deposit Details
  depositAmount: decimal("deposit_amount", { precision: 10, scale: 2 }), // Amount buyer deposited (may differ from listing price)
  depositSubmittedAt: timestamp("deposit_submitted_at"), // When buyer submitted deposit
  depositAcceptedAt: timestamp("deposit_accepted_at"), // When seller accepted deposit
  depositRejectedAt: timestamp("deposit_rejected_at"), // When seller rejected deposit
  depositRejectionReason: text("deposit_rejection_reason"), // Why seller rejected
  
  // Stripe Payment Details
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
  stripeChargeId: varchar("stripe_charge_id", { length: 255 }),
  stripeTransferId: varchar("stripe_transfer_id", { length: 255 }), // Transfer to seller
  stripeRefundId: varchar("stripe_refund_id", { length: 255 }), // Refund to buyer
  
  // Transaction Status
  status: varchar("status", { length: 30 }).notNull().default(TransactionStatus.PENDING),
  
  // Meetup Details
  meetupScheduledAt: timestamp("meetup_scheduled_at"),
  meetupLocation: text("meetup_location"), // Text address
  meetupLatitude: decimal("meetup_latitude", { precision: 10, scale: 7 }),
  meetupLongitude: decimal("meetup_longitude", { precision: 10, scale: 7 }),
  
  // Geo-Location Tracking (for safety and audit trail)
  // Deposit submission locations
  depositBuyerLatitude: decimal("deposit_buyer_latitude", { precision: 10, scale: 7 }),
  depositBuyerLongitude: decimal("deposit_buyer_longitude", { precision: 10, scale: 7 }),
  depositSellerLatitude: decimal("deposit_seller_latitude", { precision: 10, scale: 7 }), // Where seller was when accepting
  depositSellerLongitude: decimal("deposit_seller_longitude", { precision: 10, scale: 7 }),
  
  // Live location during meetup (last known positions)
  buyerCurrentLatitude: decimal("buyer_current_latitude", { precision: 10, scale: 7 }),
  buyerCurrentLongitude: decimal("buyer_current_longitude", { precision: 10, scale: 7 }),
  buyerLocationUpdatedAt: timestamp("buyer_location_updated_at"),
  sellerCurrentLatitude: decimal("seller_current_latitude", { precision: 10, scale: 7 }),
  sellerCurrentLongitude: decimal("seller_current_longitude", { precision: 10, scale: 7 }),
  sellerLocationUpdatedAt: timestamp("seller_location_updated_at"),
  
  // Transaction completion locations
  completionBuyerLatitude: decimal("completion_buyer_latitude", { precision: 10, scale: 7 }),
  completionBuyerLongitude: decimal("completion_buyer_longitude", { precision: 10, scale: 7 }),
  completionSellerLatitude: decimal("completion_seller_latitude", { precision: 10, scale: 7 }),
  completionSellerLongitude: decimal("completion_seller_longitude", { precision: 10, scale: 7 }),
  
  // Shipping/Delivery
  shippedAt: timestamp("shipped_at"),
  deliveredAt: timestamp("delivered_at"),
  autoReleaseAt: timestamp("auto_release_at"), // 48 hours after delivery confirmation
  
  // Dispute Handling
  disputeReason: text("dispute_reason"),
  disputeOpenedAt: timestamp("dispute_opened_at"),
  disputeResolvedAt: timestamp("dispute_resolved_at"),
  
  // Cancellation Details
  cancelledBy: text("cancelled_by"), // User ID who cancelled
  cancellationReason: text("cancellation_reason"),
  isLastMinuteCancellation: boolean("is_last_minute_cancellation").default(false),
  hoursBeforeMeetup: integer("hours_before_meetup"),
  
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
