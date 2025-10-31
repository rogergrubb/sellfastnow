import { pgTable, varchar, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const analyticsEvents = pgTable("analytics_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // User identification
  userId: varchar("user_id"), // Null for anonymous users
  userEmail: varchar("user_email"), // Captured if available
  ipAddress: varchar("ip_address").notNull(), // For tracking anonymous users
  sessionId: varchar("session_id").notNull(), // Browser session ID
  
  // Event details
  eventType: varchar("event_type", { length: 50 }).notNull(), // click, page_view, form_submit, etc.
  eventName: varchar("event_name", { length: 100 }).notNull(), // Specific action name
  
  // Page context
  pagePath: varchar("page_path", { length: 500 }).notNull(), // URL path
  pageTitle: varchar("page_title", { length: 200 }), // Page title
  referrer: varchar("referrer", { length: 500 }), // Where user came from
  
  // Element details (for clicks)
  elementId: varchar("element_id", { length: 100 }), // HTML element ID
  elementClass: varchar("element_class", { length: 200 }), // CSS classes
  elementText: varchar("element_text", { length: 500 }), // Button/link text
  elementType: varchar("element_type", { length: 50 }), // button, link, input, etc.
  
  // Additional data
  metadata: jsonb("metadata"), // Flexible JSON for extra data
  
  // Device & browser info
  userAgent: varchar("user_agent", { length: 500 }),
  deviceType: varchar("device_type", { length: 20 }), // mobile, tablet, desktop
  browser: varchar("browser", { length: 50 }),
  os: varchar("os", { length: 50 }),
  
  // Timing
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  
  // A/B testing
  experimentId: varchar("experiment_id", { length: 100 }), // For A/B test tracking
  variantId: varchar("variant_id", { length: 100 }), // Which variant user saw
}, (table) => [
  index("idx_analytics_user_id").on(table.userId),
  index("idx_analytics_email").on(table.userEmail),
  index("idx_analytics_ip").on(table.ipAddress),
  index("idx_analytics_session").on(table.sessionId),
  index("idx_analytics_event_type").on(table.eventType),
  index("idx_analytics_timestamp").on(table.timestamp),
  index("idx_analytics_page_path").on(table.pagePath),
]);

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = typeof analyticsEvents.$inferInsert;

