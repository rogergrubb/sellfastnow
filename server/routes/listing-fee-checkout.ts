import { Router } from "express";
import { stripe } from "../stripe";
import { isAuthenticated } from "../supabaseAuth";

const router = Router();

/**
 * POST /api/listing-fee/create-checkout-session
 * Create a Stripe Checkout session for listing fee payment
 * Fee structure: Free for items under $100, 1% for $100 and above
 */
router.post("/create-checkout-session", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { listingPrice, listingTitle, listingData } = req.body;

    if (!listingPrice || listingPrice < 100) {
      return res.status(400).json({ 
        error: "Listing fee only applies to items $100 and above" 
      });
    }

    // Calculate 1% listing fee for items $100 and above
    const listingFee = listingPrice * 0.01;
    const feeInCents = Math.round(listingFee * 100);

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Listing Fee for: ${listingTitle || 'Untitled Item'}`,
              description: `1% listing fee for $${listingPrice} item on SellFast.Now`,
            },
            unit_amount: feeInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'https://sellfast.now'}/listing-payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'https://sellfast.now'}/post-ad?payment_cancelled=true`,
      metadata: {
        type: 'listing_fee',
        userId,
        listingPrice: listingPrice.toString(),
        listingTitle: listingTitle || 'Untitled',
        listingData: JSON.stringify(listingData), // Store listing data to create after payment
      },
    });

    console.log(`💳 Created Stripe Checkout session for listing fee: $${listingFee.toFixed(2)} (1% of $${listingPrice})`);
    console.log(`🔗 Checkout URL: ${session.url}`);

    res.json({
      sessionId: session.id,
      url: session.url,
      listingFee: listingFee.toFixed(2),
      listingPrice,
    });
  } catch (error: any) {
    console.error("Error creating listing fee checkout session:", error);
    res.status(500).json({ 
      error: "Failed to create checkout session",
      message: error.message 
    });
  }
});

/**
 * GET /api/listing-fee/verify-session/:sessionId
 * Verify a Stripe Checkout session and get payment status
 */
router.get("/verify-session/:sessionId", isAuthenticated, async (req: any, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Verify it belongs to this user
    if (session.metadata?.userId !== userId) {
      return res.status(403).json({ error: "Session does not belong to this user" });
    }

    res.json({
      status: session.payment_status,
      paymentIntentId: session.payment_intent as string,
      amount: session.amount_total ? session.amount_total / 100 : 0,
      listingPrice: parseFloat(session.metadata?.listingPrice || "0"),
      listingData: session.metadata?.listingData ? JSON.parse(session.metadata.listingData) : null,
    });
  } catch (error: any) {
    console.error("Error verifying checkout session:", error);
    res.status(500).json({ 
      error: "Failed to verify session",
      message: error.message 
    });
  }
});

export default router;
