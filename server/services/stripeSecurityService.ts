// Stripe Security Service
// Location: server/services/stripeSecurityService.ts
// Handles idempotency, transaction safety, and error recovery

import { db } from "../db";
import { eq } from "drizzle-orm";
import crypto from "crypto";

/**
 * Generate idempotency key for Stripe operations
 * Format: {operation}_{userId}_{timestamp}_{random}
 */
export function generateIdempotencyKey(operation: string, userId: string, additionalData?: string): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  const data = additionalData || '';
  
  // Create deterministic key for same operation
  const hash = crypto
    .createHash('sha256')
    .update(`${operation}_${userId}_${data}`)
    .digest('hex')
    .substring(0, 16);
  
  return `${operation}_${hash}_${timestamp}_${random}`;
}

/**
 * Transaction state tracking to prevent duplicate operations
 */
interface TransactionState {
  id: string;
  operation: string;
  userId: string;
  status: 'pending' | 'completed' | 'failed';
  stripePaymentIntentId?: string;
  idempotencyKey: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  error?: string;
}

// In-memory cache for transaction states (should be Redis in production)
const transactionCache = new Map<string, TransactionState>();

/**
 * Create or retrieve transaction state
 */
export async function getOrCreateTransactionState(
  operation: string,
  userId: string,
  metadata: Record<string, any>
): Promise<{ state: TransactionState; isNew: boolean }> {
  
  // Generate deterministic ID based on operation and metadata
  const stateId = crypto
    .createHash('sha256')
    .update(`${operation}_${userId}_${JSON.stringify(metadata)}`)
    .digest('hex');
  
  // Check cache first
  const cached = transactionCache.get(stateId);
  if (cached && cached.status === 'pending') {
    return { state: cached, isNew: false };
  }
  
  // Create new state
  const idempotencyKey = generateIdempotencyKey(operation, userId, JSON.stringify(metadata));
  
  const state: TransactionState = {
    id: stateId,
    operation,
    userId,
    status: 'pending',
    idempotencyKey,
    metadata,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  transactionCache.set(stateId, state);
  
  return { state, isNew: true };
}

/**
 * Update transaction state
 */
export function updateTransactionState(
  stateId: string,
  updates: Partial<TransactionState>
): void {
  const state = transactionCache.get(stateId);
  if (state) {
    Object.assign(state, updates, { updatedAt: new Date() });
    transactionCache.set(stateId, state);
  }
}

/**
 * Mark transaction as completed
 */
export function completeTransaction(stateId: string, stripePaymentIntentId?: string): void {
  updateTransactionState(stateId, {
    status: 'completed',
    stripePaymentIntentId,
  });
  
  // Clean up after 1 hour
  setTimeout(() => {
    transactionCache.delete(stateId);
  }, 60 * 60 * 1000);
}

/**
 * Mark transaction as failed
 */
export function failTransaction(stateId: string, error: string): void {
  updateTransactionState(stateId, {
    status: 'failed',
    error,
  });
  
  // Clean up after 1 hour
  setTimeout(() => {
    transactionCache.delete(stateId);
  }, 60 * 60 * 1000);
}

/**
 * Retry logic for failed Stripe operations
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on client errors (4xx)
      if (error instanceof Error && error.message.includes('400')) {
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, attempt)));
      }
    }
  }
  
  throw lastError || new Error('Operation failed after retries');
}

/**
 * Validate webhook signature
 */
export function validateWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): boolean {
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    stripe.webhooks.constructEvent(payload, signature, secret);
    return true;
  } catch (error) {
    console.error('Webhook signature validation failed:', error);
    return false;
  }
}

/**
 * Sanitize metadata to prevent injection
 */
export function sanitizeMetadata(metadata: Record<string, any>): Record<string, string> {
  const sanitized: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(metadata)) {
    // Only allow alphanumeric keys
    if (!/^[a-zA-Z0-9_]+$/.test(key)) {
      continue;
    }
    
    // Convert value to string and limit length
    const stringValue = String(value).substring(0, 500);
    sanitized[key] = stringValue;
  }
  
  return sanitized;
}

/**
 * Check if payment intent is in a recoverable state
 */
export function isRecoverableState(status: string): boolean {
  const recoverableStates = [
    'requires_payment_method',
    'requires_confirmation',
    'requires_action',
    'processing',
  ];
  
  return recoverableStates.includes(status);
}

/**
 * Log critical payment events for audit trail
 */
export function logPaymentEvent(
  event: string,
  userId: string,
  paymentIntentId: string,
  metadata: Record<string, any>
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    userId,
    paymentIntentId,
    metadata,
  };
  
  console.log('[PAYMENT_AUDIT]', JSON.stringify(logEntry));
  
  // In production, send to logging service (e.g., Datadog, Sentry)
  // await loggingService.log('payment_event', logEntry);
}

/**
 * Clean up old pending transactions (should run periodically)
 */
export function cleanupStaleTransactions(): void {
  const now = Date.now();
  const staleThreshold = 24 * 60 * 60 * 1000; // 24 hours
  
  for (const [id, state] of transactionCache.entries()) {
    const age = now - state.createdAt.getTime();
    
    if (age > staleThreshold && state.status === 'pending') {
      console.warn(`Stale transaction detected: ${id}`, state);
      transactionCache.delete(id);
    }
  }
}

// Run cleanup every hour
setInterval(cleanupStaleTransactions, 60 * 60 * 1000);

