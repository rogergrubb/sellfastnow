# SMS Notification Touchpoint Analysis

## User Journey Analysis

### 1. BUYER JOURNEY

#### A. Searching for Items
**Current State:**
- Search results page shows listings
- Users can save searches with email/SMS alerts ✅ (Already implemented)

**Additional SMS Opportunities:**
1. **Instant Search Alerts** - When user performs a search, offer to "Get SMS alerts for items like these"
2. **Price Drop Alerts** - SMS when favorited items drop in price
3. **Back in Stock** - SMS when similar items to sold-out favorites are listed

#### B. Viewing Item Details
**Current State:**
- Listing detail page shows item info
- Users can message seller
- Users can make offers

**SMS Opportunities:**
1. **Seller Response Alerts** - SMS when seller replies to message
2. **Offer Status Updates** - SMS when offer is accepted/rejected/countered
3. **Item Status Changes** - SMS if item is marked sold or price changes
4. **Similar Items Alert** - "Get SMS when similar items are posted"

#### C. Making Offers
**Current State:**
- Users can submit offers
- Notifications via in-app/email

**SMS Opportunities:**
1. **Offer Submitted Confirmation** - Immediate SMS confirmation
2. **Seller Response** - SMS when seller accepts/rejects/counters
3. **Counter Offer Alert** - SMS with counter offer details
4. **Offer Expiration Reminder** - SMS 1 hour before offer expires

#### D. Messaging Sellers
**Current State:**
- In-app messaging system
- Email notifications for new messages

**SMS Opportunities:**
1. **New Message Alert** - SMS when seller replies (opt-in per conversation)
2. **Unread Message Reminder** - SMS if message unread for 24 hours
3. **Meetup Confirmation** - SMS when meetup time/location confirmed

#### E. Completing Purchase
**Current State:**
- Payment processing
- Transaction tracking

**SMS Opportunities:**
1. **Payment Confirmation** - SMS receipt
2. **Meetup Reminder** - SMS 1 hour before scheduled meetup
3. **Transaction Complete** - SMS when transaction marked complete
4. **Review Request** - SMS asking for review after transaction

---

### 2. SELLER JOURNEY

#### A. Posting Items
**Current State:**
- Create listing form
- AI-assisted listing generation

**SMS Opportunities:**
1. **Listing Published** - SMS confirmation when listing goes live
2. **First View Alert** - SMS when listing gets first view
3. **Interest Alert** - SMS when someone favorites the listing
4. **Listing Performance** - SMS daily summary of views/favorites

#### B. Managing Listings
**Current State:**
- Dashboard shows active listings
- Edit/delete functionality

**SMS Opportunities:**
1. **Low Performance Alert** - SMS if listing has no views after 48 hours
2. **Suggested Price Adjustment** - SMS with pricing recommendations
3. **Boost Reminder** - SMS suggesting boost for slow-moving items
4. **Expiration Warning** - SMS before listing expires

#### C. Receiving Offers
**Current State:**
- Offers shown in dashboard
- Email notifications

**SMS Opportunities:**
1. **New Offer Alert** - Instant SMS when offer received
2. **Offer Expiration** - SMS reminder to respond before offer expires
3. **Multiple Offers** - SMS when multiple offers on same item
4. **Best Offer Alert** - SMS when highest offer received

#### D. Communicating with Buyers
**Current State:**
- In-app messaging
- Email notifications

**SMS Opportunities:**
1. **New Message from Buyer** - SMS for each new message
2. **Serious Buyer Alert** - SMS when buyer asks about meetup/payment
3. **Message Waiting** - SMS if buyer message unread for 2 hours

#### E. Completing Sales
**Current State:**
- Transaction tracking
- Payment processing

**SMS Opportunities:**
1. **Payment Received** - SMS when payment confirmed
2. **Meetup Reminder** - SMS before scheduled meetup
3. **Sale Complete** - SMS when transaction finalized
4. **Review Received** - SMS when buyer leaves review

---

### 3. TRANSACTION JOURNEY

#### A. Payment Process
**SMS Opportunities:**
1. **Payment Initiated** - SMS to both parties
2. **Payment Confirmed** - SMS receipt to buyer
3. **Funds Released** - SMS to seller when funds available
4. **Payment Failed** - SMS with retry instructions

#### B. Meetup Coordination
**SMS Opportunities:**
1. **Meetup Scheduled** - SMS confirmation to both parties
2. **Location Shared** - SMS with meetup location link
3. **1 Hour Reminder** - SMS to both parties
4. **Running Late** - SMS if party marks themselves late
5. **Meetup Complete** - SMS asking to confirm completion

#### C. Shipping (if applicable)
**SMS Opportunities:**
1. **Shipping Label Created** - SMS to seller
2. **Item Shipped** - SMS to buyer with tracking
3. **Out for Delivery** - SMS on delivery day
4. **Delivered** - SMS confirmation

---

### 4. ACCOUNT & SETTINGS

#### A. Account Verification
**Current State:**
- Email verification
- Phone verification available

**SMS Opportunities:**
1. **Verification Code** - SMS with 6-digit code
2. **Verification Success** - SMS confirmation
3. **Security Alert** - SMS for suspicious login attempts

#### B. Profile & Reputation
**SMS Opportunities:**
1. **New Review** - SMS when someone reviews you
2. **Reputation Milestone** - SMS when reaching 5/10/25/50 reviews
3. **Badge Earned** - SMS when earning new badges
4. **Profile View Spike** - SMS when profile views increase

#### C. Credits & Subscriptions
**SMS Opportunities:**
1. **Credits Running Low** - SMS when AI credits < 5
2. **Credit Purchase Confirmation** - SMS receipt
3. **Free Credits Awarded** - SMS for promotional credits
4. **Subscription Renewal** - SMS before auto-renewal

---

## Priority Implementation Matrix

### HIGH PRIORITY (Immediate Value)

| Touchpoint | User Type | Trigger | Implementation Complexity |
|------------|-----------|---------|--------------------------|
| New Offer Received | Seller | Offer submitted | Low - Add to offers route |
| Offer Response | Buyer | Offer accepted/rejected | Low - Add to offers route |
| New Message | Both | Message sent | Medium - Add to messages route |
| Payment Confirmation | Both | Payment complete | Low - Add to payment webhook |
| Meetup Reminder | Both | 1 hour before meetup | Medium - Requires cron job |
| Listing Published | Seller | Listing created | Low - Add to listing creation |

### MEDIUM PRIORITY (Nice to Have)

| Touchpoint | User Type | Trigger | Implementation Complexity |
|------------|-----------|---------|--------------------------|
| Price Drop Alert | Buyer | Favorited item price drops | Medium - Requires price monitoring |
| First View Alert | Seller | Listing first viewed | Low - Add view tracking |
| Interest Alert | Seller | Item favorited | Low - Add to favorites route |
| Review Received | Both | Review posted | Low - Add to review route |
| Security Alert | Both | Suspicious login | Medium - Requires security monitoring |
| Credits Low | Seller | Credits < 5 | Low - Check on credit use |

### LOW PRIORITY (Future Enhancement)

| Touchpoint | User Type | Trigger | Implementation Complexity |
|------------|-----------|---------|--------------------------|
| Similar Items Alert | Buyer | New listing matches preferences | High - Requires ML/matching |
| Performance Alert | Seller | Low views after 48h | Medium - Requires analytics |
| Boost Suggestion | Seller | Slow-moving item | Medium - Requires analytics |
| Running Late | Both | Party marks late | Medium - Requires meetup feature |
| Reputation Milestone | Both | Review count milestone | Low - Simple counter |

---

## Current Implementation Status

### ✅ Already Implemented
1. **Saved Search Alerts** - SMS when new listings match saved searches
2. **Marketing Campaigns** - Weekly/monthly updates, credit giveaways
3. **SMS Settings Page** - User preference management
4. **Phone Verification** - SMS verification codes

### 🔄 Partially Implemented
1. **Message Notifications** - Email exists, SMS needs to be added
2. **Transaction Updates** - Email exists, SMS needs to be added

### ❌ Not Yet Implemented
1. **Offer Notifications** - No SMS for offers
2. **Listing Notifications** - No SMS for listing events
3. **Meetup Reminders** - No SMS for meetup coordination
4. **Payment Confirmations** - No SMS for payment events
5. **Review Notifications** - No SMS for reviews
6. **Favorite/View Alerts** - No SMS for engagement events

---

## Recommended Implementation Plan

### Phase 1: Core Transaction SMS (Week 1)
Focus on high-value, time-sensitive notifications:

1. **Offers System**
   - New offer received (seller)
   - Offer accepted/rejected (buyer)
   - Counter offer made (both)

2. **Messages**
   - New message received
   - Opt-in per conversation

3. **Payments**
   - Payment confirmed
   - Payment failed

### Phase 2: Engagement SMS (Week 2)
Focus on keeping users engaged:

1. **Listing Events**
   - Listing published confirmation
   - First view/favorite alert
   - Item sold notification

2. **Reviews**
   - New review received
   - Review reminder after transaction

3. **Meetups**
   - Meetup scheduled
   - 1-hour reminder

### Phase 3: Advanced SMS (Week 3-4)
Focus on retention and optimization:

1. **Performance Alerts**
   - Low listing performance
   - Price drop suggestions
   - Boost recommendations

2. **Engagement Reminders**
   - Unread messages
   - Pending offers
   - Incomplete transactions

3. **Milestone Celebrations**
   - Reputation milestones
   - Badge achievements
   - Sales milestones

---

## Implementation Locations

### Files to Modify

1. **Offers Route** (`/server/routes/offers.ts`)
   - Add SMS on offer create
   - Add SMS on offer accept/reject
   - Add SMS on counter offer

2. **Messages Route** (`/server/routes/messages.ts` or `/server/routes/conversations.ts`)
   - Add SMS on new message
   - Add per-conversation SMS preference

3. **Listings Route** (`/server/routes/listings.ts`)
   - Add SMS on listing published
   - Add SMS on first view
   - Add SMS on item sold

4. **Payment Routes** (`/server/routes/payments.ts`, `/server/routes/stripe-connect.ts`)
   - Add SMS on payment confirmed
   - Add SMS on payment failed

5. **Reviews Route** (`/server/routes/reviews.ts`)
   - Add SMS on review received
   - Add SMS review reminder

6. **Favorites Route** (`/server/routes/favorites.ts`)
   - Add SMS to seller when item favorited

7. **Meetup Route** (`/server/routes/meetup.ts`)
   - Add SMS on meetup scheduled
   - Add SMS reminder (cron job)

### UI Components to Add

1. **Listing Detail Page** (`/client/src/pages/ListingDetail.tsx`)
   - "Get SMS alerts for similar items" button
   - "Notify me if price drops" toggle (for favorited items)

2. **Offer Modal/Component**
   - "Send me SMS when seller responds" checkbox

3. **Message Thread**
   - "Get SMS for new messages in this conversation" toggle

4. **Post Listing Success**
   - "Get SMS when someone views/favorites this item" checkboxes

5. **Settings Page** (`/client/src/pages/Settings.tsx`)
   - Expand SMS preferences section with new categories:
     - Offers & Transactions
     - Messages & Communication
     - Listing Performance
     - Reviews & Reputation

---

## User Preference Schema Extension

Add to `users` table:

```typescript
// Transaction notifications
smsOfferReceived: boolean
smsOfferResponse: boolean
smsPaymentConfirmed: boolean

// Message notifications
smsNewMessage: boolean
smsMessageReminder: boolean

// Listing notifications
smsListingPublished: boolean
smsListingEngagement: boolean // views, favorites
smsListingSold: boolean

// Review notifications
smsReviewReceived: boolean
smsReviewReminder: boolean

// Meetup notifications
smsMeetupScheduled: boolean
smsMeetupReminder: boolean
```

Add to `conversations` or `messages` table:

```typescript
// Per-conversation SMS preference
smsEnabled: boolean
```

---

## Next Steps

1. Review and approve priority matrix
2. Implement Phase 1 (Core Transaction SMS)
3. Test with real users
4. Gather feedback
5. Implement Phase 2 and 3 based on usage data


