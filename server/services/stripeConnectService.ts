// Stripe Connect Service - Express Accounts
// Handles seller onboarding and payment routing

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

export const stripeConnectService = {
  /**
   * Create a Stripe Connect Express account for a seller
   */
  async createConnectedAccount(email: string, userId: string) {
    try {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        metadata: {
          userId: userId,
          platform: 'sellfastnow',
        },
      });

      return account;
    } catch (error) {
      console.error('Error creating connected account:', error);
      throw error;
    }
  },

  /**
   * Generate onboarding link for seller to complete setup
   */
  async createAccountLink(accountId: string, refreshUrl: string, returnUrl: string) {
    try {
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
      });

      return accountLink;
    } catch (error) {
      console.error('Error creating account link:', error);
      throw error;
    }
  },

  /**
   * Check if seller has completed onboarding
   */
  async getAccountStatus(accountId: string) {
    try {
      const account = await stripe.accounts.retrieve(accountId);
      
      return {
        id: account.id,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        requirements: account.requirements,
      };
    } catch (error) {
      console.error('Error getting account status:', error);
      throw error;
    }
  },

  /**
   * Create payment intent with application fee and destination
   */
  async createPaymentWithDestination(
    amount: number,
    currency: string,
    sellerAccountId: string,
    platformFee: number,
    metadata: Record<string, string>
  ) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency,
        application_fee_amount: Math.round(platformFee * 100),
        transfer_data: {
          destination: sellerAccountId,
        },
        metadata: metadata,
        capture_method: 'manual', // Hold funds for escrow
      });

      return paymentIntent;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  },

  /**
   * Capture payment (move from pending to captured in escrow)
   */
  async capturePayment(paymentIntentId: string) {
    try {
      const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      console.error('Error capturing payment:', error);
      throw error;
    }
  },

  /**
   * Cancel payment intent (before capture)
   */
  async cancelPayment(paymentIntentId: string) {
    try {
      const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      console.error('Error canceling payment:', error);
      throw error;
    }
  },

  /**
   * Create refund (after capture)
   */
  async createRefund(paymentIntentId: string, amount?: number) {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined,
      });
      return refund;
    } catch (error) {
      console.error('Error creating refund:', error);
      throw error;
    }
  },

  /**
   * Get account balance and payouts
   */
  async getAccountBalance(accountId: string) {
    try {
      const balance = await stripe.balance.retrieve({
        stripeAccount: accountId,
      });

      const payouts = await stripe.payouts.list(
        { limit: 10 },
        { stripeAccount: accountId }
      );

      return {
        available: balance.available,
        pending: balance.pending,
        recentPayouts: payouts.data,
      };
    } catch (error) {
      console.error('Error getting account balance:', error);
      throw error;
    }
  },

  /**
   * Create login link for seller to access Stripe Express dashboard
   */
  async createLoginLink(accountId: string) {
    try {
      const loginLink = await stripe.accounts.createLoginLink(accountId);
      return loginLink;
    } catch (error) {
      console.error('Error creating login link:', error);
      throw error;
    }
  },

  /**
   * Delete connected account (for testing or account closure)
   */
  async deleteAccount(accountId: string) {
    try {
      const deleted = await stripe.accounts.del(accountId);
      return deleted;
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  },
};

