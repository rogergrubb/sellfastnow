import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  decimal,
  boolean,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (updated for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  bio: text("bio"),
  location: varchar("location", { length: 100 }),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  reviewEmailsEnabled: boolean("review_emails_enabled").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const upsertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;

// Listings table
export const listings = pgTable("listings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  condition: varchar("condition", { length: 20 }).notNull(),
  location: varchar("location", { length: 100 }).notNull(),
  images: text("images").array().notNull().default(sql`'{}'::text[]`),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertListingSchema = createInsertSchema(listings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertListing = z.infer<typeof insertListingSchema>;
export type Listing = typeof listings.$inferSelect;

// Messages table
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  listingId: varchar("listing_id")
    .notNull()
    .references(() => listings.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  receiverId: varchar("receiver_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  isRead: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Favorites table
export const favorites = pgTable("favorites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  listingId: varchar("listing_id")
    .notNull()
    .references(() => listings.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true,
});

export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Favorite = typeof favorites.$inferSelect;

// Upload Sessions table (for QR code phone-to-desktop uploads)
export const uploadSessions = pgTable("upload_sessions", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  images: text("images").array().notNull().default(sql`'{}'::text[]`),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUploadSessionSchema = createInsertSchema(uploadSessions).omit({
  createdAt: true,
});

export type InsertUploadSession = z.infer<typeof insertUploadSessionSchema>;
export type UploadSession = typeof uploadSessions.$inferSelect;

// Offers table
export const offers = pgTable("offers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  listingId: varchar("listing_id")
    .notNull()
    .references(() => listings.id, { onDelete: "cascade" }),
  buyerId: varchar("buyer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sellerId: varchar("seller_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  
  // Offer details
  offerAmount: decimal("offer_amount", { precision: 10, scale: 2 }).notNull(),
  depositAmount: decimal("deposit_amount", { precision: 10, scale: 2 }).default("0"),
  message: text("message"),
  
  // Status: pending, accepted, declined, countered, expired, withdrawn
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  
  // Counter offer tracking
  counterOfferAmount: decimal("counter_offer_amount", { precision: 10, scale: 2 }),
  counterOfferMessage: text("counter_offer_message"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  respondedAt: timestamp("responded_at"),
  expiresAt: timestamp("expires_at"),
});

export const insertOfferSchema = createInsertSchema(offers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  respondedAt: true,
});

export type InsertOffer = z.infer<typeof insertOfferSchema>;
export type Offer = typeof offers.$inferSelect;

// Reviews table
export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  listingId: varchar("listing_id")
    .notNull()
    .references(() => listings.id, { onDelete: "cascade" }),
  reviewerId: varchar("reviewer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  reviewedUserId: varchar("reviewed_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  
  // Ratings (1-5)
  overallRating: integer("overall_rating").notNull(),
  communicationRating: integer("communication_rating"),
  asDescribedRating: integer("as_described_rating"),
  punctualityRating: integer("punctuality_rating"),
  professionalismRating: integer("professionalism_rating"),
  
  // Review content
  reviewTitle: varchar("review_title", { length: 200 }),
  reviewText: text("review_text").notNull(),
  reviewPhotos: text("review_photos").array().default(sql`'{}'::text[]`),
  
  // Metadata
  reviewerRole: varchar("reviewer_role", { length: 20 }).notNull(), // buyer or seller
  verifiedTransaction: boolean("verified_transaction").default(true),
  wouldTransactAgain: varchar("would_transact_again", { length: 20 }), // yes_definitely, maybe, no
  
  // Response from reviewed user
  sellerResponse: text("seller_response"),
  sellerResponseAt: timestamp("seller_response_at"),
  sellerResponseEditedAt: timestamp("seller_response_edited_at"),
  
  // Community feedback
  helpfulCount: integer("helpful_count").default(0),
  notHelpfulCount: integer("not_helpful_count").default(0),
  
  // Status
  isPublic: boolean("is_public").default(true),
  isFlagged: boolean("is_flagged").default(false),
  flagReason: text("flag_reason"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  helpfulCount: true,
  notHelpfulCount: true,
  sellerResponse: true,
  sellerResponseAt: true,
  sellerResponseEditedAt: true,
  isFlagged: true,
  flagReason: true,
});

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

// Review with enriched metadata for display
export type ReviewWithMetadata = Review & {
  reviewerName?: string;
  reviewerProfileImage?: string;
};

// Cancellation Comments table
export const cancellationComments = pgTable("cancellation_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  listingId: varchar("listing_id")
    .notNull()
    .references(() => listings.id, { onDelete: "cascade" }),
  cancelledByUserId: varchar("cancelled_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  
  // Comment
  comment: text("comment").notNull(),
  isPublic: boolean("is_public").default(true),
  
  // Metadata
  cancelledRole: varchar("cancelled_role", { length: 20 }).notNull(), // buyer or seller
  cancellationTiming: varchar("cancellation_timing", { length: 50 }),
  cancellationReasonCategory: varchar("cancellation_reason_category", { length: 100 }),
  
  // Response from other party
  responseByUserId: varchar("response_by_user_id").references(() => users.id),
  responseText: text("response_text"),
  responseIsPublic: boolean("response_is_public").default(true),
  responseAt: timestamp("response_at"),
  
  // Community feedback
  helpfulCount: integer("helpful_count").default(0),
  notHelpfulCount: integer("not_helpful_count").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCancellationCommentSchema = createInsertSchema(cancellationComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  helpfulCount: true,
  notHelpfulCount: true,
  responseByUserId: true,
  responseText: true,
  responseIsPublic: true,
  responseAt: true,
});

export type InsertCancellationComment = z.infer<typeof insertCancellationCommentSchema>;
export type CancellationComment = typeof cancellationComments.$inferSelect;

// User Statistics table
export const userStatistics = pgTable("user_statistics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .unique()
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  
  // As Seller
  totalSales: integer("total_sales").default(0),
  successfulSales: integer("successful_sales").default(0),
  cancelledBySeller: integer("cancelled_by_seller").default(0),
  cancelledByBuyerOnSeller: integer("cancelled_by_buyer_on_seller").default(0),
  sellerNoShows: integer("seller_no_shows").default(0),
  buyerNoShowsOnSeller: integer("buyer_no_shows_on_seller").default(0),
  
  // As Buyer
  totalPurchases: integer("total_purchases").default(0),
  successfulPurchases: integer("successful_purchases").default(0),
  cancelledByBuyer: integer("cancelled_by_buyer").default(0),
  cancelledBySellerOnBuyer: integer("cancelled_by_seller_on_buyer").default(0),
  buyerNoShows: integer("buyer_no_shows").default(0),
  sellerNoShowsOnBuyer: integer("seller_no_shows_on_buyer").default(0),
  
  // Recent activity (last 90 days)
  recentTransactions90d: integer("recent_transactions_90d").default(0),
  recentCancellations90d: integer("recent_cancellations_90d").default(0),
  recentNoShows90d: integer("recent_no_shows_90d").default(0),
  
  // Timing stats
  avgResponseTimeMinutes: integer("avg_response_time_minutes"),
  responseRatePercent: decimal("response_rate_percent", { precision: 5, scale: 2 }),
  responsesWithin15min: integer("responses_within_15min").default(0),
  responsesWithin1hour: integer("responses_within_1hour").default(0),
  responsesWithin24hours: integer("responses_within_24hours").default(0),
  totalMessagesReceived: integer("total_messages_received").default(0),
  
  // Punctuality
  checkedInEarly: integer("checked_in_early").default(0),
  checkedInOnTime: integer("checked_in_on_time").default(0),
  checkedInLate: integer("checked_in_late").default(0),
  totalCheckins: integer("total_checkins").default(0),
  
  // Reviews received
  totalReviewsReceived: integer("total_reviews_received").default(0),
  fiveStarReviews: integer("five_star_reviews").default(0),
  fourStarReviews: integer("four_star_reviews").default(0),
  threeStarReviews: integer("three_star_reviews").default(0),
  twoStarReviews: integer("two_star_reviews").default(0),
  oneStarReviews: integer("one_star_reviews").default(0),
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }),
  
  // Verification
  phoneVerified: boolean("phone_verified").default(false),
  emailVerified: boolean("email_verified").default(false),
  idVerified: boolean("id_verified").default(false),
  stripeConnected: boolean("stripe_connected").default(false),
  
  // Calculated rates
  sellerSuccessRate: decimal("seller_success_rate", { precision: 5, scale: 2 }),
  buyerSuccessRate: decimal("buyer_success_rate", { precision: 5, scale: 2 }),
  overallSuccessRate: decimal("overall_success_rate", { precision: 5, scale: 2 }),
  
  memberSince: timestamp("member_since"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UserStatistics = typeof userStatistics.$inferSelect;

// Review Votes table
export const reviewVotes = pgTable("review_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reviewId: varchar("review_id")
    .notNull()
    .references(() => reviews.id, { onDelete: "cascade" }),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  voteType: varchar("vote_type", { length: 20 }).notNull(), // helpful or not_helpful
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReviewVoteSchema = createInsertSchema(reviewVotes).omit({
  id: true,
  createdAt: true,
});

export type InsertReviewVote = z.infer<typeof insertReviewVoteSchema>;
export type ReviewVote = typeof reviewVotes.$inferSelect;

// Cancellation Comment Votes table
export const cancellationCommentVotes = pgTable("cancellation_comment_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  commentId: varchar("comment_id")
    .notNull()
    .references(() => cancellationComments.id, { onDelete: "cascade" }),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  voteType: varchar("vote_type", { length: 20 }).notNull(), // helpful or not_helpful
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCancellationCommentVoteSchema = createInsertSchema(cancellationCommentVotes).omit({
  id: true,
  createdAt: true,
});

export type InsertCancellationCommentVote = z.infer<typeof insertCancellationCommentVoteSchema>;
export type CancellationCommentVote = typeof cancellationCommentVotes.$inferSelect;

// Transaction Events table (for timeline)
export const transactionEvents = pgTable("transaction_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  listingId: varchar("listing_id")
    .notNull()
    .references(() => listings.id, { onDelete: "cascade" }),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  eventType: varchar("event_type", { length: 50 }).notNull(),
  eventData: jsonb("event_data"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTransactionEventSchema = createInsertSchema(transactionEvents).omit({
  id: true,
  createdAt: true,
});

export type InsertTransactionEvent = z.infer<typeof insertTransactionEventSchema>;
export type TransactionEvent = typeof transactionEvents.$inferSelect;

// Review Request Emails tracking table
export const reviewRequestEmails = pgTable("review_request_emails", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  listingId: varchar("listing_id")
    .notNull()
    .references(() => listings.id, { onDelete: "cascade" }),
  recipientUserId: varchar("recipient_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  emailType: varchar("email_type", { length: 50 }).notNull(), // 'initial' or 'reminder'
  sentAt: timestamp("sent_at").defaultNow(),
  reviewLeft: boolean("review_left").notNull().default(false),
  reviewLeftAt: timestamp("review_left_at"),
});

export const insertReviewRequestEmailSchema = createInsertSchema(reviewRequestEmails).omit({
  id: true,
  sentAt: true,
  reviewLeft: true,
  reviewLeftAt: true,
});

export type InsertReviewRequestEmail = z.infer<typeof insertReviewRequestEmailSchema>;
export type ReviewRequestEmail = typeof reviewRequestEmails.$inferSelect;

// Review Tokens table (for email authentication)
export const reviewTokens = pgTable("review_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  token: varchar("token").notNull().unique(),
  listingId: varchar("listing_id")
    .notNull()
    .references(() => listings.id, { onDelete: "cascade" }),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  used: boolean("used").notNull().default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReviewTokenSchema = createInsertSchema(reviewTokens).omit({
  id: true,
  used: true,
  createdAt: true,
});

export type InsertReviewToken = z.infer<typeof insertReviewTokenSchema>;
export type ReviewToken = typeof reviewTokens.$inferSelect;
