import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Navigation, 
  Clock, 
  MessageCircle, 
  X, 
  Share2,
  AlertCircle,
  CheckCircle 
} from "lucide-react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface LiveMeetupMapProps {
  sessionId: string;
  userId: string;
  onClose: () => void;
}

interface MeetupSession {
  id: string;
  status: string;
  buyerId: string;
  sellerId: string;
  buyerSharedLocation: boolean;
  sellerSharedLocation: boolean;
  buyerLatitude: string | null;
  buyerLongitude: string | null;
  buyerLastUpdate: string | null;
  sellerLatitude: string | null;
  sellerLongitude: string | null;
  sellerLastUpdate: string | null;
  currentDistance: string | null;
  suggestedMeetupLat: string | null;
  suggestedMeetupLng: string | null;
  suggestedMeetupName: string | null;
  expiresAt: string;
}

export function LiveMeetupMap({ sessionId, userId, onClose }: LiveMeetupMapProps) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [shareContactModal, setShareContactModal] = useState(false);
  const [trustedContactEmail, setTrustedContactEmail] = useState("");
  const [proximityAlert, setProximityAlert] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const { socket } = useWebSocket();
  const previousDistanceRef = useRef<number | null>(null);

  // Fetch meetup session details
  const { data: sessionData, refetch } = useQuery({
    queryKey: ["meetup-session", sessionId],
    queryFn: async () => {
      const response = await fetch(`/api/meetups/${sessionId}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch session");
      const data = await response.json();
      return data.meetupSession as MeetupSession;
    },
    refetchInterval: 5000, // Refetch every 5 seconds as backup
  });

  // Send quick message
  const sendMessageMutation = useMutation({
    mutationFn: async (messageType: string) => {
      const response = await fetch(`/api/meetups/${sessionId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ messageType }),
      });
      if (!response.ok) throw new Error("Failed to send message");
      return response.json();
    },
  });

  // Complete meetup
  const completeMeetupMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/meetups/${sessionId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "completed" }),
      });
      if (!response.ok) throw new Error("Failed to complete meetup");
      return response.json();
    },
    onSuccess: () => {
      onClose();
    },
  });

  // Start tracking user's location
  useEffect(() => {
    if (!navigator.geolocation) {
      console.error("Geolocation not supported");
      return;
    }

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });

        // Send location update to server
        fetch(`/api/meetups/${sessionId}/location`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ latitude, longitude, accuracy }),
        });

        // Broadcast via WebSocket
        if (socket) {
          socket.emit("meetup_location_update", {
            sessionId,
            latitude,
            longitude,
            accuracy,
          });
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    setWatchId(id);

    return () => {
      if (id !== null) {
        navigator.geolocation.clearWatch(id);
      }
    };
  }, [sessionId, socket]);

  // Join meetup room via WebSocket
  useEffect(() => {
    if (socket) {
      socket.emit("join_meetup", { sessionId });

      // Listen for location updates
      socket.on("location_updated", (data: any) => {
        console.log("Location updated:", data);
        refetch(); // Refetch session data to update UI
      });

      // Listen for status updates
      socket.on("status_updated", (data: any) => {
        console.log("Status updated:", data);
        refetch();
      });

      return () => {
        socket.emit("leave_meetup", { sessionId });
        socket.off("location_updated");
        socket.off("status_updated");
      };
    }
  }, [socket, sessionId, refetch]);

  if (!sessionData) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Card>
    );
  }

  const isActive = sessionData.status === "active";
  const isBuyer = sessionData.buyerId === userId;
  const otherPartyLocation = isBuyer
    ? { lat: sessionData.sellerLatitude, lng: sessionData.sellerLongitude }
    : { lat: sessionData.buyerLatitude, lng: sessionData.buyerLongitude };

  const timeRemaining = new Date(sessionData.expiresAt).getTime() - Date.now();
  const minutesRemaining = Math.floor(timeRemaining / 60000);
  const secondsRemaining = Math.floor((timeRemaining % 60000) / 1000);

  // Calculate distance and show proximity alerts
  const currentDistance = sessionData.currentDistance ? parseFloat(sessionData.currentDistance) : null;
  
  useEffect(() => {
    if (currentDistance !== null) {
      const prevDistance = previousDistanceRef.current;
      
      // First time or distance changed significantly
      if (prevDistance === null || Math.abs(currentDistance - prevDistance) > 10) {
        if (currentDistance < 50) {
          setProximityAlert("🎯 You're very close! Less than 50 meters away.");
        } else if (currentDistance < 100) {
          setProximityAlert("📍 Getting close! Less than 100 meters away.");
        } else if (currentDistance < 200) {
          setProximityAlert("🚶 Approaching meetup point. About 200 meters away.");
        } else {
          setProximityAlert(null);
        }
        
        previousDistanceRef.current = currentDistance;
      }
    }
  }, [currentDistance]);

  // Share with trusted contact
  const shareMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/meetups/${sessionId}/share-contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: trustedContactEmail }),
      });
      if (!response.ok) throw new Error("Failed to share");
      return response.json();
    },
    onSuccess: () => {
      setShareContactModal(false);
      setTrustedContactEmail("");
    },
  });

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPin className="w-6 h-6" />
            <div>
              <h3 className="font-semibold text-lg">Live Meetup</h3>
              <div className="flex items-center gap-2 text-sm text-blue-100">
                <Clock className="w-4 h-4" />
                <span className="font-mono">
                  {minutesRemaining}:{secondsRemaining.toString().padStart(2, '0')} remaining
                </span>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-blue-800"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Status Banner */}
      {!isActive && (
        <div className="bg-amber-50 border-b border-amber-200 p-3">
          <div className="flex items-center gap-2 text-amber-800 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>Waiting for the other party to accept location sharing...</span>
          </div>
        </div>
      )}

      {/* Proximity Alert Banner */}
      {proximityAlert && (
        <div className="bg-green-50 border-b border-green-200 p-3 animate-pulse">
          <div className="flex items-center gap-2 text-green-800 text-sm font-medium">
            <Navigation className="w-4 h-4" />
            <span>{proximityAlert}</span>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div ref={mapContainerRef} className="h-[400px] bg-gray-100 relative">
        {userLocation ? (
          <MapContainer
            center={[userLocation.lat, userLocation.lng]}
            zoom={15}
            style={{ height: "100%", width: "100%" }}
            className="z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* User's location */}
            <Marker position={[userLocation.lat, userLocation.lng]}>
              <Popup>Your Location</Popup>
            </Marker>
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={50}
              pathOptions={{ color: "blue", fillColor: "blue", fillOpacity: 0.2 }}
            />
            
            {/* Other party's location */}
            {otherPartyLocation.lat && otherPartyLocation.lng && (
              <>
                <Marker position={[parseFloat(otherPartyLocation.lat), parseFloat(otherPartyLocation.lng)]}>
                  <Popup>Other Party</Popup>
                </Marker>
                <Circle
                  center={[parseFloat(otherPartyLocation.lat), parseFloat(otherPartyLocation.lng)]}
                  radius={50}
                  pathOptions={{ color: "red", fillColor: "red", fillOpacity: 0.2 }}
                />
              </>
            )}
            
            {/* Meetup point */}
            {sessionData.suggestedMeetupLat && sessionData.suggestedMeetupLng && (
              <Marker 
                position={[
                  parseFloat(sessionData.suggestedMeetupLat), 
                  parseFloat(sessionData.suggestedMeetupLng)
                ]}
              >
                <Popup>
                  Meetup Point
                  {sessionData.suggestedMeetupName && (
                    <div className="font-medium">{sessionData.suggestedMeetupName}</div>
                  )}
                </Popup>
              </Marker>
            )}
          </MapContainer>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-400 animate-pulse" />
              <p className="text-sm">Acquiring your location...</p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-t bg-white space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Quick Messages</span>
          {sessionData.currentDistance && (
            <Badge variant="secondary">
              {parseFloat(sessionData.currentDistance).toFixed(0)}m away
            </Badge>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => sendMessageMutation.mutate("here")}
            disabled={sendMessageMutation.isPending}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            I'm Here
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => sendMessageMutation.mutate("running_late")}
            disabled={sendMessageMutation.isPending}
          >
            <Clock className="w-4 h-4 mr-2" />
            Running Late
          </Button>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t bg-gray-50 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => setShareContactModal(true)}
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share with Contact
        </Button>
        <Button
          onClick={() => completeMeetupMutation.mutate()}
          disabled={completeMeetupMutation.isPending}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Complete Meetup
        </Button>
      </div>

      {/* Share with Trusted Contact Dialog */}
      <Dialog open={shareContactModal} onOpenChange={setShareContactModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Live Location</DialogTitle>
            <DialogDescription>
              Send your live meetup tracking link to a trusted contact for safety.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <Input
                type="email"
                placeholder="friend@example.com"
                value={trustedContactEmail}
                onChange={(e) => setTrustedContactEmail(e.target.value)}
              />
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-800">
                Your trusted contact will receive a link to view your live location during this meetup session only.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShareContactModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => shareMutation.mutate()}
              disabled={!trustedContactEmail || shareMutation.isPending}
            >
              {shareMutation.isPending ? "Sending..." : "Send Link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

