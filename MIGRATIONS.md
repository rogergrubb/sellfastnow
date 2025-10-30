# Database Migrations Guide

## Overview
This project uses **Drizzle ORM** with automated migrations that run on every Railway deployment.

## How It Works

### Automatic Migrations on Deployment
When you push code to GitHub:
1. Railway automatically deploys
2. `npm start` runs → `npm run db:migrate` executes first
3. All pending migrations are applied to the database
4. Then the server starts

**No manual intervention needed!**

## Adding New Database Changes

### Step 1: Update Schema
Edit files in `shared/schema.ts` or `shared/schema/*.ts`:

```typescript
// Example: Add a new column
export const users = pgTable("users", {
  // ... existing columns
  newColumn: text("new_column"), // Add this
});
```

### Step 2: Generate Migration
Run this command locally:

```bash
npm run db:generate
```

This creates a new SQL file in `migrations/` folder with your changes.

### Step 3: Review the Migration
Check the generated SQL file in `migrations/` to make sure it looks correct.

### Step 4: Commit and Push
```bash
git add migrations/
git commit -m "feat: Add new_column to users table"
git push origin main
```

### Step 5: Automatic Deployment
Railway will:
- Deploy your code
- Run the migration automatically
- Start the server

**Done!** No manual migration needed.

## Available Commands

### `npm run db:generate`
Generates a new migration file from schema changes.
Run this locally after updating your schema.

### `npm run db:migrate`
Runs all pending migrations.
This runs automatically on Railway deployment.

### `npm run db:push`
⚠️ **Deprecated for production**
Pushes schema changes directly without creating migration files.
Only use for local development.

## Migration Files

Migrations are stored in `migrations/` folder:
- `0000_odd_ma_gnuci.sql` - Initial schema
- `add_sms_columns.sql` - SMS preferences
- `add_draft_folders.sql` - Draft folder system
- etc.

Each migration has a corresponding entry in `migrations/meta/_journal.json`.

## Best Practices

### ✅ DO:
- Always generate migrations for schema changes
- Review generated SQL before committing
- Test migrations locally if possible
- Commit migrations with your code changes
- Use descriptive migration names

### ❌ DON'T:
- Don't edit migration files after they're applied
- Don't use `db:push` in production
- Don't skip generating migrations
- Don't manually run SQL on production database

## Troubleshooting

### Migration Fails on Deployment
Check Railway logs for error messages:
```bash
# Look for migration errors in logs
```

Common issues:
- **Constraint violation**: Data doesn't match new schema
- **Column exists**: Migration already applied manually
- **Syntax error**: Check generated SQL file

### Need to Rollback
Drizzle doesn't support automatic rollbacks. Options:
1. Create a new migration that reverses the changes
2. Manually fix the database and create a corrective migration

### Emergency Manual Migration
If automated migrations fail, use the emergency endpoint:
```javascript
fetch('https://your-domain/api/emergency-migration/run', {
  method: 'POST'
}).then(r => r.json()).then(console.log)
```

## Example Workflow

Adding a new feature with database changes:

```bash
# 1. Update schema
vim shared/schema.ts

# 2. Generate migration
npm run db:generate

# 3. Check the migration
cat migrations/0001_new_feature.sql

# 4. Commit and push
git add .
git commit -m "feat: Add new feature with database changes"
git push origin main

# 5. Railway automatically:
#    - Deploys code
#    - Runs migrations
#    - Starts server
```

## Migration Runner Details

The migration runner (`scripts/run-migrations.ts`):
- Connects to DATABASE_URL
- Reads migrations from `./migrations` folder
- Applies pending migrations in order
- Tracks applied migrations in `drizzle.__drizzle_migrations` table
- Exits with error code if migration fails (prevents server start)

## Production Safety

✅ **Safe Operations:**
- Adding new columns (with defaults)
- Adding new tables
- Creating indexes
- Adding constraints (if data is valid)

⚠️ **Risky Operations:**
- Dropping columns (data loss)
- Renaming columns (requires data migration)
- Changing column types (may fail with existing data)
- Adding NOT NULL constraints (fails if existing nulls)

Always test risky migrations on a staging database first!

