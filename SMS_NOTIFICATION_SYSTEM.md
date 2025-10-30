# SMS Notification System - SellFast.Now

## Overview

The SMS notification system provides real-time text message alerts to users for saved search matches and marketing campaigns. The system integrates with Twilio for SMS delivery and includes comprehensive opt-in/opt-out functionality for compliance.

## Features

### 1. Saved Search SMS Alerts

Users can receive instant SMS notifications when new listings match their saved search criteria.

**Key Features:**
- Toggle SMS notifications per saved search
- Requires phone verification before enabling
- Supports instant, daily, and weekly notification frequencies
- Tracks delivery status in database
- Includes listing title, price, and direct link

**User Flow:**
1. User creates a saved search at `/saved-searches`
2. Enables "SMS Notifications" toggle in the save search modal
3. When a new listing matches the criteria, SMS is sent via Twilio
4. Delivery is tracked in `search_alert_notifications` table

### 2. Marketing Campaign SMS

Admins can send bulk SMS campaigns to users who have opted in to marketing messages.

**Campaign Types:**
- **Weekly Updates**: Platform activity summary, new listings, saved search matches
- **Monthly Updates**: Monthly statistics, new features, success stories
- **Credit Giveaways**: Free AI credits promotional announcements
- **Promotional**: Custom marketing messages with optional CTA links

**User Opt-In Categories:**
- `smsWeeklyUpdates`: Weekly platform updates
- `smsMonthlyUpdates`: Monthly reports and stats
- `smsCreditGiveaways`: AI credit giveaway announcements
- `smsPromotional`: General promotional offers and announcements

## Architecture

### Database Schema

#### Users Table (SMS Fields)
```sql
-- Contact information
phoneNumber VARCHAR(20)
phoneVerified BOOLEAN DEFAULT false

-- Marketing preferences
smsWeeklyUpdates BOOLEAN DEFAULT false
smsMonthlyUpdates BOOLEAN DEFAULT false
smsCreditGiveaways BOOLEAN DEFAULT false
smsPromotional BOOLEAN DEFAULT false
smsOptInDate TIMESTAMP
```

#### Saved Searches Table
```sql
-- Notification preferences
emailNotifications BOOLEAN DEFAULT true
smsNotifications BOOLEAN DEFAULT false
notificationFrequency TEXT DEFAULT 'instant' -- instant, daily, weekly
```

#### Search Alert Notifications Table
```sql
-- Delivery tracking
emailSent BOOLEAN DEFAULT false
emailSentAt TIMESTAMP
smsSent BOOLEAN DEFAULT false
smsSentAt TIMESTAMP
```

### Backend Services

#### 1. SMS Service (`/server/services/sms.ts`)

Core Twilio integration for sending SMS messages.

**Key Functions:**
- `sendSMS({ to, message })`: Send single SMS
- `sendBatchSMS(recipients[])`: Send bulk SMS with rate limiting
- `sendSavedSearchSMS()`: Format and send saved search alert
- `sendWeeklyUpdateSMS()`: Format and send weekly update
- `sendMonthlyUpdateSMS()`: Format and send monthly update
- `sendCreditGiveawaySMS()`: Format and send credit giveaway
- `sendPromotionalSMS()`: Format and send promotional message
- `formatPhoneNumber()`: Convert to E.164 format
- `isValidPhoneNumber()`: Validate phone format

**Configuration:**
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

#### 2. SMS Campaigns Service (`/server/services/smsCampaigns.ts`)

Manages bulk SMS campaigns for marketing.

**Key Functions:**
- `sendWeeklyUpdates()`: Send to all users with `smsWeeklyUpdates=true`
- `sendMonthlyUpdates()`: Send to all users with `smsMonthlyUpdates=true`
- `sendCreditGiveaway(credits)`: Send to all users with `smsCreditGiveaways=true`
- `sendPromotionalCampaign(title, message, ctaUrl)`: Send to all users with `smsPromotional=true`

**Rate Limiting:**
- 1 message per second (safe for Twilio free tier)
- Configurable delay between messages
- Returns sent/failed counts

#### 3. Saved Search Notifications Service (`/server/services/savedSearchNotifications.ts`)

Processes new listings and sends notifications to matching saved searches.

**Key Functions:**
- `processNewListingForNotifications(listing)`: Check all saved searches for matches
- `listingMatchesSearch(listing, search)`: Match algorithm
- Sends both email and SMS if enabled
- Tracks delivery in `search_alert_notifications` table

**Integration Point:**
Called automatically when a new listing is created in `/server/routes.ts`:
```typescript
// After listing creation
await processNewListingForNotifications(newListing);
```

### API Endpoints

#### User Profile Updates
```
PATCH /api/auth/user
Body: {
  phoneNumber: string,
  smsWeeklyUpdates: boolean,
  smsMonthlyUpdates: boolean,
  smsCreditGiveaways: boolean,
  smsPromotional: boolean
}
```

#### Saved Search Management
```
POST /api/saved-searches
Body: {
  name: string,
  searchQuery: string,
  category: string,
  condition: string,
  priceMin: number,
  priceMax: number,
  location: string,
  distance: number,
  emailNotifications: boolean,
  smsNotifications: boolean,
  notificationFrequency: 'instant' | 'daily' | 'weekly'
}

PATCH /api/saved-searches/:id
Body: { smsNotifications: boolean, ... }
```

#### SMS Campaign Management (Admin)
```
POST /api/sms-campaigns/weekly
POST /api/sms-campaigns/monthly
POST /api/sms-campaigns/giveaway
Body: { credits: number }

POST /api/sms-campaigns/promotional
Body: {
  title: string,
  message: string,
  ctaUrl?: string
}
```

### Frontend Components

#### 1. SMS Settings Page (`/client/src/pages/SmsSettings.tsx`)

Dedicated page for managing SMS marketing preferences.

**Route:** `/sms-settings`

**Features:**
- Phone number input
- Toggle for each marketing category
- Save preferences button
- Privacy notice and opt-out instructions

#### 2. SMS Preferences Component (`/client/src/components/SmsPreferences.tsx`)

Reusable component for SMS preference management.

**Props:**
```typescript
interface SmsPreferencesProps {
  phoneNumber?: string;
  smsWeeklyUpdates?: boolean;
  smsMonthlyUpdates?: boolean;
  smsCreditGiveaways?: boolean;
  smsPromotional?: boolean;
  onUpdate: (preferences) => Promise<void>;
}
```

#### 3. Save Search Modal (`/client/src/components/SaveSearchModal.tsx`)

Includes SMS notification toggle for individual saved searches.

**Features:**
- Email/SMS notification toggles
- Frequency selector (instant/daily/weekly)
- Phone verification requirement
- Helpful error messages

## Setup Instructions

### 1. Twilio Account Setup

1. Sign up for Twilio account at https://www.twilio.com/
2. Get a phone number (free trial includes one number)
3. Copy Account SID, Auth Token, and Phone Number
4. Add to environment variables:

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+15551234567
```

### 2. Database Migration

The SMS fields are already included in the schema. If deploying to a new database, run migrations:

```bash
npm run db:push
```

### 3. Testing SMS Delivery

#### Test Saved Search SMS
1. Add phone number in settings
2. Verify phone number (if verification enabled)
3. Create a saved search with SMS enabled
4. Create a listing that matches the criteria
5. Check for SMS delivery

#### Test Marketing Campaign SMS
1. Enable marketing SMS preferences at `/sms-settings`
2. Use admin API to send test campaign:

```bash
curl -X POST http://localhost:5000/api/sms-campaigns/weekly \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### 4. Production Deployment

**Environment Variables:**
```env
# Required
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_production_auth_token
TWILIO_PHONE_NUMBER=+15551234567

# Optional
NODE_ENV=production
```

**Twilio Upgrade:**
- Free tier: 500 messages/month, trial watermark
- Pay-as-you-go: $0.0079/SMS (US), no watermark
- Verify production phone number with Twilio

## Compliance & Best Practices

### TCPA Compliance

The system is designed for TCPA compliance:

1. **Explicit Opt-In**: Users must actively enable SMS notifications
2. **Clear Purpose**: Each SMS category has clear description
3. **Easy Opt-Out**: Users can disable in settings or reply STOP
4. **Opt-Out Instructions**: Every SMS includes opt-out info
5. **Audit Trail**: All preferences tracked with timestamps

### Rate Limiting

- 1 message per second for bulk campaigns
- Twilio free tier: 1 msg/sec
- Twilio paid: Up to 100 msg/sec (configurable)

### Message Length

- SMS limit: 160 characters (single message)
- Messages over 160 chars are split (charged per segment)
- Current implementation keeps messages under 160 chars

### Privacy

- Phone numbers never shared with other users
- Stored securely in database
- Only used for opted-in notifications
- Can be deleted by user at any time

## Monitoring & Analytics

### Delivery Tracking

All SMS delivery is tracked in the database:

```sql
-- Check delivery stats
SELECT 
  COUNT(*) as total_sent,
  COUNT(*) FILTER (WHERE sms_sent = true) as successful,
  COUNT(*) FILTER (WHERE sms_sent = false) as failed
FROM search_alert_notifications
WHERE created_at >= NOW() - INTERVAL '7 days';
```

### Campaign Analytics

```sql
-- Marketing campaign opt-in rates
SELECT 
  COUNT(*) FILTER (WHERE sms_weekly_updates = true) as weekly_subscribers,
  COUNT(*) FILTER (WHERE sms_monthly_updates = true) as monthly_subscribers,
  COUNT(*) FILTER (WHERE sms_credit_giveaways = true) as giveaway_subscribers,
  COUNT(*) FILTER (WHERE sms_promotional = true) as promo_subscribers,
  COUNT(*) FILTER (WHERE phone_number IS NOT NULL) as has_phone,
  COUNT(*) FILTER (WHERE phone_verified = true) as verified_phone
FROM users;
```

### Twilio Console

Monitor in Twilio dashboard:
- Message delivery status
- Error rates
- Cost tracking
- Phone number usage

## Troubleshooting

### SMS Not Sending

1. **Check Twilio credentials**:
   ```bash
   echo $TWILIO_ACCOUNT_SID
   echo $TWILIO_AUTH_TOKEN
   echo $TWILIO_PHONE_NUMBER
   ```

2. **Check phone number format**:
   - Must be E.164 format: `+1234567890`
   - Use `formatPhoneNumber()` helper

3. **Check Twilio logs**:
   - Visit Twilio Console > Monitor > Logs
   - Look for error codes

4. **Check user preferences**:
   ```sql
   SELECT phone_number, phone_verified, sms_weekly_updates 
   FROM users WHERE id = 'user_id';
   ```

### Common Twilio Error Codes

- **21211**: Invalid phone number format
- **21608**: Phone number not verified (trial account)
- **21610**: Message blocked (user replied STOP)
- **30007**: Message filtered (spam)

### Testing Without Twilio

For development without Twilio credentials, the system will log messages instead of sending:

```
⚠️  Twilio not configured - SMS features will be disabled
   Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER
```

## Future Enhancements

### Planned Features

1. **SMS Templates**: Customizable message templates
2. **A/B Testing**: Test different message formats
3. **Scheduling**: Schedule campaigns for specific times
4. **Segmentation**: Target specific user groups
5. **Analytics Dashboard**: Visual campaign performance
6. **Two-Way SMS**: Handle incoming SMS responses
7. **Shortlinks**: Track click-through rates
8. **Unsubscribe Management**: Handle STOP/START keywords

### Integration Opportunities

1. **Stripe Integration**: Payment confirmation SMS
2. **Meetup Reminders**: SMS reminders for scheduled meetups
3. **Offer Notifications**: SMS when offer received/accepted
4. **Transaction Updates**: SMS for payment status changes
5. **Verification Codes**: SMS-based 2FA

## Cost Estimation

### Twilio Pricing (US)

- **SMS**: $0.0079 per message
- **Phone Number**: $1.15/month
- **Free Trial**: 500 messages (with trial watermark)

### Example Monthly Costs

**Scenario 1: Small Platform (1,000 users)**
- 500 saved search alerts/month: $3.95
- 2 marketing campaigns/month: $15.80
- Phone number: $1.15
- **Total: ~$21/month**

**Scenario 2: Medium Platform (10,000 users)**
- 5,000 saved search alerts/month: $39.50
- 4 marketing campaigns/month: $316.00
- Phone number: $1.15
- **Total: ~$357/month**

**Scenario 3: Large Platform (100,000 users)**
- 50,000 saved search alerts/month: $395.00
- 8 marketing campaigns/month: $6,320.00
- Phone number: $1.15
- **Total: ~$6,716/month**

## Support

For issues or questions:
- Check Twilio documentation: https://www.twilio.com/docs/sms
- Review server logs for error messages
- Test with Twilio Console's SMS testing tool
- Contact Twilio support for delivery issues

---

**Last Updated**: October 29, 2025
**Version**: 1.0.0
**Author**: SellFast.Now Development Team

