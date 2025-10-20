import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Initialize Twilio client only if credentials are provided
let twilioClient: twilio.Twilio | null = null;

if (accountSid && authToken) {
  twilioClient = twilio(accountSid, authToken);
  console.log('✅ Twilio client initialized');
} else {
  console.warn('⚠️  Twilio credentials not found. Phone verification will be disabled.');
}

// In-memory store for verification codes (in production, use Redis or database)
interface VerificationCode {
  code: string;
  phoneNumber: string;
  expiresAt: Date;
  attempts: number;
}

const verificationCodes = new Map<string, VerificationCode>();

// Clean up expired codes every 5 minutes
setInterval(() => {
  const now = new Date();
  for (const [userId, data] of verificationCodes.entries()) {
    if (data.expiresAt < now) {
      verificationCodes.delete(userId);
    }
  }
}, 5 * 60 * 1000);

/**
 * Generate a 6-digit verification code
 */
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Format phone number to E.164 format
 */
function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // If it's a US number without country code, add +1
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  
  // If it already has country code
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  
  // Otherwise, assume it's already formatted or international
  return digits.startsWith('+') ? phone : `+${digits}`;
}

/**
 * Send verification code via SMS
 */
export async function sendVerificationCode(
  userId: string,
  phoneNumber: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Check if Twilio is configured
    if (!twilioClient || !twilioPhoneNumber) {
      return {
        success: false,
        message: 'SMS service is not configured. Please contact support.',
      };
    }

    // Format phone number
    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    // Generate code
    const code = generateCode();
    
    // Store code with 10-minute expiration
    verificationCodes.set(userId, {
      code,
      phoneNumber: formattedPhone,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      attempts: 0,
    });

    // Send SMS
    const message = await twilioClient.messages.create({
      body: `Your SellFast.Now verification code is: ${code}\n\nThis code expires in 10 minutes.`,
      from: twilioPhoneNumber,
      to: formattedPhone,
    });

    console.log(`📱 Verification SMS sent to ${formattedPhone}, SID: ${message.sid}`);

    return {
      success: true,
      message: 'Verification code sent successfully',
    };
  } catch (error: any) {
    console.error('❌ Error sending verification SMS:', error);
    
    // Handle specific Twilio errors
    if (error.code === 21211) {
      return {
        success: false,
        message: 'Invalid phone number. Please check and try again.',
      };
    }
    
    if (error.code === 21608) {
      return {
        success: false,
        message: 'This phone number cannot receive SMS messages.',
      };
    }
    
    return {
      success: false,
      message: error.message || 'Failed to send verification code',
    };
  }
}

/**
 * Verify the code entered by user
 */
export async function verifyCode(
  userId: string,
  code: string
): Promise<{ success: boolean; message: string }> {
  const stored = verificationCodes.get(userId);

  if (!stored) {
    return {
      success: false,
      message: 'No verification code found. Please request a new code.',
    };
  }

  // Check expiration
  if (stored.expiresAt < new Date()) {
    verificationCodes.delete(userId);
    return {
      success: false,
      message: 'Verification code has expired. Please request a new code.',
    };
  }

  // Check attempts
  if (stored.attempts >= 5) {
    verificationCodes.delete(userId);
    return {
      success: false,
      message: 'Too many failed attempts. Please request a new code.',
    };
  }

  // Verify code
  if (stored.code !== code.trim()) {
    stored.attempts++;
    return {
      success: false,
      message: `Invalid code. ${5 - stored.attempts} attempts remaining.`,
    };
  }

  // Success! Clean up
  verificationCodes.delete(userId);
  
  return {
    success: true,
    message: 'Phone number verified successfully!',
  };
}

/**
 * Check if Twilio is configured
 */
export function isTwilioConfigured(): boolean {
  return twilioClient !== null && !!twilioPhoneNumber;
}

