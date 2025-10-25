// Centralized Stripe Client
// Single instance of Stripe client to be reused across the application

import { Stripe } from "stripe";
import { STRIPE_CONFIG, validateStripeEnv } from "./config/stripe.config";

// Validate environment variables on import
const envCheck = validateStripeEnv();
if (!envCheck.valid) {
  console.error("❌ Missing required Stripe environment variables:", envCheck.missing);
  throw new Error(`Missing required Stripe environment variables: ${envCheck.missing.join(', ')}`);
}

// Create single Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: STRIPE_CONFIG.API_VERSION,
});

console.log("✅ Stripe client initialized successfully");

