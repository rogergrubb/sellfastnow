// Phone Verification Service
// Handles phone verification with SMS codes

import { db } from "../db";
import { users } from "../../shared/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

interface VerificationCode {
  userId: string;
  phoneNumber: string;
  code: string;
  expiresAt: Date;
  attempts: number;
}

// In-memory storage for verification codes (in production, use Redis or database table)
const verificationCodes = new Map<string, VerificationCode>();

const MAX_ATTEMPTS = 5;
const CODE_EXPIRY_MINUTES = 10;

export class PhoneVerificationService {
  /**
   * Generate 6-digit verification code
   */
  private static generateCode(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Send verification SMS
   */
  static async sendVerificationCode(userId: string, phoneNumber: string): Promise<{ success: boolean; message: string }> {
    // Validate phone number format (basic validation)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber.replace(/[\s-]/g, ''))) {
      return {
        success: false,
        message: 'Invalid phone number format. Please use international format (e.g., +1234567890)',
      };
    }

    // Check if there's an existing code
    const existingCode = Array.from(verificationCodes.values()).find(
      (vc) => vc.userId === userId && vc.phoneNumber === phoneNumber
    );

    if (existingCode && new Date() < existingCode.expiresAt) {
      const minutesLeft = Math.ceil((existingCode.expiresAt.getTime() - Date.now()) / 60000);
      return {
        success: false,
        message: `Please wait ${minutesLeft} minute(s) before requesting a new code`,
      };
    }

    // Generate new code
    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);

    const key = `${userId}-${phoneNumber}`;
    verificationCodes.set(key, {
      userId,
      phoneNumber,
      code,
      expiresAt,
      attempts: 0,
    });

    // TODO: In production, use a proper SMS service (Twilio, AWS SNS, etc.)
    // For now, we'll log the code
    console.log(`📱 SMS verification code for ${phoneNumber}:`);
    console.log(`   Code: ${code}`);
    console.log(`   Expires in ${CODE_EXPIRY_MINUTES} minutes`);

    // In production, send actual SMS:
    // await smsService.send({
    //   to: phoneNumber,
    //   body: `Your SellFast.now verification code is: ${code}. Valid for ${CODE_EXPIRY_MINUTES} minutes.`
    // });

    // Clean up expired codes
    this.cleanupExpiredCodes();

    return {
      success: true,
      message: `Verification code sent to ${phoneNumber}`,
    };
  }

  /**
   * Verify phone with code
   */
  static async verifyCode(
    userId: string,
    phoneNumber: string,
    code: string
  ): Promise<{ success: boolean; message: string }> {
    const key = `${userId}-${phoneNumber}`;
    const codeData = verificationCodes.get(key);

    if (!codeData) {
      return {
        success: false,
        message: 'No verification code found. Please request a new code.',
      };
    }

    // Check if code is expired
    if (new Date() > codeData.expiresAt) {
      verificationCodes.delete(key);
      return {
        success: false,
        message: 'Verification code has expired. Please request a new one.',
      };
    }

    // Check attempts
    if (codeData.attempts >= MAX_ATTEMPTS) {
      verificationCodes.delete(key);
      return {
        success: false,
        message: 'Too many failed attempts. Please request a new code.',
      };
    }

    // Verify code
    if (codeData.code !== code) {
      codeData.attempts++;
      const attemptsLeft = MAX_ATTEMPTS - codeData.attempts;
      return {
        success: false,
        message: `Invalid code. ${attemptsLeft} attempt(s) remaining.`,
      };
    }

    // Update user's phone verification status
    try {
      await db
        .update(users)
        .set({
          phoneNumber: phoneNumber,
          phoneVerified: true,
          verifiedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      // Remove code after successful verification
      verificationCodes.delete(key);

      console.log(`✅ Phone verified for user ${userId}`);

      return {
        success: true,
        message: 'Phone number verified successfully!',
      };
    } catch (error) {
      console.error('Error verifying phone:', error);
      return {
        success: false,
        message: 'Failed to verify phone number. Please try again.',
      };
    }
  }

  /**
   * Clean up expired codes
   */
  private static cleanupExpiredCodes(): void {
    const now = new Date();
    for (const [key, data] of verificationCodes.entries()) {
      if (now > data.expiresAt) {
        verificationCodes.delete(key);
      }
    }
  }

  /**
   * Check if user's phone is verified
   */
  static async isPhoneVerified(userId: string): Promise<boolean> {
    const [user] = await db
      .select({ phoneVerified: users.phoneVerified })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return user?.phoneVerified || false;
  }

  /**
   * Get remaining attempts for a verification code
   */
  static getRemainingAttempts(userId: string, phoneNumber: string): number {
    const key = `${userId}-${phoneNumber}`;
    const codeData = verificationCodes.get(key);

    if (!codeData || new Date() > codeData.expiresAt) {
      return 0;
    }

    return MAX_ATTEMPTS - codeData.attempts;
  }
}

