CREATE TABLE "cancellation_comment_votes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comment_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"vote_type" varchar(20) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cancellation_comments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" varchar NOT NULL,
	"cancelled_by_user_id" varchar NOT NULL,
	"comment" text NOT NULL,
	"is_public" boolean DEFAULT true,
	"cancelled_role" varchar(20) NOT NULL,
	"cancellation_timing" varchar(50),
	"cancellation_reason_category" varchar(100),
	"response_by_user_id" varchar,
	"response_text" text,
	"response_is_public" boolean DEFAULT true,
	"response_at" timestamp,
	"helpful_count" integer DEFAULT 0,
	"not_helpful_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "credit_transactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"transaction_type" varchar(50) NOT NULL,
	"amount" integer NOT NULL,
	"cost" numeric(10, 2),
	"description" text,
	"stripe_payment_id" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"listing_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "listings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"category" varchar(50) NOT NULL,
	"condition" varchar(20) NOT NULL,
	"location" varchar(100) NOT NULL,
	"images" text[] DEFAULT '{}'::text[] NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" varchar NOT NULL,
	"sender_id" varchar NOT NULL,
	"receiver_id" varchar NOT NULL,
	"content" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "offers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" varchar NOT NULL,
	"buyer_id" varchar NOT NULL,
	"seller_id" varchar NOT NULL,
	"offer_amount" numeric(10, 2) NOT NULL,
	"deposit_amount" numeric(10, 2) DEFAULT '0',
	"message" text,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"counter_offer_amount" numeric(10, 2),
	"counter_offer_message" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"responded_at" timestamp,
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "review_request_emails" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" varchar NOT NULL,
	"recipient_user_id" varchar NOT NULL,
	"email_type" varchar(50) NOT NULL,
	"sent_at" timestamp DEFAULT now(),
	"review_left" boolean DEFAULT false NOT NULL,
	"review_left_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "review_tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" varchar NOT NULL,
	"listing_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "review_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "review_votes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"vote_type" varchar(20) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" varchar NOT NULL,
	"reviewer_id" varchar NOT NULL,
	"reviewed_user_id" varchar NOT NULL,
	"overall_rating" integer NOT NULL,
	"communication_rating" integer,
	"as_described_rating" integer,
	"punctuality_rating" integer,
	"professionalism_rating" integer,
	"review_title" varchar(200),
	"review_text" text NOT NULL,
	"review_photos" text[] DEFAULT '{}'::text[],
	"reviewer_role" varchar(20) NOT NULL,
	"verified_transaction" boolean DEFAULT true,
	"would_transact_again" varchar(20),
	"seller_response" text,
	"seller_response_at" timestamp,
	"seller_response_edited_at" timestamp,
	"helpful_count" integer DEFAULT 0,
	"not_helpful_count" integer DEFAULT 0,
	"is_public" boolean DEFAULT true,
	"is_flagged" boolean DEFAULT false,
	"flag_reason" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transaction_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"event_data" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "upload_sessions" (
	"id" varchar PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"images" text[] DEFAULT '{}'::text[] NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_credits" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"email" varchar NOT NULL,
	"credits_remaining" integer DEFAULT 0 NOT NULL,
	"credits_purchased" integer DEFAULT 0 NOT NULL,
	"credits_used" integer DEFAULT 0 NOT NULL,
	"last_purchase_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_credits_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_statistics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"total_sales" integer DEFAULT 0,
	"successful_sales" integer DEFAULT 0,
	"cancelled_by_seller" integer DEFAULT 0,
	"cancelled_by_buyer_on_seller" integer DEFAULT 0,
	"seller_no_shows" integer DEFAULT 0,
	"buyer_no_shows_on_seller" integer DEFAULT 0,
	"total_purchases" integer DEFAULT 0,
	"successful_purchases" integer DEFAULT 0,
	"cancelled_by_buyer" integer DEFAULT 0,
	"cancelled_by_seller_on_buyer" integer DEFAULT 0,
	"buyer_no_shows" integer DEFAULT 0,
	"seller_no_shows_on_buyer" integer DEFAULT 0,
	"recent_transactions_90d" integer DEFAULT 0,
	"recent_cancellations_90d" integer DEFAULT 0,
	"recent_no_shows_90d" integer DEFAULT 0,
	"avg_response_time_minutes" integer,
	"response_rate_percent" numeric(5, 2),
	"responses_within_15min" integer DEFAULT 0,
	"responses_within_1hour" integer DEFAULT 0,
	"responses_within_24hours" integer DEFAULT 0,
	"total_messages_received" integer DEFAULT 0,
	"checked_in_early" integer DEFAULT 0,
	"checked_in_on_time" integer DEFAULT 0,
	"checked_in_late" integer DEFAULT 0,
	"total_checkins" integer DEFAULT 0,
	"total_reviews_received" integer DEFAULT 0,
	"five_star_reviews" integer DEFAULT 0,
	"four_star_reviews" integer DEFAULT 0,
	"three_star_reviews" integer DEFAULT 0,
	"two_star_reviews" integer DEFAULT 0,
	"one_star_reviews" integer DEFAULT 0,
	"average_rating" numeric(3, 2),
	"phone_verified" boolean DEFAULT false,
	"email_verified" boolean DEFAULT false,
	"id_verified" boolean DEFAULT false,
	"stripe_connected" boolean DEFAULT false,
	"seller_success_rate" numeric(5, 2),
	"buyer_success_rate" numeric(5, 2),
	"overall_success_rate" numeric(5, 2),
	"member_since" timestamp,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_statistics_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"bio" text,
	"location" varchar(100),
	"location_city" varchar(100),
	"location_region" varchar(100),
	"location_country" varchar(100),
	"location_postal_code" varchar(20),
	"location_latitude" numeric(10, 7),
	"location_longitude" numeric(10, 7),
	"location_display_precision" varchar(20) DEFAULT 'city',
	"stripe_customer_id" varchar,
	"stripe_subscription_id" varchar,
	"review_emails_enabled" boolean DEFAULT true NOT NULL,
	"ai_uses_this_month" integer DEFAULT 0 NOT NULL,
	"ai_reset_date" timestamp DEFAULT now() NOT NULL,
	"ai_credits_purchased" integer DEFAULT 0 NOT NULL,
	"subscription_tier" varchar(20) DEFAULT 'free' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "badges" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"badge_type" text NOT NULL,
	"badge_name" text NOT NULL,
	"badge_icon" text,
	"badge_color" text,
	"earned_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "penalties" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"penalty_type" text NOT NULL,
	"reason" text NOT NULL,
	"score_penalty" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"applied_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"appeal_submitted" boolean DEFAULT false NOT NULL,
	"appealed_at" timestamp,
	"appeal_resolution" text,
	"appeal_resolved_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporter_id" text NOT NULL,
	"reported_user_id" text NOT NULL,
	"report_type" text NOT NULL,
	"report_reason" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"evidence" jsonb,
	"moderator_id" text,
	"moderator_notes" text,
	"resolution" text,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trust_events" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"event_type" text NOT NULL,
	"event_category" text NOT NULL,
	"score_before" integer,
	"score_after" integer,
	"score_delta" integer,
	"reason" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trust_scores" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"overall_score" integer DEFAULT 0 NOT NULL,
	"score_level" text DEFAULT 'new' NOT NULL,
	"verification_score" integer DEFAULT 0 NOT NULL,
	"transaction_score" integer DEFAULT 0 NOT NULL,
	"reputation_score" integer DEFAULT 0 NOT NULL,
	"responsiveness_score" integer DEFAULT 0 NOT NULL,
	"total_transactions" integer DEFAULT 0 NOT NULL,
	"successful_transactions" integer DEFAULT 0 NOT NULL,
	"disputed_transactions" integer DEFAULT 0 NOT NULL,
	"cancelled_transactions" integer DEFAULT 0 NOT NULL,
	"total_volume" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_reviews" integer DEFAULT 0 NOT NULL,
	"average_rating" numeric(3, 2),
	"positive_reviews" integer DEFAULT 0 NOT NULL,
	"negative_reviews" integer DEFAULT 0 NOT NULL,
	"listings_created" integer DEFAULT 0 NOT NULL,
	"listings_sold" integer DEFAULT 0 NOT NULL,
	"listing_completion_rate" numeric(5, 2),
	"average_response_time" integer,
	"total_messages" integer DEFAULT 0 NOT NULL,
	"last_calculated" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "trust_scores_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"phone_verified" boolean DEFAULT false NOT NULL,
	"phone_verified_at" timestamp,
	"email_verified" boolean DEFAULT false NOT NULL,
	"email_verified_at" timestamp,
	"id_verified" boolean DEFAULT false NOT NULL,
	"id_verified_at" timestamp,
	"id_verification_provider" text,
	"payment_verified" boolean DEFAULT false NOT NULL,
	"payment_verified_at" timestamp,
	"social_verified" boolean DEFAULT false NOT NULL,
	"social_verified_at" timestamp,
	"social_provider" text,
	"verification_metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "verifications_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"buyer_id" text NOT NULL,
	"seller_id" text NOT NULL,
	"listing_id" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"platform_fee" numeric(10, 2) NOT NULL,
	"seller_payout" numeric(10, 2) NOT NULL,
	"stripe_payment_intent_id" varchar(255),
	"stripe_charge_id" varchar(255),
	"status" varchar(30) DEFAULT 'pending' NOT NULL,
	"meetup_scheduled_at" timestamp,
	"meetup_location" text,
	"shipped_at" timestamp,
	"delivered_at" timestamp,
	"auto_release_at" timestamp,
	"dispute_reason" text,
	"dispute_opened_at" timestamp,
	"dispute_resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"cancelled_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "cancellation_comment_votes" ADD CONSTRAINT "cancellation_comment_votes_comment_id_cancellation_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."cancellation_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cancellation_comment_votes" ADD CONSTRAINT "cancellation_comment_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cancellation_comments" ADD CONSTRAINT "cancellation_comments_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cancellation_comments" ADD CONSTRAINT "cancellation_comments_cancelled_by_user_id_users_id_fk" FOREIGN KEY ("cancelled_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cancellation_comments" ADD CONSTRAINT "cancellation_comments_response_by_user_id_users_id_fk" FOREIGN KEY ("response_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_receiver_id_users_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_request_emails" ADD CONSTRAINT "review_request_emails_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_request_emails" ADD CONSTRAINT "review_request_emails_recipient_user_id_users_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_tokens" ADD CONSTRAINT "review_tokens_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_tokens" ADD CONSTRAINT "review_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_votes" ADD CONSTRAINT "review_votes_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_votes" ADD CONSTRAINT "review_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewed_user_id_users_id_fk" FOREIGN KEY ("reviewed_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_events" ADD CONSTRAINT "transaction_events_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_events" ADD CONSTRAINT "transaction_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upload_sessions" ADD CONSTRAINT "upload_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_credits" ADD CONSTRAINT "user_credits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_statistics" ADD CONSTRAINT "user_statistics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");--> statement-breakpoint
CREATE INDEX "badges_user_id_idx" ON "badges" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "badges_badge_type_idx" ON "badges" USING btree ("badge_type");--> statement-breakpoint
CREATE INDEX "badges_is_active_idx" ON "badges" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "penalties_user_id_idx" ON "penalties" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "penalties_penalty_type_idx" ON "penalties" USING btree ("penalty_type");--> statement-breakpoint
CREATE INDEX "penalties_is_active_idx" ON "penalties" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "reports_reporter_id_idx" ON "reports" USING btree ("reporter_id");--> statement-breakpoint
CREATE INDEX "reports_reported_user_id_idx" ON "reports" USING btree ("reported_user_id");--> statement-breakpoint
CREATE INDEX "reports_status_idx" ON "reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "trust_events_user_id_idx" ON "trust_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "trust_events_event_type_idx" ON "trust_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "trust_events_created_at_idx" ON "trust_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "trust_scores_user_id_idx" ON "trust_scores" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "trust_scores_score_level_idx" ON "trust_scores" USING btree ("score_level");--> statement-breakpoint
CREATE INDEX "verifications_user_id_idx" ON "verifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verifications_phone_verified_idx" ON "verifications" USING btree ("phone_verified");--> statement-breakpoint
CREATE INDEX "verifications_email_verified_idx" ON "verifications" USING btree ("email_verified");--> statement-breakpoint
CREATE INDEX "transactions_buyer_id_idx" ON "transactions" USING btree ("buyer_id");--> statement-breakpoint
CREATE INDEX "transactions_seller_id_idx" ON "transactions" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX "transactions_listing_id_idx" ON "transactions" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "transactions_status_idx" ON "transactions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "transactions_created_at_idx" ON "transactions" USING btree ("created_at");