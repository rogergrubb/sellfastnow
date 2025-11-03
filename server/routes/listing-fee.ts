import { Router } from "express";
import { stripe } from "../stripe";
import { isAuthenticated } from "../supabaseAuth";

const router = Router();

/**
 * POST /api/listing-fee/create-payment-intent
 * Create a Stripe payment intent for the 3% listing fee
 */
router.post("/create-payment-intent", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.auth.userId;
    const { listingPrice, listingTitle } = req.body;

    if (!listingPrice || listingPrice < 50) {
      return res.status(400).json({ 
        error: "Listing fee only applies to items $50 and above" 
      });
    }

    // Calculate 3% listing fee
    const listingFee = listingPrice * 0.03;
    const feeInCents = Math.round(listingFee * 100);

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: feeInCents,
      currency: "usd",
      metadata: {
        type: "listing_fee",
        userId,
        listingPrice: listingPrice.toString(),
        listingTitle: listingTitle || "Untitled",
      },
      description: `SellFast.Now Listing Fee (3%) for $${listingPrice} item`,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log(`💳 Created payment intent for listing fee: $${listingFee.toFixed(2)} (3% of $${listingPrice})`);

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      listingFee: listingFee.toFixed(2),
      listingPrice,
    });
  } catch (error: any) {
    console.error("Error creating listing fee payment intent:", error);
    res.status(500).json({ 
      error: "Failed to create payment intent",
      message: error.message 
    });
  }
});

/**
 * GET /api/listing-fee/verify/:paymentIntentId
 * Verify a payment intent status
 */
router.get("/verify/:paymentIntentId", isAuthenticated, async (req: any, res) => {
  try {
    const { paymentIntentId } = req.params;
    const userId = req.auth.userId;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Verify it belongs to this user
    if (paymentIntent.metadata.userId !== userId) {
      return res.status(403).json({ error: "Payment does not belong to this user" });
    }

    res.json({
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      listingPrice: parseFloat(paymentIntent.metadata.listingPrice || "0"),
    });
  } catch (error: any) {
    console.error("Error verifying payment intent:", error);
    res.status(500).json({ 
      error: "Failed to verify payment",
      message: error.message 
    });
  }
});

export default router;
