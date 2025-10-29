import { Router } from "express";
import { storage } from "../storage";

const router = Router();

/**
 * POST /api/welcome-signup
 * Handle welcome modal signup
 */
router.post("/welcome-signup", async (req, res) => {
  try {
    const { email, keywords, preferences } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Get IP and user agent for tracking
    const ipAddress = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const referrer = req.headers['referer'] || req.headers['referrer'] as string || null;

    // Create welcome signup
    const signup = await storage.createWelcomeSignup({
      email,
      keywords: keywords || null,
      keywordAlerts: preferences.keywordAlerts || false,
      bulkSalesAlerts: preferences.bulkSales || false,
      estateSalesAlerts: preferences.estateSales || false,
      giveawayEntry: preferences.giveaway || false,
      newsletter: preferences.newsletter || false,
      ipAddress,
      userAgent,
      referrer,
    });

    console.log(`✅ Welcome signup created for ${email}`);

    // If user entered giveaway, create entry
    if (preferences.giveaway) {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      await storage.createGiveawayEntry({
        email,
        month: currentMonth,
        entrySource: 'welcome_modal',
      });
      console.log(`🎁 Giveaway entry created for ${email} (${currentMonth})`);
    }

    // TODO: Send confirmation email
    // TODO: If keywords, create saved search alerts

    res.json({
      success: true,
      message: "Thank you for signing up!",
    });
  } catch (error: any) {
    console.error("❌ Error creating welcome signup:", error);
    
    // Handle duplicate email
    if (error.message && error.message.includes('unique constraint')) {
      return res.status(409).json({ message: "This email is already registered" });
    }
    
    res.status(500).json({ message: "Failed to process signup" });
  }
});

export default router;

