# Environment Variables Reference

## Quick Reference Table

| Variable | Required | Default | Description | Where to Get |
|----------|----------|---------|-------------|--------------|
| `DATABASE_URL` | ✅ Yes | - | PostgreSQL connection string | Auto-provided by Railway Postgres |
| `SESSION_SECRET` | ✅ Yes | - | Secret for session encryption | Generate: `openssl rand -base64 32` |
| `NODE_ENV` | ✅ Yes | `development` | Environment mode | Set to `production` |
| `PORT` | ✅ Yes | `5000` | Server port | Auto-assigned by Railway |
| `REPLIT_DOMAINS` | ⚠️ Migration | - | OAuth callback domains | `https://${{RAILWAY_PUBLIC_DOMAIN}}` |
| `ISSUER_URL` | ⚠️ Migration | - | OIDC issuer URL | Needs auth provider migration |
| `REPL_ID` | ⚠️ Migration | - | Replit application ID | Needs auth provider migration |
| `PUBLIC_OBJECT_SEARCH_PATHS` | ⚠️ Migration | - | Public storage paths | After storage setup |
| `PRIVATE_OBJECT_DIR` | ⚠️ Migration | - | Private storage directory | After storage setup |
| `DEFAULT_OBJECT_STORAGE_BUCKET_ID` | ⚠️ Migration | - | Default bucket ID | After storage setup |
| `OPENAI_API_KEY` | ⬜ Optional | - | OpenAI API key for AI coaching | [platform.openai.com](https://platform.openai.com) |
| `STRIPE_SECRET_KEY` | ⬜ Optional | - | Stripe secret key | [dashboard.stripe.com](https://dashboard.stripe.com) |
| `VITE_STRIPE_PUBLIC_KEY` | ⬜ Optional | - | Stripe publishable key | [dashboard.stripe.com](https://dashboard.stripe.com) |
| `RESEND_API_KEY` | ⬜ Optional | - | Resend API key for emails | [resend.com](https://resend.com) |

## Railway Variable Configuration

### Minimal Setup (Just to Get Started)

Add these 4 variables in Railway dashboard:

```bash
DATABASE_URL=${{Postgres.DATABASE_URL}}
SESSION_SECRET=<generate-with-openssl-rand-base64-32>
NODE_ENV=production
PORT=${{PORT}}
```

### With Optional Features

```bash
# Core (required)
DATABASE_URL=${{Postgres.DATABASE_URL}}
SESSION_SECRET=<generate-with-openssl-rand-base64-32>
NODE_ENV=production
PORT=${{PORT}}

# Auth (needs migration - see DEPLOYMENT.md)
REPLIT_DOMAINS=https://${{RAILWAY_PUBLIC_DOMAIN}}

# AI Listing Coaching (optional)
OPENAI_API_KEY=sk-proj-...

# Payments (optional)
STRIPE_SECRET_KEY=sk_live_...
VITE_STRIPE_PUBLIC_KEY=pk_live_...

# Email (optional - needs code update)
RESEND_API_KEY=re_...

# Object Storage (needs migration - see DEPLOYMENT.md)
PUBLIC_OBJECT_SEARCH_PATHS=public/images,public/avatars
PRIVATE_OBJECT_DIR=.private
```

## Environment Variable Categories

### 🔴 Critical (App won't start without these)

| Variable | How to Set |
|----------|------------|
| `DATABASE_URL` | Railway auto-provides when you add PostgreSQL |
| `SESSION_SECRET` | Run `openssl rand -base64 32` and paste result |
| `NODE_ENV` | Set to `production` |

### 🟡 Migration Required (Replit-specific)

These work on Replit but need replacement for Railway:

| Variable | Current Use | Railway Alternative |
|----------|-------------|---------------------|
| `REPLIT_DOMAINS` | OAuth callbacks | Configure with Auth0/Clerk domain |
| `ISSUER_URL` | OIDC provider | Auth0: `https://your-domain.auth0.com` |
| `REPL_ID` | Replit auth ID | Auth0 Client ID or Clerk App ID |
| `PUBLIC_OBJECT_SEARCH_PATHS` | Object storage paths | Configure after GCS/S3/Cloudinary setup |
| `PRIVATE_OBJECT_DIR` | Private storage | Configure after storage setup |

**Action Required:** See migration guides in `DEPLOYMENT.md`

### 🟢 Optional (Features work without these)

| Variable | Feature Enabled | Fallback Behavior |
|----------|----------------|-------------------|
| `OPENAI_API_KEY` | AI listing coaching with real AI | Uses realistic mock data |
| `STRIPE_SECRET_KEY` | Payment processing | Payment features disabled |
| `RESEND_API_KEY` | Email notifications | Email features disabled |

## Variable Validation Checklist

Before deploying, verify:

- [ ] `DATABASE_URL` contains `postgresql://` connection string
- [ ] `SESSION_SECRET` is at least 32 characters long
- [ ] `NODE_ENV` is set to `production`
- [ ] `PORT` is set (Railway auto-assigns)
- [ ] Optional: `OPENAI_API_KEY` starts with `sk-proj-` or `sk-`
- [ ] Optional: `STRIPE_SECRET_KEY` starts with `sk_live_` or `sk_test_`
- [ ] Optional: `RESEND_API_KEY` starts with `re_`

## Auto-Reference Variables (Railway-specific)

Railway allows you to reference other services:

```bash
# Reference PostgreSQL database URL
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Reference your own public domain
REPLIT_DOMAINS=https://${{RAILWAY_PUBLIC_DOMAIN}}

# Reference current service port
PORT=${{PORT}}

# Reference custom variable from another service
BACKEND_URL=${{Backend.RAILWAY_PUBLIC_DOMAIN}}
```

## Security Best Practices

✅ **DO:**
- Generate SESSION_SECRET using cryptographic random
- Use environment variables for all secrets
- Use `sk_live_` Stripe keys for production
- Rotate secrets periodically

❌ **DON'T:**
- Commit `.env` file to git (use `.env.example`)
- Share SESSION_SECRET publicly
- Use test API keys in production
- Hardcode secrets in source code

## Generating Secure Secrets

### Session Secret
```bash
# Generate 32-byte base64 secret
openssl rand -base64 32

# Example output:
# 9xP4kL8nM2vQ5wR7tY1zA3bC6dE9fG2hJ4kL7mN0pQ3r
```

### Random String
```bash
# Generate UUID
uuidgen

# Generate random hex
openssl rand -hex 20
```

## Testing Environment Variables

### Local Testing
```bash
# Create .env file
cp .env.example .env

# Edit .env with your values
nano .env

# Test locally
npm run dev
```

### Railway Testing
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# Pull production env vars
railway variables

# Run locally with production vars
railway run npm run dev
```

## Common Issues

### Issue: "DATABASE_URL must be set"
**Solution:** Ensure PostgreSQL is added to Railway project and DATABASE_URL is set to `${{Postgres.DATABASE_URL}}`

### Issue: "Session secret is required"
**Solution:** Generate secret with `openssl rand -base64 32` and add to Railway variables

### Issue: "Object storage error"
**Solution:** Object storage needs migration - see DEPLOYMENT.md. App will run but image uploads won't work.

### Issue: "Authentication fails"
**Solution:** Auth needs migration from Replit OIDC - see DEPLOYMENT.md

## Migration Priority

When deploying to Railway, migrate in this order:

1. **✅ Database** - Works immediately with Railway PostgreSQL
2. **✅ Session Storage** - Already uses PostgreSQL (works automatically)
3. **⚠️ Authentication** - CRITICAL: Migrate from Replit OIDC to Auth0/Clerk
4. **⚠️ Object Storage** - Important for image uploads
5. **⬜ Email** - Nice to have for notifications
6. **⬜ AI Features** - Optional enhancement
7. **⬜ Payments** - Optional feature

---

For detailed migration steps, see **DEPLOYMENT.md**
