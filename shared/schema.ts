// Complete Database Schema for Drizzle ORM
// Location: shared/schema.ts
// This file contains ALL tables for your application

import { sql } from "drizzle-orm";
import { 
  pgTable, 
  text, 
  integer, 
  boolean, 
  timestamp, 
  decimal, 
  jsonb, 
  index, 
  unique,
  varchar,
  serial
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================
// USER TABLES (Core Application)
// ============================================

export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  username: text("username").unique(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  location: text("location"),
  
  // Stripe integration
  stripeCustomerId: text("stripe_customer_id"),
  stripeConnectAccountId: text("stripe_connect_account_id"),
  
  // Account status
  isActive: boolean("is_active").notNull().default(true),
  isBanned: boolean("is_banned").notNull().default(false),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  emailIdx: index("users_email_idx").on(table.email),
  usernameIdx: index("users_username_idx").on(table.username),
}));

// ============================================
// TRUST SYSTEM TABLES
// ============================================

export const trustScores = pgTable("trust_scores", {
  id: text("id").primaryKey().$defaultFn(() => sql`gen_random_uuid()`),
  userId: text("user_id").notNull().unique(),
  
  // Overall Score (0-100)
  overallScore: integer("overall_score").notNull().default(0),
  scoreLevel: text("score_level").notNull().default("new"), // new, building, established, trusted, elite
  
  // Component Scores (0-25 each)
  verificationScore: integer("verification_score").notNull().default(0),
  transactionScore: integer("transaction_score").notNull().default(0),
  reputationScore: integer("reputation_score").notNull().default(0),
  responsivenessScore: integer("responsiveness_score").notNull().default(0),
  
  // Transaction Metrics (AUTO-UPDATED FROM TRANSACTIONS)
  totalTransactions: integer("total_transactions").notNull().default(0),
  successfulTransactions: integer("successful_transactions").notNull().default(0),
  disputedTransactions: integer("disputed_transactions").notNull().default(0),
  cancelledTransactions: integer("cancelled_transactions").notNull().default(0),
  totalVolume: decimal("total_volume", { precision: 12, scale: 2 }).notNull().default("0"),
  
  // Reputation Metrics
  totalReviews: integer("total_reviews").notNull().default(0),
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }),
  positiveReviews: integer("positive_reviews").notNull().default(0),
  negativeReviews: integer("negative_reviews").notNull().default(0),
  
  // Activity Metrics
  listingsCreated: integer("listings_created").notNull().default(0),
  listingsSold: integer("listings_sold").notNull().default(0),
  listingCompletionRate: decimal("listing_completion_rate", { precision: 5, scale: 2 }),
  
  // Responsiveness Metrics
  averageResponseTime: integer("average_response_time"), // minutes
  totalMessages: integer("total_messages").notNull().default(0),
  
  // Timestamps
  lastCalculated: timestamp("last_calculated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("trust_scores_user_id_idx").on(table.userId),
  scoreLevelIdx: index("trust_scores_score_level_idx").on(table.scoreLevel),
}));

export const verifications = pgTable("verifications", {
  id: text("id").primaryKey().$defaultFn(() => sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  
  // Verification Types
  phoneVerified: boolean("phone_verified").notNull().default(false),
  phoneVerifiedAt: timestamp("phone_verified_at"),
  
  emailVerified: boolean("email_verified").notNull().default(false),
  emailVerifiedAt: timestamp("email_verified_at"),
  
  idVerified: boolean("id_verified").notNull().default(false),
  idVerifiedAt: timestamp("id_verified_at"),
  idVerificationProvider: text("id_verification_provider"),
  
  paymentVerified: boolean("payment_verified").notNull().default(false),
  paymentVerifiedAt: timestamp("payment_verified_at"),
  
  socialVerified: boolean("social_verified").notNull().default(false),
  socialVerifiedAt: timestamp("social_verified_at"),
  socialProvider: text("social_provider"),
  
  verificationMetadata: jsonb("verification_metadata"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("verifications_user_id_idx").on(table.userId),
  phoneVerifiedIdx: index("verifications_phone_verified_idx").on(table.phoneVerified),
  emailVerifiedIdx: index("verifications_email_verified_idx").on(table.emailVerified),
  uniqueUserId: unique("verifications_user_id_unique").on(table.userId),
}));

export const badges = pgTable("badges", {
  id: text("id").primaryKey().$defaultFn(() => sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  
  badgeType: text("badge_type").notNull(),
  badgeName: text("badge_name").notNull(),
  badgeIcon: text("badge_icon"),
  badgeColor: text("badge_color"),
  
  earnedAt: timestamp("earned_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  
  isActive: boolean("is_active").notNull().default(true),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("badges_user_id_idx").on(table.userId),
  badgeTypeIdx: index("badges_badge_type_idx").on(table.badgeType),
  isActiveIdx: index("badges_is_active_idx").on(table.isActive),
}));

export const trustEvents = pgTable("trust_events", {
  id: text("id").primaryKey().$defaultFn(() => sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  
  eventType: text("event_type").notNull(),
  eventCategory: text("event_category").notNull(),
  
  scoreBefore: integer("score_before"),
  scoreAfter: integer("score_after"),
  scoreDelta: integer("score_delta"),
  
  reason: text("reason"),
  metadata: jsonb("metadata"),
  
  transactionId: text("transaction_id"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("trust_events_user_id_idx").on(table.userId),
  eventTypeIdx: index("trust_events_event_type_idx").on(table.eventType),
  createdAtIdx: index("trust_events_created_at_idx").on(table.createdAt),
  transactionIdIdx: index("trust_events_transaction_id_idx").on(table.transactionId),
}));

export const penalties = pgTable("penalties", {
  id: text("id").primaryKey().$defaultFn(() => sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  
  penaltyType: text("penalty_type").notNull(),
  reason: text("reason").notNull(),
  
  scorePenalty: integer("score_penalty").notNull().default(0),
  
  isActive: boolean("is_active").notNull().default(true),
  appliedAt: timestamp("applied_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  
  appealSubmitted: boolean("appeal_submitted").notNull().default(false),
  appealedAt: timestamp("appealed_at"),
  appealResolution: text("appeal_resolution"),
  appealResolvedAt: timestamp("appeal_resolved_at"),
  
  metadata: jsonb("metadata"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("penalties_user_id_idx").on(table.userId),
  penaltyTypeIdx: index("penalties_penalty_type_idx").on(table.penaltyType),
  isActiveIdx: index("penalties_is_active_idx").on(table.isActive),
}));

export const reports = pgTable("reports", {
  id: text("id").primaryKey().$defaultFn(() => sql`gen_random_uuid()`),
  
  reporterId: text("reporter_id").notNull(),
  reportedUserId: text("reported_user_id").notNull(),
  
  reportType: text("report_type").notNull(),
  reportReason: text("report_reason").notNull(),
  
  status: text("status").notNull().default("pending"),
  
  evidence: jsonb("evidence"),
  
  transactionId: text("transaction_id"),
  
  moderatorId: text("moderator_id"),
  moderatorNotes: text("moderator_notes"),
  resolution: text("resolution"),
  resolvedAt: timestamp("resolved_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  reporterIdIdx: index("reports_reporter_id_idx").on(table.reporterId),
  reportedUserIdIdx: index("reports_reported_user_id_idx").on(table.reportedUserId),
  statusIdx: index("reports_status_idx").on(table.status),
  transactionIdIdx: index("reports_transaction_id_idx").on(table.transactionId),
}));

// ============================================
// TRANSACTION TABLES (Escrow System)
// ============================================

export const transactions = pgTable("transactions", {
  id: text("id").primaryKey().$defaultFn(() => sql`gen_random_uuid()`),
  
  // Parties
  buyerId: text("buyer_id").notNull(),
  sellerId: text("seller_id").notNull(),
  listingId: text("listing_id"),
  
  // Transaction Details
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("usd"),
  description: text("description"),
  
  // Status Management
  status: text("status").notNull().default("pending"),
  
  // Stripe Integration
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeChargeId: text("stripe_charge_id"),
  
  // Escrow Management
  heldAt: timestamp("held_at"),
  releasedAt: timestamp("released_at"),
  refundedAt: timestamp("refunded_at"),
  cancelledAt: timestamp("cancelled_at"),
  
  autoReleaseAt: timestamp("auto_release_at"),
  
  // Dispute Management
  isDisputed: boolean("is_disputed").notNull().default(false),
  disputeReason: text("dispute_reason"),
  disputeOpenedAt: timestamp("dispute_opened_at"),
  disputeResolvedAt: timestamp("dispute_resolved_at"),
  disputeResolution: text("dispute_resolution"),
  
  // Delivery Tracking
  trackingNumber: text("tracking_number"),
  shippedAt: timestamp("shipped_at"),
  deliveredAt: timestamp("delivered_at"),
  
  // Metadata
  metadata: jsonb("metadata"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  buyerIdIdx: index("transactions_buyer_id_idx").on(table.buyerId),
  sellerIdIdx: index("transactions_seller_id_idx").on(table.sellerId),
  statusIdx: index("transactions_status_idx").on(table.status),
  stripePaymentIntentIdIdx: index("transactions_stripe_payment_intent_id_idx").on(table.stripePaymentIntentId),
  autoReleaseAtIdx: index("transactions_auto_release_at_idx").on(table.autoReleaseAt),
  isDisputedIdx: index("transactions_is_disputed_idx").on(table.isDisputed),
}));

// ============================================
// RELATIONSHIPS (Drizzle ORM Relations)
// ============================================

export const usersRelations = relations(users, ({ one, many }) => ({
  trustScore: one(trustScores, {
    fields: [users.id],
    references: [trustScores.userId],
  }),
  verification: one(verifications, {
    fields: [users.id],
    references: [verifications.userId],
  }),
  badges: many(badges),
  trustEvents: many(trustEvents),
  penalties: many(penalties),
  buyerTransactions: many(transactions, { relationName: "buyer" }),
  sellerTransactions: many(transactions, { relationName: "seller" }),
}));

export const trustScoresRelations = relations(trustScores, ({ one }) => ({
  user: one(users, {
    fields: [trustScores.userId],
    references: [users.id],
  }),
}));

export const verificationsRelations = relations(verifications, ({ one }) => ({
  user: one(users, {
    fields: [verifications.userId],
    references: [users.id],
  }),
}));

export const badgesRelations = relations(badges, ({ one }) => ({
  user: one(users, {
    fields: [badges.userId],
    references: [users.id],
  }),
}));

export const trustEventsRelations = relations(trustEvents, ({ one }) => ({
  user: one(users, {
    fields: [trustEvents.userId],
    references: [users.id],
  }),
  transaction: one(transactions, {
    fields: [trustEvents.transactionId],
    references: [transactions.id],
  }),
}));

export const penaltiesRelations = relations(penalties, ({ one }) => ({
  user: one(users, {
    fields: [penalties.userId],
    references: [users.id],
  }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  reporter: one(users, {
    fields: [reports.reporterId],
    references: [users.id],
  }),
  reportedUser: one(users, {
    fields: [reports.reportedUserId],
    references: [users.id],
  }),
  transaction: one(transactions, {
    fields: [reports.transactionId],
    references: [transactions.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  buyer: one(users, {
    fields: [transactions.buyerId],
    references: [users.id],
    relationName: "buyer",
  }),
  seller: one(users, {
    fields: [transactions.sellerId],
    references: [users.id],
    relationName: "seller",
  }),
  trustEvents: many(trustEvents),
  reports: many(reports),
}));

// ============================================
// TYPE EXPORTS (TypeScript Types)
// ============================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type TrustScore = typeof trustScores.$inferSelect;
export type NewTrustScore = typeof trustScores.$inferInsert;

export type Verification = typeof verifications.$inferSelect;
export type NewVerification = typeof verifications.$inferInsert;

export type Badge = typeof badges.$inferSelect;
export type NewBadge = typeof badges.$inferInsert;

export type TrustEvent = typeof trustEvents.$inferSelect;
export type NewTrustEvent = typeof trustEvents.$inferInsert;

export type Penalty = typeof penalties.$inferSelect;
export type NewPenalty = typeof penalties.$inferInsert;

export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

// ============================================
// ENUMS & CONSTANTS
// ============================================

export const SCORE_LEVELS = {
  NEW: "new",
  BUILDING: "building",
  ESTABLISHED: "established",
  TRUSTED: "trusted",
  ELITE: "elite",
} as const;

export const TRANSACTION_STATUSES = {
  PENDING: "pending",
  HELD: "held",
  RELEASED: "released",
  REFUNDED: "refunded",
  CANCELLED: "cancelled",
  DISPUTED: "disputed",
} as const;

export const EVENT_TYPES = {
  TRANSACTION_COMPLETED: "transaction_completed",
  VERIFICATION_ADDED: "verification_added",
  POSITIVE_REVIEW: "positive_review",
  FAST_RESPONSE: "fast_response",
  DISPUTE_OPENED: "dispute_opened",
  DISPUTE_LOST: "dispute_lost",
  TRANSACTION_CANCELLED: "transaction_cancelled",
  PENALTY_APPLIED: "penalty_applied",
  NEGATIVE_REVIEW: "negative_review",
  SCORE_RECALCULATED: "score_recalculated",
  BADGE_EARNED: "badge_earned",
} as const;

export const BADGE_TYPES = {
  PHONE_VERIFIED: "phone_verified",
  EMAIL_VERIFIED: "email_verified",
  ID_VERIFIED: "id_verified",
  PAYMENT_VERIFIED: "payment_verified",
  POWER_SELLER: "power_seller",
  FAST_RESPONDER: "fast_responder",
  TRUSTED_MEMBER: "trusted_member",
  FIVE_STAR: "five_star",
  NEW_MEMBER: "new_member",
} as const;


