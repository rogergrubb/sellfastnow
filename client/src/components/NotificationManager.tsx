import { useState, useEffect } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { MessageOfferPopup } from "./MessageOfferPopup";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

interface Notification {
  id: string;
  type: "message" | "offer";
  listingId: string;
  listingTitle: string;
  listingImage?: string;
  senderName: string;
  message?: string;
  offerAmount?: string;
  depositAmount?: string;
  timestamp: string;
}

interface NotificationManagerProps {
  userId: string;
}

export function NotificationManager({ userId }: NotificationManagerProps) {
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);
  const [notificationQueue, setNotificationQueue] = useState<Notification[]>([]);
  const { socket } = useWebSocket();

  // Fetch unread notifications on mount (for login scenario)
  const { data: unreadNotifications } = useQuery({
    queryKey: ["/api", "notifications", "unread"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!userId,
    retry: false,
  });

  // Show unread notifications on login
  useEffect(() => {
    if (unreadNotifications && unreadNotifications.length > 0) {
      setNotificationQueue(unreadNotifications);
    }
  }, [unreadNotifications]);

  // WebSocket listeners for real-time notifications
  useEffect(() => {
    if (!socket) return;

    // Listen for new messages
    socket.on("new_message", (data: any) => {
      const notification: Notification = {
        id: `msg-${data.id}`,
        type: "message",
        listingId: data.listingId,
        listingTitle: data.listingTitle,
        listingImage: data.listingImage,
        senderName: data.senderName,
        message: data.message,
        timestamp: data.timestamp,
      };
      addNotification(notification);
    });

    // Listen for new offers
    socket.on("new_offer", (data: any) => {
      const notification: Notification = {
        id: `offer-${data.id}`,
        type: "offer",
        listingId: data.listingId,
        listingTitle: data.listingTitle,
        listingImage: data.listingImage,
        senderName: data.senderName,
        message: data.message,
        offerAmount: data.offerAmount,
        depositAmount: data.depositAmount,
        timestamp: data.timestamp,
      };
      addNotification(notification);
    });

    return () => {
      socket.off("new_message");
      socket.off("new_offer");
    };
  }, [socket]);

  // Process notification queue
  useEffect(() => {
    if (!currentNotification && notificationQueue.length > 0) {
      setCurrentNotification(notificationQueue[0]);
      setNotificationQueue((prev) => prev.slice(1));
    }
  }, [currentNotification, notificationQueue]);

  const addNotification = (notification: Notification) => {
    setNotificationQueue((prev) => [...prev, notification]);
  };

  const handleClose = () => {
    setCurrentNotification(null);
  };

  if (!currentNotification) {
    return null;
  }

  return (
    <MessageOfferPopup 
      notification={currentNotification} 
      onClose={handleClose}
    />
  );
}

