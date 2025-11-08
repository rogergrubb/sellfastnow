# How to Run the Featured Listings Migration

## The Problem

The SellFast.Now site is experiencing 500 errors because the database migration for featured listings hasn't run successfully. The `listings` table is missing these columns:
- `featured_until`
- `featured_payment_id`
- `featured_created_at`
- `featured_duration`

## The Solution (Choose ONE method below)

### ✅ Method 1: Railway CLI (Recommended - Easiest)

1. **Install Railway CLI** (if not already installed):
```bash
npm install -g @railway/cli
# or
brew install railway
```

2. **Login to Railway**:
```bash
railway login
```

3. **Link to your project**:
```bash
cd /path/to/sellfastnow
railway link
```

4. **Connect to PostgreSQL**:
```bash
railway connect postgres
```

5. **Run this SQL**:
```sql
ALTER TABLE listings
ADD COLUMN IF NOT EXISTS featured_until TIMESTAMP,
ADD COLUMN IF NOT EXISTS featured_payment_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS featured_created_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS featured_duration VARCHAR(10);

CREATE INDEX IF NOT EXISTS idx_listings_featured_until 
ON listings(featured_until) 
WHERE featured_until IS NOT NULL;
```

6. **Exit** (type `\q` or Ctrl+D)

7. **Restart the service** (optional, it may auto-restart):
```bash
railway restart
```

---

### ✅ Method 2: Database Client (pgAdmin, DBeaver, TablePlus, etc.)

1. **Get Database URL from Railway**:
   - Go to https://railway.app
   - Select your project
   - Click on PostgreSQL service
   - Go to "Variables" tab
   - Copy the `DATABASE_URL`

2. **Connect using your preferred client**:
   - **pgAdmin**: Create new server, paste connection details
   - **DBeaver**: New Connection → PostgreSQL → paste URL
   - **TablePlus**: New Connection → PostgreSQL → paste URL
   - **psql command line**: `psql "YOUR_DATABASE_URL"`

3. **Run the SQL**:
```sql
ALTER TABLE listings
ADD COLUMN IF NOT EXISTS featured_until TIMESTAMP,
ADD COLUMN IF NOT EXISTS featured_payment_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS featured_created_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS featured_duration VARCHAR(10);

CREATE INDEX IF NOT EXISTS idx_listings_featured_until 
ON listings(featured_until) 
WHERE featured_until IS NOT NULL;
```

4. **Verify** (optional):
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'listings' 
AND column_name LIKE 'featured%';
```

---

### ✅ Method 3: psql Command Line

1. **Get DATABASE_URL from Railway** (see Method 2, step 1)

2. **Connect via psql**:
```bash
psql "postgresql://username:password@host:port/database"
```

3. **Run the migration SQL** (same as above)

4. **Exit**: `\q`

---

### ✅ Method 4: Railway Environment Variables + Custom Script

If you have access to Railway's environment variables:

1. **Create a one-time migration script locally**:
```bash
cd /path/to/sellfastnow
cat > run-migration-local.js << 'EOF'
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);

async function runMigration() {
  try {
    console.log('Running migration...');
    
    await sql`
      ALTER TABLE listings
      ADD COLUMN IF NOT EXISTS featured_until TIMESTAMP,
      ADD COLUMN IF NOT EXISTS featured_payment_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS featured_created_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS featured_duration VARCHAR(10)
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_listings_featured_until 
      ON listings(featured_until) 
      WHERE featured_until IS NOT NULL
    `;
    
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await sql.end();
  }
}

runMigration();
EOF
```

2. **Set DATABASE_URL**:
```bash
export DATABASE_URL="your_database_url_from_railway"
```

3. **Run the script**:
```bash
node run-migration-local.js
```

---

## Verification

After running the migration using ANY method above, verify it worked:

### Test 1: Check API
```bash
curl https://sellfast.now/api/listings
```
Should return `[]` or listings data (not an error)

### Test 2: Check Featured API
```bash
curl https://sellfast.now/api/featured-listings
```
Should return `[]` (not an error)

### Test 3: Visit Homepage
Go to https://sellfast.now and check:
- No console errors
- "Recently Posted" section loads (even if empty)
- No 500 errors

---

## What Happens After Migration

Once the migration runs successfully:

1. **All API endpoints will work** - No more 500 errors
2. **Homepage will load properly** - Recently Posted section will appear
3. **Featured carousel will work** - When you feature a listing, it will appear
4. **You can test featuring** - Create a listing and feature it for $5

---

## Testing the Featured Carousel

After migration is complete:

1. **Create a test listing**:
   - Go to https://sellfast.now
   - Click "Post Ad"
   - Upload an image
   - Fill in details
   - Publish

2. **Feature the listing**:
   - Go to your listing detail page
   - Click "✨ Feature This Listing"
   - Choose duration (24h/$5, 48h/$10, or 7d/$25)
   - Use Stripe test card: `4242 4242 4242 4242`
   - Complete payment

3. **See the carousel**:
   - Go back to homepage
   - Featured carousel should appear at top
   - Your listing displays with "FEATURED" badge
   - Auto-scrolls every 6 seconds

---

## Troubleshooting

### "Column already exists" error
This is fine! The `IF NOT EXISTS` clause handles this. The migration is idempotent.

### "Permission denied" error
Make sure you're using the correct DATABASE_URL with proper credentials.

### "Connection refused" error
Check that:
- DATABASE_URL is correct
- Railway PostgreSQL service is running
- Your IP isn't blocked by Railway

### Still getting 500 errors after migration
1. Restart the Railway service
2. Clear browser cache
3. Check Railway logs for other errors

---

## Quick Reference: The SQL

```sql
-- Copy and paste this entire block
ALTER TABLE listings
ADD COLUMN IF NOT EXISTS featured_until TIMESTAMP,
ADD COLUMN IF NOT EXISTS featured_payment_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS featured_created_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS featured_duration VARCHAR(10);

CREATE INDEX IF NOT EXISTS idx_listings_featured_until 
ON listings(featured_until) 
WHERE featured_until IS NOT NULL;
```

---

## Need Help?

If you're still having issues:
1. Check Railway deployment logs
2. Verify DATABASE_URL is set correctly
3. Try restarting the Railway service
4. Check if PostgreSQL service is healthy

The migration is safe to run multiple times - it won't break anything!
