// SMS Service for Notifications
// Wrapper around the existing SMS service for notification-specific messages

import { sendSMS as sendTwilioSMS } from './sms';

interface SendSMSParams {
  to: string;
  message: string;
}

class SMSService {
  /**
   * Send SMS notification
   */
  async sendSMS(params: SendSMSParams): Promise<boolean> {
    return sendTwilioSMS(params);
  }

  /**
   * Send new message SMS notification
   */
  async sendNewMessageSMS(params: {
    to: string;
    senderName: string;
    listingTitle: string;
  }): Promise<boolean> {
    const message = `💬 New message from ${params.senderName} about "${params.listingTitle}"\n\nReply at: ${process.env.BASE_URL || 'https://sellfast.now'}/messages`;
    
    return this.sendSMS({ to: params.to, message });
  }

  /**
   * Send new offer SMS notification
   */
  async sendNewOfferSMS(params: {
    to: string;
    buyerName: string;
    listingTitle: string;
    offerAmount: string;
  }): Promise<boolean> {
    const message = `💰 ${params.buyerName} offered $${params.offerAmount} for "${params.listingTitle}"\n\nView: ${process.env.BASE_URL || 'https://sellfast.now'}/dashboard`;
    
    return this.sendSMS({ to: params.to, message });
  }

  /**
   * Send new review SMS notification
   */
  async sendNewReviewSMS(params: {
    to: string;
    reviewerName: string;
    rating: number;
  }): Promise<boolean> {
    const stars = '⭐'.repeat(Math.round(params.rating));
    const message = `⭐ ${params.reviewerName} left you a review: ${stars} (${params.rating}/5)\n\nView: ${process.env.BASE_URL || 'https://sellfast.now'}/profile`;
    
    return this.sendSMS({ to: params.to, message });
  }

  /**
   * Send item sold SMS notification
   */
  async sendItemSoldSMS(params: {
    to: string;
    listingTitle: string;
    saleAmount: string;
    buyerName: string;
  }): Promise<boolean> {
    const message = `🎉 Your item sold!\n\n"${params.listingTitle}" sold to ${params.buyerName} for $${params.saleAmount}\n\nView: ${process.env.BASE_URL || 'https://sellfast.now'}/dashboard`;
    
    return this.sendSMS({ to: params.to, message });
  }

  /**
   * Send purchase confirmation SMS
   */
  async sendPurchaseConfirmationSMS(params: {
    to: string;
    listingTitle: string;
    purchaseAmount: string;
    sellerName: string;
  }): Promise<boolean> {
    const message = `✅ Purchase confirmed!\n\nYou bought "${params.listingTitle}" from ${params.sellerName} for $${params.purchaseAmount}\n\nView: ${process.env.BASE_URL || 'https://sellfast.now'}/dashboard`;
    
    return this.sendSMS({ to: params.to, message });
  }

  /**
   * Send transaction update SMS
   */
  async sendTransactionUpdateSMS(params: {
    to: string;
    listingTitle: string;
    status: string;
  }): Promise<boolean> {
    const message = `📦 Transaction update\n\n"${params.listingTitle}" status: ${params.status}\n\nView: ${process.env.BASE_URL || 'https://sellfast.now'}/transactions`;
    
    return this.sendSMS({ to: params.to, message });
  }
}

export const smsService = new SMSService();
