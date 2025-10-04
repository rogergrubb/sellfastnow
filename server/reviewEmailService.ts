import { storage } from './storage';
import { sendReviewRequestEmail, sendReviewReminderEmail } from './email';
import crypto from 'crypto';

function generateReviewUrl(listingId: string, token: string): string {
  const baseUrl = process.env.REPLIT_DOMAINS 
    ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
    : 'http://localhost:5000';
  return `${baseUrl}/reviews/create?listing=${listingId}&token=${token}`;
}

function generateUnsubscribeUrl(userId: string): string {
  const baseUrl = process.env.REPLIT_DOMAINS 
    ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
    : 'http://localhost:5000';
  return `${baseUrl}/unsubscribe/review-reminders?user=${userId}`;
}

export async function sendReviewRequestEmails(listingId: string) {
  try {
    const listingDetails = await storage.getListingWithSeller(listingId);
    
    if (!listingDetails) {
      console.error('Listing not found:', listingId);
      return;
    }

    const { listing, seller } = listingDetails;

    const transactionEvents = await storage.getTransactionDetails(listingId);
    if (!transactionEvents || !transactionEvents.transactionEvents) {
      console.log('No transaction events found for listing:', listingId);
      return;
    }

    const completedEvent = transactionEvents.transactionEvents.find(
      (event: any) => event.eventType === 'completed' || event.eventType === 'confirmed'
    );

    if (!completedEvent) {
      console.log('No completed event found for listing:', listingId);
      return;
    }

    const buyerId = completedEvent.userId;
    const buyer = await storage.getUser(buyerId);

    if (!buyer || !buyer.email) {
      console.error('Buyer not found or no email:', buyerId);
      return;
    }

    if (!seller.email) {
      console.error('Seller has no email:', seller.id);
      return;
    }

    const buyerStats = await storage.getUserStatistics(buyer.id);
    const sellerStats = await storage.getUserStatistics(seller.id);

    const buyerToken = crypto.randomBytes(32).toString('hex');
    const sellerToken = crypto.randomBytes(32).toString('hex');
    
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    await storage.createReviewToken({
      token: buyerToken,
      listingId: listing.id,
      userId: buyer.id,
      expiresAt: expiryDate,
    });

    await storage.createReviewToken({
      token: sellerToken,
      listingId: listing.id,
      userId: seller.id,
      expiresAt: expiryDate,
    });

    const buyerEmail = {
      to: buyer.email,
      recipientName: buyer.firstName || 'there',
      otherPartyName: `${seller.firstName || ''} ${seller.lastName || ''}`.trim() || 'the seller',
      otherPartyRating: sellerStats?.averageRating ? parseFloat(sellerStats.averageRating as any) : null,
      itemName: listing.title,
      itemPrice: listing.price,
      transactionDate: completedEvent.createdAt,
      reviewUrl: generateReviewUrl(listing.id, buyerToken),
      role: 'buyer' as const,
    };

    const sellerEmail = {
      to: seller.email,
      recipientName: seller.firstName || 'there',
      otherPartyName: `${buyer.firstName || ''} ${buyer.lastName || ''}`.trim() || 'the buyer',
      otherPartyRating: buyerStats?.averageRating ? parseFloat(buyerStats.averageRating as any) : null,
      itemName: listing.title,
      itemPrice: listing.price,
      transactionDate: completedEvent.createdAt,
      reviewUrl: generateReviewUrl(listing.id, sellerToken),
      role: 'seller' as const,
    };

    if (buyer.reviewEmailsEnabled !== false) {
      await sendReviewRequestEmail(buyerEmail);
      await storage.trackReviewRequestEmail({
        listingId: listing.id,
        recipientUserId: buyer.id,
        emailType: 'initial',
      });
      console.log(`Review request email sent to buyer: ${buyer.email}`);
    }

    if (seller.reviewEmailsEnabled !== false) {
      await sendReviewRequestEmail(sellerEmail);
      await storage.trackReviewRequestEmail({
        listingId: listing.id,
        recipientUserId: seller.id,
        emailType: 'initial',
      });
      console.log(`Review request email sent to seller: ${seller.email}`);
    }

  } catch (error) {
    console.error('Error sending review request emails:', error);
  }
}

export async function sendReviewReminders() {
  try {
    const pendingReminders = await storage.getPendingReviewReminders(7);

    for (const { listing, user, recipientUserId } of pendingReminders) {
      if (!user.email || user.reviewEmailsEnabled === false) {
        continue;
      }

      const existingReview = await storage.getUserReviews(recipientUserId, {
        limit: 1,
        offset: 0,
      });

      const hasReviewedListing = existingReview.some((r: any) => r.listingId === listing.id);
      if (hasReviewedListing) {
        await storage.markReviewAsLeft(listing.id, recipientUserId);
        continue;
      }

      const tokenData = await storage.createReviewToken({
        token: crypto.randomBytes(32).toString('hex'),
        listingId: listing.id,
        userId: recipientUserId,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      const transactionDetails = await storage.getTransactionDetails(listing.id);
      const sellerOrBuyerId = listing.userId === recipientUserId
        ? transactionDetails.transactionEvents.find((e: any) => e.userId !== listing.userId)?.userId
        : listing.userId;

      const otherParty = sellerOrBuyerId ? await storage.getUser(sellerOrBuyerId) : null;
      const otherPartyStats = sellerOrBuyerId ? await storage.getUserStatistics(sellerOrBuyerId) : null;

      const role = listing.userId === recipientUserId ? 'seller' : 'buyer';

      await sendReviewReminderEmail({
        to: user.email,
        recipientName: user.firstName || 'there',
        otherPartyName: otherParty ? `${otherParty.firstName || ''} ${otherParty.lastName || ''}`.trim() : 'the other party',
        otherPartyRating: otherPartyStats?.averageRating ? parseFloat(otherPartyStats.averageRating as any) : null,
        itemName: listing.title,
        itemPrice: listing.price,
        reviewUrl: generateReviewUrl(listing.id, tokenData.token),
        unsubscribeUrl: generateUnsubscribeUrl(recipientUserId),
        role,
      });

      await storage.trackReviewRequestEmail({
        listingId: listing.id,
        recipientUserId: recipientUserId,
        emailType: 'reminder',
      });

      console.log(`Review reminder sent to: ${user.email}`);
    }

    console.log(`Sent ${pendingReminders.length} review reminders`);
  } catch (error) {
    console.error('Error sending review reminders:', error);
  }
}
