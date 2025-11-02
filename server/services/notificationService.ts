// Notification Service
// Handles creation and delivery of notifications across all channels

import { db } from "../db";
import {
  notifications,
  notificationPreferences,
  notificationDeliveryLog,
  NotificationType,
  DeliveryMethod,
  DeliveryStatus,
  type InsertNotification,
  type NotificationPreferences,
} from "../../shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { emailService } from "./emailService";
import { smsService } from "./smsService";

export interface CreateNotificationParams {
  userId: string;
  type: string;
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: string;
  actionUrl?: string;
}

class NotificationService {
  /**
   * Create a notification and send it via all enabled channels
   */
  async createNotification(params: CreateNotificationParams): Promise<void> {
    const { userId, type, title, message, relatedId, relatedType, actionUrl } = params;

    try {
      // Get user preferences
      const prefs = await this.getUserPreferences(userId);

      // Create in-app notification if enabled
      if (this.shouldSendInApp(type, prefs)) {
        await this.createInAppNotification({
          userId,
          type,
          title,
          message,
          relatedId,
          relatedType,
          actionUrl,
        });
      }

      // Send email notification if enabled
      if (this.shouldSendEmail(type, prefs)) {
        await this.sendEmailNotification(userId, type, title, message, actionUrl);
      }

      // Send SMS notification if enabled
      if (this.shouldSendSMS(type, prefs)) {
        await this.sendSMSNotification(userId, type, title, message);
      }
    } catch (error) {
      console.error("Error creating notification:", error);
      // Don't throw - notifications should not break the main flow
    }
  }

  /**
   * Create in-app notification
   */
  private async createInAppNotification(data: InsertNotification): Promise<void> {
    try {
      const [notification] = await db
        .insert(notifications)
        .values(data)
        .returning();

      // Log delivery
      await this.logDelivery({
        notificationId: notification.id,
        userId: data.userId,
        deliveryMethod: DeliveryMethod.IN_APP,
        status: DeliveryStatus.DELIVERED,
      });
    } catch (error) {
      console.error("Error creating in-app notification:", error);
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    actionUrl?: string
  ): Promise<void> {
    try {
      // Get user email
      const user = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, userId),
      });

      if (!user?.email) {
        console.log("No email found for user:", userId);
        return;
      }

      // Send email
      await emailService.sendNotificationEmail({
        to: user.email,
        subject: title,
        title,
        message,
        actionUrl,
        actionText: this.getActionText(type),
      });

      // Log delivery
      await this.logDelivery({
        userId,
        deliveryMethod: DeliveryMethod.EMAIL,
        status: DeliveryStatus.SENT,
        recipient: user.email,
        sentAt: new Date(),
      });
    } catch (error) {
      console.error("Error sending email notification:", error);
      await this.logDelivery({
        userId,
        deliveryMethod: DeliveryMethod.EMAIL,
        status: DeliveryStatus.FAILED,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send SMS notification
   */
  private async sendSMSNotification(
    userId: string,
    type: string,
    title: string,
    message: string
  ): Promise<void> {
    try {
      // Get user phone number
      const user = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, userId),
      });

      if (!user?.phoneNumber) {
        console.log("No phone number found for user:", userId);
        return;
      }

      // Send SMS
      const smsMessage = `${title}\n\n${message}`;
      await smsService.sendSMS({
        to: user.phoneNumber,
        message: smsMessage,
      });

      // Log delivery
      await this.logDelivery({
        userId,
        deliveryMethod: DeliveryMethod.SMS,
        status: DeliveryStatus.SENT,
        recipient: user.phoneNumber,
        sentAt: new Date(),
      });
    } catch (error) {
      console.error("Error sending SMS notification:", error);
      await this.logDelivery({
        userId,
        deliveryMethod: DeliveryMethod.SMS,
        status: DeliveryStatus.FAILED,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get user notification preferences
   */
  async getUserPreferences(userId: string): Promise<NotificationPreferences | null> {
    try {
      let prefs = await db.query.notificationPreferences.findFirst({
        where: eq(notificationPreferences.userId, userId),
      });

      // Create default preferences if they don't exist
      if (!prefs) {
        [prefs] = await db
          .insert(notificationPreferences)
          .values({ userId })
          .returning();
      }

      return prefs;
    } catch (error) {
      console.error("Error getting user preferences:", error);
      return null;
    }
  }

  /**
   * Update user notification preferences
   */
  async updatePreferences(
    userId: string,
    updates: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences | null> {
    try {
      const [updated] = await db
        .update(notificationPreferences)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(notificationPreferences.userId, userId))
        .returning();

      return updated;
    } catch (error) {
      console.error("Error updating preferences:", error);
      return null;
    }
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(
    userId: string,
    options: { limit?: number; offset?: number; unreadOnly?: boolean } = {}
  ) {
    const { limit = 50, offset = 0, unreadOnly = false } = options;

    try {
      const conditions = [eq(notifications.userId, userId)];
      if (unreadOnly) {
        conditions.push(eq(notifications.isRead, false));
      }

      const userNotifications = await db.query.notifications.findMany({
        where: and(...conditions),
        orderBy: [desc(notifications.createdAt)],
        limit,
        offset,
      });

      return userNotifications;
    } catch (error) {
      console.error("Error getting user notifications:", error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      await db
        .update(notifications)
        .set({ isRead: true, readAt: new Date() })
        .where(
          and(
            eq(notifications.id, notificationId),
            eq(notifications.userId, userId)
          )
        );

      return true;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return false;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      await db
        .update(notifications)
        .set({ isRead: true, readAt: new Date() })
        .where(
          and(
            eq(notifications.userId, userId),
            eq(notifications.isRead, false)
          )
        );

      return true;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      return false;
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const unread = await db.query.notifications.findMany({
        where: and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        ),
      });

      return unread.length;
    } catch (error) {
      console.error("Error getting unread count:", error);
      return 0;
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    try {
      await db
        .delete(notifications)
        .where(
          and(
            eq(notifications.id, notificationId),
            eq(notifications.userId, userId)
          )
        );

      return true;
    } catch (error) {
      console.error("Error deleting notification:", error);
      return false;
    }
  }

  /**
   * Helper: Check if in-app notification should be sent
   */
  private shouldSendInApp(type: string, prefs: NotificationPreferences | null): boolean {
    if (!prefs) return true; // Default to sending

    switch (type) {
      case NotificationType.MESSAGE:
        return prefs.inAppMessages;
      case NotificationType.OFFER:
        return prefs.inAppOffers;
      case NotificationType.REVIEW:
        return prefs.inAppReviews;
      case NotificationType.TRANSACTION:
        return prefs.inAppTransactions;
      case NotificationType.SALE:
        return prefs.inAppSales;
      case NotificationType.PURCHASE:
        return prefs.inAppPurchases;
      case NotificationType.SYSTEM:
        return prefs.inAppSystem;
      default:
        return true;
    }
  }

  /**
   * Helper: Check if email notification should be sent
   */
  private shouldSendEmail(type: string, prefs: NotificationPreferences | null): boolean {
    if (!prefs) return true; // Default to sending

    switch (type) {
      case NotificationType.MESSAGE:
        return prefs.emailMessages;
      case NotificationType.OFFER:
        return prefs.emailOffers;
      case NotificationType.REVIEW:
        return prefs.emailReviews;
      case NotificationType.TRANSACTION:
        return prefs.emailTransactions;
      case NotificationType.SALE:
        return prefs.emailSales;
      case NotificationType.PURCHASE:
        return prefs.emailPurchases;
      case NotificationType.SYSTEM:
        return prefs.emailSystem;
      default:
        return false;
    }
  }

  /**
   * Helper: Check if SMS notification should be sent
   */
  private shouldSendSMS(type: string, prefs: NotificationPreferences | null): boolean {
    if (!prefs) return false; // Default to NOT sending SMS

    switch (type) {
      case NotificationType.MESSAGE:
        return prefs.smsMessages;
      case NotificationType.OFFER:
        return prefs.smsOffers;
      case NotificationType.REVIEW:
        return prefs.smsReviews;
      case NotificationType.TRANSACTION:
        return prefs.smsTransactions;
      case NotificationType.SALE:
        return prefs.smsSales;
      case NotificationType.PURCHASE:
        return prefs.smsPurchases;
      case NotificationType.SYSTEM:
        return prefs.smsSystem;
      default:
        return false;
    }
  }

  /**
   * Helper: Get action button text based on notification type
   */
  private getActionText(type: string): string {
    switch (type) {
      case NotificationType.MESSAGE:
        return "View Message";
      case NotificationType.OFFER:
        return "View Offer";
      case NotificationType.REVIEW:
        return "View Review";
      case NotificationType.TRANSACTION:
        return "View Transaction";
      case NotificationType.SALE:
        return "View Sale";
      case NotificationType.PURCHASE:
        return "View Purchase";
      default:
        return "View Details";
    }
  }

  /**
   * Helper: Log notification delivery
   */
  private async logDelivery(data: {
    notificationId?: string;
    userId: string;
    deliveryMethod: string;
    status: string;
    recipient?: string;
    errorMessage?: string;
    sentAt?: Date;
  }): Promise<void> {
    try {
      await db.insert(notificationDeliveryLog).values(data);
    } catch (error) {
      console.error("Error logging delivery:", error);
    }
  }
}

export const notificationService = new NotificationService();
