// Email Verification Service
// Handles email verification tokens and confirmation

import { db } from "../db";
import { users } from "../../shared/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

interface VerificationToken {
  userId: string;
  token: string;
  expiresAt: Date;
}

// In-memory storage for verification tokens (in production, use Redis or database table)
const verificationTokens = new Map<string, VerificationToken>();

export class EmailVerificationService {
  /**
   * Generate verification token for user
   */
  static generateToken(userId: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    verificationTokens.set(token, {
      userId,
      token,
      expiresAt,
    });

    // Clean up expired tokens
    this.cleanupExpiredTokens();

    return token;
  }

  /**
   * Send verification email
   */
  static async sendVerificationEmail(userId: string, email: string, baseUrl: string): Promise<void> {
    const token = this.generateToken(userId);
    const verificationUrl = `${baseUrl}/verify-email?token=${token}`;

    // TODO: In production, use a proper email service (SendGrid, AWS SES, etc.)
    // For now, we'll log the URL and return success
    console.log(`📧 Email verification link for ${email}:`);
    console.log(`   ${verificationUrl}`);
    console.log(`   Token expires in 24 hours`);

    // In production, send actual email:
    // await emailService.send({
    //   to: email,
    //   subject: 'Verify your SellFast.now email',
    //   html: `
    //     <h1>Welcome to SellFast.now!</h1>
    //     <p>Please click the link below to verify your email address:</p>
    //     <a href="${verificationUrl}">Verify Email</a>
    //     <p>This link will expire in 24 hours.</p>
    //   `
    // });
  }

  /**
   * Verify email with token
   */
  static async verifyEmail(token: string): Promise<{ success: boolean; message: string; userId?: string }> {
    const tokenData = verificationTokens.get(token);

    if (!tokenData) {
      return {
        success: false,
        message: 'Invalid or expired verification token',
      };
    }

    // Check if token is expired
    if (new Date() > tokenData.expiresAt) {
      verificationTokens.delete(token);
      return {
        success: false,
        message: 'Verification token has expired. Please request a new one.',
      };
    }

    // Update user's email verification status
    try {
      await db
        .update(users)
        .set({
          emailVerified: true,
          verifiedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, tokenData.userId));

      // Remove token after successful verification
      verificationTokens.delete(token);

      console.log(`✅ Email verified for user ${tokenData.userId}`);

      return {
        success: true,
        message: 'Email verified successfully!',
        userId: tokenData.userId,
      };
    } catch (error) {
      console.error('Error verifying email:', error);
      return {
        success: false,
        message: 'Failed to verify email. Please try again.',
      };
    }
  }

  /**
   * Resend verification email
   */
  static async resendVerificationEmail(userId: string, email: string, baseUrl: string): Promise<void> {
    // Remove any existing tokens for this user
    for (const [token, data] of verificationTokens.entries()) {
      if (data.userId === userId) {
        verificationTokens.delete(token);
      }
    }

    // Send new verification email
    await this.sendVerificationEmail(userId, email, baseUrl);
  }

  /**
   * Clean up expired tokens
   */
  private static cleanupExpiredTokens(): void {
    const now = new Date();
    for (const [token, data] of verificationTokens.entries()) {
      if (now > data.expiresAt) {
        verificationTokens.delete(token);
      }
    }
  }

  /**
   * Check if user's email is verified
   */
  static async isEmailVerified(userId: string): Promise<boolean> {
    const [user] = await db
      .select({ emailVerified: users.emailVerified })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return user?.emailVerified || false;
  }
}

