// Trust System Schema Migration for Drizzle ORM
// Add this to your existing schema file: shared/schema.ts

import { pgTable, text, integer, boolean, timestamp, decimal, jsonb, index, unique } from "drizzle-orm/pg-core";

// ============================================
// TRUST SCORES TABLE
// ============================================
export const trustScores = pgTable("trust_scores", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().unique(),
  
  // Overall Score (0-100)
  overallScore: integer("overall_score").notNull().default(0),
  scoreLevel: text("score_level").notNull().default("new"), // new, building, established, trusted, elite
  
  // Component Scores (0-25 each)
  verificationScore: integer("verification_score").notNull().default(0),
  transactionScore: integer("transaction_score").notNull().default(0),
  reputationScore: integer("reputation_score").notNull().default(0),
  responsivenessScore: integer("responsiveness_score").notNull().default(0),
  
  // Transaction Metrics
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

// ============================================
// VERIFICATIONS TABLE
// ============================================
export const verifications = pgTable("verifications", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  
  // Verification Types
  phoneVerified: boolean("phone_verified").notNull().default(false),
  phoneVerifiedAt: timestamp("phone_verified_at"),
  
  emailVerified: boolean("email_verified").notNull().default(false),
  emailVerifiedAt: timestamp("email_verified_at"),
  
  idVerified: boolean("id_verified").notNull().default(false),
  idVerifiedAt: timestamp("id_verified_at"),
  idVerificationProvider: text("id_verification_provider"), // stripe, onfido, etc
  
  paymentVerified: boolean("payment_verified").notNull().default(false),
  paymentVerifiedAt: timestamp("payment_verified_at"),
  
  socialVerified: boolean("social_verified").notNull().default(false),
  socialVerifiedAt: timestamp("social_verified_at"),
  socialProvider: text("social_provider"), // google, facebook, etc
  
  // Verification Data
  verificationMetadata: jsonb("verification_metadata"), // Store additional verification details
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("verifications_user_id_idx").on(table.userId),
  phoneVerifiedIdx: index("verifications_phone_verified_idx").on(table.phoneVerified),
  emailVerifiedIdx: index("verifications_email_verified_idx").on(table.emailVerified),
  uniqueUserId: unique("verifications_user_id_unique").on(table.userId),
}));

// ============================================
// BADGES TABLE
// ============================================
export const badges = pgTable("badges", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  
  badgeType: text("badge_type").notNull(), // phone_verified, power_seller, fast_responder, etc
  badgeName: text("badge_name").notNull(),
  badgeIcon: text("badge_icon"), // emoji or icon identifier
  badgeColor: text("badge_color"),
  
  earnedAt: timestamp("earned_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"), // Some badges may expire
  
  isActive: boolean("is_active").notNull().default(true),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("badges_user_id_idx").on(table.userId),
  badgeTypeIdx: index("badges_badge_type_idx").on(table.badgeType),
  isActiveIdx: index("badges_is_active_idx").on(table.isActive),
}));

// ============================================
// TRUST EVENTS TABLE (Audit Log)
// ============================================
export const trustEvents = pgTable("trust_events", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  
  eventType: text("event_type").notNull(), // transaction_completed, verification_added, penalty_applied, etc
  eventCategory: text("event_category").notNull(), // positive, negative, neutral
  
  scoreBefore: integer("score_before"),
  scoreAfter: integer("score_after"),
  scoreDelta: integer("score_delta"),
  
  reason: text("reason"),
  metadata: jsonb("metadata"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("trust_events_user_id_idx").on(table.userId),
  eventTypeIdx: index("trust_events_event_type_idx").on(table.eventType),
  createdAtIdx: index("trust_events_created_at_idx").on(table.createdAt),
}));

// ============================================
// PENALTIES TABLE
// ============================================
export const penalties = pgTable("penalties", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  
  penaltyType: text("penalty_type").notNull(), // warning, suspension, ban
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

// ============================================
// REPORTS TABLE (User-to-User Reports)
// ============================================
export const reports = pgTable("reports", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  
  reporterId: text("reporter_id").notNull(), // User who made the report
  reportedUserId: text("reported_user_id").notNull(), // User being reported
  
  reportType: text("report_type").notNull(), // spam, fraud, harassment, etc
  reportReason: text("report_reason").notNull(),
  
  status: text("status").notNull().default("pending"), // pending, reviewing, resolved, dismissed
  
  evidence: jsonb("evidence"), // Screenshots, message IDs, etc
  
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
}));
