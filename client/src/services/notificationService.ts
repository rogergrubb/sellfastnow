// Browser Push Notification Service
// Handles browser notifications for new messages

export class NotificationService {
  private static permission: NotificationPermission = 'default';

  /**
   * Request permission for browser notifications
   */
  static async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.permission = 'granted';
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    }

    return false;
  }

  /**
   * Check if notifications are supported and permitted
   */
  static isSupported(): boolean {
    return 'Notification' in window;
  }

  /**
   * Check if permission is granted
   */
  static isPermissionGranted(): boolean {
    return Notification.permission === 'granted';
  }

  /**
   * Show a notification
   */
  static async showNotification(
    title: string,
    options?: NotificationOptions
  ): Promise<Notification | null> {
    if (!this.isSupported()) {
      console.warn('Notifications not supported');
      return null;
    }

    if (!this.isPermissionGranted()) {
      const granted = await this.requestPermission();
      if (!granted) {
        console.warn('Notification permission not granted');
        return null;
      }
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });

      // Auto-close after 5 seconds
      setTimeout(() => notification.close(), 5000);

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }

  /**
   * Show notification for new message
   */
  static async showNewMessageNotification(
    senderName: string,
    messagePreview: string,
    listingTitle: string,
    onClick?: () => void
  ): Promise<void> {
    const notification = await this.showNotification(
      `New message from ${senderName}`,
      {
        body: `${listingTitle}\n${messagePreview}`,
        tag: 'new-message',
        requireInteraction: false,
        silent: false,
      }
    );

    if (notification && onClick) {
      notification.onclick = () => {
        window.focus();
        onClick();
        notification.close();
      };
    }
  }

  /**
   * Show notification for transaction update
   */
  static async showTransactionNotification(
    title: string,
    message: string,
    onClick?: () => void
  ): Promise<void> {
    const notification = await this.showNotification(title, {
      body: message,
      tag: 'transaction-update',
      requireInteraction: false,
      silent: false,
    });

    if (notification && onClick) {
      notification.onclick = () => {
        window.focus();
        onClick();
        notification.close();
      };
    }
  }

  /**
   * Show notification for unread messages count
   */
  static async showUnreadCountNotification(
    unreadCount: number,
    onClick?: () => void
  ): Promise<void> {
    if (unreadCount === 0) return;

    const notification = await this.showNotification(
      `You have ${unreadCount} unread message${unreadCount !== 1 ? 's' : ''}`,
      {
        body: 'Click to view your messages',
        tag: 'unread-count',
        requireInteraction: false,
        silent: true,
      }
    );

    if (notification && onClick) {
      notification.onclick = () => {
        window.focus();
        onClick();
        notification.close();
      };
    }
  }
}

