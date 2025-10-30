import { db } from "../db";
import { users } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import {
  sendWeeklyUpdateSMS,
  sendMonthlyUpdateSMS,
  sendCreditGiveawaySMS,
  sendPromotionalSMS,
  sendBatchSMS,
} from "./sms";

/**
 * Send weekly update SMS to all subscribed users
 */
export async function sendWeeklyUpdates() {
  console.log("📅 Starting weekly SMS update campaign...");
  
  try {
    // Get all users who opted in for weekly updates and have phone numbers
    const subscribedUsers = await db
      .select()
      .from(users)
      .where(and(
        eq(users.smsWeeklyUpdates, true),
        // Phone number exists (not null/empty)
      ));
    
    const usersWithPhones = subscribedUsers.filter(u => u.phoneNumber);
    
    console.log(`Found ${usersWithPhones.length} users subscribed to weekly updates`);
    
    if (usersWithPhones.length === 0) {
      console.log("No users to send to");
      return { sent: 0, failed: 0 };
    }
    
    // Prepare messages
    const messages = usersWithPhones.map(user => ({
      phoneNumber: user.phoneNumber!,
      message: `Hi ${user.firstName || "there"}! 📊 Your SellFast.Now weekly update:\n\n` +
        `• Check out new listings this week\n` +
        `• Review your saved search matches\n` +
        `• See what's trending\n\n` +
        `Visit: https://sellfast.now`,
    }));
    
    // Send batch SMS
    const result = await sendBatchSMS(messages);
    
    console.log(`✅ Weekly update campaign complete: ${result.sent} sent, ${result.failed} failed`);
    
    return result;
  } catch (error) {
    console.error("❌ Error sending weekly updates:", error);
    return { sent: 0, failed: 0 };
  }
}

/**
 * Send monthly update SMS to all subscribed users
 */
export async function sendMonthlyUpdates() {
  console.log("📅 Starting monthly SMS update campaign...");
  
  try {
    const subscribedUsers = await db
      .select()
      .from(users)
      .where(and(
        eq(users.smsMonthlyUpdates, true),
      ));
    
    const usersWithPhones = subscribedUsers.filter(u => u.phoneNumber);
    
    console.log(`Found ${usersWithPhones.length} users subscribed to monthly updates`);
    
    if (usersWithPhones.length === 0) {
      return { sent: 0, failed: 0 };
    }
    
    const messages = usersWithPhones.map(user => ({
      phoneNumber: user.phoneNumber!,
      message: `Hi ${user.firstName || "there"}! 📈 Your SellFast.Now monthly report:\n\n` +
        `• Platform growing fast!\n` +
        `• New features added\n` +
        `• Check your stats\n\n` +
        `Keep selling! https://sellfast.now`,
    }));
    
    const result = await sendBatchSMS(messages);
    
    console.log(`✅ Monthly update campaign complete: ${result.sent} sent, ${result.failed} failed`);
    
    return result;
  } catch (error) {
    console.error("❌ Error sending monthly updates:", error);
    return { sent: 0, failed: 0 };
  }
}

/**
 * Send AI credit giveaway SMS to all subscribed users
 */
export async function sendCreditGiveaway(credits: number) {
  console.log(`🎁 Starting AI credit giveaway campaign (${credits} credits)...`);
  
  try {
    const subscribedUsers = await db
      .select()
      .from(users)
      .where(and(
        eq(users.smsCreditGiveaways, true),
      ));
    
    const usersWithPhones = subscribedUsers.filter(u => u.phoneNumber);
    
    console.log(`Found ${usersWithPhones.length} users subscribed to giveaways`);
    
    if (usersWithPhones.length === 0) {
      return { sent: 0, failed: 0 };
    }
    
    const messages = usersWithPhones.map(user => ({
      phoneNumber: user.phoneNumber!,
      message: `🎉 Surprise, ${user.firstName || "there"}!\n\n` +
        `You've received ${credits} FREE AI credits from SellFast.Now!\n\n` +
        `Use them to generate listings with AI-powered titles, descriptions, and valuations.\n\n` +
        `Start listing: https://sellfast.now/post-ad`,
    }));
    
    const result = await sendBatchSMS(messages);
    
    // Update user credits in database
    for (const user of usersWithPhones) {
      await db
        .update(users)
        .set({
          aiCreditsPurchased: (user.aiCreditsPurchased || 0) + credits,
        })
        .where(eq(users.id, user.id));
    }
    
    console.log(`✅ Credit giveaway campaign complete: ${result.sent} sent, ${result.failed} failed`);
    console.log(`💰 Added ${credits} credits to ${usersWithPhones.length} users`);
    
    return result;
  } catch (error) {
    console.error("❌ Error sending credit giveaway:", error);
    return { sent: 0, failed: 0 };
  }
}

/**
 * Send promotional SMS to all subscribed users
 */
export async function sendPromotionalCampaign(
  title: string,
  message: string,
  ctaUrl?: string
) {
  console.log(`📢 Starting promotional SMS campaign: ${title}...`);
  
  try {
    const subscribedUsers = await db
      .select()
      .from(users)
      .where(and(
        eq(users.smsPromotional, true),
      ));
    
    const usersWithPhones = subscribedUsers.filter(u => u.phoneNumber);
    
    console.log(`Found ${usersWithPhones.length} users subscribed to promotions`);
    
    if (usersWithPhones.length === 0) {
      return { sent: 0, failed: 0 };
    }
    
    const messages = usersWithPhones.map(user => {
      let smsText = `${title}\n\n${message}`;
      if (ctaUrl) {
        smsText += `\n\n${ctaUrl}`;
      }
      
      return {
        phoneNumber: user.phoneNumber!,
        message: smsText,
      };
    });
    
    const result = await sendBatchSMS(messages);
    
    console.log(`✅ Promotional campaign complete: ${result.sent} sent, ${result.failed} failed`);
    
    return result;
  } catch (error) {
    console.error("❌ Error sending promotional campaign:", error);
    return { sent: 0, failed: 0 };
  }
}

/**
 * Schedule weekly updates (call this from a cron job)
 */
export async function scheduleWeeklyUpdates() {
  // This would be called by a cron job every Monday at 9am
  console.log("⏰ Scheduled weekly update triggered");
  return await sendWeeklyUpdates();
}

/**
 * Schedule monthly updates (call this from a cron job)
 */
export async function scheduleMonthlyUpdates() {
  // This would be called by a cron job on the 1st of each month
  console.log("⏰ Scheduled monthly update triggered");
  return await sendMonthlyUpdates();
}

