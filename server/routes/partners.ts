import { db } from "../db";
import { businessPartners, partnerClients, partnerListings } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import type { Express } from "express";
import { isAuthenticated } from "../supabaseAuth";

export default function partnerRoutes(app: Express) {
  
  // ==========================================
  // PARTNER ONBOARDING & PROFILE
  // ==========================================
  
  /**
   * Create a new business partner account
   * POST /api/partners/onboard
   */
  app.post("/api/partners/onboard", isAuthenticated, async (req: any, res) => {
    try {
      console.log('🔍 Partner onboard request received');
      console.log('🔍 req.auth:', req.auth);
      console.log('🔍 req.headers.authorization:', req.headers.authorization);
      
      const userId = req.auth?.userId;
      
      if (!userId) {
        console.error('❌ No userId found in req.auth');
        return res.status(401).json({ message: "Unauthorized - No user ID found" });
      }
      
      console.log('✅ User ID found:', userId);

      const {
        businessName,
        businessType,
        businessDescription,
        businessEmail,
        businessPhone,
        businessWebsite,
        customDomain,
        streetAddress,
        city,
        state,
        postalCode,
        country,
      } = req.body;

      // Validate required fields
      if (!businessName || !businessType || !businessEmail) {
        return res.status(400).json({ 
          message: "Business name, type, and email are required" 
        });
      }

      // Check if custom domain is already taken
      if (customDomain) {
        const existing = await db
          .select()
          .from(businessPartners)
          .where(eq(businessPartners.customDomain, customDomain))
          .limit(1);

        if (existing.length > 0) {
          return res.status(400).json({ 
            message: "This custom URL is already taken" 
          });
        }
      }

      // Check if user already has a partner account
      const existingPartner = await db
        .select()
        .from(businessPartners)
        .where(eq(businessPartners.userId, userId))
        .limit(1);

      if (existingPartner.length > 0) {
        return res.status(400).json({ 
          message: "You already have a business partner account" 
        });
      }

      // Create partner account
      const [partner] = await db
        .insert(businessPartners)
        .values({
          userId,
          businessName,
          businessType,
          businessDescription,
          businessEmail,
          businessPhone,
          businessWebsite,
          customDomain: customDomain || businessName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          streetAddress,
          city,
          state,
          postalCode,
          country: country || 'US',
          status: 'pending', // Requires admin approval
        })
        .returning();

      res.json({
        message: "Partner account created successfully",
        partner,
      });
    } catch (error) {
      console.error("Partner onboarding error:", error);
      res.status(500).json({ message: "Failed to create partner account" });
    }
  });

  /**
   * Get current user's partner profile
   * GET /api/partners/profile
   */
  app.get("/api/partners/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.auth?.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const [partner] = await db
        .select()
        .from(businessPartners)
        .where(eq(businessPartners.userId, userId))
        .limit(1);

      if (!partner) {
        return res.status(404).json({ message: "Partner account not found" });
      }

      res.json(partner);
    } catch (error) {
      console.error("Get partner profile error:", error);
      res.status(500).json({ message: "Failed to fetch partner profile" });
    }
  });

  /**
   * Update partner profile
   * PUT /api/partners/profile
   */
  app.put("/api/partners/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.auth?.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const {
        businessName,
        businessDescription,
        businessEmail,
        businessPhone,
        businessWebsite,
        logoUrl,
        bannerUrl,
        primaryColor,
        secondaryColor,
        streetAddress,
        city,
        state,
        postalCode,
        country,
      } = req.body;

      const [updated] = await db
        .update(businessPartners)
        .set({
          businessName,
          businessDescription,
          businessEmail,
          businessPhone,
          businessWebsite,
          logoUrl,
          bannerUrl,
          primaryColor,
          secondaryColor,
          streetAddress,
          city,
          state,
          postalCode,
          country,
          updatedAt: new Date(),
        })
        .where(eq(businessPartners.userId, userId))
        .returning();

      if (!updated) {
        return res.status(404).json({ message: "Partner account not found" });
      }

      res.json({
        message: "Profile updated successfully",
        partner: updated,
      });
    } catch (error) {
      console.error("Update partner profile error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  /**
   * Get partner by custom domain (public endpoint)
   * GET /api/partners/storefront/:domain
   */
  app.get("/api/partners/storefront/:domain", async (req, res) => {
    try {
      const { domain } = req.params;

      const [partner] = await db
        .select()
        .from(businessPartners)
        .where(
          and(
            eq(businessPartners.customDomain, domain),
            eq(businessPartners.status, 'active')
          )
        )
        .limit(1);

      if (!partner) {
        return res.status(404).json({ message: "Partner storefront not found" });
      }

      // Return public information only
      res.json({
        id: partner.id,
        businessName: partner.businessName,
        businessType: partner.businessType,
        businessDescription: partner.businessDescription,
        logoUrl: partner.logoUrl,
        bannerUrl: partner.bannerUrl,
        primaryColor: partner.primaryColor,
        secondaryColor: partner.secondaryColor,
        customDomain: partner.customDomain,
        city: partner.city,
        state: partner.state,
        totalListings: partner.totalListings,
        totalSales: partner.totalSales,
      });
    } catch (error) {
      console.error("Get partner storefront error:", error);
      res.status(500).json({ message: "Failed to fetch storefront" });
    }
  });

  /**
   * Get partner's public storefront listings
   * GET /api/partners/storefront/:domain/listings
   */
  app.get("/api/partners/storefront/:domain/listings", async (req, res) => {
    try {
      const { domain } = req.params;

      // Get partner
      const [partner] = await db
        .select()
        .from(businessPartners)
        .where(
          and(
            eq(businessPartners.customDomain, domain),
            eq(businessPartners.status, 'active')
          )
        )
        .limit(1);

      if (!partner) {
        return res.status(404).json({ message: "Partner storefront not found" });
      }

      // Get active listings for this partner
      const listings = await db
        .select()
        .from(partnerListings)
        .where(
          and(
            eq(partnerListings.partnerId, partner.id),
            eq(partnerListings.status, 'active')
          )
        )
        .orderBy(desc(partnerListings.createdAt));

      res.json(listings);
    } catch (error) {
      console.error("Get storefront listings error:", error);
      res.status(500).json({ message: "Failed to fetch listings" });
    }
  });

  /**
   * Get partner's listings (authenticated)
   * GET /api/partners/listings
   */
  app.get("/api/partners/listings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.auth?.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Get partner
      const [partner] = await db
        .select()
        .from(businessPartners)
        .where(eq(businessPartners.userId, userId))
        .limit(1);

      if (!partner) {
        return res.status(404).json({ message: "Partner account not found" });
      }

      // Get partner's listings
      const listings = await db
        .select()
        .from(partnerListings)
        .where(eq(partnerListings.partnerId, partner.id))
        .orderBy(desc(partnerListings.createdAt));

      res.json(listings);
    } catch (error) {
      console.error("Get partner listings error:", error);
      res.status(500).json({ message: "Failed to fetch listings" });
    }
  });

  /**
   * Get partner's clients
   * GET /api/partners/clients
   */
  app.get("/api/partners/clients", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.auth?.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Get partner
      const [partner] = await db
        .select()
        .from(businessPartners)
        .where(eq(businessPartners.userId, userId))
        .limit(1);

      if (!partner) {
        return res.status(404).json({ message: "Partner account not found" });
      }

      // Get partner's clients
      const clients = await db
        .select()
        .from(partnerClients)
        .where(eq(partnerClients.partnerId, partner.id))
        .orderBy(desc(partnerClients.createdAt));

      res.json(clients);
    } catch (error) {
      console.error("Get partner clients error:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  /**
   * Add a client to partner's list
   * POST /api/partners/clients
   */
  app.post("/api/partners/clients", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.auth?.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { email, firstName, lastName, phone, emailOptIn, smsOptIn } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Get partner
      const [partner] = await db
        .select()
        .from(businessPartners)
        .where(eq(businessPartners.userId, userId))
        .limit(1);

      if (!partner) {
        return res.status(404).json({ message: "Partner account not found" });
      }

      // Check if client already exists
      const existing = await db
        .select()
        .from(partnerClients)
        .where(
          and(
            eq(partnerClients.partnerId, partner.id),
            eq(partnerClients.email, email)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        return res.status(400).json({ message: "Client already exists" });
      }

      // Add client
      const [client] = await db
        .insert(partnerClients)
        .values({
          partnerId: partner.id,
          email,
          firstName,
          lastName,
          phone,
          emailOptIn: emailOptIn ?? true,
          smsOptIn: smsOptIn ?? false,
        })
        .returning();

      res.json({
        message: "Client added successfully",
        client,
      });
    } catch (error) {
      console.error("Add partner client error:", error);
      res.status(500).json({ message: "Failed to add client" });
    }
  });

  /**
   * Get partner dashboard statistics
   * GET /api/partners/stats
   */
  app.get("/api/partners/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.auth?.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Get partner
      const [partner] = await db
        .select()
        .from(businessPartners)
        .where(eq(businessPartners.userId, userId))
        .limit(1);

      if (!partner) {
        return res.status(404).json({ message: "Partner account not found" });
      }

      // Get listing stats
      const listings = await db
        .select()
        .from(partnerListings)
        .where(eq(partnerListings.partnerId, partner.id));

      const activeListings = listings.filter(l => l.status === 'active').length;
      const soldListings = listings.filter(l => l.status === 'sold').length;

      // Get client count
      const clients = await db
        .select()
        .from(partnerClients)
        .where(eq(partnerClients.partnerId, partner.id));

      res.json({
        totalListings: partner.totalListings,
        activeListings,
        soldListings,
        totalSales: partner.totalSales,
        totalRevenue: partner.totalRevenue,
        totalCommissionEarned: partner.totalCommissionEarned,
        totalClients: clients.length,
        platformFeePercent: partner.platformFeePercent,
      });
    } catch (error) {
      console.error("Get partner stats error:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });
}

