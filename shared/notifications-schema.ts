// Notifications System Schema
// Defines tables for in-app notifications, user preferences, and delivery tracking

import { pgTable, varchar, text, boolean, timestamp, index, time } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./schema";

// ============================================
// NOTIFICATIONS TABLE
// ============================================

export const notifications = pgTable(
  "notifications",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 50 }).notNull(), // 'message', 'offer', 'review', 'transaction', 'sale', 'purchase', 'system'
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    relatedId: varchar("related_id"), // ID of related entity
    relatedType: varchar("related_type", { length: 50 }), // 'message', 'listing', 'transaction', 'review', 'offer'
    actionUrl: varchar("action_url", { length: 500 }), // URL to navigate to
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    readAt: timestamp("read_at"),
  },
  (table) => ({
    userIdIdx: index("idx_notifications_user_id").on(table.userId),
    createdAtIdx: index("idx_notifications_created_at").on(table.createdAt),
    isReadIdx: index("idx_notifications_is_read").on(table.isRead),
  })
);

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  readAt: true,
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// ============================================
// NOTIFICATION PREFERENCES TABLE
// ============================================

export const notificationPreferences = pgTable("notification_preferences", {
  userId: varchar("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),

  // In-app notification preferences
  inAppMessages: boolean("in_app_messages").notNull().default(true),
  inAppOffers: boolean("in_app_offers").notNull().default(true),
  inAppReviews: boolean("in_app_reviews").notNull().default(true),
  inAppTransactions: boolean("in_app_transactions").notNull().default(true),
  inAppSales: boolean("in_app_sales").notNull().default(true),
  inAppPurchases: boolean("in_app_purchases").notNull().default(true),
  inAppSystem: boolean("in_app_system").notNull().default(true),

  // Email notification preferences
  emailMessages: boolean("email_messages").notNull().default(true),
  emailOffers: boolean("email_offers").notNull().default(true),
  emailReviews: boolean("email_reviews").notNull().default(true),
  emailTransactions: boolean("email_transactions").notNull().default(true),
  emailSales: boolean("email_sales").notNull().default(true),
  emailPurchases: boolean("email_purchases").notNull().default(true),
  emailSystem: boolean("email_system").notNull().default(false),
  emailDailyDigest: boolean("email_daily_digest").notNull().default(false),
  emailWeeklyDigest: boolean("email_weekly_digest").notNull().default(false),

  // SMS notification preferences
  smsMessages: boolean("sms_messages").notNull().default(false),
  smsOffers: boolean("sms_offers").notNull().default(false),
  smsReviews: boolean("sms_reviews").notNull().default(false),
  smsTransactions: boolean("sms_transactions").notNull().default(false),
  smsSales: boolean("sms_sales").notNull().default(false),
  smsPurchases: boolean("sms_purchases").notNull().default(false),
  smsSystem: boolean("sms_system").notNull().default(false),

  // Quiet hours
  quietHoursEnabled: boolean("quiet_hours_enabled").notNull().default(false),
  quietHoursStart: time("quiet_hours_start"), // e.g., '22:00:00'
  quietHoursEnd: time("quiet_hours_end"), // e.g., '08:00:00'
  quietHoursTimezone: varchar("quiet_hours_timezone", { length: 50 }).default("America/New_York"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertNotificationPreferencesSchema = createInsertSchema(notificationPreferences).omit({
  createdAt: true,
  updatedAt: true,
});

export const updateNotificationPreferencesSchema = insertNotificationPreferencesSchema.partial();

export type InsertNotificationPreferences = z.infer<typeof insertNotificationPreferencesSchema>;
export type UpdateNotificationPreferences = z.infer<typeof updateNotificationPreferencesSchema>;
export type NotificationPreferences = typeof notificationPreferences.$inferSelect;

// ============================================
// NOTIFICATION DELIVERY LOG TABLE
// ============================================

export const notificationDeliveryLog = pgTable(
  "notification_delivery_log",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    notificationId: varchar("notification_id").references(() => notifications.id, { onDelete: "cascade" }),
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    deliveryMethod: varchar("delivery_method", { length: 20 }).notNull(), // 'email', 'sms', 'in_app'
    status: varchar("status", { length: 20 }).notNull(), // 'pending', 'sent', 'delivered', 'failed', 'bounced'
    recipient: varchar("recipient", { length: 255 }), // email address or phone number
    errorMessage: text("error_message"),
    sentAt: timestamp("sent_at"),
    deliveredAt: timestamp("delivered_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    notificationIdIdx: index("idx_delivery_log_notification_id").on(table.notificationId),
    userIdIdx: index("idx_delivery_log_user_id").on(table.userId),
    statusIdx: index("idx_delivery_log_status").on(table.status),
  })
);

export const insertNotificationDeliveryLogSchema = createInsertSchema(notificationDeliveryLog).omit({
  id: true,
  createdAt: true,
});

export type InsertNotificationDeliveryLog = z.infer<typeof insertNotificationDeliveryLogSchema>;
export type NotificationDeliveryLog = typeof notificationDeliveryLog.$inferSelect;

// ============================================
// NOTIFICATION TYPE ENUM
// ============================================

export const NotificationType = {
  MESSAGE: "message",
  OFFER: "offer",
  REVIEW: "review",
  TRANSACTION: "transaction",
  SALE: "sale",
  PURCHASE: "purchase",
  SYSTEM: "system",
} as const;

export type NotificationTypeValue = typeof NotificationType[keyof typeof NotificationType];

// ============================================
// DELIVERY METHOD ENUM
// ============================================

export const DeliveryMethod = {
  IN_APP: "in_app",
  EMAIL: "email",
  SMS: "sms",
} as const;

export type DeliveryMethodValue = typeof DeliveryMethod[keyof typeof DeliveryMethod];

// ============================================
// DELIVERY STATUS ENUM
// ============================================

export const DeliveryStatus = {
  PENDING: "pending",
  SENT: "sent",
  DELIVERED: "delivered",
  FAILED: "failed",
  BOUNCED: "bounced",
} as const;

export type DeliveryStatusValue = typeof DeliveryStatus[keyof typeof DeliveryStatus];
