# 🛡️ Trust System Foundation - Phase 1

Complete trust scoring system for your Sell Fast marketplace. Build buyer and seller confidence with transparent, multi-factor trust scores.

## 📦 What's Included

### Database Layer
- **`prisma/migrations/trust_system_v1.sql`** - Complete database schema with:
  - 5 core tables (scores, events, rules, verifications, milestones)
  - PostgreSQL functions for score calculations
  - Automated triggers for real-time updates
  - Optimized indexes for performance
  - Default trust rules and scoring logic

### Backend Services
- **`src/services/trustScoreService.ts`** - Core TypeScript service with:
  - Score initialization and calculation
  - Verification management
  - Transaction tracking
  - Review aggregation
  - Listing metrics
  - Responsiveness tracking
  - Flag recording
  - Badge generation
  - Requirements checking

### API Routes
- **`src/routes/trust.ts`** - Express REST API with:
  - Public endpoints (view scores, badges, leaderboard)
  - Authenticated endpoints (detailed breakdown, recalculation)
  - Admin endpoints (flag users, bulk operations)
  - Full error handling and validation

### Frontend Components
- **`src/components/TrustScoreDisplay.tsx`** - React component with:
  - 3 display variants (full, compact, badge)
  - Real-time score display
  - Progress visualization
  - Badge showcase
  - Detailed breakdown view
  - Responsive design
  - Loading states

### Documentation & Tools
- **`docs/TRUST_SYSTEM_INTEGRATION.md`** - Complete integration guide
- **`tests/trustSystemTest.ts`** - Comprehensive test suite
- **`deploy-trust-system.sh`** - Automated deployment script

## 🎯 Key Features

### Multi-Factor Trust Scoring (0-1000 points)

| Component | Weight | Max Points | Includes |
|-----------|--------|------------|----------|
| **Verification** | 20% | 200 | Email, phone, ID, address, payment |
| **Transactions** | 30% | 300 | Success rate, volume, disputes |
| **Reputation** | 25% | 250 | Ratings, reviews, feedback |
| **Activity** | 15% | 150 | Listings, completion rate, age |
| **Responsiveness** | 10% | 100 | Response time, communication |

### Trust Levels
- 🆕 **New** (0-199) - Just getting started
- 🔨 **Building** (200-399) - Establishing credibility
- ✅ **Established** (400-599) - Proven track record
- ⭐ **Trusted** (600-799) - Highly reliable
- 👑 **Elite** (800-1000) - Top-tier seller

### Smart Features
- ⚡ Real-time score updates
- 🎖️ Dynamic badge system
- 📊 Detailed breakdowns
- 🚨 Risk level indicators
- 🔒 Requirement gates for features
- 📈 Leaderboard system
- 🎯 Achievement tracking

## 🚀 Quick Start

### 1. Download Files

Download all files from this package to your project:

```
your-project/
├── backend/
│   ├── prisma/migrations/trust_system_v1.sql
│   ├── src/
│   │   ├── services/trustScoreService.ts
│   │   └── routes/trust.ts
│   └── tests/trustSystemTest.ts
├── frontend/
│   └── src/components/TrustScoreDisplay.tsx
└── docs/TRUST_SYSTEM_INTEGRATION.md
```

### 2. Run Deployment Script

The easiest way to get started:

```bash
chmod +x deploy-trust-system.sh
./deploy-trust-system.sh
```

This interactive script will:
- Test database connection
- Run migrations
- Install dependencies
- Initialize trust scores for existing users
- Run test suite
- Provide next steps

### 3. Manual Setup (Alternative)

If you prefer manual installation:

```bash
# 1. Run database migration
psql -U your_user -d your_database -f prisma/migrations/trust_system_v1.sql

# 2. Install dependencies
npm install @prisma/client lucide-react

# 3. Generate Prisma client
npx prisma generate

# 4. Copy files to your project
# - trustScoreService.ts → src/services/
# - trust.ts → src/routes/
# - TrustScoreDisplay.tsx → src/components/

# 5. Add routes to your Express app
# In your app.ts or index.ts:
import trustRoutes from './routes/trust';
app.use('/api/trust', trustRoutes);
```

## 📖 Usage Examples

### Initialize Trust Score (New User)

```typescript
import { trustScoreService } from './services/trustScoreService';

// When user signs up
await trustScoreService.initializeUserTrust(userId);
```

### Update After Email Verification

```typescript
// When user verifies email
await trustScoreService.updateVerification(userId, 'email', true);
```

### Track Transaction

```typescript
// When transaction completes
await trustScoreService.updateTransactionMetrics(
  sellerId,
  transactionId,
  'completed',
  amount
);
```

### Record Review

```typescript
// When buyer leaves review
await trustScoreService.updateReviewMetrics(
  sellerId,
  reviewId,
  rating  // 1-5
);
```

### Display Trust Score

```tsx
import TrustScoreDisplay from '@/components/TrustScoreDisplay';

// Full display on profile page
<TrustScoreDisplay 
  userId={profileUserId} 
  variant="full" 
  showDetails={true} 
/>

// Compact display on listing card
<TrustScoreDisplay 
  userId={sellerId} 
  variant="compact" 
/>

// Badge only
<TrustScoreDisplay 
  userId={userId} 
  variant="badge" 
/>
```

### Check Requirements

```typescript
// Before allowing high-value transaction
const check = await trustScoreService.checkTrustRequirement(userId, {
  minScore: 500,
  maxRiskLevel: 'low',
  requiredVerifications: ['email', 'phone', 'id']
});

if (!check.allowed) {
  // Show requirements to user
  console.log(check.reasons);
}
```

## 🔌 API Endpoints

### Public Endpoints

```bash
GET /api/trust/:userId
# Get public trust score for any user

GET /api/trust/:userId/badges
# Get trust badges for a user

GET /api/trust/leaderboard?limit=50
# Get top trusted sellers
```

### Authenticated Endpoints

```bash
GET /api/trust/me
# Get detailed trust score for authenticated user

GET /api/trust/me/breakdown
# Get component breakdown

POST /api/trust/recalculate
# Manually trigger score recalculation

POST /api/trust/verify/:type
# Request verification
```

### Admin Endpoints

```bash
POST /api/trust/admin/flag
# Record a flag against a user

POST /api/trust/admin/recalculate-all
# Recalculate all scores (background job)
```

## 🧪 Testing

Run the comprehensive test suite:

```bash
npx ts-node tests/trustSystemTest.ts
```

Tests include:
- ✅ Trust score initialization
- ✅ Verification updates
- ✅ Transaction metrics
- ✅ Review metrics
- ✅ Listing metrics
- ✅ Responsiveness tracking
- ✅ Flag recording
- ✅ Badge generation
- ✅ Requirement checking
- ✅ Score calculation accuracy

## 📊 Database Schema

### Core Tables

**trust_scores** - Stores calculated trust metrics
- Overall score (0-1000)
- Component scores (verification, transaction, reputation, activity, responsiveness)
- Transaction metrics
- Review metrics
- Risk indicators

**trust_events** - Tracks all trust-affecting actions
- Event type and category
- Score delta
- Related entities
- Timestamps

**trust_rules** - Configuration for scoring
- Rule definitions
- Score impacts
- Trigger events
- Conditions

**trust_verifications** - Verification tracking
- Verification type
- Status
- Provider info
- Expiry dates

**trust_milestones** - Achievement tracking
- Milestone types
- Score bonuses
- Badge awards

## 🎨 Customization

### Modify Score Weights

Edit the calculation function in `trust_system_v1.sql`:

```sql
v_overall := (
    (v_verification * 2.0) +      -- 200 points (20%)
    (v_transaction * 3.0) +       -- 300 points (30%)
    (v_reputation * 2.5) +        -- 250 points (25%)
    (v_activity * 1.5) +          -- 150 points (15%)
    (v_responsiveness * 1.0)      -- 100 points (10%)
)::INT;
```

### Add Custom Rules

```sql
INSERT INTO trust_rules (
  rule_name, rule_category, rule_type,
  score_impact, component_target, trigger_event
) VALUES (
  'custom_achievement', 'activity', 'bonus',
  50, 'activity', 'custom_milestone'
);
```

### Adjust Trust Levels

```sql
score_level = CASE
    WHEN v_overall >= 800 THEN 'elite'
    WHEN v_overall >= 600 THEN 'trusted'
    WHEN v_overall >= 400 THEN 'established'
    WHEN v_overall >= 200 THEN 'building'
    ELSE 'new'
END
```

## 🔍 Monitoring

### Check Score Distribution

```sql
SELECT 
  score_level,
  COUNT(*) as users,
  AVG(overall_score) as avg_score
FROM trust_scores
GROUP BY score_level;
```

### View Recent Events

```sql
SELECT * FROM trust_events
ORDER BY recorded_at DESC
LIMIT 50;
```

### Find High-Risk Users

```sql
SELECT u.email, ts.overall_score, ts.risk_level
FROM users u
JOIN trust_scores ts ON u.id = ts.user_id
WHERE ts.risk_level IN ('high', 'critical');
```

## ⚡ Performance

- **Indexed queries** for fast lookups
- **Trigger-based updates** for real-time scoring
- **Cached calculations** to avoid redundant computation
- **Optimized for scale** - handles millions of users

**Recommended:** Add Redis caching for frequently accessed scores:

```typescript
const cached = await redis.get(`trust:${userId}`);
if (cached) return JSON.parse(cached);
```

## 🔐 Security

- ✅ Input validation on all endpoints
- ✅ Rate limiting on public APIs
- ✅ Permission checks on admin endpoints
- ✅ Encrypted sensitive verification data
- ✅ Audit logging for trust modifications
- ✅ SQL injection protection
- ✅ XSS protection in React component

## 🚦 Next Steps

After Phase 1 is working:

1. **Phase 2: Advanced Analytics**
   - Trust trends over time
   - Predictive risk modeling
   - Comparative analytics
   - Trust decay for inactivity

2. **Phase 3: Automation**
   - Automatic verification workflows
   - Smart escrow based on trust
   - Dynamic pricing/fees
   - Fraud detection

3. **Phase 4: Gamification**
   - Challenge system
   - Rewards program
   - Trust boost promotions
   - Referral bonuses

## 📞 Support

Issues? Check:
1. Database logs for errors
2. Trust_events table for recorded activities
3. Integration guide for common problems
4. Test suite output for failures

## 📄 License

Part of Sell Fast marketplace platform.

---

**Built with:**
- PostgreSQL for reliable data storage
- TypeScript for type safety
- React for beautiful UIs
- Express for robust APIs

**Ready to build trust in your marketplace! 🚀**
