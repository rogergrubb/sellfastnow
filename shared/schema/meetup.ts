import { pgTable, varchar, timestamp, decimal, text, integer, boolean } from "drizzle-orm/pg-core";
import { users, listings } from "../schema";
import { sql } from "drizzle-orm";

export const meetupSessions = pgTable("meetup_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  listingId: varchar("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  buyerId: varchar("buyer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sellerId: varchar("seller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Status tracking
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, active, en_route, arrived, completed, cancelled
  
  // Location consent
  buyerConsented: boolean("buyer_consented").default(false),
  sellerConsented: boolean("seller_consented").default(false),
  buyerConsentedAt: timestamp("buyer_consented_at"),
  sellerConsentedAt: timestamp("seller_consented_at"),
  
  // Meetup location (agreed upon location)
  meetupLatitude: decimal("meetup_latitude", { precision: 10, scale: 7 }),
  meetupLongitude: decimal("meetup_longitude", { precision: 10, scale: 7 }),
  meetupAddress: text("meetup_address"),
  
  // En route tracking
  enRouteStartedAt: timestamp("en_route_started_at"),
  enRouteStartedBy: varchar("en_route_started_by"), // 'buyer' or 'seller'
  estimatedArrivalTime: timestamp("estimated_arrival_time"),
  estimatedArrivalMinutes: integer("estimated_arrival_minutes"), // ETA in minutes
  
  // Arrival tracking
  buyerArrivedAt: timestamp("buyer_arrived_at"),
  sellerArrivedAt: timestamp("seller_arrived_at"),
  
  // Session metadata
  expiresAt: timestamp("expires_at").notNull(), // Auto-expire after 60 minutes
  completedAt: timestamp("completed_at"),
  cancelledAt: timestamp("cancelled_at"),
  cancelledBy: varchar("cancelled_by"), // user_id who cancelled
  cancellationReason: text("cancellation_reason"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const locationHistory = pgTable("location_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => meetupSessions.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  accuracy: decimal("accuracy", { precision: 10, scale: 2 }), // in meters
  
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const meetupMessages = pgTable("meetup_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => meetupSessions.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  messageType: varchar("message_type", { length: 20 }).notNull(), // 'text', 'quick_message', 'system'
  messageContent: text("message_content").notNull(),
  
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export type MeetupSession = typeof meetupSessions.$inferSelect;
export type NewMeetupSession = typeof meetupSessions.$inferInsert;
export type LocationHistory = typeof locationHistory.$inferSelect;
export type NewLocationHistory = typeof locationHistory.$inferInsert;
export type MeetupMessage = typeof meetupMessages.$inferSelect;
export type NewMeetupMessage = typeof meetupMessages.$inferInsert;

