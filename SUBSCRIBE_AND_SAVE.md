# Subscribe & Save - Saved Search Alerts

## Overview

The Subscribe & Save feature allows users to save their search criteria and receive automatic notifications when new listings match their preferences. This is perfect for estate sale professionals, collectors, and resellers who want to be the first to know about relevant items.

## Features Implemented (Phase 1)

### ✅ 1. Save Search Criteria
Users can save any combination of:
- **Keywords** - Search terms in title/description
- **Category** - Specific item categories
- **Condition** - New, Like New, Good, Fair
- **Price Range** - Min and max price
- **Location** - Geographic area
- **Distance** - Search radius (future enhancement)

### ✅ 2. Email Notifications
- **Instant Alerts** - Get notified immediately when matching items are posted
- **Daily Digest** - Receive a summary of matches once per day
- **Weekly Digest** - Get a weekly roundup of matching listings

### ✅ 3. Subscription Management
- View all saved searches in one place
- Edit search criteria anytime
- Toggle alerts on/off without deleting
- Delete searches you no longer need
- See when you were last notified

### ✅ 4. Smart Matching Algorithm
The system automatically:
- Checks new listings against all active saved searches
- Matches based on keywords, category, condition, price, and location
- Prevents duplicate notifications for the same listing
- Respects user notification preferences

---

## Technical Implementation

### Database Schema

**`saved_searches` table:**
```sql
CREATE TABLE saved_searches (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  
  -- Search criteria
  search_query TEXT,
  category TEXT,
  condition TEXT,
  price_min INTEGER,
  price_max INTEGER,
  location TEXT,
  distance INTEGER,
  
  -- Notification preferences
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  notification_frequency TEXT DEFAULT 'instant',
  
  -- Tracking
  is_active BOOLEAN DEFAULT true,
  last_notified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**`search_alert_notifications` table:**
```sql
CREATE TABLE search_alert_notifications (
  id SERIAL PRIMARY KEY,
  saved_search_id INTEGER REFERENCES saved_searches(id),
  listing_id VARCHAR NOT NULL,
  
  -- Notification status
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMP,
  sms_sent BOOLEAN DEFAULT false,
  sms_sent_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Backend API Endpoints

**GET `/api/saved-searches`**
- Get all saved searches for the current user
- Returns array of saved search objects

**GET `/api/saved-searches/:id`**
- Get a specific saved search
- Requires ownership verification

**POST `/api/saved-searches`**
- Create a new saved search
- Required: `name`
- Optional: all search criteria and notification preferences

**PUT `/api/saved-searches/:id`**
- Update an existing saved search
- Requires ownership verification

**DELETE `/api/saved-searches/:id`**
- Delete a saved search
- Requires ownership verification

**PATCH `/api/saved-searches/:id/toggle`**
- Toggle active/inactive status
- Quick way to pause/resume alerts

### Notification Service

**`processNewListingForNotifications(listing)`**
- Called automatically when a new listing is created
- Checks listing against all active saved searches
- Sends instant notifications if configured
- Records matches for daily/weekly digests

**Email Template Features:**
- Beautiful HTML email with listing image
- Clear call-to-action button to view listing
- Shows search criteria that matched
- Links to manage saved searches
- Unsubscribe option

---

## User Experience

### Creating a Saved Search

1. **From Browse/Search Page:**
   - User applies filters (category, price, etc.)
   - Clicks "Save This Search" button
   - Enters a name for the search
   - Chooses notification preferences
   - Clicks "Save Search"

2. **From Saved Searches Page:**
   - User clicks "New Alert" button
   - Fills in search criteria manually
   - Sets notification preferences
   - Clicks "Create Alert"

### Managing Saved Searches

**Saved Searches Page** (`/saved-searches`):
- Grid view of all saved searches
- Each card shows:
  - Search name
  - Active/inactive status
  - Search criteria summary
  - Notification settings
  - Last notified timestamp
- Actions:
  - Edit (pencil icon)
  - Toggle on/off (bell icon)
  - Delete (trash icon)

### Receiving Notifications

**Instant Alerts:**
- Email sent immediately when matching listing is posted
- Subject: "🔔 New Match: [Listing Title]"
- Includes listing image, price, description
- Direct link to view listing

**Daily/Weekly Digests:**
- Summary email with all matches from the period
- Up to 10 listings per digest
- Grouped by saved search name

---

## Use Cases

### 1. Antique Dealer
**Saved Search:** "Victorian Furniture Under $500"
- Keywords: "victorian, antique"
- Category: Furniture
- Price Max: $500
- Frequency: Instant

**Result:** Gets notified immediately when relevant items are posted, can be first to contact seller

### 2. Collector
**Saved Search:** "Vintage Vinyl Records"
- Keywords: "vinyl, record, LP"
- Category: Music
- Frequency: Daily

**Result:** Receives daily digest of all new vinyl records posted

### 3. Reseller
**Saved Search:** "Electronics Under $100"
- Category: Electronics
- Price Max: $100
- Condition: Good or better
- Frequency: Instant

**Result:** Finds underpriced electronics to resell for profit

### 4. Estate Sale Professional
**Saved Search:** "Bulk Liquidations"
- Keywords: "estate sale, liquidation, bulk"
- Frequency: Instant

**Result:** Gets alerted to large estate sales immediately

---

## Future Enhancements (Phase 2)

### Planned Features:
1. **SMS Notifications** - Text alerts for urgent matches
2. **In-App Notifications** - Real-time alerts in the app
3. **Seller Subscriptions** - Follow specific sellers
4. **Location Radius** - Search within X miles of a location
5. **Saved Search Analytics** - See how many items matched this week
6. **Smart Suggestions** - AI recommends searches based on browsing history
7. **Price Drop Alerts** - Get notified when saved items drop in price
8. **Batch Alerts** - Get notified when 20+ items match at once

---

## Testing

### Manual Testing Checklist:

**Create Saved Search:**
- ✅ Create search with all criteria
- ✅ Create search with only keywords
- ✅ Create search with only price range
- ✅ Verify search appears in list

**Edit Saved Search:**
- ✅ Update search name
- ✅ Change notification frequency
- ✅ Toggle email notifications
- ✅ Verify changes persist

**Delete Saved Search:**
- ✅ Delete a search
- ✅ Verify it's removed from list
- ✅ Verify no more notifications sent

**Notifications:**
- ✅ Create listing that matches saved search
- ✅ Verify instant email sent
- ✅ Check email formatting
- ✅ Click "View Listing" link
- ✅ Verify no duplicate emails

**Toggle Active Status:**
- ✅ Disable a saved search
- ✅ Create matching listing
- ✅ Verify no notification sent
- ✅ Re-enable search
- ✅ Create another matching listing
- ✅ Verify notification sent

---

## Deployment

### Environment Variables Required:
```
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@sellfast.now
```

### Database Migration:
Migration `006_saved_searches` will run automatically on deployment.

### Monitoring:
- Check server logs for notification processing
- Monitor email delivery rates via Resend dashboard
- Track saved search creation/deletion metrics

---

## Summary

The Subscribe & Save feature transforms SellFast.Now from a passive marketplace into an active alert system. Users no longer need to constantly check for new listings - they get notified automatically when items matching their interests are posted.

**Key Benefits:**
- ✅ **For Buyers:** Never miss relevant items
- ✅ **For Sellers:** Items reach interested buyers faster
- ✅ **For Platform:** Increased engagement and retention
- ✅ **For Estate Sale Pros:** Competitive advantage in finding inventory

**Status:** ✅ Phase 1 Complete and Ready for Production

