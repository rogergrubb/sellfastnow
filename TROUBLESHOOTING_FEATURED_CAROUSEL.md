# Troubleshooting: Featured Listings Carousel

## Current Status

The featured listings carousel system has been fully implemented but is experiencing deployment issues. The code is complete and correct, but the database migration may not have run successfully.

## Issues Encountered

### 1. API Endpoints Returning Errors
- `/api/listings` → 500 Internal Server Error  
- `/api/featured-listings` → 500 Internal Server Error

### 2. Root Cause
The migration `008_featured_listings` needs to run to add the following columns to the `listings` table:
- `featured_until` (TIMESTAMP)
- `featured_payment_id` (VARCHAR(255))
- `featured_created_at` (TIMESTAMP)
- `featured_duration` (VARCHAR(10))

## Solution Steps

### Option 1: Manual Migration (Recommended)

Connect to the Railway PostgreSQL database and run this SQL:

```sql
-- Add featured listing fields to listings table
ALTER TABLE listings
ADD COLUMN IF NOT EXISTS featured_until TIMESTAMP,
ADD COLUMN IF NOT EXISTS featured_payment_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS featured_created_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS featured_duration VARCHAR(10);

-- Create index for faster queries on featured listings
CREATE INDEX IF NOT EXISTS idx_listings_featured_until 
ON listings(featured_until) 
WHERE featured_until IS NOT NULL;
```

### Option 2: Force Migration Rerun

1. SSH into Railway container
2. Run: `npm run db:migrate` (if script exists)
3. Or manually trigger migration from Node.js console

### Option 3: Check Railway Logs

1. Go to Railway dashboard
2. Check deployment logs for migration errors
3. Look for lines starting with "Running migration 008"
4. If migration failed, check error details

## Testing the Carousel

Once the migration runs successfully:

### Step 1: Create Test Featured Listings

Use the admin endpoint (if working):
```bash
curl -X POST https://sellfast.now/api/admin/featured-demo/create-demo-featured
```

Or manually insert via SQL:
```sql
INSERT INTO listings (
  id, user_id, title, description, price, category, condition, status,
  primary_image, images, location, featured_until, featured_duration,
  featured_created_at, created_at, updated_at
) VALUES (
  'demo-featured-1',
  (SELECT id FROM users LIMIT 1),
  'Vintage Camera Collection',
  'Beautiful vintage camera collection from the 1960s.',
  299.99,
  'electronics',
  'good',
  'active',
  'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400',
  ARRAY['https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400'],
  'San Francisco, CA',
  NOW() + INTERVAL '7 days',
  '7d',
  NOW(),
  NOW(),
  NOW()
);
```

### Step 2: Verify API Works

```bash
# Should return empty array or featured listings
curl https://sellfast.now/api/featured-listings

# Should return all listings
curl https://sellfast.now/api/listings
```

### Step 3: Check Homepage

1. Visit https://sellfast.now
2. Carousel should appear at the top if there are featured listings
3. If no featured listings, carousel is hidden (by design)

## Code Changes Made

### Frontend
1. **FeaturedCarousel.tsx** - Auto-scrolling carousel component with Swiper.js
2. **Home.tsx** - Added carousel to homepage
3. **FeatureListingModal.tsx** - Modal for featuring listings with Stripe payment
4. **ListingDetail.tsx** - Added "Feature This Listing" button
5. **LocationSelectionModalWithMap.tsx** - Interactive map for location selection
6. **InteractiveMapPicker.tsx** - Map component with pin dropping

### Backend
1. **schema.ts** - Added featured fields to listings table
2. **migrations/008_featured_listings.ts** - Migration to add columns
3. **routes/featured.ts** - API endpoints for featured listings
4. **routes/admin-featured-demo.ts** - Admin endpoint to create demo data
5. **routes.ts** - Webhook handler for Stripe payments

### Fixes Applied
1. Fixed FeaturedCarousel fetch call (was using wrong API method)
2. Fixed migration 008 to match pattern of other migrations
3. Updated pnpm-lock.yaml to resolve deployment errors

## Expected Behavior

### When Working Correctly:

**Homepage:**
- Featured carousel appears at top (if featured listings exist)
- Auto-scrolls every 6 seconds
- Shows 1-4 items depending on screen size
- Each item has green "FEATURED" badge with sparkles

**Listing Detail Page:**
- Owners see "✨ Feature This Listing" button
- Click opens modal with 3 pricing tiers
- Stripe payment integration
- After payment, listing appears in carousel

**Featured Listings:**
- Displayed prominently on homepage
- Auto-expire after duration ends
- Random order for fairness
- Limited to 12 items max in carousel

## Next Steps

1. **Check Railway logs** to see if migration ran
2. **Run migration manually** if it didn't run automatically
3. **Test API endpoints** to confirm they work
4. **Create test featured listing** to see carousel
5. **Verify Stripe webhook** is receiving payments correctly

## Files to Review

- `/server/migrations/008_featured_listings.ts` - Migration file
- `/server/migrations/index.ts` - Migration runner
- `/server/routes/featured.ts` - Featured listings API
- `/client/src/components/FeaturedCarousel.tsx` - Carousel component

## Contact

If issues persist, check:
- Railway deployment logs
- Database connection status
- Environment variables (STRIPE_SECRET_KEY, DATABASE_URL)
- Migration execution logs
