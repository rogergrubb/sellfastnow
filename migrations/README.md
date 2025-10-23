# Database Migrations

## How to Run Migrations in Railway

### Option 1: Via Railway Dashboard (Recommended)

1. Go to your Railway project dashboard
2. Click on your PostgreSQL database service
3. Click "Data" tab
4. Click "Query" button
5. Copy and paste the SQL from `add_account_tiers.sql`
6. Click "Run Query"
7. Verify columns were added successfully

### Option 2: Via Railway CLI

```bash
# Install Railway CLI if not already installed
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Connect to database and run migration
railway run psql $DATABASE_URL -f migrations/add_account_tiers.sql
```

### Option 3: Via Drizzle Push (Automatic)

```bash
# In Railway, add this to your build command:
npm run db:push && npm run build

# Or run manually after deployment:
railway run npm run db:push
```

## Current Migrations

### add_account_tiers.sql
Adds support for two-tier Stripe Connect system:
- `stripe_account_type` - 'express' or 'standard'
- `account_tier` - 'none', 'express', or 'standard'
- `onboarding_complete` - boolean flag
- `charges_enabled` - can accept payments
- `payouts_enabled` - can receive payouts

**Status:** Needs to be run in production
**Date Added:** 2025-01-23
**Required For:** Two-tier payment system to work

## Troubleshooting

### Error: "column does not exist"
- The migration hasn't been run yet
- Run the SQL script in Railway database
- Or add `npm run db:push` to build command

### Error: "column already exists"
- Migration was already run
- Safe to ignore
- SQL uses `IF NOT EXISTS` to prevent errors

### Error: 500 on /api/auth/user or /api/user/credits
- Usually means migration hasn't run
- Database schema doesn't match code
- Run migration to fix

