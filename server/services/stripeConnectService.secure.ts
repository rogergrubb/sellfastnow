// Secure Stripe Connect Service (UPDATED VERSION)
// Location: server/services/stripeConnectService.secure.ts
// Replace the original stripeConnectService.ts with this version

import Stripe from 'stripe';
import {
  generateIdempotencyKey,
  getOrCreateTransactionState,
  completeTransaction,
  failTransaction,
  retryOperation,
  sanitizeMetadata,
  logPaymentEvent,
} from './stripeSecurityService';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
});

export const stripeConnectService = {
  /**
   * Create Stripe Connect account with idempotency
   */
  async createConnectedAccount(
    email: string,
    userId: string,
    accountType: 'express' | 'standard' = 'express'
  ) {
    const metadata = { email, userId, accountType };
    const { state, isNew } = await getOrCreateTransactionState(
      'create_connect_account',
      userId,
      metadata
    );

    // Return existing account if operation already completed
    if (!isNew && state.status === 'completed') {
      console.log('Returning existing Stripe account from cache');
      // Retrieve from Stripe to get fresh data
      const accounts = await stripe.accounts.list({ limit: 100 });
      const existing = accounts.data.find(acc => acc.metadata.userId === userId);
      if (existing) return existing;
    }

    try {
      const account = await retryOperation(async () => {
        return await stripe.accounts.create(
          {
            type: accountType === 'standard' ? 'standard' : 'express',
            country: 'US',
            email: email,
            capabilities: {
              card_payments: { requested: true },
              transfers: { requested: true },
            },
            metadata: sanitizeMetadata({
              userId,
              accountType,
              createdBy: 'sellfast_platform',
            }),
          },
          {
            idempotencyKey: state.idempotencyKey,
          }
        );
      });

      completeTransaction(state.id, account.id);
      logPaymentEvent('connect_account_created', userId, account.id, { accountType });

      return account;
    } catch (error) {
      failTransaction(state.id, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  },

  /**
   * Create payment intent with escrow (manual capture) - SECURE VERSION
   */
  async createPaymentIntent(
    amount: number,
    currency: string,
    connectedAccountId: string,
    platformFee: number,
    userId: string,
    metadata: Record<string, string>
  ) {
    // Validate amount server-side
    if (amount <= 0 || amount > 999999) {
      throw new Error('Invalid payment amount');
    }

    if (platformFee < 0 || platformFee > amount) {
      throw new Error('Invalid platform fee');
    }

    const txMetadata = { amount, connectedAccountId, ...metadata };
    const { state, isNew } = await getOrCreateTransactionState(
      'create_payment_intent',
      userId,
      txMetadata
    );

    // Prevent duplicate payment intents
    if (!isNew && state.status === 'completed' && state.stripePaymentIntentId) {
      console.log('Returning existing payment intent:', state.stripePaymentIntentId);
      const existing = await stripe.paymentIntents.retrieve(state.stripePaymentIntentId);
      return existing;
    }

    try {
      const paymentIntent = await retryOperation(async () => {
        return await stripe.paymentIntents.create(
          {
            amount: Math.round(amount * 100), // Convert to cents
            currency: currency,
            application_fee_amount: Math.round(platformFee * 100),
            transfer_data: {
              destination: connectedAccountId,
            },
            capture_method: 'manual', // Hold funds for escrow
            metadata: sanitizeMetadata({
              userId,
              ...metadata,
            }),
          },
          {
            idempotencyKey: state.idempotencyKey,
          }
        );
      });

      completeTransaction(state.id, paymentIntent.id);
      logPaymentEvent('payment_intent_created', userId, paymentIntent.id, {
        amount,
        platformFee,
        connectedAccountId,
      });

      return paymentIntent;
    } catch (error) {
      failTransaction(state.id, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  },

  /**
   * Capture payment (move from pending to captured in escrow) - SECURE VERSION
   */
  async capturePayment(paymentIntentId: string, userId: string) {
    const metadata = { paymentIntentId };
    const { state } = await getOrCreateTransactionState(
      'capture_payment',
      userId,
      metadata
    );

    try {
      // Verify payment intent exists and is in capturable state
      const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (intent.status !== 'requires_capture') {
        throw new Error(`Payment intent is not capturable. Current status: ${intent.status}`);
      }

      const paymentIntent = await retryOperation(async () => {
        return await stripe.paymentIntents.capture(
          paymentIntentId,
          {},
          {
            idempotencyKey: state.idempotencyKey,
          }
        );
      });

      completeTransaction(state.id, paymentIntent.id);
      logPaymentEvent('payment_captured', userId, paymentIntentId, {
        amount: paymentIntent.amount,
      });

      return paymentIntent;
    } catch (error) {
      failTransaction(state.id, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  },

  /**
   * Cancel payment intent (before capture) - SECURE VERSION
   */
  async cancelPayment(paymentIntentId: string, userId: string, reason?: string) {
    const metadata = { paymentIntentId, reason };
    const { state } = await getOrCreateTransactionState(
      'cancel_payment',
      userId,
      metadata
    );

    try {
      const paymentIntent = await retryOperation(async () => {
        return await stripe.paymentIntents.cancel(
          paymentIntentId,
          {
            cancellation_reason: reason as any,
          },
          {
            idempotencyKey: state.idempotencyKey,
          }
        );
      });

      completeTransaction(state.id, paymentIntent.id);
      logPaymentEvent('payment_cancelled', userId, paymentIntentId, { reason });

      return paymentIntent;
    } catch (error) {
      failTransaction(state.id, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  },

  /**
   * Create refund (after capture) - SECURE VERSION
   */
  async createRefund(paymentIntentId: string, userId: string, amount?: number, reason?: string) {
    const metadata = { paymentIntentId, amount, reason };
    const { state } = await getOrCreateTransactionState(
      'create_refund',
      userId,
      metadata
    );

    try {
      const refund = await retryOperation(async () => {
        return await stripe.refunds.create(
          {
            payment_intent: paymentIntentId,
            amount: amount ? Math.round(amount * 100) : undefined,
            reason: reason as any,
          },
          {
            idempotencyKey: state.idempotencyKey,
          }
        );
      });

      completeTransaction(state.id, refund.id);
      logPaymentEvent('refund_created', userId, paymentIntentId, {
        refundId: refund.id,
        amount: refund.amount,
      });

      return refund;
    } catch (error) {
      failTransaction(state.id, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  },

  /**
   * Create account link for onboarding
   */
  async createAccountLink(accountId: string, refreshUrl: string, returnUrl: string) {
    return await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });
  },

  /**
   * Get account status
   */
  async getAccountStatus(accountId: string) {
    const account = await stripe.accounts.retrieve(accountId);
    return {
      id: account.id,
      detailsSubmitted: account.details_submitted || false,
      chargesEnabled: account.charges_enabled || false,
      payoutsEnabled: account.payouts_enabled || false,
      requirements: account.requirements,
    };
  },

  /**
   * Get account balance
   */
  async getAccountBalance(accountId: string) {
    const balance = await stripe.balance.retrieve({
      stripeAccount: accountId,
    });
    return balance;
  },

  /**
   * Create login link for Stripe dashboard
   */
  async createLoginLink(accountId: string) {
    return await stripe.accounts.createLoginLink(accountId);
  },

  /**
   * Delete account
   */
  async deleteAccount(accountId: string) {
    return await stripe.accounts.del(accountId);
  },
};

