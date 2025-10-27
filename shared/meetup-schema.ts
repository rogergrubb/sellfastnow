// Meetup Location Sharing Schema
// Handles real-time location sharing between buyers and sellers

import { pgTable, varchar, timestamp, decimal, boolean, integer, text } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Meetup Sessions - Tracks active location sharing sessions
export const meetupSessions = pgTable("meetup_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transactionId: varchar("transaction_id").notNull(),
  listingId: varchar("listing_id").notNull(),
  buyerId: varchar("buyer_id").notNull(),
  sellerId: varchar("seller_id").notNull(),
  
  // Session status
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, active, waiting, en_route, arrived, completed, expired, cancelled
  
  // En route tracking
  enRouteStartedAt: timestamp("en_route_started_at"),
  enRouteUserId: varchar("en_route_user_id"), // User who is en route
  estimatedArrivalTime: timestamp("estimated_arrival_time"),
  estimatedArrivalMinutes: integer("estimated_arrival_minutes"), // ETA in minutes
  
  // Who initiated the session
  initiatedBy: varchar("initiated_by").notNull(), // buyer or seller user ID
  
  // Location sharing permissions
  buyerSharedLocation: boolean("buyer_shared_location").default(false),
  sellerSharedLocation: boolean("seller_shared_location").default(false),
  
  // Current locations (updated in real-time)
  buyerLatitude: decimal("buyer_latitude", { precision: 10, scale: 7 }),
  buyerLongitude: decimal("buyer_longitude", { precision: 10, scale: 7 }),
  buyerLastUpdate: timestamp("buyer_last_update"),
  
  sellerLatitude: decimal("seller_latitude", { precision: 10, scale: 7 }),
  sellerLongitude: decimal("seller_longitude", { precision: 10, scale: 7 }),
  sellerLastUpdate: timestamp("seller_last_update"),
  
  // Distance tracking
  currentDistance: decimal("current_distance", { precision: 10, scale: 2 }), // in meters
  
  // Safety features
  expiresAt: timestamp("expires_at").notNull(), // Auto-expire after 60 minutes
  sharedWithContacts: text("shared_with_contacts"), // JSON array of phone numbers/emails
  
  // Meetup details
  suggestedMeetupLat: decimal("suggested_meetup_lat", { precision: 10, scale: 7 }),
  suggestedMeetupLng: decimal("suggested_meetup_lng", { precision: 10, scale: 7 }),
  suggestedMeetupName: varchar("suggested_meetup_name", { length: 200 }),
  
  // Completion
  completedAt: timestamp("completed_at"),
  completedBy: varchar("completed_by"), // User ID who confirmed completion
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Location History - Tracks location updates for reliability scoring
export const locationHistory = pgTable("location_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => meetupSessions.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull(),
  
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  
  accuracy: decimal("accuracy", { precision: 10, scale: 2 }), // GPS accuracy in meters
  
  timestamp: timestamp("timestamp").defaultNow(),
});

// Meetup Messages - Quick status messages during meetup
export const meetupMessages = pgTable("meetup_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => meetupSessions.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id").notNull(),
  
  messageType: varchar("message_type", { length: 50 }).notNull(), // "here", "running_late", "cant_find", "custom"
  messageText: text("message_text"),
  
  timestamp: timestamp("timestamp").defaultNow(),
});

// Reliability Scores - Track punctuality and meetup behavior
export const reliabilityScores = pgTable("reliability_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  
  totalMeetups: integer("total_meetups").default(0),
  completedMeetups: integer("completed_meetups").default(0),
  cancelledMeetups: integer("cancelled_meetups").default(0),
  
  averagePunctuality: decimal("average_punctuality", { precision: 5, scale: 2 }), // Minutes early/late
  
  onTimeCount: integer("on_time_count").default(0), // Within 5 minutes
  lateCount: integer("late_count").default(0), // More than 5 minutes late
  noShowCount: integer("no_show_count").default(0),
  
  reliabilityScore: decimal("reliability_score", { precision: 5, scale: 2 }), // 0-100 score
  
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Zod schemas for validation
export const insertMeetupSessionSchema = createInsertSchema(meetupSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLocationHistorySchema = createInsertSchema(locationHistory).omit({
  id: true,
  timestamp: true,
});

export const insertMeetupMessageSchema = createInsertSchema(meetupMessages).omit({
  id: true,
  timestamp: true,
});

// TypeScript types
export type MeetupSession = typeof meetupSessions.$inferSelect;
export type InsertMeetupSession = z.infer<typeof insertMeetupSessionSchema>;

export type LocationHistory = typeof locationHistory.$inferSelect;
export type InsertLocationHistory = z.infer<typeof insertLocationHistorySchema>;

export type MeetupMessage = typeof meetupMessages.$inferSelect;
export type InsertMeetupMessage = z.infer<typeof insertMeetupMessageSchema>;

export type ReliabilityScore = typeof reliabilityScores.$inferSelect;

