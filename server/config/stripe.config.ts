// Stripe Configuration
// Centralized configuration for Stripe-related settings

export const STRIPE_CONFIG = {
  // Credit Bundles - Pricing and names
  CREDIT_BUNDLES: {
    25: { price: 2.99, name: "25 AI Credits" },
    50: { price: 4.99, name: "50 AI Credits" },
    75: { price: 6.99, name: "75 AI Credits" },
    100: { price: 8.99, name: "100 AI Credits" },
    500: { price: 39.99, name: "500 AI Credits" },
  } as Record<number, { price: number; name: string }>,

  // Platform Fee (5%)
  PLATFORM_FEE_PERCENTAGE: 0.05,

  // API Version
  API_VERSION: "2025-09-30.clover" as const,

  // Rate Limits (requests per time window)
  RATE_LIMITS: {
    ACCOUNT_CREATION: {
      max: 5,
      windowMs: 60 * 60 * 1000, // 1 hour
    },
    PAYMENT_INTENT: {
      max: 10,
      windowMs: 60 * 1000, // 1 minute
    },
    CHECKOUT_SESSION: {
      max: 20,
      windowMs: 60 * 1000, // 1 minute
    },
  },
} as const;

// Validation function to ensure required environment variables are set
export function validateStripeEnv(): { valid: boolean; missing: string[] } {
  const required = [
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
  ];

  const missing = required.filter(key => !process.env[key]);

  return {
    valid: missing.length === 0,
    missing,
  };
}

// Helper to calculate platform fee
export function calculatePlatformFee(amount: number): number {
  return amount * STRIPE_CONFIG.PLATFORM_FEE_PERCENTAGE;
}

// Helper to get base URL for redirects
export function getBaseUrl(): string {
  return process.env.FRONTEND_URL 
    || (process.env.NODE_ENV === 'production' 
      ? 'https://sellfast.now' 
      : 'http://localhost:5000');
}

