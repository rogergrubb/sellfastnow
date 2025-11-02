import { Router } from 'express';
import Stripe from 'stripe';
import { db } from '../db';
import { users, pricingTierPurchases, userCredits, creditUsageHistory } from '../../shared/schema';
import { eq, and, sql } from 'drizzle-orm';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Pricing tier definitions
const PRICING_TIERS = {
  'single-listing-unlock': {
    name: 'Single Listing Unlock',
    price: 0.99,
    listings: 1,
    photos: 20,
    aiCredits: 1,
    isMonthly: false,
  },
  'double-deal': {
    name: 'Double Deal',
    price: 1.49,
    listings: 2,
    photos: 20,
    aiCredits: 2,
    isMonthly: false,
  },
  'triple-boost': {
    name: 'Triple Boost',
    price: 1.99,
    listings: 3,
    photos: 20,
    aiCredits: 3,
    isMonthly: false,
  },
  'five-item-pack': {
    name: 'Five-Item Pack',
    price: 2.99,
    listings: 5,
    photos: 20,
    aiCredits: 5,
    isMonthly: false,
  },
  'six-pack-pro': {
    name: 'Six-Pack Pro',
    price: 3.49,
    listings: 6,
    photos: 20,
    aiCredits: 6,
    isMonthly: false,
  },
  'power-starter-pack': {
    name: 'Power Starter Pack',
    price: 4.99,
    listings: 10,
    photos: 20,
    aiCredits: 10,
    isMonthly: false,
  },
  'local-hero-pack': {
    name: 'Local Hero Pack',
    price: 9.99,
    listings: 25,
    photos: 50,
    aiCredits: 30,
    isMonthly: false,
  },
  'marketplace-pro-pack': {
    name: 'Marketplace Pro Pack',
    price: 14.99,
    listings: 50,
    photos: 50,
    aiCredits: 75,
    isMonthly: false,
  },
  'mega-growth-pack': {
    name: 'Mega Growth Pack',
    price: 19.99,
    listings: 100,
    photos: 50,
    aiCredits: 100,
    isMonthly: true,
  },
};

// POST /api/pricing-tiers/create-payment-intent
// Create a Stripe payment intent for a pricing tier
router.post('/create-payment-intent', async (req, res) => {
  try {
    const { tierId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const tier = PRICING_TIERS[tierId as keyof typeof PRICING_TIERS];
    if (!tier) {
      return res.status(400).json({ error: 'Invalid tier ID' });
    }

    // Get user email
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(tier.price * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        userId: userId.toString(),
        tierId,
        tierName: tier.name,
        listings: tier.listings.toString(),
        photos: tier.photos.toString(),
        aiCredits: tier.aiCredits.toString(),
      },
      description: `${tier.name} - ${tier.listings} listings, ${tier.photos} photos each, ${tier.aiCredits} AI credits`,
      receipt_email: user.email,
    });

    // Create pending purchase record
    const [purchase] = await db.insert(pricingTierPurchases).values({
      userId,
      tierName: tier.name,
      tierPrice: tier.price.toString(),
      listingsIncluded: tier.listings,
      photosPerListing: tier.photos,
      aiCreditsIncluded: tier.aiCredits,
      isMonthly: tier.isMonthly,
      stripePaymentIntentId: paymentIntent.id,
      status: 'pending',
    }).returning();

    res.json({
      clientSecret: paymentIntent.client_secret,
      purchaseId: purchase.id,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// POST /api/pricing-tiers/confirm-payment
// Confirm payment and credit user account
router.post('/confirm-payment', async (req, res) => {
  try {
    const { paymentIntentId, purchaseId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not successful' });
    }

    // Get purchase record
    const [purchase] = await db
      .select()
      .from(pricingTierPurchases)
      .where(
        and(
          eq(pricingTierPurchases.id, purchaseId),
          eq(pricingTierPurchases.userId, userId),
          eq(pricingTierPurchases.stripePaymentIntentId, paymentIntentId)
        )
      )
      .limit(1);

    if (!purchase) {
      return res.status(404).json({ error: 'Purchase not found' });
    }

    if (purchase.status === 'completed') {
      return res.json({ message: 'Credits already applied', purchase });
    }

    // Update purchase status
    await db
      .update(pricingTierPurchases)
      .set({ status: 'completed' })
      .where(eq(pricingTierPurchases.id, purchaseId));

    // Get or create user credits record
    let [userCredit] = await db
      .select()
      .from(userCredits)
      .where(eq(userCredits.userId, userId))
      .limit(1);

    if (!userCredit) {
      [userCredit] = await db.insert(userCredits).values({
        userId,
        photoUnlockCredits: 0,
        aiGenerationCredits: 0,
        totalPhotoUnlocksPurchased: 0,
        totalAiCreditsPurchased: 0,
      }).returning();
    }

    // Add credits to user account
    const newPhotoUnlocks = (userCredit.photoUnlockCredits || 0) + purchase.listingsIncluded;
    const newAiCredits = (userCredit.aiGenerationCredits || 0) + purchase.aiCreditsIncluded;
    const newTotalPhotoUnlocks = (userCredit.totalPhotoUnlocksPurchased || 0) + purchase.listingsIncluded;
    const newTotalAiCredits = (userCredit.totalAiCreditsPurchased || 0) + purchase.aiCreditsIncluded;

    await db
      .update(userCredits)
      .set({
        photoUnlockCredits: newPhotoUnlocks,
        aiGenerationCredits: newAiCredits,
        totalPhotoUnlocksPurchased: newTotalPhotoUnlocks,
        totalAiCreditsPurchased: newTotalAiCredits,
      })
      .where(eq(userCredits.userId, userId));

    console.log(`✅ Credits applied for user ${userId}:`, {
      photoUnlocks: `+${purchase.listingsIncluded} (total: ${newPhotoUnlocks})`,
      aiCredits: `+${purchase.aiCreditsIncluded} (total: ${newAiCredits})`,
      tierName: purchase.tierName,
      price: purchase.tierPrice,
    });

    res.json({
      success: true,
      credits: {
        photoUnlockCredits: newPhotoUnlocks,
        aiGenerationCredits: newAiCredits,
      },
      purchase,
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

// GET /api/pricing-tiers/credits
// Get user's current credit balance
router.get('/credits', async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let [userCredit] = await db
      .select()
      .from(userCredits)
      .where(eq(userCredits.userId, userId))
      .limit(1);

    if (!userCredit) {
      // Create default credits record
      [userCredit] = await db.insert(userCredits).values({
        userId,
        photoUnlockCredits: 0,
        aiGenerationCredits: 0,
        totalPhotoUnlocksPurchased: 0,
        totalAiCreditsPurchased: 0,
      }).returning();
    }

    res.json({
      photoUnlockCredits: userCredit.photoUnlockCredits || 0,
      aiGenerationCredits: userCredit.aiGenerationCredits || 0,
      totalPhotoUnlocksPurchased: userCredit.totalPhotoUnlocksPurchased || 0,
      totalAiCreditsPurchased: userCredit.totalAiCreditsPurchased || 0,
    });
  } catch (error) {
    console.error('Error fetching credits:', error);
    res.status(500).json({ error: 'Failed to fetch credits' });
  }
});

// POST /api/pricing-tiers/use-credit
// Use a credit (photo unlock or AI generation)
router.post('/use-credit', async (req, res) => {
  try {
    const { creditType, listingId } = req.body; // creditType: 'photo_unlock' or 'ai_generation'
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!['photo_unlock', 'ai_generation'].includes(creditType)) {
      return res.status(400).json({ error: 'Invalid credit type' });
    }

    // Get user credits
    const [userCredit] = await db
      .select()
      .from(userCredits)
      .where(eq(userCredits.userId, userId))
      .limit(1);

    if (!userCredit) {
      return res.status(404).json({ error: 'No credits found' });
    }

    // Check if user has enough credits
    const availableCredits = creditType === 'photo_unlock' 
      ? userCredit.photoUnlockCredits 
      : userCredit.aiGenerationCredits;

    if (availableCredits <= 0) {
      return res.status(400).json({ error: 'Insufficient credits' });
    }

    // Deduct credit
    if (creditType === 'photo_unlock') {
      await db
        .update(userCredits)
        .set({ photoUnlockCredits: userCredit.photoUnlockCredits - 1 })
        .where(eq(userCredits.userId, userId));
    } else {
      await db
        .update(userCredits)
        .set({ aiGenerationCredits: userCredit.aiGenerationCredits - 1 })
        .where(eq(userCredits.userId, userId));
    }

    // Log usage
    await db.insert(creditUsageHistory).values({
      userId,
      creditType,
      creditsUsed: 1,
      listingId: listingId || null,
      description: `Used 1 ${creditType.replace('_', ' ')} credit`,
    });

    console.log(`📊 Credit used: User ${userId} used 1 ${creditType} credit (listing: ${listingId || 'N/A'})`);

    res.json({
      success: true,
      remainingCredits: availableCredits - 1,
      creditType,
    });
  } catch (error) {
    console.error('Error using credit:', error);
    res.status(500).json({ error: 'Failed to use credit' });
  }
});

// GET /api/pricing-tiers/purchase-history
// Get user's purchase history
router.get('/purchase-history', async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const purchases = await db
      .select()
      .from(pricingTierPurchases)
      .where(eq(pricingTierPurchases.userId, userId))
      .orderBy(sql`${pricingTierPurchases.purchasedAt} DESC`);

    res.json({ purchases });
  } catch (error) {
    console.error('Error fetching purchase history:', error);
    res.status(500).json({ error: 'Failed to fetch purchase history' });
  }
});

export default router;
