import { Router } from "express";

const router = Router();

/**
 * GET /api/stripe-diagnostic
 * Diagnostic endpoint to check Stripe configuration
 */
router.get("/", async (req, res) => {
  try {
    const diagnostics = {
      stripeSecretKeyExists: !!process.env.STRIPE_SECRET_KEY,
      stripeSecretKeyLength: process.env.STRIPE_SECRET_KEY?.length || 0,
      stripeSecretKeyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 7) || 'none',
      stripeWebhookSecretExists: !!process.env.STRIPE_WEBHOOK_SECRET,
      nodeEnv: process.env.NODE_ENV,
      canImportStripeModule: false,
      stripeModuleError: null as string | null,
    };

    // Try to import the Stripe module
    try {
      const { stripe } = await import("../stripe");
      diagnostics.canImportStripeModule = true;
      
      // Try to list a payment intent (should fail but tells us if Stripe is working)
      try {
        await stripe.paymentIntents.list({ limit: 1 });
      } catch (stripeError: any) {
        diagnostics.stripeModuleError = `Stripe API call failed: ${stripeError.message}`;
      }
    } catch (importError: any) {
      diagnostics.stripeModuleError = `Failed to import Stripe module: ${importError.message}`;
    }

    res.json(diagnostics);
  } catch (error: any) {
    res.status(500).json({
      error: "Diagnostic failed",
      message: error.message,
      stack: error.stack,
    });
  }
});

export default router;
