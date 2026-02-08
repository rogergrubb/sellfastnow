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
- Build status: ✅ FIXED (Feb 8, 2026)
- Test status: ✅ AI diagnostic passing
- Deployment status: Live on Railway
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

## 6. Debug History (High Signal Only)

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

## 8. Failed Approaches (Do Not Retry)
- `gemini-2.0-flash-exp` - Deprecated, 404 error
- `gemini-1.5-flash` - Deprecated April 2025
- `gemini-1.5-flash-latest` - Also deprecated

## 9. Open Questions / Unknowns
- When will `gemini-2.0-flash` be deprecated? Monitor Google AI announcements
- Consider switching to `gemini-2.5-flash` for future-proofing

## 10. Next Actions
1. ✅ AI evaluation fixed and tested
2. Monitor for any new user reports of AI issues
3. Consider adding model version to diagnostic output for easier debugging
4. Consider implementing model fallback logic in case of future deprecations
