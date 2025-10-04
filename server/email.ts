import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return {
    apiKey: connectionSettings.settings.api_key, 
    fromEmail: connectionSettings.settings.from_email
  };
}

export async function getUncachableResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail: fromEmail || 'noreply@sellfast.now'
  };
}

interface ReviewRequestEmailData {
  to: string;
  recipientName: string;
  otherPartyName: string;
  otherPartyRating: number | null;
  itemName: string;
  itemPrice: string;
  transactionDate: Date;
  reviewUrl: string;
  role: 'buyer' | 'seller';
}

export async function sendReviewRequestEmail(data: ReviewRequestEmailData) {
  const { client, fromEmail } = await getUncachableResendClient();
  
  const isBuyer = data.role === 'buyer';
  const actionVerb = isBuyer ? 'purchase from' : 'sale to';
  const subject = `How was your ${actionVerb} ${data.otherPartyName}?`;
  
  const ratingDisplay = data.otherPartyRating 
    ? `⭐ ${data.otherPartyRating.toFixed(1)}/5.0`
    : '(New user)';
  
  const helpsBullets = isBuyer
    ? `✓ Other buyers find reliable sellers
✓ Good sellers get recognized
✓ Everyone makes better decisions`
    : `✓ Other sellers identify reliable buyers
✓ Good buyers build their reputation
✓ Everyone has better transactions`;

  const feedbackMessage = isBuyer
    ? `Your honest feedback helps other buyers make informed decisions and helps good sellers build their reputation.`
    : `Your feedback helps other sellers identify reliable buyers and helps the community grow stronger.`;

  const html = `
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
    }
    .container {
      background-color: #ffffff;
    }
    .header {
      text-align: left;
      margin-bottom: 30px;
    }
    .transaction-box {
      background-color: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .transaction-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .transaction-detail {
      margin: 4px 0;
      color: #666;
    }
    .cta-button {
      display: inline-block;
      background-color: #ea580c;
      color: #ffffff !important;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
    }
    .benefits {
      background-color: #f0fdf4;
      border-left: 4px solid #22c55e;
      padding: 16px;
      margin: 20px 0;
    }
    .benefits-title {
      font-weight: 600;
      margin-bottom: 8px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #dee2e6;
      font-size: 14px;
      color: #666;
    }
    .footer-links {
      margin-top: 12px;
    }
    .footer-links a {
      color: #ea580c;
      text-decoration: none;
      margin: 0 8px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Hi ${data.recipientName},</h2>
    </div>
    
    <p>You recently completed a ${isBuyer ? 'purchase' : 'sale'} on SellFast.now:</p>
    
    <div class="transaction-box">
      <div class="transaction-title">📦 ${data.itemName}</div>
      <div class="transaction-detail"><strong>Price:</strong> $${data.itemPrice}</div>
      <div class="transaction-detail"><strong>${isBuyer ? 'Seller' : 'Buyer'}:</strong> ${data.otherPartyName} ${ratingDisplay}</div>
      <div class="transaction-detail"><strong>Date:</strong> ${new Date(data.transactionDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
    </div>
    
    <p><strong>How was your experience with ${data.otherPartyName}?</strong></p>
    
    <p>${feedbackMessage}</p>
    
    <div style="text-align: center;">
      <a href="${data.reviewUrl}" class="cta-button">⭐⭐⭐⭐⭐ Leave a Review</a>
    </div>
    
    <p style="text-align: center; color: #666; font-size: 14px;">It takes less than 2 minutes!</p>
    
    <div class="benefits">
      <div class="benefits-title">Your review helps the SellFast.now community:</div>
      <div style="white-space: pre-line;">${helpsBullets}</div>
    </div>
    
    <p style="font-size: 14px; color: #666;">
      <strong>Note:</strong> ${data.otherPartyName} can see and respond to your review publicly.
    </p>
    
    <p style="font-size: 14px; color: #666;">
      Questions? Reply to this email.
    </p>
    
    <p>- The SellFast.now Team</p>
    
    <div class="footer">
      <div>SellFast.now | Safe local marketplace</div>
      <div class="footer-links">
        <a href="${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000'}">View Transaction</a> |
        <a href="${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}/settings` : 'http://localhost:5000/settings'}">Settings</a> |
        <a href="${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}/help` : 'http://localhost:5000/help'}">Help</a>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  const response = await client.emails.send({
    from: fromEmail,
    to: data.to,
    subject,
    html,
  });

  return response;
}

interface ReminderEmailData {
  to: string;
  recipientName: string;
  otherPartyName: string;
  otherPartyRating: number | null;
  itemName: string;
  itemPrice: string;
  reviewUrl: string;
  unsubscribeUrl: string;
  role: 'buyer' | 'seller';
}

export async function sendReviewReminderEmail(data: ReminderEmailData) {
  const { client, fromEmail } = await getUncachableResendClient();
  
  const isBuyer = data.role === 'buyer';
  const actionVerb = isBuyer ? 'purchase from' : 'sale to';
  const subject = `Still want to review your ${actionVerb} ${data.otherPartyName}?`;
  
  const ratingDisplay = data.otherPartyRating 
    ? `⭐ ${data.otherPartyRating.toFixed(1)}/5.0`
    : '';

  const html = `
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
    }
    .container {
      background-color: #ffffff;
    }
    .header {
      text-align: left;
      margin-bottom: 30px;
    }
    .transaction-box {
      background-color: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .cta-button {
      display: inline-block;
      background-color: #ea580c;
      color: #ffffff !important;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #dee2e6;
      font-size: 14px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Hi ${data.recipientName},</h2>
    </div>
    
    <p>A week ago you completed a ${isBuyer ? 'purchase' : 'sale'} on SellFast.now:</p>
    
    <div class="transaction-box">
      <div style="font-size: 18px; font-weight: 600;">📦 ${data.itemName} - $${data.itemPrice}</div>
      <div style="margin-top: 8px; color: #666;">${isBuyer ? 'Seller' : 'Buyer'}: ${data.otherPartyName} ${ratingDisplay}</div>
    </div>
    
    <p>We noticed you haven't left a review yet. Your feedback only takes 2 minutes and really helps the community!</p>
    
    <div style="text-align: center;">
      <a href="${data.reviewUrl}" class="cta-button">⭐⭐⭐⭐⭐ Leave a Review</a>
    </div>
    
    <p style="font-size: 14px; color: #666;">
      This is our final reminder - we won't email you about this transaction again.
    </p>
    
    <p>Thanks for being part of SellFast.now!</p>
    
    <p>- The Team</p>
    
    <div class="footer">
      <div><a href="${data.unsubscribeUrl}" style="color: #ea580c;">Unsubscribe from review reminders</a></div>
    </div>
  </div>
</body>
</html>
  `;

  const response = await client.emails.send({
    from: fromEmail,
    to: data.to,
    subject,
    html,
  });

  return response;
}
