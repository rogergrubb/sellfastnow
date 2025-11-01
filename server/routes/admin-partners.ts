import { db } from "../db";
import { businessPartners } from "@shared/schema";
import { eq } from "drizzle-orm";
import type { Express } from "express";

export default function adminPartnerRoutes(app: Express) {
  
  /**
   * Activate a partner account (temporary admin endpoint)
   * POST /api/admin/partners/activate
   * Body: { email: "user@example.com" }
   */
  app.post("/api/admin/partners/activate", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Find user by email
      const { users } = await import("@shared/schema");
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Find partner account
      const [partner] = await db
        .select()
        .from(businessPartners)
        .where(eq(businessPartners.userId, user.id));

      if (!partner) {
        return res.status(404).json({ message: "Partner account not found" });
      }

      // Activate the partner
      const [updatedPartner] = await db
        .update(businessPartners)
        .set({
          status: "active",
          approvedAt: new Date(),
        })
        .where(eq(businessPartners.id, partner.id))
        .returning();

      console.log(`✅ Activated partner account for ${email}`);

      res.json({
        message: "Partner account activated successfully",
        partner: {
          id: updatedPartner.id,
          businessName: updatedPartner.businessName,
          status: updatedPartner.status,
          approvedAt: updatedPartner.approvedAt,
        },
      });
    } catch (error) {
      console.error("Error activating partner:", error);
      res.status(500).json({ message: "Failed to activate partner account" });
    }
  });

  /**
   * List all partner accounts (temporary admin endpoint)
   * GET /api/admin/partners
   */
  app.get("/api/admin/partners", async (req, res) => {
    try {
      const partners = await db
        .select()
        .from(businessPartners)
        .orderBy(businessPartners.createdAt);

      res.json(partners);
    } catch (error) {
      console.error("Error fetching partners:", error);
      res.status(500).json({ message: "Failed to fetch partners" });
    }
  });
}

