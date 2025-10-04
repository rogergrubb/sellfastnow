# Railway Deployment Guide - SellFast.Now

## 📋 Deployment Checklist

- [ ] PostgreSQL database provisioned on Railway
- [ ] All required environment variables configured
- [ ] Database schema pushed to production
- [ ] Object storage bucket configured (if using GCS)
- [ ] OAuth/OIDC provider configured for production domain
- [ ] Stripe webhooks updated (if using payments)
- [ ] Email service configured (Resend)
- [ ] Production build tested locally
- [ ] Health check endpoint verified

## 🔐 Required Environment Variables

### Core Database & Server
```bash
# PostgreSQL Database (Auto-provided by Railway)
DATABASE_URL=postgresql://user:password@host:port/database

# Server Configuration
PORT=5000                    # Railway auto-assigns, default 5000
NODE_ENV=production
```

### Session Management
```bash
# Session Secret (Generate using: openssl rand -base64 32)
SESSION_SECRET=your-secure-random-session-secret-here
```

### Authentication (Replit OIDC)
**Note:** These are Replit-specific. For Railway, you'll need to configure an alternative auth provider (Auth0, Clerk, NextAuth, etc.) or implement your own authentication system.

```bash
# Current Replit-specific variables (will need replacement)
REPLIT_DOMAINS=https://your-app.railway.app
ISSUER_URL=https://auth.replit.com
REPL_ID=your-repl-id
```

**Recommended Alternative:** Implement Passport Local Auth or integrate Auth0/Clerk for production.

### Object Storage (Google Cloud Storage)
**Note:** The current implementation uses Replit's Object Storage sidecar. For Railway, you'll need to:
1. Use Google Cloud Storage directly with service account credentials, OR
2. Switch to Railway's volume storage, OR
3. Use AWS S3, Cloudinary, or another cloud storage provider

```bash
# If using GCS directly (requires service account)
GCS_PROJECT_ID=your-gcp-project-id
GCS_BUCKET_NAME=your-bucket-name
GCS_CREDENTIALS_PATH=/path/to/service-account.json
# OR
GCS_CREDENTIALS_JSON={"type":"service_account",...}

# Object Storage Paths
PUBLIC_OBJECT_SEARCH_PATHS=public/images,public/avatars
PRIVATE_OBJECT_DIR=.private
DEFAULT_OBJECT_STORAGE_BUCKET_ID=your-bucket-id
```

### Optional Services

#### OpenAI (AI Listing Coaching)
```bash
# Optional - falls back to mock data if not provided
OPENAI_API_KEY=sk-...
```

#### Stripe (Payments)
```bash
# Optional - only needed if enabling payment features
STRIPE_SECRET_KEY=sk_live_...
VITE_STRIPE_PUBLIC_KEY=pk_live_...

# Test keys for development
TESTING_STRIPE_SECRET_KEY=sk_test_...
TESTING_VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

#### Email (Resend) - Replit Connector
**Note:** Currently uses Replit Connectors. For Railway, configure Resend directly:

```bash
# Resend API Key
RESEND_API_KEY=re_...
```

Then update `server/email.ts` to use the API key directly instead of the connector.

## 🗄️ Database Setup & Migrations

### Step 1: Provision PostgreSQL on Railway

1. Create new Railway project
2. Click "+ New" → "Database" → "Add PostgreSQL"
3. Database provisions automatically with `DATABASE_URL` variable

### Step 2: Push Schema to Production

**Option A: Using Drizzle Push (Recommended for initial setup)**
```bash
# Locally, set DATABASE_URL to your Railway PostgreSQL
export DATABASE_URL="postgresql://..."

# Push schema to production database
npm run db:push
```

**Option B: Generate and Run Migrations**
```bash
# Generate migration files
npx drizzle-kit generate

# Connect to Railway database and apply
npx drizzle-kit migrate
```

### Step 3: Verify Database Schema

Connect to Railway PostgreSQL using the provided credentials and verify tables exist:
```bash
# From Railway dashboard, get connection details
psql $DATABASE_URL

# List tables
\dt

# Expected tables:
# - users
# - listings
# - messages
# - favorites
# - reviews
# - review_votes
# - review_responses
# - offers
# - transactions
# - transaction_events
# - cancellation_comments
# - sessions
```

## 🏗️ Production Build Configuration

### Build Commands

The application uses a combined build process:

```bash
# Install dependencies
npm install

# Build frontend (Vite) + backend (esbuild)
npm run build

# Output:
# - Frontend: dist/client (static files)
# - Backend: dist/index.js (bundled server)
```

### Start Command
```bash
npm start
# Runs: NODE_ENV=production node dist/index.js
```

### Build Verification (Local)
```bash
# Test production build locally
npm run build
NODE_ENV=production DATABASE_URL="your-db-url" npm start

# Visit http://localhost:5000
```

## 🚀 Railway Deployment Steps

### 1. Initial Setup

**A. Create Railway Account**
- Go to [railway.app](https://railway.app)
- Sign up with GitHub

**B. Create New Project**
- Click "New Project"
- Select "Deploy from GitHub repo"
- Authorize Railway to access your repository
- Select your repository

### 2. Configure Service

**A. Root Directory**
- Service Settings → Root Directory: `.` (entire repo)

**B. Build Configuration**
- Build Command: `npm install && npm run build`
- Start Command: `npm start`
- (These are auto-detected from railway.json)

**C. Watch Paths** (Optional - for monorepo optimization)
```
/**
```

### 3. Add PostgreSQL Database

- Click "+ New" in your project
- Select "Database" → "PostgreSQL"
- Database provisions with automatic `DATABASE_URL` reference

### 4. Configure Environment Variables

Navigate to Service → Variables tab:

**Required Variables:**
```bash
# Auto-referenced from PostgreSQL service
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Generate secure session secret
SESSION_SECRET=<generate using: openssl rand -base64 32>

# Server config
NODE_ENV=production
PORT=${{PORT}}  # Railway auto-assigns

# Public domain for OAuth callbacks
REPLIT_DOMAINS=https://${{RAILWAY_PUBLIC_DOMAIN}}
```

**Optional Variables:**
```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
VITE_STRIPE_PUBLIC_KEY=pk_live_...

# Resend Email
RESEND_API_KEY=re_...

# Object Storage (if using GCS)
PUBLIC_OBJECT_SEARCH_PATHS=public/images
PRIVATE_OBJECT_DIR=.private
GCS_BUCKET_NAME=your-bucket
```

### 5. Generate Public Domain

- Navigate to Service → Settings → Networking
- Click "Generate Domain"
- Copy the generated URL (e.g., `your-app-production.up.railway.app`)

### 6. Database Migration

**Option A: From Railway Dashboard**
- Go to PostgreSQL service
- Click "Data" tab
- Can run SQL queries directly

**Option B: Connect Locally and Push Schema**
```bash
# Copy DATABASE_URL from Railway dashboard
export DATABASE_URL="postgresql://..."

# Push schema
npm run db:push

# Verify
psql $DATABASE_URL -c "\dt"
```

### 7. Deploy

- Railway automatically deploys on push to main branch
- Monitor deployment in "Deployments" tab
- Check logs for any errors

### 8. Verify Deployment

**Health Checks:**
```bash
# Check server is running
curl https://your-app.railway.app/api/auth/user

# Expected: 401 Unauthorized (server is running)
```

**Access Application:**
- Visit: `https://your-app.railway.app`
- Test login, listing creation, etc.

## ⚙️ Special Configuration Needed

### 1. Authentication Migration (IMPORTANT)

**Current State:** Uses Replit OIDC (not available outside Replit)

**Migration Options:**

**Option A: Passport Local (Simple)**
```bash
# Already scaffolded in codebase
# Update server/replitAuth.ts to use passport-local
# Store hashed passwords in users table
```

**Option B: Auth0 (Recommended for Production)**
```bash
# Install Auth0 SDK
npm install express-openid-connect

# Configure in server/replitAuth.ts
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_CLIENT_ID=...
AUTH0_CLIENT_SECRET=...
```

**Option C: Clerk**
```bash
npm install @clerk/clerk-sdk-node @clerk/clerk-react

CLERK_SECRET_KEY=...
VITE_CLERK_PUBLISHABLE_KEY=...
```

### 2. Object Storage Migration

**Current State:** Uses Replit Object Storage sidecar

**Migration Options:**

**Option A: Google Cloud Storage (Direct)**
1. Create GCS bucket
2. Create service account with Storage Admin role
3. Download service account JSON
4. Update `server/objectStorage.ts`:
```typescript
const storage = new Storage({
  projectId: process.env.GCS_PROJECT_ID,
  keyFilename: process.env.GCS_CREDENTIALS_PATH,
});
```

**Option B: AWS S3**
```bash
npm install @aws-sdk/client-s3
# Update server/objectStorage.ts to use S3 client
```

**Option C: Cloudinary**
```bash
npm install cloudinary
# Simplest for image hosting
```

**Option D: Railway Volumes (Simple but less scalable)**
```bash
# Mount volume in Railway dashboard
# Update code to use local file system
```

### 3. Email Service Migration

**Current State:** Uses Replit Connectors for Resend

**Update `server/email.ts`:**
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(to: string, subject: string, html: string) {
  await resend.emails.send({
    from: 'noreply@yourdomain.com',
    to,
    subject,
    html,
  });
}
```

### 4. Session Storage

Currently uses MemoryStore (in-memory). For production:

**Option A: PostgreSQL Session Store (Already configured)**
```typescript
// server/routes.ts already has connect-pg-simple setup
// Just ensure SESSION_SECRET is set
```

**Option B: Redis (Higher performance)**
```bash
# Add Redis database on Railway
npm install connect-redis redis

# Update session config
```

## 📊 Monitoring & Logs

### View Logs
- Railway Dashboard → Service → Logs tab
- Real-time log streaming
- Filter by log level

### Metrics
- Railway Dashboard → Service → Metrics
- CPU, Memory, Network usage

### Alerts
- Configure in Project Settings → Notifications
- Slack, Discord, Email webhooks

## 🔄 Continuous Deployment

### Automatic Deploys
- Railway auto-deploys on git push to main
- Configure in Service → Settings → Source

### Manual Deploys
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link project
railway link

# Deploy manually
railway up
```

### Rollback
- Railway Dashboard → Deployments
- Click on previous deployment → Redeploy

## 💰 Cost Estimates

**Railway Pricing (2025):**
- Developer Plan: $5/month + usage
- PostgreSQL: ~$5-10/month
- Application service: ~$5-15/month (depends on usage)
- Total: ~$15-30/month for small-medium traffic

## 🔒 Security Checklist

- [ ] SESSION_SECRET is cryptographically random (32+ bytes)
- [ ] DATABASE_URL not exposed in client-side code
- [ ] CORS configured for production domain only
- [ ] HTTPS enforced (Railway provides by default)
- [ ] API keys stored as Railway variables (not in code)
- [ ] SQL injection prevented (using Drizzle ORM)
- [ ] XSS prevention (React auto-escapes)
- [ ] Rate limiting implemented (consider adding)
- [ ] Input validation using Zod schemas

## 🐛 Troubleshooting

### Build Fails
```bash
# Check logs for specific error
# Common issues:
# - Missing dependencies (run npm install)
# - TypeScript errors (run npm run check)
# - Build command wrong (verify railway.json)
```

### Database Connection Errors
```bash
# Verify DATABASE_URL is set
# Check PostgreSQL service is running
# Test connection locally: psql $DATABASE_URL
```

### 404 on All Routes
```bash
# Ensure dist/client is built correctly
# Check server/vite.ts serves static files in production
# Verify NODE_ENV=production
```

### Authentication Fails
```bash
# Migrate away from Replit OIDC first
# Verify callback URLs match production domain
# Check session secret is set
```

## 📚 Additional Resources

- [Railway Docs](https://docs.railway.com)
- [Drizzle ORM Docs](https://orm.drizzle.team)
- [Express Production Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [Vite Production Build](https://vitejs.dev/guide/build.html)

---

## Quick Deploy Command Summary

```bash
# 1. Build locally to test
npm run build
NODE_ENV=production npm start

# 2. Push to GitHub
git add .
git commit -m "Prepare for Railway deployment"
git push origin main

# 3. Configure on Railway
# - Add PostgreSQL
# - Set environment variables
# - Generate domain
# - Push database schema: npm run db:push

# 4. Monitor deployment
# - Check Railway logs
# - Visit generated domain
# - Test core functionality
```

**Note:** This application currently has Replit-specific integrations (OIDC auth, Object Storage sidecar). You'll need to migrate these to Railway-compatible alternatives before full deployment.
