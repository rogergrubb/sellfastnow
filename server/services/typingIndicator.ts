/**
 * Service for tracking typing indicators in conversations
 * Uses in-memory Map for real-time updates
 */

interface TypingStatus {
  userId: string;
  conversationId: string;
  timestamp: Date;
}

// Map: conversationId -> Set of userIds currently typing
const typingUsers = new Map<string, Map<string, Date>>();

// Typing indicator expires after 3 seconds
const TYPING_TIMEOUT_MS = 3 * 1000;

// Cleanup interval: every 2 seconds
const CLEANUP_INTERVAL_MS = 2 * 1000;

/**
 * Set user as typing in a conversation
 */
export function setUserTyping(conversationId: string, userId: string): void {
  if (!typingUsers.has(conversationId)) {
    typingUsers.set(conversationId, new Map());
  }

  const conversationTyping = typingUsers.get(conversationId)!;
  conversationTyping.set(userId, new Date());
}

/**
 * Remove user from typing status
 */
export function removeUserTyping(conversationId: string, userId: string): void {
  const conversationTyping = typingUsers.get(conversationId);
  if (conversationTyping) {
    conversationTyping.delete(userId);
    
    // Clean up empty conversation entries
    if (conversationTyping.size === 0) {
      typingUsers.delete(conversationId);
    }
  }
}

/**
 * Get all users currently typing in a conversation
 */
export function getUsersTyping(conversationId: string): string[] {
  const conversationTyping = typingUsers.get(conversationId);
  if (!conversationTyping) return [];

  const now = Date.now();
  const activeTypers: string[] = [];

  for (const [userId, timestamp] of conversationTyping.entries()) {
    if (now - timestamp.getTime() < TYPING_TIMEOUT_MS) {
      activeTypers.push(userId);
    }
  }

  return activeTypers;
}

/**
 * Check if a specific user is typing in a conversation
 */
export function isUserTyping(conversationId: string, userId: string): boolean {
  const conversationTyping = typingUsers.get(conversationId);
  if (!conversationTyping) return false;

  const timestamp = conversationTyping.get(userId);
  if (!timestamp) return false;

  return Date.now() - timestamp.getTime() < TYPING_TIMEOUT_MS;
}

/**
 * Cleanup expired typing indicators
 */
function cleanupExpiredTyping(): void {
  const now = Date.now();

  for (const [conversationId, conversationTyping] of typingUsers.entries()) {
    for (const [userId, timestamp] of conversationTyping.entries()) {
      if (now - timestamp.getTime() >= TYPING_TIMEOUT_MS) {
        conversationTyping.delete(userId);
      }
    }

    // Clean up empty conversation entries
    if (conversationTyping.size === 0) {
      typingUsers.delete(conversationId);
    }
  }
}

// Start cleanup interval
setInterval(cleanupExpiredTyping, CLEANUP_INTERVAL_MS);

console.log("✅ Typing indicator service initialized");

