import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, DollarSign, X, ExternalLink } from "lucide-react";
import { Link } from "wouter";

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

interface MessageOfferPopupProps {
  notification: Notification;
  onClose: () => void;
}

export function MessageOfferPopup({ notification, onClose }: MessageOfferPopupProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      handleClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  if (!isVisible) {
    return null;
  }

  const isOffer = notification.type === "offer";
  const IconComponent = isOffer ? DollarSign : MessageCircle;
  const bgColor = isOffer ? "bg-green-500" : "bg-blue-500";
  const borderColor = isOffer ? "border-green-500" : "border-blue-500";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-300">
      <Card 
        className={`w-full max-w-2xl shadow-2xl border-4 ${borderColor} animate-in zoom-in-95 duration-300`}
      >
        {/* Header */}
        <div className={`${bgColor} p-6 text-white relative`}>
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4 text-white hover:bg-white/20 h-8 w-8 p-0"
            onClick={handleClose}
          >
            <X className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <IconComponent className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {isOffer ? "New Offer Received!" : "New Message Received!"}
              </h2>
              <p className="text-white/90 text-sm">From {notification.senderName}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex gap-4 mb-6">
            {/* Listing Image */}
            {notification.listingImage ? (
              <img 
                src={notification.listingImage} 
                alt={notification.listingTitle}
                className="w-32 h-32 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                <IconComponent className="w-12 h-12 text-gray-400" />
              </div>
            )}

            {/* Details */}
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {notification.listingTitle}
              </h3>

              {isOffer ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800 text-lg px-3 py-1">
                      Offer: ${parseFloat(notification.offerAmount || "0").toFixed(2)}
                    </Badge>
                  </div>
                  {notification.depositAmount && parseFloat(notification.depositAmount) > 0 && (
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-100 text-blue-800 text-lg px-3 py-1">
                        Deposit: ${parseFloat(notification.depositAmount).toFixed(2)}
                      </Badge>
                    </div>
                  )}
                  {notification.message && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">{notification.message}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-gray-800">{notification.message}</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Link href={`/messages?listing=${notification.listingId}`} className="flex-1">
              <Button 
                className={`w-full ${bgColor} hover:opacity-90 text-white text-lg py-6`}
                onClick={handleClose}
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                {isOffer ? "View Offer Details" : "Reply to Message"}
              </Button>
            </Link>
            <Button 
              variant="outline" 
              onClick={handleClose}
              className="px-6 py-6"
            >
              Dismiss
            </Button>
          </div>

          {/* Auto-dismiss indicator */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              This notification will automatically close in 5 seconds
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

