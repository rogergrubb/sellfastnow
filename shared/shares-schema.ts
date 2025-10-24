import { sql } from "drizzle-orm";
import {
  pgTable,
  varchar,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./schema";
import { listings } from "./schema";

// Social shares tracking table
export const socialShares = pgTable(
  "social_shares",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    
    // What was shared
    listingId: varchar("listing_id").references(() => listings.id, { onDelete: "cascade" }),
    userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }), // Who shared it (nullable for anonymous shares)
    
    // Share details
    platform: varchar("platform", { length: 20 }).notNull(), // facebook, twitter, whatsapp, instagram, copy_link
    shareType: varchar("share_type", { length: 20 }).notNull(), // individual_listing, complete_listings_page, user_profile
    shareUrl: varchar("share_url", { length: 500 }).notNull(), // The URL that was shared
    
    // Metadata
    userAgent: varchar("user_agent", { length: 500 }), // Browser/device info
    referrer: varchar("referrer", { length: 500 }), // Where the share originated from
    
    // Timestamps
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("idx_social_shares_listing_id").on(table.listingId),
    index("idx_social_shares_user_id").on(table.userId),
    index("idx_social_shares_platform").on(table.platform),
    index("idx_social_shares_created_at").on(table.createdAt),
  ]
);

export const insertSocialShareSchema = createInsertSchema(socialShares).omit({
  id: true,
  createdAt: true,
});

export type InsertSocialShare = z.infer<typeof insertSocialShareSchema>;
export type SocialShare = typeof socialShares.$inferSelect;

// Social share statistics view (for analytics)
export interface ShareStatistics {
  listingId: string;
  totalShares: number;
  facebookShares: number;
  twitterShares: number;
  whatsappShares: number;
  copyLinkShares: number;
  lastSharedAt: Date;
}

