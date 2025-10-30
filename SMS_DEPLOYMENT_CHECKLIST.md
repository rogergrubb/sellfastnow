# SMS System Deployment Checklist

## Pre-Deployment Setup

### 1. Twilio Account Configuration

- [ ] **Create Twilio Account**
  - Sign up at https://www.twilio.com/
  - Verify email address
  - Complete account setup

- [ ] **Get Phone Number**
  - Navigate to Phone Numbers > Buy a Number
  - Select a US number with SMS capability
  - Cost: $1.15/month
  - Note the number in E.164 format (e.g., +15551234567)

- [ ] **Get API Credentials**
  - Go to Console Dashboard
  - Copy Account SID (starts with AC...)
  - Copy Auth Token (click "Show" to reveal)
  - Store securely (never commit to git)

- [ ] **Upgrade Account (Production Only)**
  - Add payment method
  - Remove trial restrictions
  - Enable auto-recharge (recommended)
  - Set up billing alerts

- [ ] **Configure Messaging Service (Optional)**
  - Better for high-volume sending
  - Improved deliverability
  - Advanced features (link shortening, etc.)

### 2. Environment Variables

Add to Railway/hosting platform:

```bash
# Required
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+15551234567

# Optional
NODE_ENV=production
```

**Railway Setup:**
1. Go to project settings
2. Click "Variables"
3. Add each variable
4. Deploy to apply changes

### 3. Database Verification

- [ ] **Check Schema**
  ```sql
  -- Verify SMS fields exist
  SELECT column_name, data_type 
  FROM information_schema.columns 
  WHERE table_name = 'users' 
  AND column_name IN ('phone_number', 'sms_weekly_updates', 'sms_monthly_updates', 'sms_credit_giveaways', 'sms_promotional');
  ```

- [ ] **Run Migrations**
  ```bash
  npm run db:push
  ```

- [ ] **Verify Tables**
  - `users` table has SMS preference columns
  - `saved_searches` table has `sms_notifications` column
  - `search_alert_notifications` table has `sms_sent` and `sms_sent_at` columns

### 4. Code Deployment

- [ ] **Build Project**
  ```bash
  npm run build
  ```

- [ ] **Check for Errors**
  - No TypeScript errors
  - No build warnings
  - All imports resolved

- [ ] **Deploy to Railway**
  ```bash
  git add .
  git commit -m "Add SMS notification system"
  git push origin main
  ```

- [ ] **Verify Deployment**
  - Check Railway logs for successful build
  - Check for "✅ Twilio configured" in logs
  - No startup errors

## Testing Phase

### 1. Basic Functionality Tests

- [ ] **Test SMS Settings Page**
  - Navigate to `/sms-settings`
  - Page loads without errors
  - Can enter phone number
  - Toggles work correctly
  - Save button functions

- [ ] **Test Saved Search Creation**
  - Navigate to `/saved-searches`
  - Create new search with SMS enabled
  - Verify saved in database
  - Check SMS toggle appears in list

- [ ] **Test SMS Delivery**
  - Create listing that matches saved search
  - Verify SMS received on phone
  - Check delivery tracking in database
  - Verify message format is correct

### 2. Campaign Tests

- [ ] **Test Weekly Campaign**
  ```bash
  curl -X POST https://your-domain.com/api/sms-campaigns/weekly \
    -H "Authorization: Bearer YOUR_TOKEN"
  ```
  - Verify SMS received
  - Check sent/failed counts
  - Monitor Twilio logs

- [ ] **Test Monthly Campaign**
  ```bash
  curl -X POST https://your-domain.com/api/sms-campaigns/monthly \
    -H "Authorization: Bearer YOUR_TOKEN"
  ```

- [ ] **Test Credit Giveaway**
  ```bash
  curl -X POST https://your-domain.com/api/sms-campaigns/giveaway \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"credits": 10}'
  ```
  - Verify SMS received
  - Check credits added to account

### 3. Error Handling Tests

- [ ] **Invalid Phone Number**
  - Try saving invalid phone format
  - Verify error message shown
  - System doesn't crash

- [ ] **Twilio Errors**
  - Test with unverified number (trial account)
  - Verify graceful error handling
  - Check error logged properly

- [ ] **Rate Limiting**
  - Send bulk campaign to 10+ users
  - Verify 1 second delay between messages
  - No rate limit errors

## Production Launch

### 1. Pre-Launch Checklist

- [ ] **Monitoring Setup**
  - Set up error alerting (Sentry, etc.)
  - Configure Twilio billing alerts
  - Set up uptime monitoring

- [ ] **Documentation**
  - Update user help docs
  - Create support team guide
  - Document opt-out process

- [ ] **Compliance**
  - Review TCPA compliance
  - Verify opt-in language
  - Test opt-out functionality

- [ ] **Cost Planning**
  - Estimate monthly SMS volume
  - Calculate expected costs
  - Set budget alerts in Twilio

### 2. Launch Day

- [ ] **Enable for Limited Users First**
  - Start with beta users or staff
  - Monitor for 24 hours
  - Check for issues

- [ ] **Monitor Closely**
  - Watch Twilio console
  - Check server logs every hour
  - Monitor error rates

- [ ] **Support Readiness**
  - Brief support team on SMS features
  - Prepare FAQ for common questions
  - Have escalation process ready

### 3. Gradual Rollout

- [ ] **Day 1: Beta Users (10-50 users)**
  - Enable SMS settings page
  - Monitor delivery rates
  - Collect feedback

- [ ] **Day 3: Early Adopters (100-500 users)**
  - Announce SMS feature in app
  - Send email about new feature
  - Monitor opt-in rates

- [ ] **Week 2: All Users**
  - Full public launch
  - Marketing announcement
  - Monitor costs and delivery

## Post-Launch Monitoring

### Daily Checks (First Week)

- [ ] **Delivery Rates**
  ```sql
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE sms_sent = true) as delivered,
    ROUND(100.0 * COUNT(*) FILTER (WHERE sms_sent = true) / COUNT(*), 2) as rate
  FROM search_alert_notifications
  WHERE created_at >= NOW() - INTERVAL '24 hours';
  ```

- [ ] **Twilio Console**
  - Check message logs
  - Review error codes
  - Monitor costs

- [ ] **User Feedback**
  - Check support tickets
  - Monitor social media
  - Review in-app feedback

### Weekly Checks

- [ ] **Opt-In Rates**
  ```sql
  SELECT 
    COUNT(*) FILTER (WHERE phone_number IS NOT NULL) as has_phone,
    COUNT(*) FILTER (WHERE sms_weekly_updates = true) as weekly_subs,
    COUNT(*) FILTER (WHERE sms_monthly_updates = true) as monthly_subs
  FROM users;
  ```

- [ ] **Cost Analysis**
  - Review Twilio billing
  - Compare to projections
  - Adjust budget if needed

- [ ] **Performance Metrics**
  - SMS delivery success rate
  - Average delivery time
  - User engagement (clicks)

### Monthly Reviews

- [ ] **Feature Usage**
  - How many users enabled SMS?
  - Which campaigns perform best?
  - What's the opt-out rate?

- [ ] **Cost Optimization**
  - Review message lengths (split messages cost more)
  - Optimize sending times
  - Consider message consolidation

- [ ] **User Satisfaction**
  - Survey SMS users
  - Analyze feedback
  - Plan improvements

## Troubleshooting

### Common Issues

**Issue: "Twilio not configured" in logs**
- **Solution**: Check environment variables are set correctly
- Verify variable names match exactly
- Restart server after adding variables

**Issue: SMS not received**
- **Solution**: 
  1. Check Twilio logs for delivery status
  2. Verify phone number format (E.164)
  3. Check user opted in to SMS
  4. For trial accounts, verify phone number in Twilio

**Issue: High costs**
- **Solution**:
  1. Review message lengths (keep under 160 chars)
  2. Check for duplicate sends
  3. Verify rate limiting is working
  4. Consider reducing campaign frequency

**Issue: Low opt-in rates**
- **Solution**:
  1. Make SMS benefits clearer
  2. Add onboarding flow for SMS
  3. Offer incentive for enabling SMS
  4. Test different messaging

## Rollback Plan

If critical issues arise:

### 1. Disable SMS Sending

```typescript
// In server/services/sms.ts
export async function sendSMS({ to, message }: SendSMSOptions): Promise<boolean> {
  // EMERGENCY DISABLE - uncomment to stop all SMS
  // console.log('SMS disabled - would send:', { to, message });
  // return false;
  
  // ... rest of code
}
```

### 2. Disable Campaign Routes

```typescript
// In server/routes.ts
// Comment out SMS campaign routes
// app.use("/api/sms-campaigns", smsCampaignsRoutes);
```

### 3. Hide UI Components

```typescript
// In client/src/App.tsx
// Comment out SMS settings route
// <Route path="/sms-settings" component={SmsSettings} />
```

### 4. Database Rollback (if needed)

```sql
-- Disable all SMS notifications
UPDATE users SET 
  sms_weekly_updates = false,
  sms_monthly_updates = false,
  sms_credit_giveaways = false,
  sms_promotional = false;

UPDATE saved_searches SET 
  sms_notifications = false;
```

## Success Criteria

### Week 1 Targets

- [ ] 95%+ SMS delivery success rate
- [ ] <5% opt-out rate
- [ ] Zero critical bugs
- [ ] Positive user feedback

### Month 1 Targets

- [ ] 20%+ of users with phone numbers
- [ ] 10%+ opted into at least one SMS category
- [ ] SMS costs within budget
- [ ] 4+ star average rating for feature

### Quarter 1 Targets

- [ ] 40%+ of users with phone numbers
- [ ] 25%+ opted into SMS notifications
- [ ] Positive ROI on SMS campaigns
- [ ] Feature expansion planned

## Next Steps After Launch

### Short Term (1-3 months)

- [ ] Add SMS analytics dashboard
- [ ] A/B test message formats
- [ ] Implement two-way SMS (reply handling)
- [ ] Add SMS for transaction updates

### Medium Term (3-6 months)

- [ ] SMS-based 2FA
- [ ] Personalized message timing
- [ ] Advanced segmentation
- [ ] SMS templates for sellers

### Long Term (6-12 months)

- [ ] AI-powered message optimization
- [ ] Multi-language SMS support
- [ ] International SMS expansion
- [ ] SMS chatbot integration

---

**Deployment Date**: _____________

**Deployed By**: _____________

**Sign-Off**: _____________

---

**Last Updated**: October 29, 2025
**Version**: 1.0.0

