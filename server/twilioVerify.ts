import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

let client: ReturnType<typeof twilio> | null = null;

// Initialize Twilio client
if (accountSid && authToken) {
  client = twilio(accountSid, authToken);
  console.log("✅ Twilio Verify client initialized");
} else {
  console.warn("⚠️ Twilio credentials not found. Phone verification will not work.");
}

export interface SendVerificationResult {
  success: boolean;
  error?: string;
}

export interface VerifyCodeResult {
  success: boolean;
  error?: string;
}

/**
 * Send verification code via Twilio Verify API
 * @param phoneNumber Phone number in E.164 format (e.g., +15105040402)
 * @returns Result object with success status
 */
export async function sendVerificationCode(
  phoneNumber: string
): Promise<SendVerificationResult> {
  if (!client || !verifyServiceSid) {
    return {
      success: false,
      error: "Phone verification is not configured. Please contact support.",
    };
  }

  try {
    // Format phone number to E.164
    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    console.log(`📱 Sending verification via Twilio Verify to: ${formattedPhone}`);

    // Send verification code using Twilio Verify
    const verification = await client.verify.v2
      .services(verifyServiceSid)
      .verifications.create({
        to: formattedPhone,
        channel: "sms",
      });

    console.log(`✅ Verification sent, status: ${verification.status}`);

    return { success: true };
  } catch (error: any) {
    console.error("❌ Error sending verification code:", error);
    return {
      success: false,
      error: error.message || "Failed to send verification code",
    };
  }
}

/**
 * Verify the code entered by the user
 * @param phoneNumber Phone number in E.164 format
 * @param code 6-digit verification code
 * @returns Result object with success status
 */
export async function verifyCode(
  phoneNumber: string,
  code: string
): Promise<VerifyCodeResult> {
  if (!client || !verifyServiceSid) {
    return {
      success: false,
      error: "Phone verification is not configured. Please contact support.",
    };
  }

  try {
    // Format phone number to E.164
    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    console.log(`🔍 Verifying code for: ${formattedPhone}`);

    // Verify the code using Twilio Verify
    const verificationCheck = await client.verify.v2
      .services(verifyServiceSid)
      .verificationChecks.create({
        to: formattedPhone,
        code: code,
      });

    console.log(`✅ Verification check status: ${verificationCheck.status}`);

    if (verificationCheck.status === "approved") {
      return { success: true };
    } else {
      return {
        success: false,
        error: "Invalid verification code",
      };
    }
  } catch (error: any) {
    console.error("❌ Error verifying code:", error);
    return {
      success: false,
      error: error.message || "Failed to verify code",
    };
  }
}

/**
 * Format phone number to E.164 format
 * @param phoneNumber Phone number in various formats
 * @returns Phone number in E.164 format (e.g., +15105040402)
 */
function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, "");

  // If already has country code (11 digits starting with 1)
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  // If 10 digits (US number without country code)
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  // If already starts with +, return as-is
  if (phoneNumber.startsWith("+")) {
    return phoneNumber;
  }

  // Default: assume US number and add +1
  return `+1${digits}`;
}

