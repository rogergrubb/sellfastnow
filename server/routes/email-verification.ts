// Email Verification Routes
import { Router } from "express";
import { EmailVerificationService } from "../services/emailVerificationService";
import { db } from "../db";
import { users } from "../../shared/schema";
import { eq } from "drizzle-orm";

const router = Router();

/**
 * POST /api/verification/email/send
 * Send email verification link
 */
router.post("/email/send", async (req, res) => {
  try {
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get user's email
    const [user] = await db
      .select({ email: users.email, emailVerified: users.emailVerified })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || !user.email) {
      return res.status(400).json({ error: "No email address found for this account" });
    }

    if (user.emailVerified) {
      return res.status(400).json({ error: "Email is already verified" });
    }

    // Get base URL from environment or request
    const baseUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;

    // Send verification email
    await EmailVerificationService.sendVerificationEmail(userId, user.email, baseUrl);

    res.json({
      success: true,
      message: "Verification email sent! Please check your inbox.",
    });
  } catch (error) {
    console.error("Error sending verification email:", error);
    res.status(500).json({ error: "Failed to send verification email" });
  }
});

/**
 * GET /api/verification/email/verify?token=xxx
 * Verify email with token
 */
router.get("/email/verify", async (req, res) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: "Verification token is required" });
    }

    const result = await EmailVerificationService.verifyEmail(token);

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        userId: result.userId,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message,
      });
    }
  } catch (error) {
    console.error("Error verifying email:", error);
    res.status(500).json({ error: "Failed to verify email" });
  }
});

/**
 * POST /api/verification/email/resend
 * Resend verification email
 */
router.post("/email/resend", async (req, res) => {
  try {
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get user's email
    const [user] = await db
      .select({ email: users.email, emailVerified: users.emailVerified })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || !user.email) {
      return res.status(400).json({ error: "No email address found for this account" });
    }

    if (user.emailVerified) {
      return res.status(400).json({ error: "Email is already verified" });
    }

    // Get base URL
    const baseUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;

    // Resend verification email
    await EmailVerificationService.resendVerificationEmail(userId, user.email, baseUrl);

    res.json({
      success: true,
      message: "Verification email resent! Please check your inbox.",
    });
  } catch (error) {
    console.error("Error resending verification email:", error);
    res.status(500).json({ error: "Failed to resend verification email" });
  }
});

/**
 * GET /api/verification/status
 * Get user's verification status
 */
router.get("/status", async (req, res) => {
  try {
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const [user] = await db
      .select({
        emailVerified: users.emailVerified,
        phoneVerified: users.phoneVerified,
        idVerified: users.idVerified,
        addressVerified: users.addressVerified,
        verifiedAt: users.verifiedAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      idVerified: user.idVerified,
      addressVerified: user.addressVerified,
      verifiedAt: user.verifiedAt,
      isFullyVerified: user.emailVerified && user.phoneVerified,
    });
  } catch (error) {
    console.error("Error fetching verification status:", error);
    res.status(500).json({ error: "Failed to fetch verification status" });
  }
});

export default router;

