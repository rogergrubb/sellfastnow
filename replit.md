# SellFast.Now - Local Classified Ads Marketplace

## Overview

SellFast.Now is a local classified ads marketplace platform designed to connect buyers and sellers in their local area. Inspired by platforms like Facebook Marketplace and Craigslist, it focuses on intuitive browsing, quick listing scans, and efficient transactions. Key features include listing management, real-time messaging, a favorites system, and a mobile-optimized user interface. The platform aims to provide a seamless experience for local commerce.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System:**
- React 18 with TypeScript.
- Vite for fast HMR and optimized builds.
- Wouter for client-side routing.
- TanStack Query for server state management and data fetching.

**UI Component System:**
- Shadcn/ui component library based on Radix UI.
- Tailwind CSS for utility-first styling, with custom design tokens.
- "New-york" style variant with neutral base colors and light/dark mode support.
- Emphasis on a scan-first interface and clear visual hierarchy.

**State Management Approach:**
- Server state managed via TanStack Query.
- Local UI state handled with React hooks.
- Authentication state synchronized with backend sessions.

### Backend Architecture

**Server Framework:**
- Express.js with Node.js and ES modules.
- Custom middleware for request logging and error handling.

**Database Layer:**
- PostgreSQL via Neon serverless database.
- Drizzle ORM for type-safe queries and migrations.
- Schema-first design with TypeScript types derived from the database.

**Data Models:**
- Users (with Replit authentication and Stripe integration).
- Listings (category, pricing, condition, location).
- Messages (direct messaging).
- Favorites (user-saved listings).
- Sessions (authentication persistence).

**API Design:**
- RESTful API endpoints.
- Consistent error handling and HTTP status codes.
- Request/response logging.
- Configured CORS and security middleware.

### Authentication & Authorization

- **Replit Authentication Integration:** OpenID Connect (OIDC) via Replit, using Passport.js.
- **Security Measures:** Session-based authentication with secure HTTP-only cookies, PostgreSQL session store, HTTPS-only in production, CSRF protection, secure WebSocket connections.

### Object Storage

- **Google Cloud Storage Integration:** Via Replit's Object Storage sidecar service.
- **File Management:** Image uploads for listings, custom ACL system for object-level permissions, public/private visibility, owner-based access control.

### Feature Specifications

- **Intelligent Listing Creation (AI-Powered Coaching):** Revolutionary listing creation experience that educates users to be better sellers through AI-powered coaching across 5 phases:
  - **Phase 1 - Smart Photo Upload:** Real-time quality analysis of uploaded photos with scores for lighting, focus, framing, and background. Progressive tips teach photography best practices (natural light, clean backgrounds, multiple angles, close-ups, size reference).
  - **Phase 2 - Description Coaching:** Strength meter (0-10) analyzes descriptions and identifies missing information. AI-generated enhanced descriptions available with one click. Suggestions include adding measurements, materials, condition details, and purchase history.
  - **Phase 3 - Pricing Intelligence:** Market-based pricing recommendations with "Sell Fast" and "Maximize Value" strategies. Pricing psychology tips (e.g., $99 vs $100). Mock market data when OpenAI API key unavailable.
  - **Phase 4 - Real-time Quality Score:** Live 0-100 score that updates as users fill the form. Gamification with achievements: "Photographer Pro" (5+ photos), "Perfect Shot" (90+ photo score), "Master Wordsmith" (8+ description score), "Listing Legend" (90+ overall score), "Perfection Achieved!" (100 score).
  - **Phase 5 - Seller Academy:** Sidebar with Quick Tips (photo essentials, description must-haves, pricing psychology) and Success Stats showing impact metrics (+67% views with 5+ photos, +45% sales with detailed descriptions, 3x faster sale with competitive pricing).
  - **Skip to Simple Form:** One-click toggle to bypass all AI coaching and use a traditional listing form. Users can switch between coached and simple modes at any time.
  - **Graceful Fallback:** Works without OpenAI API key by using realistic mock data for all AI analysis endpoints, ensuring feature availability even without AI credentials.
- **Review System:** Public response capability for reviews with a 24-hour edit window and 500-character limit.
- **Advanced Review Filtering and Sorting:** UI on user profiles with filtering by stars, role, period, and sorting options. Includes active filter badges, clear-all functionality, and URL parameter persistence.
- **Offer System:** Buyers can make offers, and sellers can accept, decline, counter, or withdraw offers. Includes displaying seller/buyer statistics and recommendations during the offer process.
- **Statistics Dashboard:** Comprehensive dashboard on user profiles with sections for Overall Summary, As Buyer, As Seller, Recent Activity, Communication & Timing, Reviews Received, and Verification Status. Features visual indicators, color-coded metrics, and monthly transaction breakdowns.
- **Cancellation Response System:** Bidirectional response capability for cancellation comments with authorization rules to ensure only the non-cancelling party can respond.
- **Transaction Cancellation System:** Secure cancellation feature for buyers and sellers with reason selection, optional comments, and server-side role validation and eligibility checks.
- **Transaction History Page:** Comprehensive page displaying filterable transaction lists, status badges, listing details, other party info, reviews, and cancellation comments.
- **Automatic Statistics Updates:** Database triggers for automatic user statistics updates on transaction events, including completion, cancellation, no-show tracking, and review aggregation, recalculating success rates dynamically.

## External Dependencies

**Core Infrastructure:**
- Neon Database (PostgreSQL)
- Replit Authentication (OAuth/OIDC)
- Google Cloud Storage (via Replit sidecar)
- Replit Object Storage

**AI & Machine Learning (Optional):**
- OpenAI API (gpt-5 model for intelligent listing coaching)
- Falls back to realistic mock data when API key unavailable

**Payment Integration (Prepared):**
- Stripe (scaffolded in schema)

**Third-Party Libraries:**
- @radix-ui/* (Accessible UI primitives)
- Tailwind CSS
- Drizzle ORM
- TanStack Query
- Zod (Runtime type validation)
- React Hook Form
- OpenAI SDK (for AI-powered listing coaching)

**Development Tools:**
- TypeScript
- Vite plugins (Runtime error modal, Replit cartographer, dev banner)
- ESBuild