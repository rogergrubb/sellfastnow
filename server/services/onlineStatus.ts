import { db } from "../db";
import { sql } from "drizzle-orm";

/**
 * Service for tracking user online status
 * Uses in-memory Map for fast lookups with periodic cleanup
 */

interface UserStatus {
  userId: string;
  lastSeen: Date;
  isOnline: boolean;
}

// In-memory store for online users (userId -> lastSeen timestamp)
const onlineUsers = new Map<string, Date>();

// Consider user offline after 2 minutes of inactivity
const ONLINE_THRESHOLD_MS = 2 * 60 * 1000;

// Cleanup interval: every 30 seconds
const CLEANUP_INTERVAL_MS = 30 * 1000;

/**
 * Update user's last seen timestamp
 */
export function updateUserOnlineStatus(userId: string): void {
  onlineUsers.set(userId, new Date());
}

/**
 * Check if a user is currently online
 */
export function isUserOnline(userId: string): boolean {
  const lastSeen = onlineUsers.get(userId);
  if (!lastSeen) return false;

  const timeSinceLastSeen = Date.now() - lastSeen.getTime();
  return timeSinceLastSeen < ONLINE_THRESHOLD_MS;
}

/**
 * Get online status for multiple users
 */
export function getUsersOnlineStatus(userIds: string[]): Map<string, boolean> {
  const statusMap = new Map<string, boolean>();
  
  for (const userId of userIds) {
    statusMap.set(userId, isUserOnline(userId));
  }
  
  return statusMap;
}

/**
 * Get all currently online users
 */
export function getOnlineUsers(): string[] {
  const now = Date.now();
  const online: string[] = [];

  for (const [userId, lastSeen] of onlineUsers.entries()) {
    if (now - lastSeen.getTime() < ONLINE_THRESHOLD_MS) {
      online.push(userId);
    }
  }

  return online;
}

/**
 * Get user's last seen timestamp
 */
export function getUserLastSeen(userId: string): Date | null {
  return onlineUsers.get(userId) || null;
}

/**
 * Remove user from online status (on logout)
 */
export function removeUserOnlineStatus(userId: string): void {
  onlineUsers.delete(userId);
}

/**
 * Cleanup stale entries periodically
 */
function cleanupStaleEntries(): void {
  const now = Date.now();
  const staleThreshold = now - (ONLINE_THRESHOLD_MS * 2); // Double the threshold for cleanup

  for (const [userId, lastSeen] of onlineUsers.entries()) {
    if (lastSeen.getTime() < staleThreshold) {
      onlineUsers.delete(userId);
    }
  }
}

// Start cleanup interval
setInterval(cleanupStaleEntries, CLEANUP_INTERVAL_MS);

console.log("✅ Online status tracking service initialized");

