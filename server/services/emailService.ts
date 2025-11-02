// Email Service for Notifications
// Handles sending notification emails using Resend

import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL || 'notifications@sellfast.now';

if (!resendApiKey) {
  console.warn('⚠️  RESEND_API_KEY not set - email notifications will be disabled');
}

const resendClient = resendApiKey ? new Resend(resendApiKey) : null;

interface NotificationEmailParams {
  to: string;
  subject: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
}

class EmailService {
  /**
   * Send a notification email
   */
  async sendNotificationEmail(params: NotificationEmailParams): Promise<boolean> {
    if (!resendClient) {
      console.error('❌ Resend not configured - cannot send email');
      return false;
    }

    const { to, subject, title, message, actionUrl, actionText = 'View Details' } = params;

    try {
      const html = this.generateNotificationEmailHTML({
        title,
        message,
        actionUrl,
        actionText,
      });

      await resendClient.emails.send({
        from: fromEmail,
        to,
        subject,
        html,
      });

      console.log(`✅ Notification email sent to ${to}`);
      return true;
    } catch (error: any) {
      console.error('❌ Error sending notification email:', error.message);
      return false;
    }
  }

  /**
   * Generate HTML for notification email
   */
  private generateNotificationEmailHTML(params: {
    title: string;
    message: string;
    actionUrl?: string;
    actionText?: string;
  }): string {
    const { title, message, actionUrl, actionText } = params;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #ea580c;
      margin-bottom: 10px;
    }
    .title {
      font-size: 24px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 20px;
    }
    .message {
      font-size: 16px;
      color: #4b5563;
      margin-bottom: 30px;
      line-height: 1.8;
    }
    .cta-button {
      display: inline-block;
      background-color: #ea580c;
      color: #ffffff !important;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
    }
    .cta-button:hover {
      background-color: #c2410c;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 14px;
      color: #6b7280;
    }
    .footer a {
      color: #ea580c;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">SellFast.Now</div>
    </div>
    
    <div class="title">${title}</div>
    
    <div class="message">
      ${message.replace(/\n/g, '<br>')}
    </div>
    
    ${actionUrl ? `
      <div style="text-align: center;">
        <a href="${actionUrl}" class="cta-button">${actionText}</a>
      </div>
    ` : ''}
    
    <div class="footer">
      <p>
        You're receiving this email because you have notifications enabled on SellFast.Now.
      </p>
      <p>
        <a href="${process.env.BASE_URL || 'https://sellfast.now'}/settings">Manage notification preferences</a>
      </p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Send new message notification email
   */
  async sendNewMessageEmail(params: {
    to: string;
    senderName: string;
    listingTitle: string;
    messagePreview: string;
    messageUrl: string;
  }): Promise<boolean> {
    return this.sendNotificationEmail({
      to: params.to,
      subject: `New message from ${params.senderName}`,
      title: `${params.senderName} sent you a message`,
      message: `About: ${params.listingTitle}\n\n"${params.messagePreview}"`,
      actionUrl: params.messageUrl,
      actionText: 'Reply to Message',
    });
  }

  /**
   * Send new offer notification email
   */
  async sendNewOfferEmail(params: {
    to: string;
    buyerName: string;
    listingTitle: string;
    offerAmount: string;
    offerUrl: string;
  }): Promise<boolean> {
    return this.sendNotificationEmail({
      to: params.to,
      subject: `New offer on ${params.listingTitle}`,
      title: `${params.buyerName} made an offer`,
      message: `${params.buyerName} offered $${params.offerAmount} for "${params.listingTitle}"`,
      actionUrl: params.offerUrl,
      actionText: 'View Offer',
    });
  }

  /**
   * Send new review notification email
   */
  async sendNewReviewEmail(params: {
    to: string;
    reviewerName: string;
    rating: number;
    reviewUrl: string;
  }): Promise<boolean> {
    const stars = '⭐'.repeat(Math.round(params.rating));
    
    return this.sendNotificationEmail({
      to: params.to,
      subject: `${params.reviewerName} left you a review`,
      title: 'You received a new review',
      message: `${params.reviewerName} rated you ${stars} (${params.rating}/5)`,
      actionUrl: params.reviewUrl,
      actionText: 'View Review',
    });
  }

  /**
   * Send item sold notification email
   */
  async sendItemSoldEmail(params: {
    to: string;
    listingTitle: string;
    saleAmount: string;
    buyerName: string;
    transactionUrl: string;
  }): Promise<boolean> {
    return this.sendNotificationEmail({
      to: params.to,
      subject: `Your item sold: ${params.listingTitle}`,
      title: '🎉 Congratulations! Your item sold',
      message: `"${params.listingTitle}" sold to ${params.buyerName} for $${params.saleAmount}`,
      actionUrl: params.transactionUrl,
      actionText: 'View Transaction',
    });
  }

  /**
   * Send purchase confirmation email
   */
  async sendPurchaseConfirmationEmail(params: {
    to: string;
    listingTitle: string;
    purchaseAmount: string;
    sellerName: string;
    transactionUrl: string;
  }): Promise<boolean> {
    return this.sendNotificationEmail({
      to: params.to,
      subject: `Purchase confirmed: ${params.listingTitle}`,
      title: '✅ Purchase Confirmed',
      message: `You purchased "${params.listingTitle}" from ${params.sellerName} for $${params.purchaseAmount}`,
      actionUrl: params.transactionUrl,
      actionText: 'View Purchase',
    });
  }

  /**
   * Send transaction update email
   */
  async sendTransactionUpdateEmail(params: {
    to: string;
    listingTitle: string;
    status: string;
    transactionUrl: string;
  }): Promise<boolean> {
    return this.sendNotificationEmail({
      to: params.to,
      subject: `Transaction update: ${params.listingTitle}`,
      title: 'Transaction Status Update',
      message: `Your transaction for "${params.listingTitle}" has been updated to: ${status}`,
      actionUrl: params.transactionUrl,
      actionText: 'View Transaction',
    });
  }
}

export const emailService = new EmailService();
