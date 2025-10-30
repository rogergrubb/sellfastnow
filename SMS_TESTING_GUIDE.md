# SMS Testing Guide - SellFast.Now

## Quick Start Testing

### Prerequisites

1. **Twilio Account Setup**
   ```bash
   # Add to .env or Railway environment variables
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_PHONE_NUMBER=+15551234567
   ```

2. **Verify Twilio Configuration**
   - Start the server: `npm run dev`
   - Check logs for: `✅ Twilio configured` or `⚠️ Twilio not configured`

3. **Add Test Phone Number**
   - For Twilio trial accounts, add your phone number as a verified caller
   - Go to: Twilio Console > Phone Numbers > Verified Caller IDs

## Test Scenarios

### Test 1: User SMS Preferences

**Objective**: Verify users can update SMS marketing preferences

**Steps:**
1. Navigate to `/sms-settings`
2. Enter phone number: `+15551234567`
3. Enable "Weekly Updates" toggle
4. Enable "Credit Giveaways" toggle
5. Click "Save Preferences"

**Expected Result:**
- ✅ Success toast: "Preferences saved"
- ✅ Database updated with new preferences
- ✅ Green checkmark: "SMS notifications enabled"

**Verification:**
```sql
SELECT phone_number, sms_weekly_updates, sms_credit_giveaways 
FROM users 
WHERE id = 'your_user_id';
```

---

### Test 2: Create Saved Search with SMS

**Objective**: Verify users can enable SMS for saved searches

**Steps:**
1. Navigate to `/saved-searches`
2. Click "New Alert"
3. Fill in search criteria:
   - Name: "Test Search"
   - Keywords: "vintage camera"
   - Price Max: $200
4. Enable "SMS Notifications" toggle
5. Select frequency: "Instant"
6. Click "Save"

**Expected Result:**
- ✅ Success toast: "Alert created"
- ✅ Search appears in list with SMS icon
- ✅ Database record created with `sms_notifications=true`

**Verification:**
```sql
SELECT name, sms_notifications, notification_frequency 
FROM saved_searches 
WHERE user_id = 'your_user_id';
```

---

### Test 3: Saved Search SMS Delivery

**Objective**: Verify SMS sent when listing matches saved search

**Steps:**
1. Create saved search (from Test 2)
2. Navigate to `/post-ad`
3. Create listing that matches criteria:
   - Title: "Vintage Canon Camera"
   - Price: $150
   - Category: "Electronics"
4. Submit listing

**Expected Result:**
- ✅ Listing created successfully
- ✅ SMS sent to user's phone number
- ✅ SMS contains: listing title, price, and link
- ✅ Database record in `search_alert_notifications` with `sms_sent=true`

**SMS Message Format:**
```
🔔 New Match for "Test Search"!

Vintage Canon Camera
$150

View: https://sellfast.now/listings/123
```

**Verification:**
```sql
SELECT sms_sent, sms_sent_at, listing_id 
FROM search_alert_notifications 
WHERE saved_search_id = 1 
ORDER BY created_at DESC 
LIMIT 1;
```

**Server Logs:**
```
📱 Sending SMS to +15551234567
✅ SMS sent successfully: SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

### Test 4: Weekly Marketing Campaign

**Objective**: Verify bulk SMS campaign delivery

**Prerequisites:**
- At least one user with `sms_weekly_updates=true`
- User has valid phone number

**Steps:**
1. Use API or admin interface to trigger campaign:
   ```bash
   curl -X POST http://localhost:5000/api/sms-campaigns/weekly \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json"
   ```

**Expected Result:**
- ✅ API returns: `{ "success": true, "sent": 1, "failed": 0 }`
- ✅ SMS received on user's phone
- ✅ Server logs show successful delivery

**SMS Message Format:**
```
Hi John! 📊 Your SellFast.Now weekly update:

• Check out new listings this week
• Review your saved search matches
• See what's trending

Visit: https://sellfast.now
```

**Server Logs:**
```
📅 Starting weekly SMS update campaign...
Found 1 users subscribed to weekly updates
📱 Sending SMS to +15551234567
✅ SMS sent successfully: SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
✅ Weekly update campaign complete: 1 sent, 0 failed
```

---

### Test 5: Credit Giveaway Campaign

**Objective**: Verify credit giveaway SMS and database update

**Steps:**
1. Trigger giveaway campaign:
   ```bash
   curl -X POST http://localhost:5000/api/sms-campaigns/giveaway \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"credits": 10}'
   ```

**Expected Result:**
- ✅ SMS sent to all users with `sms_credit_giveaways=true`
- ✅ Credits added to user accounts
- ✅ API returns sent/failed counts

**SMS Message Format:**
```
🎉 Surprise, John!

You've received 10 FREE AI credits from SellFast.Now!

Use them to generate listings with AI-powered titles, descriptions, and valuations.

Start listing: https://sellfast.now/post-ad
```

**Verification:**
```sql
SELECT ai_credits_purchased 
FROM users 
WHERE sms_credit_giveaways = true;
```

---

### Test 6: Phone Number Validation

**Objective**: Verify phone number format validation

**Test Cases:**

| Input | Expected Result |
|-------|----------------|
| `5551234567` | ✅ Formatted to `+15551234567` |
| `(555) 123-4567` | ✅ Formatted to `+15551234567` |
| `+1 555-123-4567` | ✅ Formatted to `+15551234567` |
| `123` | ❌ Error: "Invalid phone number format" |
| `abcdefghij` | ❌ Error: "Invalid phone number format" |

**Steps:**
1. Navigate to `/sms-settings`
2. Try each test case in phone number field
3. Click "Save Preferences"

---

### Test 7: SMS Opt-Out Compliance

**Objective**: Verify users can disable SMS notifications

**Steps:**
1. Navigate to `/sms-settings`
2. Disable all SMS toggles
3. Click "Save Preferences"
4. Create new listing that matches saved search

**Expected Result:**
- ✅ Preferences saved
- ✅ No SMS sent (only email if enabled)
- ✅ Database shows `sms_notifications=false`

**Verification:**
```sql
SELECT sms_weekly_updates, sms_monthly_updates, sms_credit_giveaways, sms_promotional 
FROM users 
WHERE id = 'your_user_id';
-- All should be false
```

---

### Test 8: Rate Limiting

**Objective**: Verify bulk SMS respects rate limits

**Steps:**
1. Create 10 test users with `sms_weekly_updates=true`
2. Trigger weekly campaign
3. Monitor server logs for timing

**Expected Result:**
- ✅ Messages sent with ~1 second delay between each
- ✅ No Twilio rate limit errors (429)
- ✅ All messages delivered successfully

**Server Logs:**
```
📅 Starting weekly SMS update campaign...
Found 10 users subscribed to weekly updates
📱 Sending SMS to +15551234567
✅ SMS sent successfully: SMxxx...
[~1 second delay]
📱 Sending SMS to +15552345678
✅ SMS sent successfully: SMxxx...
[~1 second delay]
...
✅ Weekly update campaign complete: 10 sent, 0 failed
```

---

### Test 9: Error Handling

**Objective**: Verify graceful error handling for invalid phone numbers

**Steps:**
1. Manually update user phone to invalid format:
   ```sql
   UPDATE users SET phone_number = 'invalid' WHERE id = 'test_user_id';
   ```
2. Trigger SMS campaign or create matching listing

**Expected Result:**
- ✅ Server logs error: "Invalid phone number format: invalid"
- ✅ Campaign continues for other users
- ✅ Database shows `sms_sent=false` for failed delivery
- ✅ No application crash

**Server Logs:**
```
❌ Error sending SMS: Invalid phone number format
📊 Batch SMS complete: 9 sent, 1 failed
```

---

### Test 10: Twilio Not Configured

**Objective**: Verify system works without Twilio credentials

**Steps:**
1. Remove Twilio environment variables
2. Restart server
3. Try to create saved search with SMS enabled

**Expected Result:**
- ✅ Server logs: "⚠️ Twilio not configured - SMS features will be disabled"
- ✅ Application continues to work
- ✅ SMS toggles still visible but non-functional
- ✅ Email notifications still work
- ✅ No application crash

---

## Automated Testing

### Unit Tests

Create test file: `/server/services/__tests__/sms.test.ts`

```typescript
import { formatPhoneNumber, isValidPhoneNumber } from '../sms';

describe('SMS Service', () => {
  describe('formatPhoneNumber', () => {
    it('should format 10-digit US number', () => {
      expect(formatPhoneNumber('5551234567')).toBe('+15551234567');
    });
    
    it('should handle formatted numbers', () => {
      expect(formatPhoneNumber('(555) 123-4567')).toBe('+15551234567');
    });
    
    it('should return null for invalid numbers', () => {
      expect(formatPhoneNumber('123')).toBeNull();
    });
  });
  
  describe('isValidPhoneNumber', () => {
    it('should validate US phone numbers', () => {
      expect(isValidPhoneNumber('5551234567')).toBe(true);
      expect(isValidPhoneNumber('15551234567')).toBe(true);
      expect(isValidPhoneNumber('123')).toBe(false);
    });
  });
});
```

Run tests:
```bash
npm test
```

---

## Load Testing

### Bulk Campaign Test

Test bulk SMS delivery with realistic load:

```typescript
// Create 100 test users
for (let i = 0; i < 100; i++) {
  await db.insert(users).values({
    id: `test_user_${i}`,
    email: `test${i}@example.com`,
    phoneNumber: `+1555000${String(i).padStart(4, '0')}`,
    smsWeeklyUpdates: true,
  });
}

// Trigger campaign
const result = await sendWeeklyUpdates();

// Verify results
console.log(`Sent: ${result.sent}, Failed: ${result.failed}`);
// Expected: Sent: 100, Failed: 0
// Duration: ~100 seconds (1 msg/sec rate limit)
```

---

## Monitoring Checklist

### Pre-Deployment

- [ ] Twilio credentials configured
- [ ] Phone number verified in Twilio
- [ ] Database migrations run
- [ ] All test scenarios pass
- [ ] Error handling tested
- [ ] Rate limiting verified

### Post-Deployment

- [ ] Monitor Twilio console for delivery rates
- [ ] Check server logs for errors
- [ ] Verify database delivery tracking
- [ ] Monitor user opt-out rates
- [ ] Track SMS costs in Twilio billing

### Daily Monitoring

```sql
-- Daily SMS delivery stats
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_notifications,
  COUNT(*) FILTER (WHERE sms_sent = true) as sms_delivered,
  COUNT(*) FILTER (WHERE sms_sent = false) as sms_failed,
  ROUND(100.0 * COUNT(*) FILTER (WHERE sms_sent = true) / COUNT(*), 2) as success_rate
FROM search_alert_notifications
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## Troubleshooting Guide

### Issue: SMS Not Received

**Checklist:**
1. ✅ Twilio credentials configured?
2. ✅ Phone number in E.164 format?
3. ✅ User opted in to SMS?
4. ✅ Phone number verified (trial account)?
5. ✅ Check Twilio logs for delivery status
6. ✅ Check spam/blocked messages on phone

### Issue: High Failure Rate

**Possible Causes:**
- Invalid phone number formats in database
- Twilio trial account restrictions
- Phone numbers replied STOP (opt-out)
- Carrier filtering as spam

**Solution:**
```sql
-- Find invalid phone numbers
SELECT id, phone_number 
FROM users 
WHERE phone_number IS NOT NULL 
AND phone_number !~ '^\+?[1-9]\d{10,14}$';
```

### Issue: Rate Limit Errors

**Symptoms:**
- Twilio error code 429
- "Too Many Requests" errors

**Solution:**
- Increase delay between messages
- Upgrade Twilio account for higher limits
- Split campaigns into smaller batches

---

## Production Checklist

### Before Launch

- [ ] Upgrade Twilio account (remove trial restrictions)
- [ ] Set up billing alerts in Twilio
- [ ] Configure monitoring/alerting for failures
- [ ] Document opt-out process for support team
- [ ] Add SMS cost tracking to admin dashboard
- [ ] Test with real phone numbers (not just test numbers)
- [ ] Verify TCPA compliance
- [ ] Set up automated daily/weekly campaigns (cron jobs)

### Launch Day

- [ ] Monitor Twilio console for first hour
- [ ] Check server logs for errors
- [ ] Verify users receiving SMS
- [ ] Monitor opt-out rates
- [ ] Have support team ready for SMS questions

### Post-Launch

- [ ] Weekly review of delivery rates
- [ ] Monthly cost analysis
- [ ] User feedback collection
- [ ] A/B test message formats
- [ ] Optimize send times for engagement

---

**Last Updated**: October 29, 2025
**Version**: 1.0.0

