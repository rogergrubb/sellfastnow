// Payment Sessions Routes
// Handles seller-initiated and buyer-initiated payment flows with QR codes

import { Router } from "express";
import { db } from "../db";
import { users, listings } from "../../shared/schema";
import { eq } from "drizzle-orm";
import { isAuthenticated } from "../supabaseAuth";
import Stripe from 'stripe';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

// In-memory store for payment sessions (in production, use Redis or database)
const paymentSessions = new Map<string, {
  listingId: string;
  sellerId: string;
  buyerId?: string;
  amount: number;
  originalAmount: number;
  status: 'pending' | 'accepted' | 'paid' | 'expired';
  initiatedBy: 'seller' | 'buyer';
  createdAt: Date;
  expiresAt: Date;
}>();

/**
 * POST /api/payment-sessions/seller-initiate
 * Seller creates a payment session with negotiated price
 */
router.post("/seller-initiate", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { listingId, amount } = req.body;

    if (!listingId || !amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid listing ID or amount" });
    }

    // Get listing and verify seller
    const listing = await db.query.listings.findFirst({
      where: eq(listings.id, listingId),
    });

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    if (listing.userId !== userId) {
      return res.status(403).json({ error: "Not authorized to create payment for this listing" });
    }

    // Get seller's Stripe account
    const seller = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!seller || !seller.stripeAccountId) {
      return res.status(400).json({ 
        error: "Please complete Stripe setup first",
        needsOnboarding: true 
      });
    }

    // Check if seller's account tier supports this amount
    const accountTier = seller.accountTier || 'none';
    if (amount >= 1000 && accountTier !== 'standard') {
      return res.status(400).json({
        error: "Items $1,000+ require Standard verification",
        needsUpgrade: true,
        currentTier: accountTier
      });
    }

    if (!seller.chargesEnabled) {
      return res.status(400).json({
        error: "Your Stripe account is not ready to accept payments",
        needsOnboarding: true
      });
    }

    // Create payment session
    const sessionId = `ps_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const session = {
      listingId,
      sellerId: userId,
      amount,
      originalAmount: parseFloat(listing.price),
      status: 'pending' as const,
      initiatedBy: 'seller' as const,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };

    paymentSessions.set(sessionId, session);

    // Generate payment link
    const baseUrl = process.env.FRONTEND_URL || "http://localhost:5000";
    const paymentUrl = `${baseUrl}/pay/${sessionId}`;

    res.json({
      sessionId,
      paymentUrl,
      qrCodeData: paymentUrl, // Frontend will generate QR code from this
      amount,
      originalAmount: listing.price,
      expiresAt: session.expiresAt,
    });
  } catch (error) {
    console.error("Error creating seller-initiated payment:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to create payment session",
    });
  }
});

/**
 * POST /api/payment-sessions/buyer-initiate
 * Buyer creates a payment offer with negotiated price
 */
router.post("/buyer-initiate", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { listingId, amount } = req.body;

    if (!listingId || !amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid listing ID or amount" });
    }

    // Get listing
    const listing = await db.query.listings.findFirst({
      where: eq(listings.id, listingId),
    });

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    if (listing.userId === userId) {
      return res.status(400).json({ error: "Cannot buy your own listing" });
    }

    // Get seller's Stripe account
    const seller = await db.query.users.findFirst({
      where: eq(users.id, listing.userId),
    });

    if (!seller || !seller.stripeAccountId) {
      return res.status(400).json({ 
        error: "Seller hasn't set up Stripe payments",
        stripeNotAvailable: true
      });
    }

    // Check if seller's account tier supports this amount
    const accountTier = seller.accountTier || 'none';
    if (amount >= 1000 && accountTier !== 'standard') {
      return res.status(400).json({
        error: "Seller needs Standard verification for items $1,000+",
        sellerNeedsUpgrade: true
      });
    }

    if (!seller.chargesEnabled) {
      return res.status(400).json({
        error: "Seller's payment account is not ready",
        stripeNotAvailable: true
      });
    }

    // Create payment session (pending seller acceptance)
    const sessionId = `ps_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const session = {
      listingId,
      sellerId: listing.userId,
      buyerId: userId,
      amount,
      originalAmount: parseFloat(listing.price),
      status: 'pending' as const,
      initiatedBy: 'buyer' as const,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour for buyer offers
    };

    paymentSessions.set(sessionId, session);

    // TODO: Send notification to seller

    res.json({
      sessionId,
      amount,
      originalAmount: listing.price,
      status: 'pending',
      message: "Offer sent to seller. Waiting for acceptance.",
      expiresAt: session.expiresAt,
    });
  } catch (error) {
    console.error("Error creating buyer-initiated payment:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to create payment offer",
    });
  }
});

/**
 * GET /api/payment-sessions/:sessionId
 * Get payment session details
 */
router.get("/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = paymentSessions.get(sessionId);

    if (!session) {
      return res.status(404).json({ error: "Payment session not found or expired" });
    }

    // Check if expired
    if (new Date() > session.expiresAt) {
      paymentSessions.delete(sessionId);
      return res.status(410).json({ error: "Payment session expired" });
    }

    // Get listing details
    const listing = await db.query.listings.findFirst({
      where: eq(listings.id, session.listingId),
    });

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    // Get seller details
    const seller = await db.query.users.findFirst({
      where: eq(users.id, session.sellerId),
    });

    res.json({
      sessionId,
      listing: {
        id: listing.id,
        title: listing.title,
        description: listing.description,
        originalPrice: listing.price,
      },
      seller: {
        id: seller?.id,
        name: `${seller?.firstName} ${seller?.lastName}`,
      },
      amount: session.amount,
      originalAmount: session.originalAmount,
      status: session.status,
      initiatedBy: session.initiatedBy,
      expiresAt: session.expiresAt,
    });
  } catch (error) {
    console.error("Error fetching payment session:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to fetch payment session",
    });
  }
});

/**
 * POST /api/payment-sessions/:sessionId/accept
 * Seller accepts buyer's payment offer
 */
router.post("/:sessionId/accept", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;
    const session = paymentSessions.get(sessionId);

    if (!session) {
      return res.status(404).json({ error: "Payment session not found" });
    }

    if (session.sellerId !== userId) {
      return res.status(403).json({ error: "Only the seller can accept this offer" });
    }

    if (session.initiatedBy !== 'buyer') {
      return res.status(400).json({ error: "This session was not initiated by a buyer" });
    }

    if (session.status !== 'pending') {
      return res.status(400).json({ error: "Session is no longer pending" });
    }

    // Update session status
    session.status = 'accepted';
    paymentSessions.set(sessionId, session);

    // TODO: Send notification to buyer

    res.json({
      message: "Offer accepted. Buyer can now complete payment.",
      sessionId,
    });
  } catch (error) {
    console.error("Error accepting payment offer:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to accept offer",
    });
  }
});

/**
 * POST /api/payment-sessions/:sessionId/create-payment-intent
 * Create Stripe PaymentIntent for the session
 */
router.post("/:sessionId/create-payment-intent", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;
    const session = paymentSessions.get(sessionId);

    if (!session) {
      return res.status(404).json({ error: "Payment session not found" });
    }

    // Verify buyer
    if (session.initiatedBy === 'buyer' && session.buyerId !== userId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // For buyer-initiated, must be accepted first
    if (session.initiatedBy === 'buyer' && session.status !== 'accepted') {
      return res.status(400).json({ error: "Seller must accept offer first" });
    }

    // Get seller's Stripe account
    const seller = await db.query.users.findFirst({
      where: eq(users.id, session.sellerId),
    });

    if (!seller || !seller.stripeAccountId) {
      return res.status(400).json({ error: "Seller's payment account not found" });
    }

    // Calculate platform fee (2.5%)
    const platformFeePercent = 0.025;
    const platformFee = session.amount * platformFeePercent;

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(session.amount * 100), // Convert to cents
      currency: 'usd',
      application_fee_amount: Math.round(platformFee * 100),
      transfer_data: {
        destination: seller.stripeAccountId,
      },
      metadata: {
        sessionId,
        listingId: session.listingId,
        sellerId: session.sellerId,
        buyerId: userId,
      },
      capture_method: 'manual', // Hold funds in escrow
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      amount: session.amount,
      platformFee,
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to create payment intent",
    });
  }
});

export default router;

