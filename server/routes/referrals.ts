import type { Express } from "express";
import { db } from "../storage";
import { sql, eq, and } from "drizzle-orm";
import { z } from "zod";

const referralSchema = z.object({
  friendEmail: z.string().email("Please enter a valid email address"),
});

export default function referralRoutes(app: Express) {
  // Submit a referral
  app.post("/api/referrals", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Validate request body
      const validation = referralSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: validation.error.errors[0].message 
        });
      }

      const { friendEmail } = validation.data;

      // Check if user is trying to refer themselves
      const [user] = await db.execute(sql`
        SELECT email FROM users WHERE id = ${userId}
      `);

      if (user && user.email === friendEmail.toLowerCase()) {
        return res.status(400).json({ 
          message: "You cannot refer yourself" 
        });
      }

      // Check if this email has already been referred by this user
      const [existingReferral] = await db.execute(sql`
        SELECT id FROM referrals 
        WHERE referrer_id = ${userId} 
        AND LOWER(referred_email) = ${friendEmail.toLowerCase()}
      `);

      if (existingReferral) {
        return res.status(400).json({ 
          message: "You have already referred this email address" 
        });
      }

      // Check if the referred email already has an account
      const [existingUser] = await db.execute(sql`
        SELECT id FROM users WHERE LOWER(email) = ${friendEmail.toLowerCase()}
      `);

      if (existingUser) {
        return res.status(400).json({ 
          message: "This email already has an account" 
        });
      }

      // Create the referral
      const [referral] = await db.execute(sql`
        INSERT INTO referrals (referrer_id, referred_email, status)
        VALUES (${userId}, ${friendEmail.toLowerCase()}, 'pending')
        RETURNING id, referrer_id, referred_email, status, created_at
      `);

      // TODO: Send referral email to friend
      // This would integrate with your email service (SendGrid, etc.)
      console.log(`📧 Referral email should be sent to ${friendEmail}`);

      res.json({
        success: true,
        message: "Referral sent successfully!",
        referral,
      });
    } catch (error) {
      console.error("Error creating referral:", error);
      res.status(500).json({ message: "Failed to send referral" });
    }
  });

  // Get user's referrals
  app.get("/api/referrals", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const referrals = await db.execute(sql`
        SELECT 
          id, 
          referred_email, 
          status, 
          credits_awarded,
          created_at,
          completed_at
        FROM referrals
        WHERE referrer_id = ${userId}
        ORDER BY created_at DESC
      `);

      res.json(referrals);
    } catch (error) {
      console.error("Error fetching referrals:", error);
      res.status(500).json({ message: "Failed to fetch referrals" });
    }
  });

  // Check for pending referrals when user signs up (called internally)
  app.post("/api/referrals/check-signup", async (req, res) => {
    try {
      const { email, userId } = req.body;

      if (!email || !userId) {
        return res.status(400).json({ message: "Email and userId required" });
      }

      // Find pending referral for this email
      const [referral] = await db.execute(sql`
        SELECT id, referrer_id 
        FROM referrals 
        WHERE LOWER(referred_email) = ${email.toLowerCase()}
        AND status = 'pending'
        LIMIT 1
      `);

      if (!referral) {
        return res.json({ referralFound: false });
      }

      // Update referral status
      await db.execute(sql`
        UPDATE referrals
        SET 
          referred_user_id = ${userId},
          status = 'completed',
          completed_at = NOW()
        WHERE id = ${referral.id}
      `);

      // Award 50 credits to referrer
      await db.execute(sql`
        UPDATE users
        SET ai_credits_purchased = ai_credits_purchased + 50
        WHERE id = ${referral.referrer_id}
      `);

      // Mark credits as awarded
      await db.execute(sql`
        UPDATE referrals
        SET 
          credits_awarded = true,
          awarded_at = NOW()
        WHERE id = ${referral.id}
      `);

      console.log(`🎉 Awarded 50 credits to user ${referral.referrer_id} for referring ${email}`);

      res.json({ 
        referralFound: true,
        creditsAwarded: true,
        referrerId: referral.referrer_id
      });
    } catch (error) {
      console.error("Error processing referral signup:", error);
      res.status(500).json({ message: "Failed to process referral" });
    }
  });
}

