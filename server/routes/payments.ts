import { Router } from "express";
import { stripe } from "../stripe";
import { storage } from "../storage";
import { isAuthenticated } from "../middleware/auth";
import { calculatePlatformFee, getBaseUrl } from "../config/stripe.config";
import QRCode from "qrcode";

const router = Router();

// Create payment intent for transaction
router.post("/transactions/:transactionId/payment-intent", isAuthenticated, async (req, res) => {
  try {
    const { transactionId } = req.params;
    const userId = req.user!.id;

    // Get transaction
    const transaction = await storage.getTransaction(transactionId);
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    // Verify user is the buyer
    if (transaction.buyerId !== userId) {
      return res.status(403).json({ error: "Only the buyer can create payment" });
    }

    // Check if payment already exists
    if (transaction.stripePaymentIntentId) {
      return res.status(400).json({ error: "Payment already created" });
    }

    const amount = parseFloat(transaction.amount);
    const platformFee = calculatePlatformFee(amount);
    const sellerPayout = amount - platformFee;

    // Create Stripe Payment Intent with manual capture (escrow)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "usd",
      capture_method: "manual", // Hold in escrow until confirmed
      metadata: {
        transactionId,
        buyerId: transaction.buyerId,
        sellerId: transaction.sellerId,
        listingId: transaction.listingId,
        platformFee: platformFee.toFixed(2),
        sellerPayout: sellerPayout.toFixed(2),
      },
      description: `SellFast.Now Transaction - ${transactionId.slice(0, 8)}`,
    });

    // Update transaction with payment intent ID and expiration
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await storage.updateTransaction(transactionId, {
      stripePaymentIntentId: paymentIntent.id,
      status: "payment_pending",
      paymentExpiresAt: expiresAt,
    });

    // Generate payment URL
    const paymentUrl = `${getBaseUrl()}/payment/${transactionId}?client_secret=${paymentIntent.client_secret}`;

    // Generate QR code with high error correction for better scanning
    const qrCodeDataUrl = await QRCode.toDataURL(paymentUrl, {
      width: 400,  // Larger for better scanning across devices
      margin: 4,   // More white space for edge detection
      errorCorrectionLevel: 'H',  // Highest error correction (30% recovery)
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    res.json({
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: amount,
      platformFee: platformFee,
      sellerPayout: sellerPayout,
      paymentUrl,
      qrCode: qrCodeDataUrl,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error: any) {
    console.error("Error creating payment intent:", error);
    res.status(500).json({ error: "Failed to create payment intent" });
  }
});

// Confirm payment (after buyer inspects item at meetup)
router.post("/transactions/:transactionId/confirm-payment", isAuthenticated, async (req, res) => {
  try {
    const { transactionId } = req.params;
    const userId = req.user!.id;

    // Get transaction
    const transaction = await storage.getTransaction(transactionId);
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    // Verify user is the buyer
    if (transaction.buyerId !== userId) {
      return res.status(403).json({ error: "Only the buyer can confirm payment" });
    }

    if (!transaction.stripePaymentIntentId) {
      return res.status(400).json({ error: "No payment intent found" });
    }

    // Check if payment expired
    if (transaction.paymentExpiresAt && new Date(transaction.paymentExpiresAt) < new Date()) {
      return res.status(400).json({ error: "Payment link has expired" });
    }

    // Validate transaction status
    if (transaction.status !== 'payment_pending') {
      return res.status(400).json({ error: "Payment cannot be confirmed in current state" });
    }

    // Capture the payment (release from escrow)
    const paymentIntent = await stripe.paymentIntents.capture(
      transaction.stripePaymentIntentId
    );

    // Update transaction status
    await storage.updateTransaction(transactionId, {
      status: "completed",
      completedAt: new Date(),
    });

    res.json({
      success: true,
      paymentIntent,
    });
  } catch (error: any) {
    console.error("Error confirming payment:", error);
    res.status(500).json({ error: "Failed to confirm payment" });
  }
});

// Cancel payment (if buyer rejects item at meetup)
router.post("/transactions/:transactionId/cancel-payment", isAuthenticated, async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { reason } = req.body;
    const userId = req.user!.id;

    // Get transaction
    const transaction = await storage.getTransaction(transactionId);
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    // Verify user is the buyer
    if (transaction.buyerId !== userId) {
      return res.status(403).json({ error: "Only the buyer can cancel payment" });
    }

    if (!transaction.stripePaymentIntentId) {
      return res.status(400).json({ error: "No payment intent found" });
    }

    // Cancel the payment intent (refund)
    const paymentIntent = await stripe.paymentIntents.cancel(
      transaction.stripePaymentIntentId
    );

    // Update transaction status
    await storage.updateTransaction(transactionId, {
      status: "cancelled",
      cancelledAt: new Date(),
      cancellationReason: reason,
    });

    res.json({
      success: true,
      paymentIntent,
    });
  } catch (error: any) {
    console.error("Error cancelling payment:", error);
    res.status(500).json({ error: "Failed to cancel payment" });
  }
});

export default router;

