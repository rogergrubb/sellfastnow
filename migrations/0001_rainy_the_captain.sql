CREATE TABLE "draft_folders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"name" varchar(200) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "draft_collections" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"collection_name" text NOT NULL,
	"subset_name" text,
	"draft_id" text NOT NULL,
	"metadata" json,
	"segment_prediction" text,
	"ai_suggestion_source" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "monetization_events" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"event_type" text NOT NULL,
	"segment" text NOT NULL,
	"offer_type" text NOT NULL,
	"collection_id" text,
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_segments" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"segment" text NOT NULL,
	"confidence" text NOT NULL,
	"detection_signals" json,
	"first_detected_at" timestamp DEFAULT now() NOT NULL,
	"last_detected_at" timestamp DEFAULT now() NOT NULL,
	"detection_count" text DEFAULT '1' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promoted_listing_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"promoted_listing_id" uuid NOT NULL,
	"date" timestamp NOT NULL,
	"impressions" integer DEFAULT 0,
	"views" integer DEFAULT 0,
	"clicks" integer DEFAULT 0,
	"messages" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promoted_listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"boost_type" text NOT NULL,
	"status" text DEFAULT 'pending_payment' NOT NULL,
	"stripe_payment_intent_id" text,
	"started_at" timestamp,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "promoted_listings_stripe_payment_intent_id_unique" UNIQUE("stripe_payment_intent_id")
);
--> statement-breakpoint
CREATE TABLE "saved_searches" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "saved_searches_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" varchar NOT NULL,
	"name" text NOT NULL,
	"search_query" text,
	"category" text,
	"condition" text,
	"price_min" integer,
	"price_max" integer,
	"location" text,
	"distance" integer,
	"email_notifications" boolean DEFAULT true NOT NULL,
	"sms_notifications" boolean DEFAULT false NOT NULL,
	"notification_frequency" text DEFAULT 'instant' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_notified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "search_alert_notifications" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "search_alert_notifications_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"saved_search_id" integer NOT NULL,
	"listing_id" integer NOT NULL,
	"email_sent" boolean DEFAULT false NOT NULL,
	"email_sent_at" timestamp,
	"sms_sent" boolean DEFAULT false NOT NULL,
	"sms_sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gratitude_gifts" (
	"id" serial PRIMARY KEY NOT NULL,
	"upcycle_listing_id" integer NOT NULL,
	"giver_id" integer NOT NULL,
	"receiver_id" integer NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"platform_fee" numeric(10, 2) NOT NULL,
	"final_amount" numeric(10, 2) NOT NULL,
	"payment_method" varchar(50),
	"stripe_payment_intent_id" varchar,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "upcycle_listings" (
	"id" serial PRIMARY KEY NOT NULL,
	"listing_id" integer NOT NULL,
	"giver_id" integer NOT NULL,
	"status" varchar(20) DEFAULT 'available' NOT NULL,
	"claimed_by" integer,
	"claimed_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "location_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"latitude" numeric(10, 7) NOT NULL,
	"longitude" numeric(10, 7) NOT NULL,
	"accuracy" numeric(10, 2),
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meetup_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar NOT NULL,
	"sender_id" varchar NOT NULL,
	"message_type" varchar(20) NOT NULL,
	"message_content" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meetup_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" varchar NOT NULL,
	"buyer_id" varchar NOT NULL,
	"seller_id" varchar NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"buyer_consented" boolean DEFAULT false,
	"seller_consented" boolean DEFAULT false,
	"buyer_consented_at" timestamp,
	"seller_consented_at" timestamp,
	"meetup_latitude" numeric(10, 7),
	"meetup_longitude" numeric(10, 7),
	"meetup_address" text,
	"en_route_started_at" timestamp,
	"en_route_started_by" varchar,
	"estimated_arrival_time" timestamp,
	"estimated_arrival_minutes" integer,
	"buyer_arrived_at" timestamp,
	"seller_arrived_at" timestamp,
	"expires_at" timestamp NOT NULL,
	"completed_at" timestamp,
	"cancelled_at" timestamp,
	"cancelled_by" varchar,
	"cancellation_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "giveaway_entries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar NOT NULL,
	"month" varchar(7) NOT NULL,
	"entry_source" varchar(50) DEFAULT 'welcome_modal' NOT NULL,
	"is_winner" boolean DEFAULT false NOT NULL,
	"won_at" timestamp,
	"credits_claimed" boolean DEFAULT false NOT NULL,
	"claimed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "welcome_signups" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar NOT NULL,
	"keyword_alerts" boolean DEFAULT false NOT NULL,
	"keywords" text,
	"bulk_sales_alerts" boolean DEFAULT false NOT NULL,
	"estate_sales_alerts" boolean DEFAULT false NOT NULL,
	"giveaway_entry" boolean DEFAULT false NOT NULL,
	"newsletter" boolean DEFAULT false NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"referrer" text,
	"email_verified" boolean DEFAULT false NOT NULL,
	"verified_at" timestamp,
	"unsubscribed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "welcome_signups_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "cancellation_comments" ADD COLUMN "transaction_id" varchar;--> statement-breakpoint
ALTER TABLE "cancellation_comments" ADD COLUMN "is_last_minute_cancellation" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "cancellation_comments" ADD COLUMN "hours_before_meetup" integer;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "location_city" varchar(100);--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "location_region" varchar(100);--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "location_country" varchar(100);--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "location_postal_code" varchar(20);--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "location_latitude" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "location_longitude" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "image_rotations" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "view_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "last_viewed_at" timestamp;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "batch_id" varchar(100);--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "batch_title" varchar(200);--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "folder_id" varchar;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "message_type" varchar(50) DEFAULT 'text' NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "transaction_id" varchar;--> statement-breakpoint
ALTER TABLE "user_statistics" ADD COLUMN "last_minute_cancels_by_seller" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "user_statistics" ADD COLUMN "last_minute_cancels_by_buyer" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripe_account_id" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripe_account_type" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "account_tier" varchar(20) DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "onboarding_complete" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "charges_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "payouts_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "free_listings_used_this_month" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "free_listings_reset_date" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "contact_email" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "contact_preference" varchar(20) DEFAULT 'in_app' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "show_email_publicly" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone_number" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "share_phone_when" varchar(20) DEFAULT 'never' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "share_email_when" varchar(20) DEFAULT 'after_acceptance' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "profile_visibility" varchar(20) DEFAULT 'public' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "show_last_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "show_items_sold" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "allow_messages_from" varchar(20) DEFAULT 'verified' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "require_verified_to_contact" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "id_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "address_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "verified_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "sms_weekly_updates" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "sms_monthly_updates" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "sms_credit_giveaways" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "sms_promotional" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "sms_opt_in_date" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "sms_offer_received" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "sms_offer_response" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "sms_payment_confirmed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "sms_new_message" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "sms_listing_published" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "sms_listing_engagement" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "sms_listing_sold" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "sms_review_received" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "sms_meetup_reminder" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "preferred_meeting_locations" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "available_times" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "willing_to_ship" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "shipping_fee_amount" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "offer_id" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "deposit_amount" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "deposit_submitted_at" timestamp;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "deposit_accepted_at" timestamp;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "deposit_rejected_at" timestamp;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "deposit_rejection_reason" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "stripe_transfer_id" varchar(255);--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "stripe_refund_id" varchar(255);--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "meetup_latitude" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "meetup_longitude" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "deposit_buyer_latitude" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "deposit_buyer_longitude" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "deposit_seller_latitude" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "deposit_seller_longitude" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "buyer_current_latitude" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "buyer_current_longitude" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "buyer_location_updated_at" timestamp;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "seller_current_latitude" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "seller_current_longitude" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "seller_location_updated_at" timestamp;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "completion_buyer_latitude" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "completion_buyer_longitude" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "completion_seller_latitude" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "completion_seller_longitude" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "cancelled_by" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "cancellation_reason" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "is_last_minute_cancellation" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "hours_before_meetup" integer;--> statement-breakpoint
ALTER TABLE "draft_folders" ADD CONSTRAINT "draft_folders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promoted_listing_analytics" ADD CONSTRAINT "promoted_listing_analytics_promoted_listing_id_promoted_listings_id_fk" FOREIGN KEY ("promoted_listing_id") REFERENCES "public"."promoted_listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promoted_listings" ADD CONSTRAINT "promoted_listings_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promoted_listings" ADD CONSTRAINT "promoted_listings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_alert_notifications" ADD CONSTRAINT "search_alert_notifications_saved_search_id_saved_searches_id_fk" FOREIGN KEY ("saved_search_id") REFERENCES "public"."saved_searches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gratitude_gifts" ADD CONSTRAINT "gratitude_gifts_upcycle_listing_id_upcycle_listings_id_fk" FOREIGN KEY ("upcycle_listing_id") REFERENCES "public"."upcycle_listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gratitude_gifts" ADD CONSTRAINT "gratitude_gifts_giver_id_users_id_fk" FOREIGN KEY ("giver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gratitude_gifts" ADD CONSTRAINT "gratitude_gifts_receiver_id_users_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upcycle_listings" ADD CONSTRAINT "upcycle_listings_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upcycle_listings" ADD CONSTRAINT "upcycle_listings_giver_id_users_id_fk" FOREIGN KEY ("giver_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upcycle_listings" ADD CONSTRAINT "upcycle_listings_claimed_by_users_id_fk" FOREIGN KEY ("claimed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_history" ADD CONSTRAINT "location_history_session_id_meetup_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."meetup_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_history" ADD CONSTRAINT "location_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetup_messages" ADD CONSTRAINT "meetup_messages_session_id_meetup_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."meetup_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetup_messages" ADD CONSTRAINT "meetup_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetup_sessions" ADD CONSTRAINT "meetup_sessions_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetup_sessions" ADD CONSTRAINT "meetup_sessions_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetup_sessions" ADD CONSTRAINT "meetup_sessions_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "draft_collections_user_id_idx" ON "draft_collections" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "draft_collections_collection_name_idx" ON "draft_collections" USING btree ("collection_name");--> statement-breakpoint
CREATE INDEX "draft_collections_draft_id_idx" ON "draft_collections" USING btree ("draft_id");--> statement-breakpoint
CREATE INDEX "monetization_events_user_id_idx" ON "monetization_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "monetization_events_event_type_idx" ON "monetization_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "monetization_events_segment_idx" ON "monetization_events" USING btree ("segment");--> statement-breakpoint
CREATE INDEX "monetization_events_created_at_idx" ON "monetization_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "user_segments_user_id_idx" ON "user_segments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_segments_segment_idx" ON "user_segments" USING btree ("segment");--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_folder_id_draft_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."draft_folders"("id") ON DELETE set null ON UPDATE no action;