# Deployment Guide - Optimized AI Service

## Quick Deploy (Recommended)

### Step 1: Backup Original Service
```bash
cd /home/claude/sellfastnow/server
cp aiService.ts aiService.backup.ts
```

### Step 2: Deploy Optimized Version
```bash
# Replace original with optimized version
cp aiService.optimized.ts aiService.ts
```

### Step 3: Restart Application
If on Replit:
- Click "Stop" then "Run"

If on Railway:
```bash
railway up
```

### Step 4: Verify Deployment
Check logs for:
```
✅ [OPTIMIZED] Product identified: "..."
⚡ identifyProductFromPhoto completed in XXXms
```

---

## Environment Requirements

### Required for AI Features
```bash
OPENAI_API_KEY=sk-...
```

### Optional but Recommended
```bash
# For full application functionality
DATABASE_URL=postgresql://...
CLERK_SECRET_KEY=sk_live_...
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
```

---

## Testing Before Full Deployment

### Option 1: Local Testing
```bash
# Create test environment
cp .env.example .env.test

# Add your OpenAI key
echo "OPENAI_API_KEY=sk-your-key" >> .env.test

# Run tests
NODE_ENV=test npm run dev
```

### Option 2: Gradual Rollout
1. Deploy optimized version to staging environment
2. Test with 10-20 real product uploads
3. Compare accuracy and speed with production
4. If satisfied, deploy to production

---

## Performance Monitoring

### Enable Performance Logging
The optimized service automatically logs performance metrics. To view:

```typescript
// In your routes or admin panel
import { aiService } from './aiService';

// Get performance report
const report = aiService.getPerformanceReport();
console.log('Performance Report:', report);

// Clear logs periodically
aiService.clearPerformanceLog();
```

### Example Report Output
```json
[
  {
    "functionName": "identifyProductFromPhoto",
    "startTime": 1696867200000,
    "endTime": 1696867202341,
    "duration": 2341,
    "tokenUsage": 543
  },
  {
    "functionName": "analyzeMultipleImages",
    "startTime": 1696867203000,
    "endTime": 1696867207456,
    "duration": 4456,
    "tokenUsage": 1234
  }
]
```

---

## Rollback Procedure

If you need to revert to the original service:

```bash
cd /home/claude/sellfastnow/server

# Option 1: From backup
cp aiService.backup.ts aiService.ts

# Option 2: From git (if committed)
git checkout HEAD -- aiService.ts

# Restart application
```

**Rollback time: 30 seconds**

---

## Cost Monitoring

### Track OpenAI Usage
Monitor your OpenAI dashboard:
- Daily API calls
- Token usage trends
- Cost per product analysis

### Set Budget Alerts
In OpenAI dashboard:
1. Go to "Usage"
2. Set monthly budget limit
3. Configure email alerts at 50%, 75%, 90%

### Expected Costs (Optimized)
- Per product analysis: ~$0.04-0.06
- Per multi-image analysis: ~$0.08-0.12
- Per description enhancement: ~$0.02-0.03
- Per pricing analysis: ~$0.02-0.03

---

## Troubleshooting

### Issue: Slower than expected
**Check:**
- Network latency to OpenAI servers
- Image sizes (compress before sending)
- OpenAI API rate limits
- Concurrent request limits

**Solution:**
- Enable parallel processing for batches
- Implement request queuing
- Add retry logic with exponential backoff

### Issue: Accuracy decreased
**Check:**
- Prompt modifications
- Token limits (may be too low for complex products)
- Image quality (ensure detail level is appropriate)

**Solution:**
- Increase token limits for specific categories
- Use "high" detail for complex products
- A/B test prompts

### Issue: High error rate
**Check:**
- OpenAI API key validity
- Rate limit exceeded
- Invalid image formats
- Network connectivity

**Solution:**
- Verify API key in environment
- Implement rate limiting on your end
- Validate images before sending
- Add retry logic

---

## Performance Benchmarks

### Target Metrics
- Single product: <3 seconds
- 5 products (parallel): <6 seconds
- 10 products (parallel): <8 seconds
- Multi-image grouping: <6 seconds

### Alert If
- Average response time >5 seconds
- Error rate >5%
- Daily cost >expected baseline + 50%

---

## Advanced Configuration

### Adjust Token Limits
Edit `aiService.ts`:

```typescript
const TOKEN_LIMITS = {
  PRODUCT_IDENTIFICATION: 1024,  // Increase if truncated
  DESCRIPTION_ANALYSIS: 1536,    // Increase for longer descriptions
  PRICING_ANALYSIS: 1024,        // Usually sufficient
  MULTI_IMAGE_ANALYSIS: 3072,    // Increase for many products
  BUNDLE_SUMMARY: 1536,          // Usually sufficient
};
```

### Adjust Image Detail Level
For higher accuracy at cost of speed:

```typescript
image_url: {
  url: imageUrl,
  detail: "high" // Change from "auto"
}
```

### Enable Parallel Processing
In your routes, replace sequential with parallel:

```typescript
// OLD: Sequential
for (const image of images) {
  await aiService.analyzeProductImage(image);
}

// NEW: Parallel (faster)
const results = await aiService.analyzeMultipleProductsInParallel(images);
```

---

## Next Optimization Phase

### After Successful Deployment
1. **Implement Caching**
   - Cache identical image analyses
   - Expected hit rate: 80-90%
   - Additional speed: 2-5× for cached items

2. **Image Compression**
   - Compress images before API call
   - Target: <500KB per image
   - Additional speed: 10-20%

3. **Smart Model Selection**
   - Use GPT-4o for simple products
   - Use GPT-5 only for complex items
   - Additional savings: 30-40%

4. **Batch API for Non-Urgent**
   - Use batch API for background processing
   - Cost savings: 50% off regular pricing

---

## Support

### Questions or Issues?
1. Check performance logs
2. Review optimization report
3. Compare with backup version
4. Test with minimal example

### Report Performance Issues
Include:
- Performance report JSON
- Example images (if possible)
- Expected vs actual timing
- Error messages (if any)

---

*Last Updated: October 9, 2025*
*Version: 1.0*
