# 📋 Trust System Implementation Checklist

Use this checklist to ensure complete and correct implementation of the trust system.

## ✅ Phase 1: Database Setup

- [ ] **Download all files** from the outputs folder
- [ ] **Back up your database** before running any migrations
- [ ] **Test database connection**
  ```bash
  psql -U your_user -d your_db -c "SELECT 1"
  ```
- [ ] **Run migration script**
  ```bash
  psql -U your_user -d your_db -f prisma/migrations/trust_system_v1.sql
  ```
- [ ] **Verify tables created**
  ```sql
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name LIKE 'trust_%';
  ```
  Expected: trust_scores, trust_events, trust_rules, trust_verifications, trust_milestones
  
- [ ] **Verify functions created**
  ```sql
  SELECT routine_name FROM information_schema.routines 
  WHERE routine_schema = 'public' AND routine_name LIKE '%trust%';
  ```
  Expected: calculate_verification_score, calculate_transaction_score, etc.
  
- [ ] **Verify default rules inserted**
  ```sql
  SELECT COUNT(*) FROM trust_rules;
  ```
  Expected: 15+ default rules

## ✅ Phase 2: Backend Integration

- [ ] **Install dependencies**
  ```bash
  npm install @prisma/client
  ```
  
- [ ] **Copy service file**
  - [ ] Place `trustScoreService.ts` in `src/services/`
  
- [ ] **Copy routes file**
  - [ ] Place `trust.ts` in `src/routes/`
  
- [ ] **Create/verify auth middleware**
  - [ ] File exists at `src/middleware/auth.ts`
  - [ ] Middleware validates JWT tokens
  - [ ] Middleware attaches user to request
  
- [ ] **Register routes in main app**
  ```typescript
  import trustRoutes from './routes/trust';
  app.use('/api/trust', trustRoutes);
  ```
  
- [ ] **Generate Prisma client**
  ```bash
  npx prisma generate
  ```
  
- [ ] **Test API endpoints**
  ```bash
  # Start your server
  npm run dev
  
  # Test health check
  curl http://localhost:3000/api/trust/leaderboard
  ```

## ✅ Phase 3: Initialize Existing Users

- [ ] **Check user count**
  ```sql
  SELECT COUNT(*) FROM users;
  ```
  
- [ ] **Run initialization script**
  ```bash
  npx ts-node scripts/initializeTrustScores.ts
  ```
  Or manually:
  ```sql
  DO $$
  DECLARE user_record RECORD;
  BEGIN
    FOR user_record IN SELECT id FROM users LOOP
      PERFORM initialize_trust_score(user_record.id);
    END LOOP;
  END $$;
  ```
  
- [ ] **Verify initialization**
  ```sql
  SELECT COUNT(*) FROM trust_scores;
  -- Should match user count
  ```

## ✅ Phase 4: Frontend Integration

- [ ] **Install dependencies**
  ```bash
  npm install lucide-react
  ```
  
- [ ] **Copy React component**
  - [ ] Place `TrustScoreDisplay.tsx` in `src/components/`
  
- [ ] **Import component in your app**
  ```typescript
  import TrustScoreDisplay from '@/components/TrustScoreDisplay';
  ```
  
- [ ] **Add to user profile page**
  ```tsx
  <TrustScoreDisplay userId={userId} variant="full" />
  ```
  
- [ ] **Add to listing cards**
  ```tsx
  <TrustScoreDisplay userId={sellerId} variant="compact" />
  ```
  
- [ ] **Test component renders**
  - [ ] Profile page shows full trust display
  - [ ] Listing cards show compact view
  - [ ] Badges appear correctly

## ✅ Phase 5: Connect Trust Events

### User Sign Up
- [ ] **Call initialize on new user**
  ```typescript
  await trustScoreService.initializeUserTrust(userId);
  ```

### Email Verification
- [ ] **Update when email verified**
  ```typescript
  await trustScoreService.updateVerification(userId, 'email', true);
  ```

### Phone Verification
- [ ] **Update when phone verified**
  ```typescript
  await trustScoreService.updateVerification(userId, 'phone', true);
  ```

### ID Verification
- [ ] **Update when ID verified**
  ```typescript
  await trustScoreService.updateVerification(userId, 'id', true);
  ```

### Transaction Complete
- [ ] **Update on successful transaction**
  ```typescript
  await trustScoreService.updateTransactionMetrics(
    sellerId,
    transactionId,
    'completed',
    amount
  );
  ```

### Transaction Disputed
- [ ] **Update on dispute**
  ```typescript
  await trustScoreService.updateTransactionMetrics(
    sellerId,
    transactionId,
    'disputed'
  );
  ```

### Review Received
- [ ] **Update when review posted**
  ```typescript
  await trustScoreService.updateReviewMetrics(
    sellerId,
    reviewId,
    rating
  );
  ```

### Listing Created
- [ ] **Update when listing posted**
  ```typescript
  await trustScoreService.updateListingMetrics(
    userId,
    listingId,
    'created'
  );
  ```

### Listing Sold
- [ ] **Update when listing sells**
  ```typescript
  await trustScoreService.updateListingMetrics(
    userId,
    listingId,
    'sold'
  );
  ```

### Message Response
- [ ] **Track response time**
  ```typescript
  await trustScoreService.updateResponsivenessMetrics(
    responderId,
    responseTimeMinutes,
    messageId
  );
  ```

## ✅ Phase 6: Testing

- [ ] **Run test suite**
  ```bash
  npx ts-node tests/trustSystemTest.ts
  ```
  
- [ ] **All tests passing**
  - [ ] Trust score initialization
  - [ ] Verification updates
  - [ ] Transaction metrics
  - [ ] Review metrics
  - [ ] Listing metrics
  - [ ] Responsiveness metrics
  - [ ] Flag recording
  - [ ] Badge generation
  - [ ] Requirement checking
  - [ ] Score calculation

- [ ] **Manual testing**
  - [ ] Create new test user
  - [ ] Verify email
  - [ ] Create listing
  - [ ] Complete transaction
  - [ ] Leave review
  - [ ] Check score updates in real-time
  - [ ] View trust breakdown
  - [ ] Check badges appear

## ✅ Phase 7: Security & Permissions

- [ ] **Add rate limiting**
  ```typescript
  import rateLimit from 'express-rate-limit';
  
  const trustLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  });
  
  app.use('/api/trust', trustLimiter);
  ```

- [ ] **Verify auth middleware works**
  - [ ] Public endpoints accessible
  - [ ] Authenticated endpoints require token
  - [ ] Admin endpoints check admin role

- [ ] **Test error handling**
  - [ ] Invalid user ID
  - [ ] Missing required fields
  - [ ] Unauthorized access attempts

## ✅ Phase 8: Monitoring

- [ ] **Set up database monitoring**
  ```sql
  -- Check score distribution
  SELECT score_level, COUNT(*) 
  FROM trust_scores 
  GROUP BY score_level;
  ```

- [ ] **Monitor trust events**
  ```sql
  -- Recent activity
  SELECT event_type, COUNT(*) 
  FROM trust_events 
  WHERE recorded_at > NOW() - INTERVAL '24 hours'
  GROUP BY event_type;
  ```

- [ ] **Track high-risk users**
  ```sql
  -- Users needing attention
  SELECT u.email, ts.overall_score, ts.risk_level
  FROM users u
  JOIN trust_scores ts ON u.id = ts.user_id
  WHERE ts.risk_level IN ('high', 'critical');
  ```

## ✅ Phase 9: Performance Optimization

- [ ] **Add indexes if needed**
  ```sql
  CREATE INDEX CONCURRENTLY idx_trust_events_user_recorded 
  ON trust_events(user_id, recorded_at DESC);
  ```

- [ ] **Consider caching**
  - [ ] Add Redis for frequently accessed scores
  - [ ] Cache leaderboard results
  - [ ] Cache badge data

- [ ] **Monitor query performance**
  ```sql
  -- Check slow queries
  SELECT query, calls, total_time 
  FROM pg_stat_statements 
  WHERE query LIKE '%trust%'
  ORDER BY total_time DESC;
  ```

## ✅ Phase 10: Documentation

- [ ] **Document for your team**
  - [ ] How to integrate trust events
  - [ ] How to display trust scores
  - [ ] How to check requirements
  
- [ ] **Update user documentation**
  - [ ] Explain trust system to users
  - [ ] How to improve trust score
  - [ ] What each verification means
  
- [ ] **Create admin guide**
  - [ ] How to handle flags
  - [ ] How to investigate disputes
  - [ ] How to adjust rules

## ✅ Phase 11: Go Live

- [ ] **Final pre-launch checks**
  - [ ] All tests passing
  - [ ] All integrations working
  - [ ] UI displays correctly
  - [ ] Performance acceptable
  
- [ ] **Deploy to production**
  - [ ] Run migrations on production DB
  - [ ] Deploy backend code
  - [ ] Deploy frontend code
  - [ ] Verify all services running
  
- [ ] **Monitor after launch**
  - [ ] Watch error logs
  - [ ] Monitor score calculations
  - [ ] Check user feedback
  
- [ ] **Announce to users**
  - [ ] Blog post about trust system
  - [ ] Email to existing users
  - [ ] In-app notification

## 🎯 Success Metrics

After 1 week, check:
- [ ] All users have trust scores initialized
- [ ] Trust events being recorded correctly
- [ ] Scores updating in real-time
- [ ] No performance issues
- [ ] Users engaging with trust features

After 1 month, analyze:
- [ ] Trust score distribution
- [ ] Impact on transaction success rate
- [ ] User feedback on trust system
- [ ] Reduction in disputes
- [ ] Increase in verifications

## 🚨 Troubleshooting

If something goes wrong:

**Scores not updating:**
1. Check trust_events table for recorded events
2. Verify trigger is enabled
3. Check for PostgreSQL errors in logs
4. Manually recalculate: `SELECT calculate_overall_trust_score('user_id');`

**API errors:**
1. Check server logs
2. Verify database connection
3. Test with curl/Postman
4. Check auth middleware

**UI not showing:**
1. Check browser console for errors
2. Verify API calls succeeding
3. Check component props
4. Verify Lucide React installed

## 📞 Need Help?

1. Review the integration guide: `TRUST_SYSTEM_INTEGRATION.md`
2. Check architecture diagram: `ARCHITECTURE.md`
3. Run the test suite to isolate issues
4. Check database logs for errors

---

**Remember:** Take your time with each phase. Test thoroughly before moving to the next step.

**Estimated Time:** 4-6 hours for complete implementation

**You've got this! 🚀**
