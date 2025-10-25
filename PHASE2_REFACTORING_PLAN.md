# Phase 2: Routes Refactoring - Progress & Plan

## ✅ Completed Modules

### 1. Location Routes (`server/routes/location.ts`)
- **Lines extracted:** 48
- **Endpoints:** 2
  - `GET /api/location/detect` - Auto-detect location from IP
  - `PUT /api/user/location` - Update user location

### 2. Favorites Routes (`server/routes/favorites.ts`)
- **Lines extracted:** 107
- **Endpoints:** 3
  - `GET /api/favorites/:listingId` - Check favorite status
  - `POST /api/favorites/toggle` - Toggle favorite
  - `GET /api/favorites` - Get all favorites

### 3. AI Routes (`server/routes/ai.ts`)
- **Lines extracted:** 418
- **Endpoints:** 10
  - `GET /api/ai/usage` - Get AI usage info
  - `POST /api/ai/analyze-photo` - Analyze photo
  - `POST /api/ai/analyze-description` - Analyze description
  - `POST /api/ai/analyze-pricing` - Pricing recommendations
  - `POST /api/ai/analyze-image` - Image recognition
  - `POST /api/ai/analyze-item` - Sequential item analysis
  - `POST /api/ai/analyze-multiple-images` - Multi-image analysis
  - `POST /api/ai/analyze-bulk-images` - Bulk analysis with parallel processing
  - `POST /api/ai/generate-bundle-summary` - Bundle summary
  - `POST /api/ai/identify-product` - Single product identification

## 📊 Progress Summary

- **Original size:** 2,621 lines
- **Current size:** 2,068 lines
- **Reduction:** 553 lines (21%)
- **Modules created:** 3
- **Total endpoints extracted:** 15

---

## 🎯 Remaining Modules to Extract

### 4. Listings Routes (Priority: HIGH)
**Estimated lines:** ~320
**Location in routes.ts:** Lines 1520-1840
**Endpoints to extract:** 12

```
GET    /api/listings                    - Get all listings
GET    /api/listings/search             - Search with filters
GET    /api/listings/mine               - Get user's own listings
GET    /api/listings/stats              - Get dashboard stats
GET    /api/listings/:id                - Get single listing
GET    /api/user/listings               - Get user listings (dashboard)
GET    /api/users/:userId/listings      - Get public user listings
POST   /api/listings                    - Create listing
DELETE /api/listings/:id                - Delete listing
PUT    /api/listings/:id                - Update listing
PUT    /api/listings/:id/status         - Update listing status
POST   /api/listings/batch              - Batch create listings
```

**Implementation:**
```typescript
// server/routes/listings.ts
import { Router } from "express";
import { isAuthenticated } from "../supabaseAuth";
import { storage } from "../storage";

const router = Router();

// Extract all 12 endpoints here
// Convert app.get/post/put/delete to router.get/post/put/delete
// Remove "/api/listings" prefix from paths

export default router;
```

**Register in routes.ts:**
```typescript
import listingsRoutes from "./routes/listings";
app.use("/api/listings", listingsRoutes);
app.use("/api/user/listings", listingsRoutes); // For /user/listings endpoint
app.use("/api/users", listingsRoutes); // For /users/:userId/listings endpoint
```

---

### 5. Images/Upload Routes (Priority: HIGH)
**Estimated lines:** ~150
**Location in routes.ts:** Lines 460-610
**Endpoints to extract:** 5

```
POST   /api/images/upload                    - Single image upload
POST   /api/images/upload-multiple           - Multiple image upload
POST   /api/upload-session/create            - Create upload session
POST   /api/upload-session/:id/upload        - Upload to session
GET    /api/upload-session/:id/images        - Get session images
DELETE /api/upload-session/:id               - Delete session
```

**Dependencies:**
- `upload` middleware from cloudinary
- `storage` service

---

### 6. Payments/Credits Routes (Priority: MEDIUM)
**Estimated lines:** ~400
**Location in routes.ts:** Lines 1090-1490
**Endpoints to extract:** 11

```
POST   /api/create-payment-intent            - Create payment intent
POST   /api/create-checkout-session          - Create checkout session
GET    /api/payment-status/:paymentIntentId  - Get payment status
POST   /api/stripe-webhook                   - Stripe webhook handler
POST   /api/confirm-ai-credit-purchase       - Confirm credit purchase
POST   /api/verify-checkout-session          - Verify checkout
POST   /api/deposits/submit                  - Submit deposit
POST   /api/deposits/:id/accept              - Accept deposit
POST   /api/deposits/:id/reject              - Reject deposit
POST   /api/transactions/:id/complete        - Complete transaction
POST   /api/transactions/:id/refund          - Refund transaction
GET    /api/user/credits                     - Get user credits
GET    /api/user/credit-transactions         - Get credit transactions
POST   /api/credits/purchase                 - Purchase credits
POST   /api/credits/use                      - Use credits
```

**Dependencies:**
- Stripe SDK
- Rate limiters
- STRIPE_CONFIG

---

### 7. Users/Auth Routes (Priority: MEDIUM)
**Estimated lines:** ~200
**Location in routes.ts:** Lines 210-460
**Endpoints to extract:** 8

```
GET    /api/auth/user                        - Get current user
GET    /api/users/:id                        - Get user by ID
GET    /api/users/top-rated                  - Get top-rated users
PUT    /api/users/profile                    - Update profile
POST   /api/phone/send-code                  - Send phone verification
POST   /api/phone/verify-code                - Verify phone code
GET    /api/phone/status                     - Get phone status
PUT    /api/user/settings                    - Update settings
POST   /api/user/sync-verification           - Sync verification
```

---

### 8. Messages Routes (Priority: LOW)
**Estimated lines:** ~130
**Location in routes.ts:** Lines 1840-1970
**Endpoints to extract:** 3

```
GET    /api/messages                         - Get messages
GET    /api/messages/listing/:listingId      - Get listing messages
POST   /api/messages                         - Send message
PUT    /api/messages/:id/read                - Mark as read
```

**Note:** Some message routes already extracted to:
- `server/routes/message-read.ts`
- `server/routes/message-search.ts`

---

### 9. Object Storage Routes (Priority: LOW)
**Estimated lines:** ~80
**Location in routes.ts:** Lines 638-718
**Endpoints to extract:** 2

```
GET    /objects/:objectPath(*)               - Serve protected images
GET    /public-objects/:filePath(*)          - Serve public images
```

**Dependencies:**
- ObjectStorageService
- ObjectPermission

---

### 10. Statistics Routes (Priority: LOW)
**Estimated lines:** ~50
**Location in routes.ts:** Lines 1370-1420
**Endpoints to extract:** 4

```
GET    /api/statistics/user/:userId          - Get user statistics
GET    /api/statistics/user/:userId/timeline - Get timeline
GET    /api/statistics/user/:userId/monthly  - Get monthly stats
GET    /api/statistics/user/:userId/summary  - Get summary
```

---

### 11. Admin Routes (Priority: LOW)
**Estimated lines:** ~60
**Location in routes.ts:** Lines 1970-2030
**Endpoints to extract:** 1

```
POST   /api/admin/seed-listings              - Seed test listings
```

---

## 📋 Implementation Checklist

### For Each Module:

1. **Create route file**
   ```bash
   touch server/routes/{module-name}.ts
   ```

2. **Add boilerplate**
   ```typescript
   import { Router } from "express";
   import { isAuthenticated } from "../supabaseAuth";
   // Add other imports as needed
   
   const router = Router();
   
   // Routes here
   
   export default router;
   ```

3. **Extract routes**
   - Copy route handlers from routes.ts
   - Change `app.{method}` to `router.{method}`
   - Remove `/api/{module}` prefix from paths
   - Keep middleware (isAuthenticated, rate limiters, etc.)

4. **Register in routes.ts**
   ```typescript
   import {moduleName}Routes from "./routes/{module-name}";
   app.use("/api/{module}", {moduleName}Routes);
   ```

5. **Remove old routes**
   - Delete the extracted section from routes.ts
   - Test compilation

6. **Commit**
   ```bash
   git add -A
   git commit -m "Extract {module-name} routes"
   git push origin main
   ```

---

## 🎯 Expected Final Results

After completing all extractions:

- **Final routes.ts size:** ~500-600 lines (core setup + health check)
- **Total reduction:** ~75-80% (from 2,621 to ~500 lines)
- **Total modules:** 11 route modules
- **Total endpoints organized:** ~70 endpoints

---

## 🔧 Automation Script

To speed up the process, you can use this helper script:

```bash
#!/bin/bash
# extract-routes.sh

MODULE=$1
START_LINE=$2
END_LINE=$3
PREFIX=$4

if [ -z "$MODULE" ] || [ -z "$START_LINE" ] || [ -z "$END_LINE" ] || [ -z "$PREFIX" ]; then
  echo "Usage: ./extract-routes.sh <module-name> <start-line> <end-line> <prefix>"
  echo "Example: ./extract-routes.sh listings 1520 1840 /api/listings"
  exit 1
fi

# Create route file
cat > "server/routes/${MODULE}.ts" << 'HEADER'
import { Router } from "express";
import { isAuthenticated } from "../supabaseAuth";
import { storage } from "../storage";

const router = Router();

HEADER

# Extract and convert
sed -n "${START_LINE},${END_LINE}p" server/routes.ts | \
  sed "s|app\\.\\(get\\|post\\|put\\|delete\\|patch\\)(\"${PREFIX}|router.\\1(\"|g" \
  >> "server/routes/${MODULE}.ts"

# Add export
echo "" >> "server/routes/${MODULE}.ts"
echo "export default router;" >> "server/routes/${MODULE}.ts"

echo "✅ Created server/routes/${MODULE}.ts"
```

---

## 📝 Notes

- **Route order matters:** Keep specific routes (like `/stats`) before parameterized routes (like `/:id`)
- **Middleware preservation:** Ensure rate limiters and auth middleware are preserved
- **Import cleanup:** Remove unused imports from routes.ts after extraction
- **Testing:** Run `npm run check` after each extraction to catch TypeScript errors
- **Deployment:** Railway auto-deploys on push to main

---

## 🚀 Quick Start (Next Steps)

1. Extract **listings routes** (highest impact, 320 lines)
2. Extract **images/upload routes** (150 lines)
3. Extract **payments routes** (400 lines)
4. Extract **users/auth routes** (200 lines)
5. Extract remaining smaller modules

**Estimated time:** 2-3 hours for complete extraction

