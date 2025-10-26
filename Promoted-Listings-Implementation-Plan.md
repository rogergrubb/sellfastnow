

# Promoted Listings / Boost System - Implementation Plan

**Date:** October 26, 2025  
**Feature:** Promoted Listings / Boost System  
**Goal:** Allow sellers to pay to feature their listings at the top of search results and track performance.

---

## 🎯 Overview

The Promoted Listings system will provide sellers with a powerful tool to increase visibility for their items. By paying a fee, sellers can "boost" their listings, ensuring they appear at the top of relevant search results and category pages. This feature will create a new revenue stream for SellFast.Now and provide valuable analytics to sellers.

### Key Features:
- **Boost Tiers:** Multiple boost options (e.g., 3-day, 7-day, 30-day) with different pricing.
- **Stripe Integration:** Seamless payment processing for boost purchases.
- **Prioritized Search:** Boosted listings will be prioritized in search results.
- **"Promoted" Badge:** A clear visual indicator on boosted listings.
- **Analytics Dashboard:** Sellers can track impressions, views, clicks, and messages for their boosted listings.

---



## 🏗️ System Architecture

The implementation will consist of several key components:

1.  **Database Schema:** New tables to store promoted listing data and analytics.
2.  **Backend API:** Endpoints for creating and managing boosts, processing payments, and retrieving analytics.
3.  **Stripe Integration:** Utilize Stripe for secure payment processing.
4.  **Search Algorithm Update:** Modify the existing search functionality to prioritize boosted listings.
5.  **Frontend UI:** New components for the boost purchase flow and analytics dashboard.

### Database Schema

Two new tables will be added to the database:

-   `promotedListings`: Stores information about each boost, including the listing ID, user ID, boost type, status, and expiration date.
-   `promotedListingAnalytics`: Tracks daily performance metrics (impressions, views, clicks, messages) for each boosted listing.

```sql
-- Table to store information about boosted listings
CREATE TABLE promoted_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  boost_type TEXT NOT NULL, -- e.g., '7_day_boost', '30_day_boost'
  status TEXT NOT NULL DEFAULT 'pending_payment' CHECK (status IN ('active', 'expired', 'pending_payment', 'cancelled')),
  stripe_payment_intent_id TEXT UNIQUE,
  started_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table to track performance metrics for boosted listings
CREATE TABLE promoted_listing_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promoted_listing_id UUID NOT NULL REFERENCES promoted_listings(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  messages INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (promoted_listing_id, date)
);
```

---


---



## 🛠️ Implementation Phases

The project will be implemented in the following phases:

**Phase 1: Database and Backend API**
- Create the `promotedListings` and `promotedListingAnalytics` tables.
- Build API endpoints for:
  - `POST /api/boosts`: Create a new boost and Stripe payment intent.
  - `GET /api/boosts/:listingId`: Get boost status for a listing.
  - `POST /api/stripe/webhook`: Handle Stripe payment confirmation.
  - `GET /api/boosts/analytics/:promotedListingId`: Get analytics data for a boosted listing.

**Phase 2: Stripe Integration**
- Integrate Stripe Elements for the payment form.
- Handle payment submission and confirmation on the frontend.
- Securely process payments on the backend and update boost status.

**Phase 3: Search Algorithm Update**
- Modify the search query to fetch active boosted listings first.
- Blend boosted listings with organic results (e.g., show 2-3 boosted listings at the top).
- Ensure boosted listings are relevant to the search query.

**Phase 4: Frontend UI**
- Create a "Boost Your Listing" modal with boost options and pricing.
- Build the Stripe payment form component.
- Design and build the analytics dashboard with charts and key metrics.
- Add a "Promoted" badge to boosted listings in search results and on the listing detail page.

**Phase 5: Testing and Deployment**
- Write unit and integration tests for the new backend endpoints.
- Conduct end-to-end testing of the boost purchase flow.
- Test the analytics dashboard to ensure data is accurate.
- Deploy the feature to production.

---

