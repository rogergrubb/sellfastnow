# Environment Variables Configuration

## Required Environment Variables for Railway

### Database
```
DATABASE_URL=postgresql://user:password@host:port/database
```
**Description:** PostgreSQL connection string  
**Where to get:** Railway PostgreSQL service provides this automatically  
**Status:** ✅ Should already be set

### Authentication (Supabase)
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```
**Description:** Supabase authentication credentials  
**Where to get:** Supabase project settings  
**Status:** ✅ Should already be set

### Stripe (CRITICAL - MISSING)
```
STRIPE_SECRET_KEY=sk_test_... (or sk_live_...)
STRIPE_PUBLISHABLE_KEY=pk_test_... (or pk_live_...)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... (or pk_live_...)
```
**Description:** Stripe API keys for payment processing  
**Where to get:** https://dashboard.stripe.com/apikeys  
**Status:** ❌ **MISSING - CAUSES ERRORS**

**Important Notes:**
- `STRIPE_SECRET_KEY` - Backend only, never expose
- `STRIPE_PUBLISHABLE_KEY` - Backend only
- `VITE_STRIPE_PUBLISHABLE_KEY` - Frontend (must start with `VITE_`)
- Use test keys (`sk_test_`, `pk_test_`) for development
- Use live keys (`sk_live_`, `pk_live_`) for production

### Cloudinary (Image Upload)
```
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```
**Description:** Cloudinary credentials for image uploads  
**Where to get:** https://cloudinary.com/console  
**Status:** ✅ Should already be set

### OpenAI (AI Generation)
```
OPENAI_API_KEY=sk-...
```
**Description:** OpenAI API key for AI-powered listing generation  
**Where to get:** https://platform.openai.com/api-keys  
**Status:** ✅ Should already be set

### Frontend URL
```
FRONTEND_URL=https://sellfastnow-production.up.railway.app
```
**Description:** Your production frontend URL  
**Used for:** CORS, redirects, email links  
**Status:** ✅ Should already be set

## How to Set Environment Variables in Railway

### Via Dashboard (Recommended)
1. Go to https://railway.app
2. Select your project
3. Click on your service (backend)
4. Click "Variables" tab
5. Click "New Variable"
6. Add name and value
7. Click "Add"
8. Railway will automatically redeploy

### Via Railway CLI
```bash
railway variables set STRIPE_SECRET_KEY=sk_test_...
railway variables set STRIPE_PUBLISHABLE_KEY=pk_test_...
railway variables set VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Current Issues

### 🔴 CRITICAL: Missing Stripe Keys
**Error:** `Stripe() with your publishable key. You used an empty string.`

**Fix:**
1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy "Publishable key" (starts with `pk_test_`)
3. Copy "Secret key" (click "Reveal" first, starts with `sk_test_`)
4. Add to Railway:
   - `STRIPE_SECRET_KEY` = secret key
   - `STRIPE_PUBLISHABLE_KEY` = publishable key  
   - `VITE_STRIPE_PUBLISHABLE_KEY` = publishable key (same as above)
5. Railway will redeploy automatically

### 🔴 CRITICAL: Database Schema Out of Sync
**Error:** `500 on /api/auth/user and /api/user/credits`

**Fix:**
1. Run migration script in Railway database
2. See `migrations/README.md` for instructions
3. Or add `npm run db:push` to build command

## Verification Checklist

After setting environment variables:

- [ ] `STRIPE_SECRET_KEY` is set and starts with `sk_test_` or `sk_live_`
- [ ] `STRIPE_PUBLISHABLE_KEY` is set and starts with `pk_test_` or `pk_live_`
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY` is set (same value as above)
- [ ] Database migration has been run
- [ ] Railway has redeployed successfully
- [ ] No errors in Railway logs
- [ ] `/api/auth/user` returns 200 (not 500)
- [ ] `/api/user/credits` returns 200 (not 500)
- [ ] Stripe Elements load without errors
- [ ] Dashboard loads without authentication errors

## Testing

### Test Stripe Keys
```bash
# In browser console on your site:
console.log(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
// Should show: pk_test_... or pk_live_...
// Should NOT show: undefined or empty string
```

### Test Backend APIs
```bash
# Get auth token from browser (F12 > Application > Cookies > auth token)
curl -H "Authorization: Bearer YOUR_TOKEN" https://sellfastnow-production.up.railway.app/api/auth/user

# Should return user object, not 500 error
```

## Security Notes

⚠️ **NEVER commit these values to Git!**
- All secrets should only be in Railway environment variables
- `.env` files should be in `.gitignore`
- Never share secret keys publicly
- Rotate keys if accidentally exposed
- Use test keys for development
- Use live keys only in production

## Support

If you're still seeing errors after setting these:
1. Check Railway logs for specific error messages
2. Verify all variables are set correctly (no typos)
3. Ensure database migration has run
4. Try redeploying manually in Railway
5. Check that frontend is using latest deployment

