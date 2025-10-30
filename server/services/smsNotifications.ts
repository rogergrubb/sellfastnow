import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { sendSMS } from "./sms";

/**
 * Send SMS when seller receives a new offer
 */
export async function sendOfferReceivedSMS(
  sellerId: string,
  buyerName: string,
  listingTitle: string,
  offerAmount: string,
  listingUrl: string
): Promise<boolean> {
  try {
    // Get seller preferences
    const [seller] = await db
      .select()
      .from(users)
      .where(eq(users.id, sellerId))
      .limit(1);

    if (!seller || !seller.phoneNumber || !seller.smsOfferReceived) {
      console.log(`Seller ${sellerId} not opted in for offer SMS`);
      return false;
    }

    const message = `💰 New Offer on "${listingTitle}"!\n\n` +
      `${buyerName} offered $${offerAmount}\n\n` +
      `View: ${listingUrl}`;

    return await sendSMS({
      to: seller.phoneNumber,
      message,
    });
  } catch (error) {
    console.error("Error sending offer received SMS:", error);
    return false;
  }
}

/**
 * Send SMS when buyer's offer is accepted
 */
export async function sendOfferAcceptedSMS(
  buyerId: string,
  sellerName: string,
  listingTitle: string,
  amount: string,
  paymentUrl: string
): Promise<boolean> {
  try {
    const [buyer] = await db
      .select()
      .from(users)
      .where(eq(users.id, buyerId))
      .limit(1);

    if (!buyer || !buyer.phoneNumber || !buyer.smsOfferResponse) {
      console.log(`Buyer ${buyerId} not opted in for offer response SMS`);
      return false;
    }

    const message = `✅ Offer Accepted!\n\n` +
      `${sellerName} accepted your $${amount} offer for "${listingTitle}"\n\n` +
      `Complete payment: ${paymentUrl}`;

    return await sendSMS({
      to: buyer.phoneNumber,
      message,
    });
  } catch (error) {
    console.error("Error sending offer accepted SMS:", error);
    return false;
  }
}

/**
 * Send SMS when buyer's offer is rejected
 */
export async function sendOfferRejectedSMS(
  buyerId: string,
  sellerName: string,
  listingTitle: string,
  listingUrl: string
): Promise<boolean> {
  try {
    const [buyer] = await db
      .select()
      .from(users)
      .where(eq(users.id, buyerId))
      .limit(1);

    if (!buyer || !buyer.phoneNumber || !buyer.smsOfferResponse) {
      return false;
    }

    const message = `❌ Offer Declined\n\n` +
      `${sellerName} declined your offer for "${listingTitle}"\n\n` +
      `View listing: ${listingUrl}`;

    return await sendSMS({
      to: buyer.phoneNumber,
      message,
    });
  } catch (error) {
    console.error("Error sending offer rejected SMS:", error);
    return false;
  }
}

/**
 * Send SMS when offer is countered
 */
export async function sendCounterOfferSMS(
  recipientId: string,
  senderName: string,
  listingTitle: string,
  counterAmount: string,
  listingUrl: string
): Promise<boolean> {
  try {
    const [recipient] = await db
      .select()
      .from(users)
      .where(eq(users.id, recipientId))
      .limit(1);

    if (!recipient || !recipient.phoneNumber || !recipient.smsOfferResponse) {
      return false;
    }

    const message = `🔄 Counter Offer on "${listingTitle}"\n\n` +
      `${senderName} countered with $${counterAmount}\n\n` +
      `Respond: ${listingUrl}`;

    return await sendSMS({
      to: recipient.phoneNumber,
      message,
    });
  } catch (error) {
    console.error("Error sending counter offer SMS:", error);
    return false;
  }
}

/**
 * Send SMS when user receives a new message
 */
export async function sendNewMessageSMS(
  receiverId: string,
  senderName: string,
  listingTitle: string,
  messagePreview: string,
  conversationUrl: string
): Promise<boolean> {
  try {
    const [receiver] = await db
      .select()
      .from(users)
      .where(eq(users.id, receiverId))
      .limit(1);

    if (!receiver || !receiver.phoneNumber || !receiver.smsNewMessage) {
      return false;
    }

    // Truncate message preview to fit in SMS
    const preview = messagePreview.length > 50 
      ? messagePreview.substring(0, 47) + "..." 
      : messagePreview;

    const message = `💬 New Message from ${senderName}\n\n` +
      `Re: "${listingTitle}"\n` +
      `"${preview}"\n\n` +
      `Reply: ${conversationUrl}`;

    return await sendSMS({
      to: receiver.phoneNumber,
      message,
    });
  } catch (error) {
    console.error("Error sending new message SMS:", error);
    return false;
  }
}

/**
 * Send SMS when listing is published
 */
export async function sendListingPublishedSMS(
  sellerId: string,
  listingTitle: string,
  listingUrl: string
): Promise<boolean> {
  try {
    const [seller] = await db
      .select()
      .from(users)
      .where(eq(users.id, sellerId))
      .limit(1);

    if (!seller || !seller.phoneNumber || !seller.smsListingPublished) {
      return false;
    }

    const message = `🎉 Listing Published!\n\n` +
      `"${listingTitle}" is now live on SellFast.Now\n\n` +
      `View: ${listingUrl}`;

    return await sendSMS({
      to: seller.phoneNumber,
      message,
    });
  } catch (error) {
    console.error("Error sending listing published SMS:", error);
    return false;
  }
}

/**
 * Send SMS when someone favorites seller's listing
 */
export async function sendItemFavoritedSMS(
  sellerId: string,
  buyerName: string,
  listingTitle: string,
  listingUrl: string
): Promise<boolean> {
  try {
    const [seller] = await db
      .select()
      .from(users)
      .where(eq(users.id, sellerId))
      .limit(1);

    if (!seller || !seller.phoneNumber || !seller.smsListingEngagement) {
      return false;
    }

    const message = `⭐ Someone Favorited Your Item!\n\n` +
      `${buyerName} favorited "${listingTitle}"\n\n` +
      `View: ${listingUrl}`;

    return await sendSMS({
      to: seller.phoneNumber,
      message,
    });
  } catch (error) {
    console.error("Error sending item favorited SMS:", error);
    return false;
  }
}

/**
 * Send SMS when listing is sold
 */
export async function sendListingSoldSMS(
  sellerId: string,
  listingTitle: string,
  saleAmount: string,
  transactionUrl: string
): Promise<boolean> {
  try {
    const [seller] = await db
      .select()
      .from(users)
      .where(eq(users.id, sellerId))
      .limit(1);

    if (!seller || !seller.phoneNumber || !seller.smsListingSold) {
      return false;
    }

    const message = `🎊 Item Sold!\n\n` +
      `"${listingTitle}" sold for $${saleAmount}\n\n` +
      `View transaction: ${transactionUrl}`;

    return await sendSMS({
      to: seller.phoneNumber,
      message,
    });
  } catch (error) {
    console.error("Error sending listing sold SMS:", error);
    return false;
  }
}

/**
 * Send SMS when payment is confirmed
 */
export async function sendPaymentConfirmedSMS(
  userId: string,
  listingTitle: string,
  amount: string,
  transactionUrl: string,
  isSeller: boolean
): Promise<boolean> {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || !user.phoneNumber || !user.smsPaymentConfirmed) {
      return false;
    }

    const message = isSeller
      ? `💰 Payment Received!\n\n` +
        `Buyer paid $${amount} for "${listingTitle}"\n\n` +
        `View: ${transactionUrl}`
      : `✅ Payment Confirmed!\n\n` +
        `Your $${amount} payment for "${listingTitle}" was successful\n\n` +
        `View: ${transactionUrl}`;

    return await sendSMS({
      to: user.phoneNumber,
      message,
    });
  } catch (error) {
    console.error("Error sending payment confirmed SMS:", error);
    return false;
  }
}

/**
 * Send SMS when user receives a review
 */
export async function sendReviewReceivedSMS(
  userId: string,
  reviewerName: string,
  rating: number,
  reviewUrl: string
): Promise<boolean> {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || !user.phoneNumber || !user.smsReviewReceived) {
      return false;
    }

    const stars = "⭐".repeat(rating);
    const message = `📝 New Review!\n\n` +
      `${reviewerName} left you a ${stars} review\n\n` +
      `View: ${reviewUrl}`;

    return await sendSMS({
      to: user.phoneNumber,
      message,
    });
  } catch (error) {
    console.error("Error sending review received SMS:", error);
    return false;
  }
}

/**
 * Send SMS meetup reminder
 */
export async function sendMeetupReminderSMS(
  userId: string,
  otherPartyName: string,
  listingTitle: string,
  meetupTime: string,
  meetupLocation: string,
  meetupUrl: string
): Promise<boolean> {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || !user.phoneNumber || !user.smsMeetupReminder) {
      return false;
    }

    const message = `📍 Meetup Reminder\n\n` +
      `Meeting ${otherPartyName} for "${listingTitle}"\n` +
      `Time: ${meetupTime}\n` +
      `Location: ${meetupLocation}\n\n` +
      `Details: ${meetupUrl}`;

    return await sendSMS({
      to: user.phoneNumber,
      message,
    });
  } catch (error) {
    console.error("Error sending meetup reminder SMS:", error);
    return false;
  }
}

