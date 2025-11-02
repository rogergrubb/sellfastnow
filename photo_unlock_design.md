# Photo Unlock Pricing System Design

## Business Model

### Pricing Structure
- **1 Photo**: FREE (always included)
- **2-25 Photos**: $0.99 one-time fee per listing
- **AI Generation**: Separate credit system (unchanged)

### Revenue Streams
1. **Photo Unlock Fee**: $0.99 for multi-photo listings
2. **AI Generation Credits**: Existing pricing model
3. These are completely separate charges

## User Experience Flow

### Scenario 1: Single Photo Listing (FREE)
1. User uploads 1 photo
2. No payment required
3. Can proceed to publish immediately

### Scenario 2: Multi-Photo Listing (2-25 photos)
1. User uploads 2+ photos
2. System shows: "📸 Unlock 2-25 photos for just $0.99"
3. User clicks "Unlock Photos" button
4. Payment modal appears (Stripe integration)
5. After payment, all photos are unlocked
6. User can proceed to publish

### Scenario 3: Multi-Photo + AI Generation
1. User uploads multiple photos ($0.99 photo unlock)
2. User clicks "Auto-Generate with AI" (1 credit)
3. Two separate charges:
   - Photo unlock: $0.99 (one-time)
   - AI generation: 1 credit from balance

## Database Schema Changes

### New Table: `photo_unlocks`
```sql
CREATE TABLE photo_unlocks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  listing_id INTEGER REFERENCES listings(id),
  photo_count INTEGER NOT NULL,
  amount_cents INTEGER NOT NULL DEFAULT 99,
  stripe_payment_intent_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, failed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Update `listings` table
```sql
ALTER TABLE listings ADD COLUMN photo_unlock_paid BOOLEAN DEFAULT FALSE;
```

## API Endpoints

### POST `/api/photo-unlock/create-payment-intent`
**Request:**
```json
{
  "photoCount": 5,
  "listingId": 123 // optional, for draft listings
}
```

**Response:**
```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "photoUnlockId": 456,
  "amount": 99
}
```

### POST `/api/photo-unlock/confirm`
**Request:**
```json
{
  "photoUnlockId": 456,
  "paymentIntentId": "pi_xxx"
}
```

**Response:**
```json
{
  "success": true,
  "photoUnlock": {
    "id": 456,
    "status": "completed"
  }
}
```

### GET `/api/photo-unlock/status/:listingId`
**Response:**
```json
{
  "unlocked": true,
  "photoCount": 5,
  "paidAt": "2025-01-15T10:30:00Z"
}
```

## Frontend Components

### PhotoUnlockModal Component
- Shows pricing: "$0.99 for 2-25 photos"
- Stripe payment form
- Success/error states
- Integrates with existing Stripe setup

### PhotoUploadZone Updates
- Shows photo count
- Displays unlock status
- Shows "Unlock Photos" button when 2+ photos uploaded
- Prevents publishing until unlocked (if 2+ photos)

## Payment Flow

1. User uploads 2+ photos
2. Frontend calls `/api/photo-unlock/create-payment-intent`
3. Stripe PaymentIntent created ($0.99)
4. User enters payment details
5. Payment confirmed via Stripe
6. Frontend calls `/api/photo-unlock/confirm`
7. Backend updates `photo_unlocks` status to 'completed'
8. Listing marked as `photo_unlock_paid = true`
9. User can now publish listing

## Edge Cases

### Draft Listings
- Photo unlock tied to draft listing ID
- If user abandons draft, unlock remains valid for that draft
- Can reuse unlock if they return to edit

### Editing Published Listings
- If listing already has photo unlock, no additional charge
- Adding more photos (within 2-25 range) doesn't require new payment
- Changing from 1 photo to 2+ photos requires unlock payment

### Refunds
- No refunds for photo unlocks once listing is published
- Refund available if listing creation fails after payment

## UI/UX Messaging

### Before Upload
> "📸 Upload up to 25 photos. First photo is FREE, 2-25 photos just $0.99!"

### After Uploading 2+ Photos
> "🔒 You've uploaded 5 photos. Unlock all photos for $0.99 to publish your listing."

### Payment Modal
> **Unlock Photos for Your Listing**
> 
> • First photo: FREE ✓
> • Photos 2-25: $0.99 (one-time fee)
> • AI generation: Separate (uses credits)
> 
> Total: $0.99

### After Payment Success
> "✅ Photos unlocked! You can now publish your listing with all 5 photos."

## Analytics Tracking

### Metrics to Track
- Photo unlock conversion rate
- Average photos per listing
- Revenue from photo unlocks vs AI credits
- Abandonment rate at photo unlock step

### Events
- `photo_unlock_shown` - User sees unlock prompt
- `photo_unlock_initiated` - User clicks "Unlock Photos"
- `photo_unlock_completed` - Payment successful
- `photo_unlock_abandoned` - User closes modal without paying

## Implementation Priority

### Phase 1 (MVP)
1. Database schema
2. Backend API endpoints
3. Frontend payment modal
4. Basic unlock flow

### Phase 2 (Enhancements)
1. Analytics integration
2. Refund handling
3. Admin dashboard for photo unlock metrics
4. A/B testing different price points

## Testing Checklist

- [ ] Upload 1 photo - no payment required
- [ ] Upload 2 photos - payment required
- [ ] Upload 25 photos - payment required
- [ ] Payment success flow
- [ ] Payment failure handling
- [ ] Draft listing with photo unlock
- [ ] Edit published listing (no double charge)
- [ ] Stripe webhook handling
- [ ] Database constraints and validations
