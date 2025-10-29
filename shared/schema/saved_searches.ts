import { pgTable, text, integer, boolean, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
import { users } from "../schema";

export const savedSearches = pgTable("saved_searches", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // User-friendly name for the search
  
  // Search criteria (stored as JSON for flexibility)
  searchQuery: text("search_query"), // Keywords
  category: text("category"),
  condition: text("condition"),
  priceMin: integer("price_min"),
  priceMax: integer("price_max"),
  location: text("location"),
  distance: integer("distance"), // In miles/km
  
  // Notification preferences
  emailNotifications: boolean("email_notifications").notNull().default(true),
  smsNotifications: boolean("sms_notifications").notNull().default(false),
  notificationFrequency: text("notification_frequency").notNull().default("instant"), // instant, daily, weekly
  
  // Tracking
  isActive: boolean("is_active").notNull().default(true),
  lastNotifiedAt: timestamp("last_notified_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const searchAlertNotifications = pgTable("search_alert_notifications", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  savedSearchId: integer("saved_search_id").notNull().references(() => savedSearches.id, { onDelete: "cascade" }),
  listingId: integer("listing_id").notNull(),
  
  // Notification status
  emailSent: boolean("email_sent").notNull().default(false),
  emailSentAt: timestamp("email_sent_at"),
  smsSent: boolean("sms_sent").notNull().default(false),
  smsSentAt: timestamp("sms_sent_at"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type SavedSearch = typeof savedSearches.$inferSelect;
export type NewSavedSearch = typeof savedSearches.$inferInsert;
export type SearchAlertNotification = typeof searchAlertNotifications.$inferSelect;
export type NewSearchAlertNotification = typeof searchAlertNotifications.$inferInsert;

