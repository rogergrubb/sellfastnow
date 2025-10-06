# SellFast.Now - Local Classified Ads Marketplace

## Overview

SellFast.Now is a local classified ads marketplace platform connecting buyers and sellers within their local area. It emphasizes intuitive browsing, quick listing scans, and efficient transactions, drawing inspiration from platforms like Facebook Marketplace and Craigslist. Key capabilities include comprehensive listing management, real-time messaging, a favorites system, and a mobile-optimized user interface, all designed to facilitate seamless local commerce.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend

- **Framework:** React 18 with TypeScript.
- **Build:** Vite for performance.
- **Routing:** Wouter.
- **Data Fetching:** TanStack Query.
- **UI:** Shadcn/ui (Radix UI-based) with Tailwind CSS, supporting light/dark modes and a "scan-first" interface.

### Backend

- **Framework:** Express.js with Node.js.
- **Database:** PostgreSQL via Neon (serverless), with Drizzle ORM for type-safe queries.
- **API:** RESTful, with consistent error handling and CORS configured.
- **Data Models:** Users, Listings, Messages, Favorites, Sessions.

### Authentication & Authorization

- **Provider:** Clerk Authentication with Google OAuth.
- **Security:** Session-based, secure HTTP-only cookies, JWT validation, HTTPS-only, CSRF protection.

### Image Storage

- **Provider:** Cloudinary for cloud-based storage, optimization, and CDN.
- **Upload:** Multer with CloudinaryStorage, supporting single and multiple image uploads (up to 10 images, 5MB limit per file).

### Key Features

- **My Listings Dashboard:** Provides a comprehensive overview and management of user listings with stats, filtering, sorting, and actions (edit, mark as sold, delete).
- **AI-Powered Product Identification:** Utilizes OpenAI GPT-5 Vision API to identify products from uploaded photos, generating titles, descriptions, and price estimates. Supports multi-product detection for creating separate or bundled listings with intelligent pricing.
- **Intelligent Listing Creation (AI Coaching):** Streamlines the listing process with flexible photo upload, AI-driven category assignment, description coaching (strength meter, enhancement suggestions), and market-based pricing recommendations. Includes a "Seller Academy" sidebar with tips and success metrics, and educational messages during AI analysis. Supports graceful fallback with mock data if OpenAI API is unavailable.
- **QR Code Phone-to-Desktop Upload:** Enables seamless cross-device photo uploads by displaying a QR code on the desktop for mobile scanning and real-time image transfer.
- **AI Usage Tracking & Monetization:** Implements a free tier (5 AI analyses/month) with monthly resets, and an option to purchase additional AI credits via Stripe. Tracks usage, manages subscriptions, and integrates with Stripe for payments and webhooks.
- **Review System:** Allows buyers and sellers to leave reviews with public response capability.
- **Advanced Review Filtering and Sorting:** Enhances user profiles with comprehensive review filtering and sorting options.
- **Offer System:** Facilitates buyer offers and seller responses (accept, decline, counter, withdraw).
- **Statistics Dashboard:** Provides detailed user statistics covering buying, selling, activity, communication, and verification.
- **Cancellation Response System:** Enables responses to transaction cancellations with specific authorization rules.
- **Transaction Cancellation System:** Secure process for buyers/sellers to cancel transactions with reasons and comments.
- **Transaction History Page:** Displays a filterable history of all user transactions.
- **Automatic Statistics Updates:** Uses database triggers to update user statistics based on transaction events.

## External Dependencies

- **Database:** Neon (PostgreSQL)
- **Authentication:** Clerk
- **Image CDN:** Cloudinary
- **AI/ML:** OpenAI API (GPT-5 Vision)
- **Payments:** Stripe