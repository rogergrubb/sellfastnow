# User Testing Guide - Claude Vision Integration

## 🎯 Goal
Verify that the Claude Vision API is working correctly and generating detailed product descriptions for bulk image uploads.

---

## ⚡ Quick Start (5 minutes)

### Step 1: Check API Key in Railway

1. Go to: https://railway.com/project/bd93b449-6d22-40b8-99b0-232c2b7645f7
2. Click on the **sellfastnow** service (the one with GitHub icon)
3. Click the **Variables** tab
4. Look for `ANTHROPIC_API_KEY`

**If it exists:**
- ✅ Good! Proceed to Step 2

**If it doesn't exist:**
- ❌ This is the problem! Follow the "Add API Key" instructions below

### Step 2: Test Bulk Upload

1. Go to: https://sellfast.now
2. Log in with your credentials
3. Click **Post an Item** button
4. Upload 5-10 product images (start small for testing)
5. Click **Analyze with AI** button
6. Wait for processing (3-5 seconds per image)

### Step 3: Check Results

**✅ SUCCESS - You should see:**
- Specific product names (e.g., "Nike Air Max 90 White/Black")
- Detailed descriptions (2-3 sentences)
- Brand names identified
- Condition assessments (Good, Excellent, etc.)
- Price estimates
- Confidence scores 6-10/10

**❌ FAILURE - If you see:**
- Empty `{...}` objects
- No titles or descriptions
- Confidence score 0%
- All fields blank

→ **Go to "Troubleshooting" section below**

---

## 🔧 Add API Key (If Missing)

### Get Anthropic API Key

1. Go to: https://console.anthropic.com/settings/keys
2. Log in (or create account if needed)
3. Click **Create Key**
4. Copy the key (starts with `sk-ant-api03-...`)

**Note**: Free tier includes $5 credit = ~1,000-2,000 image analyses

### Add to Railway

1. Go to Railway project: https://railway.com/project/bd93b449-6d22-40b8-99b0-232c2b7645f7
2. Click **sellfastnow** service
3. Click **Variables** tab
4. Click **+ New Variable**
5. Name: `ANTHROPIC_API_KEY`
6. Value: `sk-ant-api03-...` (paste your key)
7. Click **Add**
8. Wait 1-2 minutes for automatic redeploy

### Verify Deployment

1. Stay on Railway page
2. Click **Deployments** tab
3. Wait for green checkmark ✅
4. Status should show "Active"

---

## 🧪 Detailed Testing Steps

### Test 1: Single Image Upload

**Purpose**: Verify basic Claude Vision functionality

1. Go to https://sellfast.now
2. Log in
3. Click **Post an Item**
4. Upload **1 image** of a recognizable product (e.g., Nike shoe, iPhone, book)
5. Click **Analyze with AI**
6. Wait 3-5 seconds

**Expected Result**:
```
Title: "Nike Air Max 90 White/Black Men's Running Shoes"
Description: "Classic Nike Air Max 90 sneakers featuring iconic visible Air cushioning. White leather upper with black accents. Waffle outsole for traction."
Category: Shoes
Brand: Nike
Condition: Good
Confidence: 8/10
Retail Price: $130
Used Price: $78
```

**If this works**: ✅ Claude Vision is configured correctly!

**If this fails**: ❌ See "Troubleshooting" section

### Test 2: Small Batch (5 images)

**Purpose**: Verify batch processing works

1. Upload **5 different product images**
2. Click **Analyze with AI**
3. Wait ~15-25 seconds (5 images × 3-5 seconds each)

**Expected Result**:
- All 5 products have unique titles
- All 5 have descriptions
- Confidence scores vary (6-10/10)
- Credit balance decreases by 5

### Test 3: Large Batch (50-100 images)

**Purpose**: Verify system can handle your actual use case

1. Upload **50-100 product images**
2. Click **Analyze with AI**
3. Wait ~3-8 minutes

**Expected Result**:
- All products have details
- Processing completes without errors
- Credit balance decreases by number of images
- Navbar updates to show new credit balance

---

## 📊 Monitoring During Testing

### Browser Console (F12)

Open DevTools and watch Console tab:

**Good signs**:
```
📤 Calling /api/ai/analyze-bulk-images-claude endpoint (Claude Vision)...
✅ Bulk analysis complete: 110 products detected
```

**Bad signs**:
```
❌ Error: Claude Vision not configured
❌ Failed to analyze images
❌ 401 Unauthorized
```

### Railway Logs

1. Go to Railway project
2. Click **sellfastnow** service
3. Click **Logs** tab
4. Watch in real-time during upload

**Good signs**:
```
Claude Vision client initialized successfully
📦 Starting bulk analysis for 10 images using Claude Vision
🔍 [1/10] Analyzing with Claude Vision...
✅ [1/10] Detected: "Nike Air Max 90" (Confidence: 8/10)
💳 Deducted 10 purchased credits
```

**Bad signs**:
```
❌ Anthropic API key not configured
❌ Failed to initialize client
❌ Analysis failed: Invalid API key
```

---

## 🐛 Troubleshooting

### Problem: Empty Product Objects

**Symptoms**: All products show `{...}` with no details

**Solution**:
1. Check if `ANTHROPIC_API_KEY` exists in Railway Variables
2. If missing, add it (see "Add API Key" section)
3. Wait for redeploy (1-2 minutes)
4. Try again

### Problem: "Claude Vision not configured" Error

**Symptoms**: Error message in console or Railway logs

**Solution**:
1. API key is missing or invalid
2. Go to https://console.anthropic.com/settings/keys
3. Create new key
4. Add to Railway Variables
5. Redeploy

### Problem: 401 Unauthorized Error

**Symptoms**: Railway logs show "401 Unauthorized" from Anthropic API

**Solution**:
1. API key is invalid or expired
2. Generate new key at https://console.anthropic.com/settings/keys
3. Update Railway variable
4. Redeploy

### Problem: Rate Limit Error

**Symptoms**: First few images work, then fail

**Solution**:
1. Check Anthropic dashboard for usage limits
2. Free tier = $5 credit (~1,000-2,000 images)
3. Upgrade plan if needed
4. Or wait for rate limit to reset

### Problem: Slow Processing

**Symptoms**: Takes >10 seconds per image

**Solution**:
- This is normal for Claude Vision (high quality = slower)
- Each image takes 3-5 seconds
- 100 images = ~5-8 minutes total
- Consider processing in smaller batches

---

## ✅ Success Checklist

After testing, you should have:

- [ ] `ANTHROPIC_API_KEY` configured in Railway
- [ ] Railway logs show "Claude Vision client initialized successfully"
- [ ] Single image upload returns detailed product info
- [ ] Batch of 5 images all have unique descriptions
- [ ] Confidence scores are 6-10/10 (not 0%)
- [ ] Credit balance decreases correctly
- [ ] Navbar updates after processing
- [ ] Product titles are specific (not generic)
- [ ] Brands are correctly identified
- [ ] Condition assessments are detailed
- [ ] Price estimates are reasonable

---

## 📈 Expected Quality Improvements

### Before (Google Cloud Vision)
```
Title: "Shoe"
Description: "A shoe"
Category: Other
Confidence: 0%
Brand: Unknown
```

### After (Claude Vision)
```
Title: "Nike Air Max 90 White/Black Men's Size 10 Running Shoes"
Description: "Classic Nike Air Max 90 sneakers in white leather with black swoosh and accents. Features iconic visible Air cushioning unit in heel. Waffle-pattern rubber outsole. Shows light wear on toe box."
Category: Shoes
Confidence: 85%
Brand: Nike
Model: Air Max 90
Condition: Good
Retail Price: $130
Used Price: $78
Condition Details: "Light wear on toe box and heel. Minor creasing. Soles show moderate wear."
```

---

## 📞 Getting Help

If you've completed all troubleshooting steps and it still doesn't work:

1. **Export Railway Logs**:
   - Click Logs tab → Options → Download logs
   - Save last 1000 lines

2. **Take Screenshots**:
   - Railway Variables tab (hide API key value)
   - Browser console errors (F12)
   - Empty product objects in UI

3. **Provide Details**:
   - Number of images uploaded
   - Error messages seen
   - Current credit balance
   - When the issue started

4. **Submit at**: https://help.manus.im

---

## 🎉 What's Next After Success

Once Claude Vision is working:

1. **Process Your Bulk Images**:
   - Upload all 110+ images
   - Let AI generate descriptions
   - Review and edit as needed
   - Publish listings

2. **Monitor Credit Usage**:
   - Each image = 1 credit
   - You have 169 credits
   - Buy more at: https://sellfast.now/pricing

3. **Optimize Results**:
   - Take clear, well-lit photos
   - Include multiple angles
   - Show brand labels/tags
   - Capture model numbers

4. **Report Quality Issues**:
   - If confidence scores are consistently low
   - If brands are misidentified
   - If prices seem way off
   - Share examples for improvement

---

**Last Updated**: November 6, 2025  
**Estimated Testing Time**: 10-15 minutes  
**Required**: Railway access, Anthropic account (free tier OK)
