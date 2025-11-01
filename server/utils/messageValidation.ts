// Message Validation Utilities
// Comprehensive validation for messaging system

import { db } from "../db";
import { users } from "../../shared/schema";
import { eq } from "drizzle-orm";

export interface MessageValidationResult {
  valid: boolean;
  error?: string;
}

// Validate message content
export function validateMessageContent(content: string): MessageValidationResult {
  // Check if content exists
  if (!content || typeof content !== 'string') {
    return { valid: false, error: "Message content is required" };
  }

  // Trim whitespace
  const trimmed = content.trim();

  // Check minimum length
  if (trimmed.length < 1) {
    return { valid: false, error: "Message cannot be empty" };
  }

  // Check maximum length (5000 characters)
  if (trimmed.length > 5000) {
    return { valid: false, error: "Message is too long (maximum 5000 characters)" };
  }

  // Check for suspicious patterns (basic spam detection)
  const suspiciousPatterns = [
    /(.)\1{20,}/i, // Repeated characters (20+ times)
    /(https?:\/\/[^\s]+){10,}/i, // Too many URLs (10+)
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(content)) {
      return { valid: false, error: "Message contains suspicious content" };
    }
  }

  return { valid: true };
}

// Validate that receiver exists and is not the sender
export async function validateMessageParticipants(
  senderId: string,
  receiverId: string
): Promise<MessageValidationResult> {
  // Check if sender is trying to message themselves
  if (senderId === receiverId) {
    return { valid: false, error: "You cannot send a message to yourself" };
  }

  // Check if receiver exists
  const receiver = await db.query.users.findFirst({
    where: eq(users.id, receiverId),
  });

  if (!receiver) {
    return { valid: false, error: "Recipient not found" };
  }

  // Check if receiver allows messages (if privacy settings exist)
  // This would check user's privacy settings when implemented
  // For now, we'll allow all messages

  return { valid: true };
}

// Validate listing context for message
export async function validateMessageListing(
  listingId: string,
  senderId: string,
  receiverId: string
): Promise<MessageValidationResult> {
  const { listings } = await import("../../shared/schema");
  
  const listing = await db.query.listings.findFirst({
    where: eq(listings.id, listingId),
  });

  if (!listing) {
    return { valid: false, error: "Listing not found" };
  }

  // Allow messaging on active and sold listings (for post-sale communication)
  if (listing.status && listing.status !== 'active' && listing.status !== 'sold') {
    return { valid: false, error: "Cannot message about inactive listings" };
  }

  // Verify that either sender or receiver is the listing owner
  if (listing.userId !== senderId && listing.userId !== receiverId) {
    return { valid: false, error: "Invalid message context: neither party owns this listing" };
  }

  return { valid: true };
}

// Complete message validation
export async function validateMessage(
  senderId: string,
  receiverId: string,
  listingId: string,
  content: string
): Promise<MessageValidationResult> {
  // Validate content
  const contentValidation = validateMessageContent(content);
  if (!contentValidation.valid) {
    return contentValidation;
  }

  // Validate participants
  const participantsValidation = await validateMessageParticipants(senderId, receiverId);
  if (!participantsValidation.valid) {
    return participantsValidation;
  }

  // Validate listing context
  const listingValidation = await validateMessageListing(listingId, senderId, receiverId);
  if (!listingValidation.valid) {
    return listingValidation;
  }

  return { valid: true };
}

