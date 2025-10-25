// Rate Limiting Middleware
// Prevents abuse of API endpoints

import rateLimit from 'express-rate-limit';
import { STRIPE_CONFIG } from '../config/stripe.config';

// Generic rate limiter factory
export function createRateLimiter(max: number, windowMs: number, message?: string) {
  return rateLimit({
    windowMs,
    max,
    message: message || `Too many requests, please try again later.`,
    standardHeaders: true,
    legacyHeaders: false,
    // Use user ID if authenticated, otherwise IP
    keyGenerator: (req: any) => {
      return req.auth?.userId || req.ip;
    },
  });
}

// Stripe-specific rate limiters
export const stripeAccountCreationLimiter = createRateLimiter(
  STRIPE_CONFIG.RATE_LIMITS.ACCOUNT_CREATION.max,
  STRIPE_CONFIG.RATE_LIMITS.ACCOUNT_CREATION.windowMs,
  'Too many account creation attempts. Please try again later.'
);

export const stripePaymentIntentLimiter = createRateLimiter(
  STRIPE_CONFIG.RATE_LIMITS.PAYMENT_INTENT.max,
  STRIPE_CONFIG.RATE_LIMITS.PAYMENT_INTENT.windowMs,
  'Too many payment attempts. Please try again later.'
);

export const stripeCheckoutSessionLimiter = createRateLimiter(
  STRIPE_CONFIG.RATE_LIMITS.CHECKOUT_SESSION.max,
  STRIPE_CONFIG.RATE_LIMITS.CHECKOUT_SESSION.windowMs,
  'Too many checkout attempts. Please try again later.'
);

// Messaging rate limiter (20 messages per minute)
export const messageSendLimiter = createRateLimiter(
  20,
  60 * 1000,
  'You are sending messages too quickly. Please slow down.'
);

// General API rate limiter (100 requests per minute)
export const generalApiLimiter = createRateLimiter(
  100,
  60 * 1000,
  'Too many requests. Please try again later.'
);



// Phone verification rate limiter (10 requests per hour)
export const phoneVerificationLimiter = createRateLimiter(
  10,
  60 * 60 * 1000,
  'Too many verification attempts. Please try again later.'
);

// Export all rate limiters
export const rateLimiters = {
  stripeAccount: stripeAccountCreationLimiter,
  stripePayment: stripePaymentIntentLimiter,
  stripeCheckout: stripeCheckoutSessionLimiter,
  messageSend: messageSendLimiter,
  generalApi: generalApiLimiter,
  phoneVerification: phoneVerificationLimiter,
};

