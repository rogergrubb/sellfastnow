# Database Migration Instructions

## Problem
The application is failing because the database is missing new columns that were added to the schema (SMS preferences, analytics fields, etc.).

## Solution
Run the database migration to add the missing columns.

## Option 1: Run Migration via Railway CLI (Recommended)

1. **Install Railway CLI** (if not already installed):
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**:
   ```bash
   railway login
   ```

3. **Link to your project**:
   ```bash
   railway link
   ```

4. **Run the migration**:
   ```bash
   railway run bash -c 'psql $DATABASE_URL -f migrations/add_sms_columns.sql'
   ```

## Option 2: Run Migration via Railway Dashboard

1. Go to your Railway dashboard: https://railway.app/dashboard
2. Select your SellFast.Now project
3. Click on your PostgreSQL database service
4. Click on "Data" tab
5. Click "Query" button
6. Copy and paste the contents of `migrations/add_sms_columns.sql`
7. Click "Run Query"

## Option 3: Run Migration Locally (if you have DATABASE_URL)

1. **Set the DATABASE_URL environment variable**:
   ```bash
   export DATABASE_URL="your_production_database_url"
   ```

2. **Run the migration script**:
   ```bash
   ./run-migration.sh
   ```

## Verify Migration

After running the migration, check the Railway logs to ensure the errors are gone. You should no longer see:
```
ERROR: column "sms_weekly_updates" does not exist
```

## What Gets Added

The migration adds:
- **SMS preference columns** to the `users` table (14 new columns)
- **Analytics columns** to the `listings` table (view_count, last_viewed_at, quality_score)
- **SMS tracking columns** to `search_alert_notifications` table
- **SMS notifications column** to `saved_searches` table
- **Performance indexes** for view tracking

## Rollback (if needed)

If you need to rollback, run:
```sql
ALTER TABLE users 
DROP COLUMN IF EXISTS sms_weekly_updates,
DROP COLUMN IF EXISTS sms_monthly_updates,
-- ... (add all other columns)
```

## Need Help?

If you encounter any issues, check:
1. Railway deployment logs
2. PostgreSQL service logs
3. Ensure you have the correct DATABASE_URL

