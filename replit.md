# SellFast.Now - Local Classified Ads Marketplace

## Overview

SellFast.Now is a local classified ads marketplace platform that enables users to buy and sell items in their area. The application draws inspiration from Facebook Marketplace and Craigslist, emphasizing intuitive browsing, quick scanning of listings, and efficient transactions. The platform features listing management, real-time messaging between buyers and sellers, favorites functionality, and a clean, mobile-optimized interface.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**October 4, 2025 - Cancellation Response System**
- Implemented bidirectional response capability for cancellation comments
- Created RespondToCancellationModal component with 500-character limit and public/private toggle
- Built API endpoint POST /api/cancellations/:commentId/response with comprehensive authorization
- Security: Properly identifies buyer from transaction events and seller from listing, validates both as participants
- Authorization: Only the non-cancelling party can respond; canceller and third parties blocked with 403
- One response per user enforcement: responseByUserId check prevents multiple responses
- UI integration: "Respond to Comment" button in TransactionHistory, displays responses below original comments
- Character limit validation: Real-time counter, red styling over 500 chars, button disabled when invalid
- E2E tested: Both buyer-responds and seller-responds scenarios, security checks (canceller/third-party blocks)
- Fixed critical authorization bug: Initially failed when seller cancelled (buyer couldn't respond), resolved by fetching buyer from transaction events

**October 3, 2025 - Transaction Cancellation System**
- Implemented secure transaction cancellation feature for buyers and sellers
- Created CancelTransactionModal component with reason dropdown (8 categories), optional comment (500 char limit), public/private toggle
- Built API endpoint POST /api/listings/:listingId/cancel with comprehensive security checks
- Security: Backend derives user role server-side, validates transaction participation, enforces canCancelTransaction eligibility
- Cancellation timing calculation utility (early/on-time/late based on scheduled meetup time)
- Creates transaction events and optional cancellation comments in database
- Integrated into ListingDetail page with "Cancel Transaction" button (only shown when eligible)
- E2E tested: cancellation flow, role verification, database persistence, UI updates
- Fixed critical security vulnerability: removed client-controlled role selection, all authorization now server-side

**October 3, 2025 - Transaction History Page**
- Created comprehensive transaction history page at `/users/:userId/history`
- Features: filterable transaction list (status, role), status badges (completed/cancelled/no-show), transaction cards with listing details
- Displays: other party info with ratings, reviews from both parties, cancellation comments with timing
- Filter bar updates URL params and triggers re-fetch for persistent filter state
- Empty state with "Browse Listings" CTA for users with no transactions
- Navigation to user profiles and listing details from transaction cards
- Mobile responsive with flex-wrap layouts
- Fixed database trigger ambiguous column reference in review aggregation function

**October 3, 2025 - Automatic Statistics Updates System**
- Implemented database triggers for automatic user statistics updates on transaction events
- Created trigger functions: completion tracking, cancellation tracking, no-show tracking, review aggregation
- Added `recalculate_success_rates()` SQL function for automatic percentage calculations
- Built API endpoints for manual statistics updates and recalculation
- Statistics now auto-update for: successful sales/purchases, cancellations, no-shows, review counts/averages
- Success rates (seller, buyer, overall) calculated automatically on every transaction change
- Tested and verified: 3 completions increment counters correctly, cancellations update both parties

**October 3, 2025 - Review System Type Safety & Bug Fixes**
- Created shared `ReviewWithMetadata` type in schema for type-safe reviewer metadata across frontend/backend
- Fixed backend `getUserReviews()` to return properly typed `ReviewWithMetadata[]` with joined reviewer info
- Updated UserProfile and ReviewCard components to use `ReviewWithMetadata` type consistently
- Fixed ReviewCard optimistic update logic to preserve reviewer metadata during vote mutations
- Fixed critical API bug in LeaveReviewModal where fetch parameters were in wrong order (method/url swapped)
- All review interactions now maintain type safety and preserve reviewer name/avatar throughout optimistic updates

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server for fast HMR and optimized production builds
- Wouter for client-side routing (lightweight alternative to React Router)
- TanStack Query (React Query) for server state management and data fetching

**UI Component System**
- Shadcn/ui component library based on Radix UI primitives
- Tailwind CSS for utility-first styling with custom design tokens
- Design system follows the "new-york" style variant with neutral base colors
- Custom CSS variables for theming with light/dark mode support
- Design emphasizes scan-first interface with clear visual hierarchy

**State Management Approach**
- Server state managed via TanStack Query with custom query client configuration
- Local UI state handled with React hooks
- Authentication state synchronized with backend sessions

### Backend Architecture

**Server Framework**
- Express.js as the HTTP server framework
- Node.js runtime with ES modules
- Custom middleware for request logging and error handling

**Database Layer**
- PostgreSQL via Neon serverless database
- Drizzle ORM for type-safe database queries and migrations
- Schema-first design with TypeScript types derived from database schema
- Connection pooling via @neondatabase/serverless with WebSocket support

**Data Models**
- Users: Core user profiles with Replit authentication integration and optional Stripe payment info
- Listings: Marketplace items with category, pricing, condition, and location data
- Messages: Direct messaging between users for listing inquiries
- Favorites: User-saved listings for quick access
- Sessions: Secure session storage for authentication persistence

**API Design**
- RESTful API endpoints organized by resource type (listings, messages, favorites, auth)
- Consistent error handling with appropriate HTTP status codes
- Request/response logging for debugging and monitoring
- CORS and security middleware configured for production

### Authentication & Authorization

**Replit Authentication Integration**
- OpenID Connect (OIDC) based authentication via Replit
- Passport.js strategy for OAuth flow management
- Session-based authentication with secure HTTP-only cookies
- PostgreSQL session store with configurable TTL (7 days default)
- User profile synchronization from Replit claims (email, name, profile image)

**Security Measures**
- Session secrets for cookie encryption
- HTTPS-only cookies in production
- CSRF protection through session validation
- Secure WebSocket connections for real-time features

### Object Storage

**Google Cloud Storage Integration**
- Integration with Replit's Object Storage sidecar service
- External account authentication via token exchange
- Custom ACL (Access Control List) system for object-level permissions
- Support for public/private visibility on uploaded files
- Owner-based access control for user-uploaded images

**File Management**
- Image uploads for listing photos
- Metadata storage for ACL policies
- Public/private object access patterns

### External Dependencies

**Core Infrastructure**
- Neon Database: Serverless PostgreSQL hosting
- Replit Authentication: OAuth/OIDC identity provider
- Google Cloud Storage: Object storage via Replit sidecar
- Replit Object Storage: File upload and management service

**Payment Integration (Prepared)**
- Stripe integration scaffolded in schema (customer ID, subscription ID fields)
- Ready for premium features or transaction fees

**Third-Party Libraries**
- @radix-ui/* packages: Accessible UI primitives
- Tailwind CSS: Utility-first styling framework
- Drizzle ORM: Type-safe database toolkit
- TanStack Query: Server state management
- Zod: Runtime type validation for forms and API inputs
- React Hook Form: Form state management with validation

**Development Tools**
- TypeScript: Static type checking across full stack
- Vite plugins: Runtime error modal, Replit cartographer, dev banner
- ESBuild: Fast production bundling for server code