import { Router } from "express";
import { isAuthenticated } from "../supabaseAuth";
import {
  sendWeeklyUpdates,
  sendMonthlyUpdates,
  sendCreditGiveaway,
  sendPromotionalCampaign,
} from "../services/smsCampaigns";

const router = Router();

/**
 * Send weekly update SMS to all subscribed users
 * POST /api/sms-campaigns/weekly
 */
router.post("/weekly", isAuthenticated, async (req: any, res) => {
  try {
    // TODO: Add admin check here
    // if (!req.user?.isAdmin) {
    //   return res.status(403).json({ error: "Admin access required" });
    // }
    
    const result = await sendWeeklyUpdates();
    
    res.json({
      success: true,
      message: "Weekly update campaign sent",
      ...result,
    });
  } catch (error: any) {
    console.error("Error sending weekly updates:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Send monthly update SMS to all subscribed users
 * POST /api/sms-campaigns/monthly
 */
router.post("/monthly", isAuthenticated, async (req: any, res) => {
  try {
    const result = await sendMonthlyUpdates();
    
    res.json({
      success: true,
      message: "Monthly update campaign sent",
      ...result,
    });
  } catch (error: any) {
    console.error("Error sending monthly updates:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Send AI credit giveaway SMS to all subscribed users
 * POST /api/sms-campaigns/giveaway
 * Body: { credits: number }
 */
router.post("/giveaway", isAuthenticated, async (req: any, res) => {
  try {
    const { credits } = req.body;
    
    if (!credits || credits < 1) {
      return res.status(400).json({ error: "Invalid credits amount" });
    }
    
    const result = await sendCreditGiveaway(credits);
    
    res.json({
      success: true,
      message: `Credit giveaway sent (${credits} credits per user)`,
      ...result,
    });
  } catch (error: any) {
    console.error("Error sending credit giveaway:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Send promotional SMS to all subscribed users
 * POST /api/sms-campaigns/promotional
 * Body: { title: string, message: string, ctaUrl?: string }
 */
router.post("/promotional", isAuthenticated, async (req: any, res) => {
  try {
    const { title, message, ctaUrl } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({ error: "Title and message are required" });
    }
    
    const result = await sendPromotionalCampaign(title, message, ctaUrl);
    
    res.json({
      success: true,
      message: "Promotional campaign sent",
      ...result,
    });
  } catch (error: any) {
    console.error("Error sending promotional campaign:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

