// Stripe Connect Routes
// Location: server/routes/stripe-connect.ts

import { Router } from "express";
import { db } from "../db";
import { users } from "../../shared/schema";
import { eq } from "drizzle-orm";
import { stripeConnectService } from "../services/stripeConnectService";
import { isAuthenticated } from "../supabaseAuth";
import { stripeAccountCreationLimiter } from "../middleware/rateLimiter";

const router = Router();

/**
 * POST /api/stripe-connect/create-account
 * Create a Stripe Connect account (Express or Standard) for the current user
 * Body: { accountType: 'express' | 'standard' }
 */
router.post("/create-account", isAuthenticated, stripeAccountCreationLimiter, async (req: any, res) => {
  try {
    const userId = req.auth.userId;
    
    // Debug: Check if Stripe key is loaded
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("STRIPE_SECRET_KEY is not set!");
      return res.status(500).json({ 
        error: "Stripe is not configured. Please contact support." 
      });
    }
    
    console.log("Creating Stripe Connect account for user:", userId);
    console.log("Stripe key starts with:", process.env.STRIPE_SECRET_KEY.substring(0, 10));

    // Get user details
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.stripeAccountId) {
      return res.status(400).json({ 
        error: "User already has a connected account",
        accountId: user.stripeAccountId 
      });
    }

    // Get account type from request (default to 'express')
    const accountType = req.body.accountType || 'express';
    if (accountType !== 'express' && accountType !== 'standard') {
      return res.status(400).json({ error: "Invalid account type. Must be 'express' or 'standard'" });
    }

    // Create Stripe Connect account
    console.log(`Calling Stripe API to create ${accountType} account for email:`, user.email);
    const account = await stripeConnectService.createConnectedAccount(
      user.email,
      userId,
      accountType
    );
    console.log("Stripe account created successfully:", account.id);

    // Determine account tier based on type
    const accountTier = accountType;

    // Save account ID and tier to user record
    await db
      .update(users)
      .set({ 
        stripeAccountId: account.id,
        stripeAccountType: accountType,
        accountTier: accountTier,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    res.json({
      accountId: account.id,
      message: "Connected account created successfully",
    });
  } catch (error) {
    console.error("Error creating connected account:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to create connected account",
    });
  }
});

/**
 * POST /api/stripe-connect/onboarding-link
 * Generate onboarding link for seller to complete setup
 */
router.post("/onboarding-link", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.auth.userId;

    // Get user's Stripe account ID
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user || !user.stripeAccountId) {
      return res.status(400).json({ 
        error: "No connected account found. Please create one first." 
      });
    }

    const baseUrl = process.env.FRONTEND_URL || "http://localhost:5000";
    const refreshUrl = `${baseUrl}/dashboard?stripe_refresh=true`;
    const returnUrl = `${baseUrl}/dashboard?stripe_onboarding=complete`;

    // Generate onboarding link
    const accountLink = await stripeConnectService.createAccountLink(
      user.stripeAccountId,
      refreshUrl,
      returnUrl
    );

    res.json({
      url: accountLink.url,
      expiresAt: accountLink.expires_at,
    });
  } catch (error) {
    console.error("Error creating onboarding link:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to create onboarding link",
    });
  }
});

/**
 * GET /api/stripe-connect/account-status
 * Check if seller has completed onboarding
 */
router.get("/account-status", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.auth.userId;

    // Get user's Stripe account ID
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user || !user.stripeAccountId) {
      return res.json({
        hasAccount: false,
        onboardingComplete: false,
      });
    }

    // Get account status from Stripe
    const status = await stripeConnectService.getAccountStatus(user.stripeAccountId);

    // Update user record with latest status
    await db
      .update(users)
      .set({
        onboardingComplete: status.detailsSubmitted,
        chargesEnabled: status.chargesEnabled,
        payoutsEnabled: status.payoutsEnabled,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    res.json({
      hasAccount: true,
      accountId: status.id,
      accountType: user.stripeAccountType || 'express',
      accountTier: user.accountTier || 'none',
      onboardingComplete: status.detailsSubmitted,
      chargesEnabled: status.chargesEnabled,
      payoutsEnabled: status.payoutsEnabled,
      requirements: status.requirements,
    });
  } catch (error) {
    console.error("Error getting account status:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to get account status",
    });
  }
});

/**
 * GET /api/stripe-connect/balance
 * Get seller's balance and recent payouts
 */
router.get("/balance", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.auth.userId;

    // Get user's Stripe account ID
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user || !user.stripeAccountId) {
      return res.status(400).json({ 
        error: "No connected account found" 
      });
    }

    // Get balance from Stripe
    const balance = await stripeConnectService.getAccountBalance(user.stripeAccountId);

    res.json(balance);
  } catch (error) {
    console.error("Error getting balance:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to get balance",
    });
  }
});

/**
 * POST /api/stripe-connect/upgrade-to-standard
 * Upgrade from Express to Standard account for high-value items
 */
router.post("/upgrade-to-standard", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.auth.userId;

    // Get user's current account
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user || !user.stripeAccountId) {
      return res.status(400).json({ 
        error: "No connected account found. Please create one first." 
      });
    }

    if (user.stripeAccountType === 'standard') {
      return res.status(400).json({ 
        error: "Account is already Standard tier" 
      });
    }

    // Note: Stripe doesn't allow direct account type conversion
    // We need to create a new Standard account
    // Delete old Express account and create new Standard account
    
    try {
      // Delete old Express account
      await stripeConnectService.deleteAccount(user.stripeAccountId);
    } catch (error) {
      console.log("Could not delete old account, continuing anyway:", error);
    }

    // Create new Standard account
    const account = await stripeConnectService.createConnectedAccount(
      user.email!,
      userId,
      'standard'
    );

    // Update user record
    await db
      .update(users)
      .set({ 
        stripeAccountId: account.id,
        stripeAccountType: 'standard',
        accountTier: 'standard',
        onboardingComplete: false,
        chargesEnabled: false,
        payoutsEnabled: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    res.json({
      accountId: account.id,
      message: "Upgraded to Standard account. Please complete onboarding.",
    });
  } catch (error) {
    console.error("Error upgrading account:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to upgrade account",
    });
  }
});

/**
 * POST /api/stripe-connect/dashboard-link
 * Create login link for seller to access Stripe dashboard
 */
router.post("/dashboard-link", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.auth.userId;

    // Get user's Stripe account ID
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user || !user.stripeAccountId) {
      return res.status(400).json({ 
        error: "No connected account found" 
      });
    }

    // Create login link
    const loginLink = await stripeConnectService.createLoginLink(user.stripeAccountId);

    res.json({
      url: loginLink.url,
    });
  } catch (error) {
    console.error("Error creating dashboard link:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to create dashboard link",
    });
  }
});

export default router;

