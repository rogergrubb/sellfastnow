# Trust System Integration Guide

This guide will help you integrate the Trust System Phase 1 into your Sell Fast marketplace.

## 📋 Prerequisites

Before starting, ensure you have:
- PostgreSQL database running
- Node.js backend with Prisma
- React frontend
- User authentication implemented

## 🔧 Installation Steps

### Step 1: Database Migration

1. **Run the trust system migration:**

```bash
# Navigate to your backend directory
cd backend

# Run the migration
psql -U your_username -d your_database_name -f prisma/migrations/trust_system_v1.sql
```

Or if using Prisma migrations:

```bash
# Copy the migration file
cp trust_system_v1.sql prisma/migrations/20241013000000_trust_system/migration.sql

# Run migration
npx prisma migrate deploy
```

2. **Verify tables were created:**

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'trust_%';
```

You should see:
- trust_scores
- trust_events
- trust_rules
- trust_verifications
- trust_milestones

### Step 2: Backend Setup

1. **Install dependencies:**

```bash
npm install @prisma/client
```

2. **Copy service file:**

Place `trustScoreService.ts` in your `src/services/` directory.

3. **Copy routes file:**

Place `trust.ts` in your `src/routes/` directory.

4. **Update your main app file** (e.g., `src/app.ts` or `src/index.ts`):

```typescript
import trustRoutes from './routes/trust';

// Add this with your other routes
app.use('/api/trust', trustRoutes);
```

5. **Create auth middleware** if you don't have one (referenced in routes):

```typescript
// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    (req as any).user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

### Step 3: Initialize Trust Scores for Existing Users

Run this script to initialize trust scores for all existing users:

```typescript
// scripts/initializeTrustScores.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function initializeTrustScores() {
  const users = await prisma.user.findMany({
    select: { id: true }
  });
  
  for (const user of users) {
    await prisma.$executeRaw`
      SELECT initialize_trust_score(${user.id})
    `;
  }
  
  console.log(`Initialized trust scores for ${users.length} users`);
}

initializeTrustScores()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

Run it:
```bash
npx ts-node scripts/initializeTrustScores.ts
```

### Step 4: Frontend Setup

1. **Copy the React component:**

Place `TrustScoreDisplay.tsx` in your `src/components/` directory.

2. **Install required dependencies:**

```bash
npm install lucide-react
```

3. **Use the component in your app:**

```tsx
import TrustScoreDisplay from '@/components/TrustScoreDisplay';

// On user profile page
<TrustScoreDisplay userId={profileUserId} variant="full" />

// On listing card
<TrustScoreDisplay userId={sellerId} variant="compact" />

// As a badge
<TrustScoreDisplay userId={userId} variant="badge" />
```

## 🔗 Integration Points

### When User Signs Up

```typescript
// In your signup handler
import { trustScoreService } from './services/trustScoreService';

async function handleUserSignup(userData) {
  // Create user
  const user = await prisma.user.create({
    data: userData
  });
  
  // Initialize trust score
  await trustScoreService.initializeUserTrust(user.id);
  
  return user;
}
```

### When User Verifies Email

```typescript
async function handleEmailVerification(userId: string) {
  // Mark email as verified in your user table
  await prisma.user.update({
    where: { id: userId },
    data: { emailVerified: new Date() }
  });
  
  // Update trust score
  await trustScoreService.updateVerification(userId, 'email', true);
}
```

### When Transaction Completes

```typescript
async function handleTransactionComplete(transaction) {
  const sellerId = transaction.sellerId;
  const amount = transaction.amount;
  
  // Update seller's trust score
  await trustScoreService.updateTransactionMetrics(
    sellerId,
    transaction.id,
    'completed',
    amount
  );
}
```

### When Review is Received

```typescript
async function handleReviewCreated(review) {
  const sellerId = review.reviewedUserId;
  
  // Update seller's trust score
  await trustScoreService.updateReviewMetrics(
    sellerId,
    review.id,
    review.rating
  );
}
```

### When Listing is Created/Sold

```typescript
async function handleListingCreated(listing) {
  await trustScoreService.updateListingMetrics(
    listing.userId,
    listing.id,
    'created'
  );
}

async function handleListingSold(listing) {
  await trustScoreService.updateListingMetrics(
    listing.userId,
    listing.id,
    'sold'
  );
}
```

### When User Responds to Message

```typescript
async function handleMessageResponse(message, responseTime) {
  const responderId = message.recipientId;
  
  // responseTime in minutes
  await trustScoreService.updateResponsivenessMetrics(
    responderId,
    responseTime,
    message.id
  );
}
```

## 🎯 Testing

### Test Trust Score API

```bash
# Get public trust score
curl http://localhost:3000/api/trust/{userId}

# Get own trust score (requires auth)
curl http://localhost:3000/api/trust/me \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get trust badges
curl http://localhost:3000/api/trust/{userId}/badges

# Get leaderboard
curl http://localhost:3000/api/trust/leaderboard?limit=10
```

### Test Trust Score Updates

```typescript
// Test email verification
await trustScoreService.updateVerification('user123', 'email', true);

// Test transaction
await trustScoreService.updateTransactionMetrics('user123', 'tx123', 'completed', 99.99);

// Test review
await trustScoreService.updateReviewMetrics('user123', 'review123', 5);

// Test listing
await trustScoreService.updateListingMetrics('user123', 'listing123', 'created');

// Check score
const score = await trustScoreService.getTrustScore('user123');
console.log(score);
```

## 🎨 Customization

### Modify Score Weights

To change how much each component affects the overall score, edit the `calculate_overall_trust_score` function in the SQL migration:

```sql
-- Current weights (total 1000 points):
v_overall := (
    (v_verification * 2.0) +      -- 200 points max (20%)
    (v_transaction * 3.0) +       -- 300 points max (30%)
    (v_reputation * 2.5) +        -- 250 points max (25%)
    (v_activity * 1.5) +          -- 150 points max (15%)
    (v_responsiveness * 1.0)      -- 100 points max (10%)
)::INT;
```

### Add Custom Trust Rules

```sql
INSERT INTO trust_rules (
  rule_name,
  rule_category,
  rule_type,
  score_impact,
  component_target,
  trigger_event,
  description
) VALUES (
  'my_custom_rule',
  'transaction',
  'bonus',
  25,
  'transaction',
  'custom_milestone',
  'Description of when this rule applies'
);
```

### Modify Score Levels

Edit the score level thresholds in the calculation function:

```sql
score_level = CASE
    WHEN v_overall >= 800 THEN 'elite'      -- Top 20%
    WHEN v_overall >= 600 THEN 'trusted'    -- Next 20%
    WHEN v_overall >= 400 THEN 'established' -- Next 20%
    WHEN v_overall >= 200 THEN 'building'   -- Next 20%
    ELSE 'new'                               -- Bottom 20%
END
```

## 📊 Monitoring

### View Trust Score Distribution

```sql
SELECT 
  score_level,
  COUNT(*) as user_count,
  AVG(overall_score) as avg_score
FROM trust_scores
GROUP BY score_level
ORDER BY avg_score DESC;
```

### Check Recent Trust Events

```sql
SELECT 
  te.event_type,
  te.event_category,
  te.score_delta,
  te.recorded_at,
  u.display_name
FROM trust_events te
JOIN users u ON te.user_id = u.id
ORDER BY te.recorded_at DESC
LIMIT 50;
```

### Find High Risk Users

```sql
SELECT 
  u.id,
  u.email,
  ts.overall_score,
  ts.risk_level,
  ts.flags_received,
  ts.disputed_transactions
FROM users u
JOIN trust_scores ts ON u.id = ts.user_id
WHERE ts.risk_level IN ('high', 'critical')
ORDER BY ts.flags_received DESC;
```

## 🚀 Performance Optimization

### Add Indexes

Already included in migration, but if needed:

```sql
CREATE INDEX CONCURRENTLY idx_trust_scores_level ON trust_scores(score_level);
CREATE INDEX CONCURRENTLY idx_trust_events_recorded ON trust_events(recorded_at DESC);
```

### Cache Trust Scores

```typescript
// Use Redis to cache frequently accessed scores
import Redis from 'ioredis';
const redis = new Redis();

async function getCachedTrustScore(userId: string) {
  // Check cache first
  const cached = await redis.get(`trust:${userId}`);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Get from database
  const score = await trustScoreService.getTrustScore(userId);
  
  // Cache for 5 minutes
  await redis.setex(`trust:${userId}`, 300, JSON.stringify(score));
  
  return score;
}
```

## 🔐 Security Considerations

1. **Rate limit trust API endpoints** to prevent abuse
2. **Validate user permissions** before showing detailed breakdowns
3. **Encrypt sensitive verification data** in trust_verifications table
4. **Audit log all trust score modifications** for transparency
5. **Implement fraud detection** for suspicious patterns

## 📝 Next Steps

After Phase 1 is working:

1. **Phase 2**: Advanced Analytics
   - Trust score trends over time
   - Comparative analytics
   - Predictive risk modeling

2. **Phase 3**: Automation
   - Automatic verification workflows
   - Smart escrow based on trust
   - Dynamic fee adjustments

3. **Phase 4**: Gamification
   - Achievement system
   - Trust challenges
   - Rewards program

## 🆘 Troubleshooting

### Trust scores not updating

Check if the trigger is enabled:
```sql
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'trust_event_recalculate';
```

### Component scores seem wrong

Manually recalculate:
```sql
SELECT calculate_overall_trust_score('user_id_here');
```

### Database connection issues

Ensure environment variables are set:
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/sellfast"
```

## 📞 Support

If you encounter issues:
1. Check the database logs
2. Verify all tables were created
3. Ensure foreign keys are valid
4. Test with a fresh user account
5. Review trust_events table for recorded activities

---

**Remember:** Trust scores take time to build. Start with verification bonuses to give users an immediate path to improvement.
