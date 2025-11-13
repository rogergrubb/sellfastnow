// Phone Verification Routes
import { Router } from "express";
import { PhoneVerificationService } from "../services/phoneVerificationService";
import { rateLimiters } from "../middleware/rateLimiter";

const router = Router();

/**
 * POST /api/verification/phone/send
 * Send SMS verification code
 */
router.post("/phone/send", rateLimiters.phoneVerification, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { phoneNumber } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!phoneNumber) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    const result = await PhoneVerificationService.sendVerificationCode(userId, phoneNumber);

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message,
      });
    }
  } catch (error) {
    console.error("Error sending verification code:", error);
    res.status(500).json({ error: "Failed to send verification code" });
  }
});

/**
 * POST /api/verification/phone/verify
 * Verify phone with code
 */
router.post("/phone/verify", rateLimiters.phoneVerification, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { phoneNumber, code } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!phoneNumber || !code) {
      return res.status(400).json({ error: "Phone number and code are required" });
    }

    const result = await PhoneVerificationService.verifyCode(userId, phoneNumber, code);

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message,
      });
    }
  } catch (error) {
    console.error("Error verifying phone:", error);
    res.status(500).json({ error: "Failed to verify phone number" });
  }
});

/**
 * GET /api/verification/phone/attempts
 * Get remaining verification attempts
 */
router.get("/phone/attempts", async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { phoneNumber } = req.query;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return res.status(400).json({ error: "Phone number is required" });
    }

    const remainingAttempts = PhoneVerificationService.getRemainingAttempts(userId, phoneNumber);

    res.json({
      remainingAttempts,
    });
  } catch (error) {
    console.error("Error fetching attempts:", error);
    res.status(500).json({ error: "Failed to fetch remaining attempts" });
  }
});

export default router;

