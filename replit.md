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

**Payment Integration (Prepared):**
- Stripe (scaffolded in schema)

**Third-Party Libraries:**
- @radix-ui/* (Accessible UI primitives)
- Tailwind CSS
- Drizzle ORM
- TanStack Query
- Zod (Runtime type validation)
- React Hook Form

**Development Tools:**
- TypeScript
- Vite plugins (Runtime error modal, Replit cartographer, dev banner)
- ESBuild