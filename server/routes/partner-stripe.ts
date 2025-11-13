import { db } from "../db";
import { businessPartners } from "../../shared/partners-schema";
import { eq } from "drizzle-orm";
import type { Express } from "express";
import { isAuthenticated } from "../supabaseAuth";
import { stripe } from "../stripe";

export default function partnerStripeRoutes(app: Express) {
  
  /**
   * Create Stripe Connect account for partner
   * POST /api/partners/stripe/create-account
   */
  app.post("/api/partners/stripe/create-account", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Get partner account
      const [partner] = await db
        .select()
        .from(businessPartners)
        .where(eq(businessPartners.userId, userId));

      if (!partner) {
        return res.status(404).json({ message: "Partner account not found" });
      }

      if (partner.stripeAccountId) {
        return res.status(400).json({ 
          message: "Stripe account already connected",
          accountId: partner.stripeAccountId 
        });
      }

      // Create Stripe Connect Express account
      const account = await stripe.accounts.create({
        type: 'express',
        country: partner.country || 'US',
        email: partner.businessEmail,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'company',
        company: {
          name: partner.businessName,
        },
      });

      // Update partner with Stripe account ID
      await db
        .update(businessPartners)
        .set({ 
          stripeAccountId: account.id,
          updatedAt: new Date(),
        })
        .where(eq(businessPartners.id, partner.id));

      console.log(`✅ Created Stripe Connect account ${account.id} for partner ${partner.businessName}`);

      res.json({
        accountId: account.id,
        message: "Stripe account created successfully",
      });
    } catch (error) {
      console.error("Error creating Stripe account:", error);
      res.status(500).json({ message: "Failed to create Stripe account" });
    }
  });

  /**
   * Create Stripe Connect onboarding link
   * POST /api/partners/stripe/onboarding-link
   */
  app.post("/api/partners/stripe/onboarding-link", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Get partner account
      const [partner] = await db
        .select()
        .from(businessPartners)
        .where(eq(businessPartners.userId, userId));

      if (!partner) {
        return res.status(404).json({ message: "Partner account not found" });
      }

      if (!partner.stripeAccountId) {
        return res.status(400).json({ message: "No Stripe account found. Create one first." });
      }

      // Create account link for onboarding
      const accountLink = await stripe.accountLinks.create({
        account: partner.stripeAccountId,
        refresh_url: `${process.env.BASE_URL || 'https://sellfast.now'}/partner/dashboard?stripe=refresh`,
        return_url: `${process.env.BASE_URL || 'https://sellfast.now'}/partner/dashboard?stripe=success`,
        type: 'account_onboarding',
      });

      res.json({
        url: accountLink.url,
      });
    } catch (error) {
      console.error("Error creating onboarding link:", error);
      res.status(500).json({ message: "Failed to create onboarding link" });
    }
  });

  /**
   * Get Stripe account status
   * GET /api/partners/stripe/account-status
   */
  app.get("/api/partners/stripe/account-status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Get partner account
      const [partner] = await db
        .select()
        .from(businessPartners)
        .where(eq(businessPartners.userId, userId));

      if (!partner) {
        return res.status(404).json({ message: "Partner account not found" });
      }

      if (!partner.stripeAccountId) {
        return res.json({
          connected: false,
          chargesEnabled: false,
          payoutsEnabled: false,
        });
      }

      // Get Stripe account details
      const account = await stripe.accounts.retrieve(partner.stripeAccountId);

      res.json({
        connected: true,
        accountId: account.id,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        requirementsCurrentlyDue: account.requirements?.currently_due || [],
        requirementsEventuallyDue: account.requirements?.eventually_due || [],
      });
    } catch (error) {
      console.error("Error fetching account status:", error);
      res.status(500).json({ message: "Failed to fetch account status" });
    }
  });

  /**
   * Create Stripe dashboard login link
   * POST /api/partners/stripe/dashboard-link
   */
  app.post("/api/partners/stripe/dashboard-link", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Get partner account
      const [partner] = await db
        .select()
        .from(businessPartners)
        .where(eq(businessPartners.userId, userId));

      if (!partner || !partner.stripeAccountId) {
        return res.status(400).json({ message: "No Stripe account connected" });
      }

      // Create login link
      const loginLink = await stripe.accounts.createLoginLink(partner.stripeAccountId);

      res.json({
        url: loginLink.url,
      });
    } catch (error) {
      console.error("Error creating dashboard link:", error);
      res.status(500).json({ message: "Failed to create dashboard link" });
    }
  });

  /**
   * Disconnect Stripe account
   * POST /api/partners/stripe/disconnect
   */
  app.post("/api/partners/stripe/disconnect", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Get partner account
      const [partner] = await db
        .select()
        .from(businessPartners)
        .where(eq(businessPartners.userId, userId));

      if (!partner || !partner.stripeAccountId) {
        return res.status(400).json({ message: "No Stripe account connected" });
      }

      // Delete Stripe account
      await stripe.accounts.del(partner.stripeAccountId);

      // Remove from database
      await db
        .update(businessPartners)
        .set({ 
          stripeAccountId: null,
          updatedAt: new Date(),
        })
        .where(eq(businessPartners.id, partner.id));

      console.log(`✅ Disconnected Stripe account for partner ${partner.businessName}`);

      res.json({
        message: "Stripe account disconnected successfully",
      });
    } catch (error) {
      console.error("Error disconnecting Stripe account:", error);
      res.status(500).json({ message: "Failed to disconnect Stripe account" });
    }
  });
}

