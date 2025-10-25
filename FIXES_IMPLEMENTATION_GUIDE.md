# Stripe & Messaging System Fixes - Implementation Guide

This document provides step-by-step instructions for implementing the fixes identified in the audit.

---

## Files Created

1. **`server/config/stripe.config.ts`** - Centralized Stripe configuration
2. **`server/stripe.ts`** - Single Stripe client instance
3. **`server/utils/messageValidation.ts`** - Message validation utilities
4. **`server/middleware/rateLimiter.ts`** - Rate limiting middleware

---

## Implementation Steps

### Phase 1: Stripe System Improvements (High Priority)

#### Step 1: Update routes.ts to use centralized Stripe client

**Location**: `server/routes.ts`

**Changes needed**:

1. **Remove duplicate Stripe instantiation** (lines 1108-1112 and 1401-1405)
2. **Import the centralized Stripe client**

```typescript
// At the top of the file, add:
import { stripe } from "./stripe";
import { STRIPE_CONFIG, calculatePlatformFee, getBaseUrl } from "./config/stripe.config";

// Remove these blocks (lines 1108-1112 and 1401-1405):
// if (process.env.STRIPE_SECRET_KEY) {
//   const { Stripe } = await import("stripe");
//   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
//     apiVersion: "2025-09-30.clover",
//   });
```

3. **Update credit bundles reference** (line 1150)

```typescript
// Replace:
const CREDIT_BUNDLES: Record<number, { price: number; name: string }> = {
  25: { price: 2.99, name: "25 AI Credits" },
  // ...
};

// With:
const CREDIT_BUNDLES = STRIPE_CONFIG.CREDIT_BUNDLES;
```

4. **Update base URL logic** (line 1170)

```typescript
// Replace:
const baseUrl = process.env.NODE_ENV === 'production'
  ? 'https://sellfast.now'
  : 'http://localhost:5000';

// With:
const baseUrl = getBaseUrl();
```

5. **Update platform fee calculation** (line 1467)

```typescript
// Replace:
const platformFee = amount * 0.05;

// With:
const platformFee = calculatePlatformFee(amount);
```

#### Step 2: Add rate limiting to Stripe endpoints

**Location**: `server/routes.ts`

**Add imports**:
```typescript
import { 
  stripeAccountCreationLimiter,
  stripePaymentIntentLimiter,
  stripeCheckoutSessionLimiter,
} from "./middleware/rateLimiter";
```

**Apply rate limiters**:

```typescript
// Line 1115 - Add rate limiter to payment intent endpoint
app.post("/api/create-payment-intent", 
  isAuthenticated, 
  stripePaymentIntentLimiter,  // ADD THIS
  async (req, res) => {
    // ... existing code
  }
);

// Line 1140 - Add rate limiter to checkout session endpoint
app.post("/api/create-checkout-session", 
  isAuthenticated,
  stripeCheckoutSessionLimiter,  // ADD THIS
  async (req: any, res) => {
    // ... existing code
  }
);
```

#### Step 3: Add idempotency keys to Stripe API calls

**Location**: `server/routes.ts`

**For PaymentIntent creation** (line 1123):
```typescript
const paymentIntent = await stripe.paymentIntents.create({
  amount: Math.round(amount * 100),
  currency: "usd",
  description: description || "SellFast.Now payment",
  automatic_payment_methods: {
    enabled: true,
  },
}, {
  idempotencyKey: `payment_${userId}_${Date.now()}`,  // ADD THIS
});
```

**For Checkout Session creation** (line 1175):
```typescript
const session = await stripe.checkout.sessions.create({
  // ... existing config
}, {
  idempotencyKey: `checkout_${userId}_${credits}_${Date.now()}`,  // ADD THIS
});
```

#### Step 4: Update Stripe Connect routes

**Location**: `server/routes/stripe-connect.ts`

**Add imports**:
```typescript
import { stripe } from "../stripe";
import { stripeAccountCreationLimiter } from "../middleware/rateLimiter";
```

**Remove local Stripe import** (if any) and use the centralized client.

**Add rate limiter** (line 18):
```typescript
router.post("/create-account", 
  isAuthenticated,
  stripeAccountCreationLimiter,  // ADD THIS
  async (req: any, res) => {
    // ... existing code
  }
);
```

---

### Phase 2: Messaging System Improvements (High Priority)

#### Step 5: Add message validation

**Location**: `server/routes.ts`

**Add imports** (around line 2260):
```typescript
import { validateMessage } from "./utils/messageValidation";
import { messageSendLimiter } from "./middleware/rateLimiter";
```

**Update message sending endpoint** (line 2311):

```typescript
// Send a message
app.post("/api/messages", 
  isAuthenticated,
  messageSendLimiter,  // ADD THIS
  async (req: any, res) => {
    try {
      const senderId = req.auth.userId;
      const { listingId, receiverId, content } = req.body;
      
      console.log('📨 Sending message:', { senderId, listingId, receiverId, contentLength: content?.length });
      
      // ADD VALIDATION HERE
      const validation = await validateMessage(senderId, receiverId, listingId, content);
      if (!validation.valid) {
        console.error('❌ Message validation failed:', validation.error);
        return res.status(400).json({ message: validation.error });
      }
      
      const { messages, listings } = await import("@shared/schema");
      
      // Remove old validation (lines 2320-2330) as it's now handled by validateMessage
      
      console.log('✅ Message validated, creating message...');
      
      // Create message
      const newMessage = await db.insert(messages).values({
        listingId,
        senderId,
        receiverId,
        content: content.trim(),  // Trim whitespace
      }).returning();
      
      console.log('✅ Message created successfully:', newMessage[0].id);
      res.json(newMessage[0]);
    } catch (error: any) {
      console.error("❌ Error sending message:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        detail: error.detail,
        stack: error.stack?.split('\n').slice(0, 3).join('\n')
      });
      res.status(500).json({ 
        message: "Failed to send message",
        error: error.message,
        code: error.code
      });
    }
  }
);
```

#### Step 6: Add pagination to messages endpoint

**Location**: `server/routes.ts` (line 2265)

```typescript
// Get messages for current user (conversation threads)
app.get("/api/messages", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.auth.userId;
    
    // ADD PAGINATION
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;
    
    const { messages } = await import("@shared/schema");
    const { desc, or, count } = await import("drizzle-orm");
    
    // Get total count
    const [totalResult] = await db.select({ count: count() })
      .from(messages)
      .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)));
    
    const total = totalResult.count;
    
    // Get paginated messages
    const userMessages = await db.select()
      .from(messages)
      .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)))
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(offset);
    
    res.json({
      messages: userMessages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
});
```

---

### Phase 3: Testing & Validation

#### Step 7: Test Stripe improvements

**Manual tests**:
1. ✅ Purchase credits with each bundle size
2. ✅ Verify webhook receives and processes payment
3. ✅ Test rate limiting (try creating 6 accounts in 1 hour)
4. ✅ Verify idempotency (duplicate requests don't create duplicate charges)

**Test commands**:
```bash
# Test webhook locally with Stripe CLI
stripe listen --forward-to localhost:5000/api/stripe-webhook

# Trigger test webhook
stripe trigger checkout.session.completed
```

#### Step 8: Test messaging improvements

**Manual tests**:
1. ✅ Send valid message
2. ✅ Try sending empty message (should fail)
3. ✅ Try sending message > 5000 characters (should fail)
4. ✅ Try sending message to yourself (should fail)
5. ✅ Try sending 21 messages in 1 minute (should be rate limited)
6. ✅ Test pagination with page=1, page=2, etc.

---

### Phase 4: Deployment

#### Step 9: Update package.json (if needed)

Ensure `express-rate-limit` is installed:
```bash
npm install express-rate-limit
```

#### Step 10: Set environment variables

Ensure these are set in Railway:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `FRONTEND_URL` (e.g., https://sellfast.now)

#### Step 11: Deploy to Railway

```bash
# Commit changes
git add .
git commit -m "feat: improve Stripe and messaging systems with validation and rate limiting"

# Push to trigger deployment
git push origin main
```

#### Step 12: Monitor deployment

1. Check Railway logs for startup messages:
   - ✅ "Stripe client initialized successfully"
   - ❌ Any errors about missing environment variables

2. Test live endpoints after deployment

---

## Rollback Plan

If issues occur after deployment:

1. **Revert the commit**:
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Or rollback in Railway**:
   - Go to Railway dashboard
   - Click on the deployment
   - Click "Rollback" to previous version

---

## Additional Improvements (Optional - Future Phases)

### Conversation Grouping Endpoint

Add a new endpoint to group messages by conversation:

```typescript
app.get("/api/conversations", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.auth.userId;
    const { messages, users, listings } = await import("@shared/schema");
    
    // Get unique conversation partners with last message
    const conversations = await db
      .selectDistinct({
        otherUserId: sql<string>`CASE 
          WHEN ${messages.senderId} = ${userId} THEN ${messages.receiverId}
          ELSE ${messages.senderId}
        END`,
        listingId: messages.listingId,
        lastMessage: messages.content,
        lastMessageAt: messages.createdAt,
        isRead: messages.isRead,
      })
      .from(messages)
      .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)))
      .orderBy(desc(messages.createdAt));
    
    // Enrich with user and listing data
    // ... (implementation details)
    
    res.json(conversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ message: "Failed to fetch conversations" });
  }
});
```

### WebSocket Support for Real-time Messaging

This would require a more significant refactor and is recommended for a future phase.

---

## Summary of Changes

### Files Modified:
1. `server/routes.ts` - Main routes file
2. `server/routes/stripe-connect.ts` - Stripe Connect routes

### Files Created:
1. `server/config/stripe.config.ts` - Configuration
2. `server/stripe.ts` - Centralized Stripe client
3. `server/utils/messageValidation.ts` - Message validation
4. `server/middleware/rateLimiter.ts` - Rate limiting

### Key Improvements:
- ✅ Centralized Stripe configuration
- ✅ Single Stripe client instance (no duplication)
- ✅ Environment variable validation on startup
- ✅ Rate limiting on critical endpoints
- ✅ Idempotency keys for Stripe API calls
- ✅ Comprehensive message validation
- ✅ Pagination for messages
- ✅ Better error handling and logging

---

**Next Steps**: Follow the implementation steps in order, test thoroughly, and deploy with confidence! 🚀

