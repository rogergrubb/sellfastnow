import { Router } from 'express';
import { db } from '../db';
import Stripe from 'stripe';

const router = Router();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

const PHOTO_UNLOCK_PRICE_CENTS = 99; // $0.99

/**
 * Create a payment intent for photo unlock
 * POST /api/photo-unlock/create-payment-intent
 */
router.post('/create-payment-intent', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { photoCount, listingId } = req.body;

    // Validate photo count
    if (!photoCount || photoCount < 2 || photoCount > 25) {
      return res.status(400).json({ 
        error: 'Photo count must be between 2 and 25' 
      });
    }

    // Check if listing already has photo unlock
    if (listingId) {
      const existingListing = await db.query(
        'SELECT photo_unlock_paid FROM listings WHERE id = $1 AND user_id = $2',
        [listingId, userId]
      );

      if (existingListing.rows[0]?.photo_unlock_paid) {
        return res.status(400).json({ 
          error: 'Photos already unlocked for this listing' 
        });
      }
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: PHOTO_UNLOCK_PRICE_CENTS,
      currency: 'usd',
      metadata: {
        type: 'photo_unlock',
        user_id: userId.toString(),
        photo_count: photoCount.toString(),
        listing_id: listingId?.toString() || 'draft',
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Create photo unlock record
    const result = await db.query(
      `INSERT INTO photo_unlocks 
       (user_id, listing_id, photo_count, amount_cents, stripe_payment_intent_id, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING id`,
      [userId, listingId || null, photoCount, PHOTO_UNLOCK_PRICE_CENTS, paymentIntent.id]
    );

    const photoUnlockId = result.rows[0].id;

    res.json({
      clientSecret: paymentIntent.client_secret,
      photoUnlockId,
      amount: PHOTO_UNLOCK_PRICE_CENTS,
    });
  } catch (error: any) {
    console.error('Error creating photo unlock payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

/**
 * Confirm photo unlock payment
 * POST /api/photo-unlock/confirm
 */
router.post('/confirm', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { photoUnlockId, paymentIntentId } = req.body;

    if (!photoUnlockId || !paymentIntentId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not successful' });
    }

    // Update photo unlock record
    const result = await db.query(
      `UPDATE photo_unlocks 
       SET status = 'completed', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2 AND stripe_payment_intent_id = $3
       RETURNING *`,
      [photoUnlockId, userId, paymentIntentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Photo unlock not found' });
    }

    const photoUnlock = result.rows[0];

    // If listing exists, update it
    if (photoUnlock.listing_id) {
      await db.query(
        `UPDATE listings 
         SET photo_unlock_paid = true, photo_unlock_id = $1
         WHERE id = $2 AND user_id = $3`,
        [photoUnlockId, photoUnlock.listing_id, userId]
      );
    }

    res.json({
      success: true,
      photoUnlock: {
        id: photoUnlock.id,
        status: photoUnlock.status,
        photoCount: photoUnlock.photo_count,
      },
    });
  } catch (error: any) {
    console.error('Error confirming photo unlock:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

/**
 * Get photo unlock status for a listing
 * GET /api/photo-unlock/status/:listingId
 */
router.get('/status/:listingId', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { listingId } = req.params;

    const result = await db.query(
      `SELECT l.photo_unlock_paid, pu.photo_count, pu.created_at as paid_at
       FROM listings l
       LEFT JOIN photo_unlocks pu ON l.photo_unlock_id = pu.id
       WHERE l.id = $1 AND l.user_id = $2`,
      [listingId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    const listing = result.rows[0];

    res.json({
      unlocked: listing.photo_unlock_paid || false,
      photoCount: listing.photo_count || 0,
      paidAt: listing.paid_at || null,
    });
  } catch (error: any) {
    console.error('Error getting photo unlock status:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

/**
 * Get user's photo unlock history
 * GET /api/photo-unlock/history
 */
router.get('/history', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await db.query(
      `SELECT 
        pu.id,
        pu.photo_count,
        pu.amount_cents,
        pu.status,
        pu.created_at,
        l.title as listing_title,
        l.id as listing_id
       FROM photo_unlocks pu
       LEFT JOIN listings l ON pu.listing_id = l.id
       WHERE pu.user_id = $1
       ORDER BY pu.created_at DESC
       LIMIT 50`,
      [userId]
    );

    res.json({
      unlocks: result.rows,
    });
  } catch (error: any) {
    console.error('Error getting photo unlock history:', error);
    res.status(500).json({ error: 'Failed to get history' });
  }
});

export default router;
