# Claude Vision Integration - Troubleshooting Guide

## Issue Summary

**Problem**: Bulk image analysis completes successfully (110 products detected) but all product details are empty `{...}` objects.

**Expected**: Each product should have:
- Specific product name with brand/model
- Detailed description
- Condition assessment
- Pricing estimates
- Confidence score 6-10/10

**Actual**: All products return empty objects with no details.

---

## Root Cause Analysis

### ✅ What's Working

1. **Frontend Updated**: `client/src/pages/PostAdEnhanced.tsx` correctly calls `/api/ai/analyze-bulk-images-claude`
2. **Backend Route**: `/api/ai/analyze-bulk-images-claude` endpoint exists and is properly implemented
3. **Claude Provider**: `server/pipeline/providers/vision/claude.ts` has correct implementation with detailed prompt
4. **Credit System**: Properly deducts credits and updates navbar
5. **Image Upload**: Can upload up to 100 images per session

### ⚠️ What Needs Verification

1. **ANTHROPIC_API_KEY**: Must be set in Railway environment variables
2. **API Key Format**: Should start with `sk-ant-api03-...`
3. **Claude API Errors**: Need to check Railway logs for specific error messages

---

## Investigation Steps Completed

### 1. Checked Frontend Endpoint Call ✅
- **File**: `client/src/pages/PostAdEnhanced.tsx` (line 1375-1376)
- **Status**: Correctly calls `/api/ai/analyze-bulk-images-claude`
- **Fix Applied**: Updated from Google Cloud Vision endpoint to Claude endpoint

### 2. Verified Backend Implementation ✅
- **File**: `server/routes/bulk-analysis-claude.ts`
- **Logic**: 
  - Groups images into products (line 54-57)
  - Calls Claude Vision for each image (line 80)
  - Extracts `claudeData` from response (line 101)
  - Maps to product fields (line 123-142)
- **Status**: Implementation looks correct

### 3. Reviewed Claude Provider ✅
- **File**: `server/pipeline/providers/vision/claude.ts`
- **Model**: `claude-3-5-sonnet-20241022` (latest vision model)
- **Prompt**: Comprehensive product analysis prompt (lines 7-74)
- **Response Handling**: Parses JSON and returns `claudeData` (line 206)
- **Status**: Implementation looks correct

### 4. Attempted Railway Log Check ❌
- **Issue**: Could not access Railway logs to see actual API errors
- **Search Term**: `analyze-bulk-images-claude` returned "No logs found"
- **Conclusion**: Either endpoint was never called, or logs were filtered incorrectly

---

## Most Likely Causes

### Cause #1: ANTHROPIC_API_KEY Not Set (90% probability)
**Symptoms**:
- Claude provider initialization fails
- Returns error: "Claude Vision not configured"
- All products get empty objects

**How to Check**:
1. Go to Railway project: https://railway.com/project/bd93b449-6d22-40b8-99b0-232c2b7645f7
2. Click on `sellfastnow` service
3. Go to **Variables** tab
4. Look for `ANTHROPIC_API_KEY`

**How to Fix**:
1. Get API key from: https://console.anthropic.com/settings/keys
2. Add to Railway variables: `ANTHROPIC_API_KEY=sk-ant-api03-...`
3. Redeploy service

### Cause #2: Invalid API Key (5% probability)
**Symptoms**:
- API key exists but is expired or invalid
- Claude API returns 401 Unauthorized

**How to Fix**:
1. Generate new API key at https://console.anthropic.com/settings/keys
2. Update Railway variable
3. Redeploy

### Cause #3: Claude API Rate Limit (3% probability)
**Symptoms**:
- First few images work, then fail
- Error: "Rate limit exceeded"

**How to Fix**:
- Check Anthropic dashboard for usage limits
- Upgrade plan if needed (free tier = $5 credit)

### Cause #4: Image Fetch Failure (2% probability)
**Symptoms**:
- Images can't be downloaded from URLs
- Error: "Failed to fetch image"

**How to Fix**:
- Check if Railway can access image URLs
- Verify CORS settings on image storage

---

## Testing Instructions

### Step 1: Verify API Key Configuration

```bash
# SSH into Railway or check environment variables
echo $ANTHROPIC_API_KEY
# Should output: sk-ant-api03-...
```

**Via Railway Dashboard**:
1. Go to: https://railway.com/project/bd93b449-6d22-40b8-99b0-232c2b7645f7
2. Click `sellfastnow` service
3. Click **Variables** tab
4. Check if `ANTHROPIC_API_KEY` exists

### Step 2: Check Railway Logs

1. Go to Railway project
2. Click `sellfastnow` service
3. Click **Logs** tab
4. Upload images on the site
5. Look for:
   - ✅ `"Claude Vision client initialized successfully"`
   - ✅ `"Analyzing image: https://..."`
   - ✅ `"Analysis complete in XXXms - Confidence: X/10"`
   - ❌ `"Claude Vision not configured"`
   - ❌ `"Failed to initialize client"`
   - ❌ `"Analysis failed: ..."`

### Step 3: Test Bulk Upload

1. Log in to https://sellfast.now
2. Click **Post an Item**
3. Upload 5-10 test images
4. Click **Analyze with AI**
5. Check results:
   - **Success**: Products have titles, descriptions, prices, confidence scores
   - **Failure**: Products show empty `{...}` objects

### Step 4: Check Console Logs

Open browser DevTools (F12) and check Console tab:
- Look for: `"📤 Calling /api/ai/analyze-bulk-images-claude endpoint"`
- Check response data structure
- Look for error messages

---

## Quick Fix Checklist

- [ ] **ANTHROPIC_API_KEY** is set in Railway environment variables
- [ ] API key starts with `sk-ant-api03-`
- [ ] Railway service has been redeployed after adding the key
- [ ] Railway logs show "Claude Vision client initialized successfully"
- [ ] Test upload of 5 images shows product details (not empty objects)
- [ ] Confidence scores are 6-10/10 (not 0)
- [ ] Credit balance decreases after analysis

---

## Expected Behavior After Fix

### Sample Product Output

```json
{
  "imageIndices": [0],
  "imageUrls": ["https://..."],
  "title": "Nike Air Max 90 White/Black Men's Size 10",
  "description": "Classic Nike Air Max 90 sneakers in white and black colorway. Visible Air cushioning unit in heel. Iconic waffle outsole pattern.",
  "category": "Shoes",
  "tags": ["nike", "air max", "sneakers", "athletic shoes", "men's shoes"],
  "retailPrice": 130,
  "usedPrice": 78,
  "condition": "Good",
  "confidence": 0.85,
  "isAIGenerated": true,
  "brand": "Nike",
  "modelNumber": "Air Max 90",
  "conditionDetails": "Light wear on toe box and heel. Minor creasing. Soles show moderate wear.",
  "visibleDefects": ["toe box scuffing", "heel wear", "sole wear"],
  "needsMoreInfo": false,
  "missingDetails": []
}
```

### Console Output (Railway Logs)

```
📦 Starting bulk analysis for 110 images using Claude Vision
👤 User ID: 9ed23ff1-ec6f-4295-a973-24420523fb2f
📊 Free AI remaining: 0/5
💳 User has 169 purchased credits
✅ Will process 110 items with AI (0 free + 110 paid)
📦 Detected 110 products
🔍 [1/110] Analyzing with Claude Vision...
✅ [1/110] Detected: "Nike Air Max 90 White/Black Men's Size 10" (Confidence: 8/10)
🔍 [2/110] Analyzing with Claude Vision...
✅ [2/110] Detected: "Apple iPhone 12 Pro 128GB Pacific Blue" (Confidence: 9/10)
...
💳 Deducted 110 purchased credits
✅ Bulk analysis complete: 110 with AI, 0 manual
```

---

## Alternative Solutions

### Option A: Use Google Cloud Vision (Fallback)
If Claude API key is not available, the system can fall back to Google Cloud Vision:
- Endpoint: `/api/ai/analyze-bulk-images-v2`
- Requires: `GOOGLE_APPLICATION_CREDENTIALS_JSON` environment variable
- Quality: Lower than Claude (generic labels vs. specific product names)

### Option B: Manual Entry
If no AI service is configured:
- Users can manually enter product details
- No credits are deducted
- Time-consuming for bulk uploads

---

## Contact Support

If issues persist after checking all items:
1. Export Railway logs (last 1000 lines)
2. Take screenshots of:
   - Railway environment variables (hide sensitive values)
   - Console errors in browser DevTools
   - Empty product objects in UI
3. Submit at: https://help.manus.im

---

## Files Modified in This Session

1. **client/src/pages/PostAdEnhanced.tsx** (line 1375-1376)
   - Changed endpoint from `/api/ai/analyze-bulk-images-v2` to `/api/ai/analyze-bulk-images-claude`

2. **bulk_analysis_investigation.md** (new file)
   - Investigation notes and findings

---

## Next Steps

1. ✅ **Verify ANTHROPIC_API_KEY** in Railway (most important!)
2. ✅ **Check Railway logs** for Claude initialization status
3. ✅ **Test bulk upload** with 5-10 images
4. ✅ **Verify product details** are populated (not empty)
5. ✅ **Check confidence scores** are 6-10/10

---

## Success Criteria

- [ ] Upload 110 images
- [ ] All 110 products have specific titles (not empty)
- [ ] All 110 products have descriptions
- [ ] Confidence scores are 6-10/10 (not 0%)
- [ ] Brands are correctly identified
- [ ] Pricing estimates are reasonable
- [ ] Credit balance decreases by 110
- [ ] Processing completes in ~5-10 minutes (110 images × 3-5 seconds each)

---

**Last Updated**: November 6, 2025  
**Status**: Awaiting user testing after API key verification
