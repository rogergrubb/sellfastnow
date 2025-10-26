import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, X, Check, AlertCircle } from "lucide-react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { MeetupConsentModal } from "./MeetupConsentModal";

interface MeetupNotificationProps {
  userId: string;
  onAccept: (sessionId: string) => void;
}

interface MeetupRequest {
  sessionId: string;
  transactionId: string;
  listingTitle: string;
  listingImage?: string;
  otherPartyName: string;
  suggestedLocation?: string;
  timestamp: string;
}

export function MeetupNotification({ userId, onAccept }: MeetupNotificationProps) {
  const [pendingRequests, setPendingRequests] = useState<MeetupRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<MeetupRequest | null>(null);
  const [consentModalOpen, setConsentModalOpen] = useState(false);
  const { socket } = useWebSocket();

  useEffect(() => {
    if (!socket) return;

    // Listen for incoming meetup requests
    socket.on("meetup_request", (data: MeetupRequest) => {
      // Add to pending requests if not already there
      setPendingRequests((prev) => {
        const exists = prev.some((req) => req.sessionId === data.sessionId);
        if (exists) return prev;
        return [...prev, data];
      });

      // Show browser notification if permitted
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("New Meetup Request", {
          body: `${data.otherPartyName} wants to share location for ${data.listingTitle}`,
          icon: data.listingImage,
          tag: data.sessionId,
        });
      }
    });

    // Listen for cancelled requests
    socket.on("meetup_cancelled", (data: { sessionId: string }) => {
      setPendingRequests((prev) => 
        prev.filter((req) => req.sessionId !== data.sessionId)
      );
    });

    return () => {
      socket.off("meetup_request");
      socket.off("meetup_cancelled");
    };
  }, [socket]);

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const handleDismiss = (sessionId: string) => {
    setPendingRequests((prev) => prev.filter((req) => req.sessionId !== sessionId));
  };

  const handleAccept = (request: MeetupRequest) => {
    setSelectedRequest(request);
    setConsentModalOpen(true);
  };

  const handleConsentAccept = () => {
    if (selectedRequest) {
      onAccept(selectedRequest.sessionId);
      handleDismiss(selectedRequest.sessionId);
      setConsentModalOpen(false);
      setSelectedRequest(null);
    }
  };

  if (pendingRequests.length === 0) {
    return null;
  }

  return (
    <>
      {/* Notification Toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
        {pendingRequests.map((request) => (
          <Card 
            key={request.sessionId} 
            className="shadow-lg border-2 border-blue-500 bg-white animate-in slide-in-from-top-5"
          >
            <div className="p-4">
              <div className="flex items-start gap-3">
                {/* Listing Image */}
                {request.listingImage ? (
                  <img 
                    src={request.listingImage} 
                    alt={request.listingTitle}
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-8 h-8 text-blue-600" />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <Badge className="bg-blue-500 mb-1">
                        <MapPin className="w-3 h-3 mr-1" />
                        Meetup Request
                      </Badge>
                      <h4 className="font-semibold text-sm text-gray-900">
                        {request.otherPartyName}
                      </h4>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleDismiss(request.sessionId)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <p className="text-xs text-gray-600 mb-2">
                    Wants to share location for <span className="font-medium">{request.listingTitle}</span>
                  </p>

                  {request.suggestedLocation && (
                    <div className="flex items-center gap-1 text-xs text-blue-600 mb-2">
                      <MapPin className="w-3 h-3" />
                      <span>{request.suggestedLocation}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      onClick={() => handleAccept(request)}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDismiss(request.sessionId)}
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              </div>

              {/* Safety Notice */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-600">
                    You'll be asked to confirm before sharing your live location
                  </p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Consent Modal */}
      {selectedRequest && (
        <MeetupConsentModal
          isOpen={consentModalOpen}
          onClose={() => {
            setConsentModalOpen(false);
            setSelectedRequest(null);
          }}
          onAccept={handleConsentAccept}
          sessionId={selectedRequest.sessionId}
          otherPartyName={selectedRequest.otherPartyName}
          listingTitle={selectedRequest.listingTitle}
        />
      )}
    </>
  );
}

