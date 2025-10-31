import { pgTable, text, integer, timestamp, boolean, jsonb, decimal, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

/**
 * Business Partners Table
 * Stores information about liquidation companies, realtors, movers, and commercial businesses
 */
export const businessPartners = pgTable("business_partners", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(), // Links to the user who owns this partner account
  
  // Business Information
  businessName: text("business_name").notNull(),
  businessType: text("business_type").notNull(), // 'liquidation', 'realtor', 'mover', 'commercial', 'other'
  businessDescription: text("business_description"),
  businessEmail: text("business_email").notNull(),
  businessPhone: text("business_phone"),
  businessWebsite: text("business_website"),
  
  // Branding
  logoUrl: text("logo_url"),
  bannerUrl: text("banner_url"),
  primaryColor: text("primary_color").default("#3b82f6"),
  secondaryColor: text("secondary_color").default("#1e40af"),
  customDomain: text("custom_domain").unique(), // e.g., "acme-liquidation"
  
  // Address
  streetAddress: text("street_address"),
  city: text("city"),
  state: text("state"),
  postalCode: text("postal_code"),
  country: text("country").default("US"),
  
  // Payment & Commission
  stripeAccountId: text("stripe_account_id").unique(), // Stripe Connect account
  platformFeePercent: decimal("platform_fee_percent", { precision: 5, scale: 2 }).default("3.00"),
  payoutSchedule: text("payout_schedule").default("weekly"), // 'daily', 'weekly', 'monthly'
  
  // Status & Verification
  status: text("status").default("pending"), // 'pending', 'active', 'suspended', 'inactive'
  verificationStatus: text("verification_status").default("unverified"), // 'unverified', 'pending', 'verified'
  verifiedAt: timestamp("verified_at"),
  
  // Settings
  settings: jsonb("settings").default({}), // Custom settings, email templates, etc.
  features: jsonb("features").default({
    bulkUpload: true,
    emailCampaigns: true,
    smsCampaigns: false,
    analytics: true,
    customBranding: true,
  }),
  
  // Statistics
  totalListings: integer("total_listings").default(0),
  totalSales: integer("total_sales").default(0),
  totalRevenue: decimal("total_revenue", { precision: 12, scale: 2 }).default("0.00"),
  totalCommissionEarned: decimal("total_commission_earned", { precision: 12, scale: 2 }).default("0.00"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastActiveAt: timestamp("last_active_at"),
});

/**
 * Partner Clients Table
 * Tracks clients/customers of each business partner
 */
export const partnerClients = pgTable("partner_clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  partnerId: uuid("partner_id").notNull().references(() => businessPartners.id),
  
  // Client Information
  email: text("email").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone"),
  
  // Engagement
  totalPurchases: integer("total_purchases").default(0),
  totalSpent: decimal("total_spent", { precision: 12, scale: 2 }).default("0.00"),
  lastPurchaseAt: timestamp("last_purchase_at"),
  
  // Communication Preferences
  emailOptIn: boolean("email_opt_in").default(true),
  smsOptIn: boolean("sms_opt_in").default(false),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Partner Listings Table
 * Links listings to business partners
 */
export const partnerListings = pgTable("partner_listings", {
  id: uuid("id").primaryKey().defaultRandom(),
  partnerId: uuid("partner_id").notNull().references(() => businessPartners.id),
  listingId: text("listing_id").notNull(), // References listings table
  
  // Bulk Upload Info
  batchId: text("batch_id"), // Groups listings uploaded together
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  
  // Status
  status: text("status").default("active"), // 'active', 'sold', 'removed'
  soldAt: timestamp("sold_at"),
  soldPrice: decimal("sold_price", { precision: 10, scale: 2 }),
  
  // Commission
  platformFee: decimal("platform_fee", { precision: 10, scale: 2 }),
  partnerEarnings: decimal("partner_earnings", { precision: 10, scale: 2 }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Partner Email Campaigns Table
 * Tracks email campaigns sent to partner clients
 */
export const partnerCampaigns = pgTable("partner_campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  partnerId: uuid("partner_id").notNull().references(() => businessPartners.id),
  
  // Campaign Details
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  htmlContent: text("html_content").notNull(),
  plainTextContent: text("plain_text_content"),
  
  // Targeting
  targetAudience: text("target_audience").default("all"), // 'all', 'recent_buyers', 'inactive', 'custom'
  recipientCount: integer("recipient_count").default(0),
  
  // Status
  status: text("status").default("draft"), // 'draft', 'scheduled', 'sending', 'sent'
  scheduledFor: timestamp("scheduled_for"),
  sentAt: timestamp("sent_at"),
  
  // Analytics
  opens: integer("opens").default(0),
  clicks: integer("clicks").default(0),
  conversions: integer("conversions").default(0),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Zod schemas for validation
export const insertBusinessPartnerSchema = createInsertSchema(businessPartners);
export const selectBusinessPartnerSchema = createSelectSchema(businessPartners);
export const insertPartnerClientSchema = createInsertSchema(partnerClients);
export const selectPartnerClientSchema = createSelectSchema(partnerClients);
export const insertPartnerListingSchema = createInsertSchema(partnerListings);
export const selectPartnerListingSchema = createSelectSchema(partnerListings);
export const insertPartnerCampaignSchema = createInsertSchema(partnerCampaigns);
export const selectPartnerCampaignSchema = createSelectSchema(partnerCampaigns);

// TypeScript types
export type BusinessPartner = typeof businessPartners.$inferSelect;
export type NewBusinessPartner = typeof businessPartners.$inferInsert;
export type PartnerClient = typeof partnerClients.$inferSelect;
export type NewPartnerClient = typeof partnerClients.$inferInsert;
export type PartnerListing = typeof partnerListings.$inferSelect;
export type NewPartnerListing = typeof partnerListings.$inferInsert;
export type PartnerCampaign = typeof partnerCampaigns.$inferSelect;
export type NewPartnerCampaign = typeof partnerCampaigns.$inferInsert;

