import { pgTable, text, timestamp, json, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * Draft Collections Table
 * Stores user-created collections and subsets for organizing drafts
 */
export const draftCollections = pgTable("draft_collections", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  collectionName: text("collection_name").notNull(),
  subsetName: text("subset_name"), // Optional subset within collection
  draftId: text("draft_id").notNull(), // Reference to listing draft
  
  // Metadata from AI analysis
  metadata: json("metadata").$type<{
    title?: string;
    dateCreated?: string;
    gps?: { lat: number; lng: number };
    objectType?: string[];
    imageCount?: number;
  }>(),
  
  // AI predictions
  segmentPrediction: text("segment_prediction"), // "realtor", "reseller", "collector", etc.
  aiSuggestionSource: text("ai_suggestion_source"), // "geo", "objectType", "timestamp"
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("draft_collections_user_id_idx").on(table.userId),
  collectionNameIdx: index("draft_collections_collection_name_idx").on(table.collectionName),
  draftIdIdx: index("draft_collections_draft_id_idx").on(table.draftId),
}));

export const insertDraftCollectionSchema = createInsertSchema(draftCollections);
export const selectDraftCollectionSchema = createSelectSchema(draftCollections);

export type DraftCollection = z.infer<typeof selectDraftCollectionSchema>;
export type InsertDraftCollection = z.infer<typeof insertDraftCollectionSchema>;

/**
 * User Segments Table
 * Tracks detected user segments for analytics and monetization
 */
export const userSegments = pgTable("user_segments", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  
  // Detected segment
  segment: text("segment").notNull(), // "realtor", "reseller", "collector", "creator", "writer", "photographer"
  confidence: text("confidence").notNull(), // Confidence score (0.0 - 1.0)
  
  // Detection signals
  detectionSignals: json("detection_signals").$type<{
    objectTypes?: string[];
    listingPatterns?: string[];
    frequency?: string;
    geolocation?: string;
  }>(),
  
  // Timestamps
  firstDetectedAt: timestamp("first_detected_at").defaultNow().notNull(),
  lastDetectedAt: timestamp("last_detected_at").defaultNow().notNull(),
  detectionCount: text("detection_count").default("1").notNull(),
}, (table) => ({
  userIdIdx: index("user_segments_user_id_idx").on(table.userId),
  segmentIdx: index("user_segments_segment_idx").on(table.segment),
}));

export const insertUserSegmentSchema = createInsertSchema(userSegments);
export const selectUserSegmentSchema = createSelectSchema(userSegments);

export type UserSegment = z.infer<typeof selectUserSegmentSchema>;
export type InsertUserSegment = z.infer<typeof insertUserSegmentSchema>;

/**
 * Monetization Events Table
 * Logs when users interact with monetization prompts
 */
export const monetizationEvents = pgTable("monetization_events", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  
  // Event details
  eventType: text("event_type").notNull(), // "view", "click", "dismiss", "convert"
  segment: text("segment").notNull(), // User segment at time of event
  offerType: text("offer_type").notNull(), // "pro_upgrade", "subdomain", "affiliate", etc.
  
  // Context
  collectionId: text("collection_id"), // Associated collection if applicable
  metadata: json("metadata").$type<{
    offerName?: string;
    offerValue?: string;
    source?: string;
  }>(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("monetization_events_user_id_idx").on(table.userId),
  eventTypeIdx: index("monetization_events_event_type_idx").on(table.eventType),
  segmentIdx: index("monetization_events_segment_idx").on(table.segment),
  createdAtIdx: index("monetization_events_created_at_idx").on(table.createdAt),
}));

export const insertMonetizationEventSchema = createInsertSchema(monetizationEvents);
export const selectMonetizationEventSchema = createSelectSchema(monetizationEvents);

export type MonetizationEvent = z.infer<typeof selectMonetizationEventSchema>;
export type InsertMonetizationEvent = z.infer<typeof insertMonetizationEventSchema>;

