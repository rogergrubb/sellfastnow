// Notification Permission Prompt Component
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, X } from "lucide-react";
import { NotificationService } from "@/services/notificationService";

export function NotificationPrompt() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if we should show the prompt
    const checkPermission = () => {
      if (!NotificationService.isSupported()) return;
      if (NotificationService.isPermissionGranted()) return;
      if (Notification.permission === 'denied') return;
      
      // Check if user has dismissed the prompt before
      const dismissedBefore = localStorage.getItem('notification-prompt-dismissed');
      if (dismissedBefore) return;

      // Show prompt after 5 seconds
      setTimeout(() => setShow(true), 5000);
    };

    checkPermission();
  }, []);

  const handleEnable = async () => {
    const granted = await NotificationService.requestPermission();
    if (granted) {
      setShow(false);
      // Show a test notification
      NotificationService.showNotification(
        'Notifications enabled!',
        {
          body: "You'll now receive notifications for new messages",
          silent: false,
        }
      );
    }
  };

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    localStorage.setItem('notification-prompt-dismissed', 'true');
  };

  if (!show || dismissed) return null;

  return (
    <Card className="fixed bottom-4 right-4 w-96 shadow-lg z-50 animate-in slide-in-from-bottom-5">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1">Enable notifications?</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Get notified instantly when you receive new messages
            </p>
            <div className="flex gap-2">
              <Button onClick={handleEnable} size="sm">
                Enable
              </Button>
              <Button onClick={handleDismiss} variant="ghost" size="sm">
                Not now
              </Button>
            </div>
          </div>
          <Button
            onClick={handleDismiss}
            variant="ghost"
            size="icon"
            className="h-6 w-6 flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

