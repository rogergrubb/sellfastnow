# Railway Quick Start Guide

## ⚡ 5-Minute Deploy Checklist

### Prerequisites
- [ ] GitHub account
- [ ] Railway account ([railway.app](https://railway.app))
- [ ] Git repository pushed to GitHub

### Step 1: Create Railway Project (2 min)
1. Go to [railway.app](https://railway.app) and login with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository: `SellFast.Now`
4. Railway detects Node.js and auto-configures build

### Step 2: Add PostgreSQL Database (1 min)
1. In your Railway project, click "+ New"
2. Select "Database" → "PostgreSQL"
3. Database provisions automatically (wait 30 seconds)
4. `DATABASE_URL` variable is auto-created

### Step 3: Set Environment Variables (2 min)
1. Click on your service (not database)
2. Go to "Variables" tab
3. Add these **required** variables:

```bash
# Link to your database
DATABASE_URL = ${{Postgres.DATABASE_URL}}

# Generate this: openssl rand -base64 32
SESSION_SECRET = <paste-generated-secret>

# Production mode
NODE_ENV = production
```

4. Click "Add" for each variable

### Step 4: Generate Public Domain (30 sec)
1. Click on your service
2. Go to "Settings" → "Networking"
3. Click "Generate Domain"
4. Copy the URL (e.g., `sellfast-production.up.railway.app`)

### Step 5: Deploy & Push Schema (1 min)
Railway automatically deploys. While it's deploying:

```bash
# In your terminal, connect to Railway database
# Copy DATABASE_URL from Railway dashboard Variables tab
export DATABASE_URL="postgresql://..."

# Push your database schema
npm run db:push
```

### Step 6: Verify (30 sec)
1. Wait for deployment to complete (check Railway logs)
2. Visit your generated domain
3. You should see the SellFast.Now homepage!

---

## ⚠️ Known Issues & Fixes

### Issue 1: Authentication Won't Work Yet
**Problem:** App uses Replit OIDC (not available on Railway)

**Quick Fix:** Login will fail until you implement an alternative auth system.

**Solutions:**
- **Option A (Simplest):** Use Passport Local (email/password)
- **Option B (Recommended):** Integrate Auth0 or Clerk
- See `DEPLOYMENT.md` for detailed migration steps

### Issue 2: Image Uploads Won't Work
**Problem:** App uses Replit Object Storage sidecar

**Quick Fix:** Image uploads will fail until you configure cloud storage.

**Solutions:**
- **Option A (Easiest):** Use Cloudinary
- **Option B:** Configure Google Cloud Storage or AWS S3
- See `DEPLOYMENT.md` for detailed migration steps

### Issue 3: Email Notifications Won't Send
**Problem:** Uses Replit Connector for Resend

**Quick Fix:** Add `RESEND_API_KEY` to Railway variables

```bash
# Get API key from resend.com
RESEND_API_KEY=re_...
```

Then update `server/email.ts` to use the key directly (see DEPLOYMENT.md).

---

## 📊 What Works Out of the Box

✅ **Frontend** - React app loads perfectly  
✅ **Backend API** - Express server runs  
✅ **Database** - PostgreSQL connected  
✅ **Listings** - View existing listings  
✅ **Search** - Search functionality works  
✅ **AI Coaching** - Works without OpenAI key (uses mock data)  
✅ **Payments** - Stripe integration ready (just add keys)  

## 🔧 What Needs Configuration

⚠️ **Authentication** - Requires migration from Replit OIDC  
⚠️ **Image Uploads** - Requires cloud storage setup  
⚠️ **Email** - Requires Resend API key update  

---

## 🚀 Next Steps

1. **Test the deployment**: Visit your Railway URL
2. **Configure authentication**: Follow auth migration guide in DEPLOYMENT.md
3. **Set up object storage**: Choose and configure cloud storage provider
4. **Add optional services**:
   - OpenAI API key for real AI coaching
   - Stripe keys for payment processing
   - Resend API key for emails
5. **Set up custom domain** (optional): Railway Settings → Networking

---

## 📚 Full Documentation

For complete deployment guide with all options and troubleshooting, see:
- **DEPLOYMENT.md** - Comprehensive deployment guide
- **.env.example** - All environment variables documented

## 💬 Need Help?

- Railway Discord: [discord.gg/railway](https://discord.gg/railway)
- Railway Docs: [docs.railway.com](https://docs.railway.com)
- Railway Help: help@railway.app

---

## Cost Estimate

**Monthly Cost (Railway Developer Plan):**
- Base: $5/month + usage
- PostgreSQL: ~$5-10/month
- App hosting: ~$5-15/month
- **Total: ~$15-30/month** for low-medium traffic

**Free Trial:** Railway provides $5 credit to test
