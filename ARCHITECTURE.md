# Trust System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER INTERACTIONS                          │
├─────────────────────────────────────────────────────────────────────┤
│  Sign Up  │  Verify  │  Transact  │  Review  │  Message  │  List   │
└─────┬───────────┬──────────┬─────────┬─────────────┬────────────┬──┘
      │           │          │         │             │            │
      ▼           ▼          ▼         ▼             ▼            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         EVENT TRIGGERS                              │
├─────────────────────────────────────────────────────────────────────┤
│ Initialize │ Update   │ Update    │ Update   │  Update   │ Update  │
│   Trust    │ Verify   │Transaction│ Review   │ Response  │ Listing │
│            │ Status   │  Metrics  │ Metrics  │  Time     │ Metrics │
└─────┬───────────┬──────────┬─────────┬──────────────┬──────────┬──┘
      │           │          │         │              │          │
      ▼           ▼          ▼         ▼              ▼          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     TRUST SCORE SERVICE                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────┐     │
│  │              Record Trust Event                           │     │
│  │  • Log action to trust_events table                      │     │
│  │  • Include metadata and context                          │     │
│  └──────────────────┬───────────────────────────────────────┘     │
│                     │                                              │
│                     ▼                                              │
│  ┌──────────────────────────────────────────────────────────┐     │
│  │              Update Raw Metrics                           │     │
│  │  • Update trust_scores table                             │     │
│  │  • Increment counters                                    │     │
│  │  • Calculate averages                                    │     │
│  └──────────────────┬───────────────────────────────────────┘     │
│                     │                                              │
│                     ▼                                              │
│  ┌──────────────────────────────────────────────────────────┐     │
│  │          Calculate Component Scores                       │     │
│  │  • Verification Score (0-100)                            │     │
│  │  • Transaction Score (0-100)                             │     │
│  │  • Reputation Score (0-100)                              │     │
│  │  • Activity Score (0-100)                                │     │
│  │  • Responsiveness Score (0-100)                          │     │
│  └──────────────────┬───────────────────────────────────────┘     │
│                     │                                              │
│                     ▼                                              │
│  ┌──────────────────────────────────────────────────────────┐     │
│  │          Calculate Overall Score                          │     │
│  │  • Weighted average of components                        │     │
│  │  • Verification (20%) = 200 max                          │     │
│  │  • Transaction (30%) = 300 max                           │     │
│  │  • Reputation (25%) = 250 max                            │     │
│  │  • Activity (15%) = 150 max                              │     │
│  │  • Responsiveness (10%) = 100 max                        │     │
│  │  • Total = 1000 points                                   │     │
│  └──────────────────┬───────────────────────────────────────┘     │
│                     │                                              │
│                     ▼                                              │
│  ┌──────────────────────────────────────────────────────────┐     │
│  │          Determine Trust Level & Risk                     │     │
│  │  • New (0-199)                                           │     │
│  │  • Building (200-399)                                    │     │
│  │  • Established (400-599)                                 │     │
│  │  • Trusted (600-799)                                     │     │
│  │  • Elite (800-1000)                                      │     │
│  │                                                           │     │
│  │  • Risk: Low / Medium / High / Critical                  │     │
│  └──────────────────┬───────────────────────────────────────┘     │
│                     │                                              │
│                     ▼                                              │
│  ┌──────────────────────────────────────────────────────────┐     │
│  │          Generate Badges                                  │     │
│  │  • Trust level badges                                    │     │
│  │  • Verification badges                                   │     │
│  │  • Achievement badges                                    │     │
│  │  • Special recognition                                   │     │
│  └──────────────────────────────────────────────────────────┘     │
│                                                                     │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         DATABASE LAYER                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │trust_scores  │  │trust_events  │  │ trust_rules  │            │
│  │              │  │              │  │              │            │
│  │• user_id     │  │• user_id     │  │• rule_name   │            │
│  │• overall     │  │• event_type  │  │• category    │            │
│  │• components  │  │• score_delta │  │• trigger     │            │
│  │• metrics     │  │• metadata    │  │• impact      │            │
│  └──────────────┘  └──────────────┘  └──────────────┘            │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐                               │
│  │trust_        │  │trust_        │                               │
│  │verifications │  │milestones    │                               │
│  │              │  │              │                               │
│  │• user_id     │  │• user_id     │                               │
│  │• type        │  │• milestone   │                               │
│  │• status      │  │• bonus       │                               │
│  │• verified_at │  │• badge       │                               │
│  └──────────────┘  └──────────────┘                               │
│                                                                     │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                            API LAYER                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  PUBLIC ENDPOINTS                                                   │
│  ├─ GET /api/trust/:userId          → Get public score             │
│  ├─ GET /api/trust/:userId/badges   → Get user badges              │
│  └─ GET /api/trust/leaderboard      → Get top sellers              │
│                                                                     │
│  AUTHENTICATED ENDPOINTS                                            │
│  ├─ GET /api/trust/me               → Get detailed score           │
│  ├─ GET /api/trust/me/breakdown     → Get score breakdown          │
│  ├─ POST /api/trust/recalculate     → Recalculate score            │
│  └─ POST /api/trust/verify/:type    → Request verification         │
│                                                                     │
│  ADMIN ENDPOINTS                                                    │
│  ├─ POST /api/trust/admin/flag      → Flag user                    │
│  └─ POST /api/trust/admin/recalc-all → Bulk recalculation          │
│                                                                     │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND DISPLAY                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌────────────────────────────────────────────────────────┐        │
│  │              TrustScoreDisplay Component               │        │
│  │                                                         │        │
│  │  Variant: FULL                                         │        │
│  │  ┌─────────────────────────────────────────────────┐   │        │
│  │  │  Trust Score              🛡️            847     │   │        │
│  │  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 84.7%   │   │        │
│  │  │                                                  │   │        │
│  │  │  Elite Seller                                   │   │        │
│  │  │                                                  │   │        │
│  │  │  📊 Transactions: 45/48    ⭐ Rating: 4.9 (42)  │   │        │
│  │  │                                                  │   │        │
│  │  │  ✅ Verifications                               │   │        │
│  │  │  • Email ✓  • Phone ✓  • ID ✓                  │   │        │
│  │  │                                                  │   │        │
│  │  │  🎖️ Badges                                      │   │        │
│  │  │  👑 Elite  🛡️ Verified  💪 Power Seller         │   │        │
│  │  │                                                  │   │        │
│  │  │  📈 Show Detailed Breakdown                     │   │        │
│  │  └─────────────────────────────────────────────────┘   │        │
│  │                                                         │        │
│  │  Variant: COMPACT                                      │        │
│  │  ┌────────────────────────────────┐                    │        │
│  │  │ 🛡️ Trust Score        847/1000 │                    │        │
│  │  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │                    │        │
│  │  │ Elite     45 transactions     │                    │        │
│  │  └────────────────────────────────┘                    │        │
│  │                                                         │        │
│  │  Variant: BADGE                                        │        │
│  │  ┌────────────────┐                                    │        │
│  │  │ 🛡️ Elite  847 │                                    │        │
│  │  └────────────────┘                                    │        │
│  │                                                         │        │
│  └────────────────────────────────────────────────────────┘        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Score Calculation Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                    COMPONENT CALCULATIONS                        │
└──────────────────────────────────────────────────────────────────┘

VERIFICATION SCORE (0-100)
├─ Email Verified     → +20 points
├─ Phone Verified     → +20 points
├─ ID Verified        → +30 points
├─ Address Verified   → +15 points
└─ Payment Verified   → +15 points
                        ─────────
                        100 total

TRANSACTION SCORE (0-100)
├─ Success Rate       → 0-60 points (based on %)
├─ Volume Bonus       → 0-30 points (# transactions)
└─ Dispute Penalty    → -10 per dispute
                        ─────────
                        100 max

REPUTATION SCORE (0-100)
├─ Average Rating     → 0-70 points (5.0 = 70)
└─ Review Volume      → 0-30 points (# reviews)
                        ─────────
                        100 total

ACTIVITY SCORE (0-100)
├─ Completion Rate    → 0-50 points
├─ Account Age        → 0-30 points (days/10)
└─ Listing Volume     → 0-20 points
                        ─────────
                        100 total

RESPONSIVENESS SCORE (0-100)
├─ Response Rate      → 0-60 points
└─ Response Time      → 0-40 points
                        • <5 min   = 40
                        • <15 min  = 30
                        • <1 hour  = 20
                        • <4 hours = 10
                        ─────────
                        100 total

┌──────────────────────────────────────────────────────────────────┐
│                      OVERALL CALCULATION                         │
└──────────────────────────────────────────────────────────────────┘

Overall Score = 
  (Verification × 2.0)      → 200 points max (20%)
+ (Transaction × 3.0)       → 300 points max (30%)
+ (Reputation × 2.5)        → 250 points max (25%)
+ (Activity × 1.5)          → 150 points max (15%)
+ (Responsiveness × 1.0)    → 100 points max (10%)
  ────────────────────────────
  = 1000 points total
```

## Event Flow Example

```
USER ACTION: Email Verification
        │
        ▼
┌─────────────────────────┐
│  trustScoreService      │
│  .updateVerification()  │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ 1. Update trust_scores table        │
│    SET email_verified = true        │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ 2. Record trust_events              │
│    INSERT event_type='email_verify' │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ 3. Trigger: trust_event_recalculate │
│    CALLS calculate_overall_score()  │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ 4. Calculate verification_score     │
│    email(20) → 20 points            │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ 5. Calculate overall_score          │
│    (20 × 2.0) = 40 points           │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ 6. Update score_level               │
│    40 points → 'new' level          │
└──────────┬──────────────────────────┘
           │
           ▼
        COMPLETE
```

## Integration Points

```
YOUR APPLICATION              TRUST SYSTEM
─────────────────────────────────────────────

Sign Up                  →    Initialize Trust
    │                             Score
    └─ Create User           
    └─ Send Welcome          

Email Verified           →    Update Verification
    │                             Status (+20)
    └─ Mark Verified         
                             
Transaction Complete     →    Update Transaction
    │                             Metrics
    └─ Process Payment       
    └─ Update Listing        
                             
Review Received          →    Update Reputation
    │                             Metrics
    └─ Save Review           
    └─ Notify Seller         
                             
Message Sent             →    Update Responsiveness
    │                             Metrics
    └─ Store Message         
    └─ Send Notification     
                             
Listing Created          →    Update Activity
    │                             Metrics
    └─ Save Listing          
    └─ Publish               
                             
Listing Sold             →    Update Activity &
    │                             Transaction
    └─ Mark Sold             
    └─ Process Payment       

Display Profile          →    Show Trust Score
    │                             Component
    └─ Render UI             
```

## Database Relationships

```
┌──────────┐         ┌──────────────┐
│  users   │─────────│ trust_scores │
└──────────┘   1:1   └──────┬───────┘
                            │ 1:N
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │trust_events  │ │trust_        │ │trust_        │
    │              │ │verifications │ │milestones    │
    └──────────────┘ └──────────────┘ └──────────────┘

┌──────────────┐
│ trust_rules  │  ← Configuration (no FK)
└──────────────┘
```

---

This architecture provides:
- ✅ Real-time updates
- ✅ Transparent calculations
- ✅ Fraud prevention
- ✅ User trust building
- ✅ Scalable design
- ✅ Flexible customization
