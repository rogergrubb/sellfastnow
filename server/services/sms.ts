import twilio from 'twilio';

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken || !twilioPhoneNumber) {
  console.warn('⚠️  Twilio credentials not set - SMS features will be disabled');
  console.warn('   Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables');
}

const twilioClient = accountSid && authToken ? twilio(accountSid, authToken) : null;

interface SendSMSOptions {
  to: string;
  message: string;
}

/**
 * Send an SMS message via Twilio
 */
export async function sendSMS({ to, message }: SendSMSOptions): Promise<boolean> {
  if (!twilioClient || !twilioPhoneNumber) {
    console.error('❌ Twilio not configured - cannot send SMS');
    return false;
  }

  try {
    // Format phone number (ensure it starts with +1 for US numbers)
    const formattedPhone = formatPhoneNumber(to);
    
    console.log(`📱 Sending SMS to ${formattedPhone}`);
    
    const result = await twilioClient.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: formattedPhone,
    });
    
    console.log(`✅ SMS sent successfully: ${result.sid}`);
    return true;
  } catch (error: any) {
    console.error('❌ Error sending SMS:', error.message);
    return false;
  }
}

/**
 * Format phone number to E.164 format (+1XXXXXXXXXX for US)
 */
function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // If it's 10 digits, assume US and add +1
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  
  // If it's 11 digits and starts with 1, add +
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  
  // If it already has +, return as is
  if (phone.startsWith('+')) {
    return phone;
  }
  
  // Otherwise, assume it needs +1
  return `+1${digits}`;
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phone: string): boolean {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // US phone numbers should be 10 or 11 digits
  return digits.length === 10 || (digits.length === 11 && digits.startsWith('1'));
}

/**
 * Send SMS notification for a saved search match
 */
export async function sendSavedSearchSMS(
  phoneNumber: string,
  searchName: string,
  listingTitle: string,
  listingPrice: string,
  listingUrl: string
): Promise<boolean> {
  const message = `🔔 New Match for "${searchName}"!\n\n${listingTitle}\n$${listingPrice}\n\nView: ${listingUrl}`;
  
  return await sendSMS({ to: phoneNumber, message });
}

/**
 * Send SMS for weekly platform update
 */
export async function sendWeeklyUpdateSMS(
  phoneNumber: string,
  userName: string,
  stats: {
    newListings: number;
    savedSearchMatches: number;
  }
): Promise<boolean> {
  const message = `Hi ${userName}! 📊 Your SellFast.Now weekly update:\n\n` +
    `• ${stats.newListings} new listings this week\n` +
    `• ${stats.savedSearchMatches} items matched your saved searches\n\n` +
    `Visit: https://sellfast.now`;
  
  return await sendSMS({ to: phoneNumber, message });
}

/**
 * Send SMS for monthly platform update
 */
export async function sendMonthlyUpdateSMS(
  phoneNumber: string,
  userName: string,
  stats: {
    totalListings: number;
    yourListings: number;
    yourSales: number;
  }
): Promise<boolean> {
  const message = `Hi ${userName}! 📈 Your SellFast.Now monthly report:\n\n` +
    `• ${stats.totalListings} total listings on platform\n` +
    `• You listed ${stats.yourListings} items\n` +
    `• You made ${stats.yourSales} sales\n\n` +
    `Keep selling! https://sellfast.now`;
  
  return await sendSMS({ to: phoneNumber, message });
}

/**
 * Send SMS for AI credit giveaway
 */
export async function sendCreditGiveawaySMS(
  phoneNumber: string,
  userName: string,
  credits: number
): Promise<boolean> {
  const message = `🎉 Surprise, ${userName}!\n\n` +
    `You've received ${credits} FREE AI credits from SellFast.Now!\n\n` +
    `Use them to generate listings with AI-powered titles, descriptions, and valuations.\n\n` +
    `Start listing: https://sellfast.now/post-ad`;
  
  return await sendSMS({ to: phoneNumber, message });
}

/**
 * Send SMS for promotional announcement
 */
export async function sendPromotionalSMS(
  phoneNumber: string,
  title: string,
  message: string,
  ctaUrl?: string
): Promise<boolean> {
  let smsText = `${title}\n\n${message}`;
  
  if (ctaUrl) {
    smsText += `\n\n${ctaUrl}`;
  }
  
  return await sendSMS({ to: phoneNumber, message: smsText });
}

/**
 * Send SMS opt-in confirmation
 */
export async function sendOptInConfirmationSMS(
  phoneNumber: string,
  userName: string
): Promise<boolean> {
  const message = `Hi ${userName}! ✅ You're now subscribed to SellFast.Now SMS updates.\n\n` +
    `You'll receive:\n` +
    `• Saved search alerts\n` +
    `• Weekly/monthly updates\n` +
    `• Exclusive offers\n\n` +
    `Reply STOP to unsubscribe anytime.`;
  
  return await sendSMS({ to: phoneNumber, message });
}

/**
 * Batch send SMS to multiple recipients
 */
export async function sendBatchSMS(
  recipients: Array<{ phoneNumber: string; message: string }>
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;
  
  for (const recipient of recipients) {
    const success = await sendSMS({
      to: recipient.phoneNumber,
      message: recipient.message,
    });
    
    if (success) {
      sent++;
    } else {
      failed++;
    }
    
    // Add small delay to avoid rate limiting (Twilio allows 1 msg/sec on trial)
    await new Promise(resolve => setTimeout(resolve, 1100));
  }
  
  console.log(`📊 Batch SMS complete: ${sent} sent, ${failed} failed`);
  
  return { sent, failed };
}

