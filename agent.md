# Agent Memory – SellFast.Now

## 1. Project Overview
- Marketplace platform for buying/selling items with AI-powered listings
- Features: trust scoring, AI product analysis, real-time messaging, featured listings
- Live at: https://sellfast.now
- Repo: https://github.com/rogergrubb/sellfastnow

## 2. Definition of Done (DoD)
- AI product evaluation working in production
- Users can upload photos and receive AI-generated titles, descriptions, pricing
- Featured listings with Stripe payments functional
- Real-time messaging operational

## 3. Current State
- Build status: ✅ FIXED (Feb 27, 2026)
- Test status: ✅ AI diagnostic passing
- Deployment status: Pending deployment with QA bug fixes
- Known blockers: None currently

## 4. Architecture & Design Decisions
- Frontend: React with Vite
- Backend: Express/Node.js
- Database: Supabase (PostgreSQL)
- AI: Google Gemini API (`gemini-2.0-flash` model)
- Payments: Stripe
- Hosting: Railway (auto-deploys from GitHub main branch)

## 5. Known Issues & Landmines
- **Gemini API model names expire**: Google deprecates models regularly
  - `gemini-2.0-flash-exp` → Deprecated Dec 2025
  - `gemini-1.5-flash` → Deprecated April 2025
  - Current working model: `gemini-2.0-flash`
- Railway deploy takes 2-3 minutes after GitHub push
- GitHub raw.githubusercontent.com caches files; use API for fresh content
- **Drizzle relations not defined**: The `with` clause in queries won't work without proper relations. Use manual SQL joins instead.

## 6. Debug History (High Signal Only)

### Feb 27, 2026: QA Bug Fixes (8 bugs)
- **Bug 1**: /categories 404 → Created Categories.tsx page with category grid
- **Bug 2**: Purchases showing "Item" and no seller → Fixed transactions/buyer endpoint to use manual SQL joins instead of broken Drizzle `with` clause
- **Bug 3**: /resources 404 (11 footer links) → Created Resources.tsx page with About, Contact, Terms, Privacy, Guidelines sections
- **Bug 4**: Footer /buy 404 → Changed to /search
- **Bug 5**: Contact Us button no action → Added navigation to /resources#contact
- **Bug 6**: Map toggle not working → Added location prompt when switching to map without location set
- **Bug 7**: /how-it-works Start Selling → Changed /post to /post-ad
- **Bug 8**: Homepage Browse Listings button → Converted to Link component for reliable navigation

### Feb 8, 2026: AI Evaluation Broken
- **Symptom**: Users report "SellFast is broken", AI evaluation not working
- **Diagnostic URL**: https://sellfast.now/api/ai/diagnostic
- **Root cause**: Model `gemini-2.0-flash-exp` was deprecated/removed by Google
  - Error: `[404 Not Found] models/gemini-2.0-flash-exp is not found for API version v1beta`
- **Resolution**: Updated all model references to `gemini-2.0-flash`
  - Files changed: `server/aiService.ts`, `server/routes/ai.ts`
  - Commits: `9befd8b`, `10ffbe2`

### Dec 2025: Gemini Quota Exhausted
- Model `gemini-2.0-flash-exp` hit free tier quota limits
- Attempted switch to `gemini-1.5-flash` but that model was also deprecated

## 7. Proven Patterns
- Use `/api/ai/diagnostic` endpoint to test Gemini API connectivity
- Push via GitHub API when git clone fails (network proxy issues)
- Wait 2-3 minutes for Railway to fully deploy changes
- Use GitHub API (not raw.githubusercontent.com) to verify file content immediately after push
- **Use manual SQL joins** instead of Drizzle `with` clause when relations aren't defined

## 8. Failed Approaches (Do Not Retry)
- `gemini-2.0-flash-exp` - Deprecated, 404 error
- `gemini-1.5-flash` - Deprecated April 2025
- `gemini-1.5-flash-latest` - Also deprecated
- Drizzle `with` clause for transactions → No relations defined, doesn't work

## 9. Open Questions / Unknowns
- When will `gemini-2.0-flash` be deprecated? Monitor Google AI announcements
- Consider switching to `gemini-2.5-flash` for future-proofing
- Should we add proper Drizzle relations for all tables?

## 10. Next Actions
1. ✅ QA bug fixes complete (8 bugs fixed)
2. Deploy changes to production via GitHub push
3. Test all fixed routes in production
4. Monitor for any new user reports
