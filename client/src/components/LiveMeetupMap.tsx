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
  CheckCircle,
  Compass,
  MapPinned
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

// Custom marker icons
const createCustomIcon = (color: string, label: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 40px;
        height: 40px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <span style="
          transform: rotate(45deg);
          color: white;
          font-weight: bold;
          font-size: 16px;
        ">${label}</span>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};

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
  enRouteStartedAt: string | null;
  enRouteStartedBy: string | null;
  enRouteUserId: string | null;
  estimatedArrivalMinutes: number | null;
  estimatedArrivalTime: string | null;
}

// ETA Countdown Component
function ETACountdown({ estimatedArrivalTime }: { estimatedArrivalTime: string }) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const eta = new Date(estimatedArrivalTime).getTime();
      const remaining = Math.max(0, Math.floor((eta - now) / 60000)); // Convert to minutes
      setTimeRemaining(remaining);
    };
    
    updateCountdown();
    const intervalId = setInterval(updateCountdown, 10000); // Update every 10 seconds
    
    return () => clearInterval(intervalId);
  }, [estimatedArrivalTime]);
  
  return (
    <div className="text-right">
      <div className="text-2xl font-bold text-green-600">
        {timeRemaining}
      </div>
      <div className="text-xs text-gray-500">minutes</div>
    </div>
  );
}

export function LiveMeetupMap({ sessionId, userId, onClose }: LiveMeetupMapProps) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [shareContactModal, setShareContactModal] = useState(false);
  const [trustedContactEmail, setTrustedContactEmail] = useState("");
  const [proximityAlert, setProximityAlert] = useState<string | null>(null);
  const [showMeetInMiddle, setShowMeetInMiddle] = useState(false);
  const [middlePoint, setMiddlePoint] = useState<{ lat: number; lng: number } | null>(null);
  const [showSafeSpots, setShowSafeSpots] = useState(false);
  const [safeSpots, setSafeSpots] = useState<Array<{name: string; address: string; lat: number; lng: number; type: string}>>([]);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [showOnMyWayConfirm, setShowOnMyWayConfirm] = useState(false);
  const [estimatedTravelTime, setEstimatedTravelTime] = useState<number | null>(null);

  // Calculate ETA when On My Way dialog opens
  useEffect(() => {
    if (showOnMyWayConfirm && userLocation && sessionData?.suggestedMeetupLat && sessionData?.suggestedMeetupLng) {
      // Calculate estimated travel time
      const calculateETA = async () => {
        try {
          const response = await fetch(`/api/meetups/${sessionId}/calculate-eta`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              currentLat: userLocation.lat,
              currentLng: userLocation.lng,
              destinationLat: sessionData.suggestedMeetupLat,
              destinationLng: sessionData.suggestedMeetupLng,
            }),
          });
          
          if (response.ok) {
            const data = await response.json();
            setEstimatedTravelTime(data.estimatedMinutes);
          }
        } catch (error) {
          console.error("Error calculating ETA:", error);
          // Fallback to simple distance-based estimate
          const R = 6371e3; // Earth radius in meters
          const φ1 = userLocation.lat * Math.PI / 180;
          const φ2 = parseFloat(sessionData.suggestedMeetupLat) * Math.PI / 180;
          const Δφ = (parseFloat(sessionData.suggestedMeetupLat) - userLocation.lat) * Math.PI / 180;
          const Δλ = (parseFloat(sessionData.suggestedMeetupLng) - userLocation.lng) * Math.PI / 180;
          const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                    Math.cos(φ1) * Math.cos(φ2) *
                    Math.sin(Δλ/2) * Math.sin(Δλ/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const distance = R * c; // Distance in meters
          
          // Assume average speed of 30 km/h in city
          const estimatedMinutes = Math.round((distance / 1000) / 30 * 60);
          setEstimatedTravelTime(Math.max(1, estimatedMinutes));
        }
      };
      
      calculateETA();
    }
  }, [showOnMyWayConfirm, userLocation, sessionData, sessionId]);
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

  // Show location sharing prompt on mount
  useEffect(() => {
    if (sessionData && !userLocation) {
      // Show prompt after a brief delay to let UI load
      const timer = setTimeout(() => {
        setShowLocationPrompt(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [sessionData, userLocation]);

  // Start tracking user's location
  const startLocationTracking = () => {
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
  };

  // Auto-start tracking if user already has location
  useEffect(() => {
    if (userLocation) return; // Already tracking
    
    // Check if user previously granted permission
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted') {
          startLocationTracking();
        }
      });
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [sessionId, socket]);

  // Automatic ETA recalculation when buyer is en route
  useEffect(() => {
    if (sessionData?.status === "en_route" && sessionData?.enRouteUserId === userId && userLocation) {
      const intervalId = setInterval(async () => {
        try {
          // Recalculate ETA based on current location
          const response = await fetch(`/api/meetups/${sessionId}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              status: "en_route",
              currentLat: userLocation.lat.toString(),
              currentLng: userLocation.lng.toString(),
            }),
          });
          
          if (response.ok) {
            console.log("ETA recalculated successfully");
          }
        } catch (error) {
          console.error("Error recalculating ETA:", error);
        }
      }, 45000); // Recalculate every 45 seconds
      
      return () => clearInterval(intervalId);
    }
  }, [sessionData?.status, sessionData?.enRouteUserId, userId, userLocation, sessionId]);

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
      
      // Listen for ETA updates
      socket.on("eta_updated", (data: any) => {
        console.log("ETA updated:", data);
        refetch();
      });

      return () => {
        socket.emit("leave_meetup", { sessionId });
        socket.off("location_updated");
        socket.off("status_updated");
        socket.off("eta_updated");
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

  // Calculate middle point between buyer and seller
  useEffect(() => {
    if (sessionData && sessionData.buyerLatitude && sessionData.buyerLongitude && 
        sessionData.sellerLatitude && sessionData.sellerLongitude) {
      const buyerLat = parseFloat(sessionData.buyerLatitude);
      const buyerLng = parseFloat(sessionData.buyerLongitude);
      const sellerLat = parseFloat(sessionData.sellerLatitude);
      const sellerLng = parseFloat(sessionData.sellerLongitude);
      
      const midLat = (buyerLat + sellerLat) / 2;
      const midLng = (buyerLng + sellerLng) / 2;
      
      setMiddlePoint({ lat: midLat, lng: midLng });
    }
  }, [sessionData]);

  // Fetch nearby safe meetup spots
  const fetchSafeSpots = async () => {
    if (!middlePoint) return;
    
    try {
      // Use Overpass API (OpenStreetMap) to find nearby public places
      const query = `
        [out:json];
        (
          node["amenity"="police"](around:2000,${middlePoint.lat},${middlePoint.lng});
          node["amenity"="library"](around:2000,${middlePoint.lat},${middlePoint.lng});
          node["amenity"="cafe"](around:2000,${middlePoint.lat},${middlePoint.lng});
          node["amenity"="restaurant"](around:2000,${middlePoint.lat},${middlePoint.lng});
          node["shop"="convenience"](around:2000,${middlePoint.lat},${middlePoint.lng});
        );
        out body;
      `;
      
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query,
      });
      
      const data = await response.json();
      
      const spots = data.elements
        .filter((el: any) => el.tags?.name)
        .slice(0, 5)
        .map((el: any) => ({
          name: el.tags.name,
          address: el.tags['addr:street'] ? `${el.tags['addr:street']}` : 'Address not available',
          lat: el.lat,
          lng: el.lon,
          type: el.tags.amenity || el.tags.shop || 'location',
        }));
      
      setSafeSpots(spots);
      setShowSafeSpots(true);
    } catch (error) {
      console.error('Error fetching safe spots:', error);
      // Fallback to basic suggestions
      setSafeSpots([
        {
          name: 'Midpoint Location',
          address: 'Meet halfway between both locations',
          lat: middlePoint.lat,
          lng: middlePoint.lng,
          type: 'midpoint',
        },
      ]);
      setShowSafeSpots(true);
    }
  };

  // Open directions in user's preferred navigation app
  const openDirections = () => {
    if (!userLocation) return;
    
    let targetLat: number;
    let targetLng: number;
    
    // Use suggested meetup point if available, otherwise use other party's location
    if (sessionData.suggestedMeetupLat && sessionData.suggestedMeetupLng) {
      targetLat = parseFloat(sessionData.suggestedMeetupLat);
      targetLng = parseFloat(sessionData.suggestedMeetupLng);
    } else if (otherPartyLocation.lat && otherPartyLocation.lng) {
      targetLat = parseFloat(otherPartyLocation.lat);
      targetLng = parseFloat(otherPartyLocation.lng);
    } else {
      return;
    }
    
    // Detect platform and open appropriate maps app
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    if (isIOS) {
      // Apple Maps
      window.open(`maps://maps.apple.com/?daddr=${targetLat},${targetLng}`, '_blank');
    } else if (isAndroid) {
      // Google Maps
      window.open(`google.navigation:q=${targetLat},${targetLng}`, '_blank');
    } else {
      // Desktop - Google Maps web
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${targetLat},${targetLng}`, '_blank');
    }
  };

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
        
        {/* Location Sharing Status */}
        <div className="mt-3 pt-3 border-t border-blue-500/30">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              {userLocation ? (
                <>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-blue-100">Your location: <strong className="text-white">Sharing</strong></span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span className="text-blue-100">Your location: <strong className="text-white">Not shared</strong></span>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setShowLocationPrompt(true)}
                    className="text-white underline h-auto p-0 ml-1"
                  >
                    Share now
                  </Button>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {(isBuyer ? sessionData.sellerLatitude : sessionData.buyerLatitude) ? (
                <>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-blue-100">{isBuyer ? 'Seller' : 'Buyer'}: <strong className="text-white">Sharing</strong></span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span className="text-blue-100">{isBuyer ? 'Seller' : 'Buyer'}: <strong className="text-white">Waiting...</strong></span>
                </>
              )}
            </div>
          </div>
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
            <Marker 
              position={[userLocation.lat, userLocation.lng]}
              icon={createCustomIcon('#3b82f6', isBuyer ? 'B' : 'S')}
            >
              <Popup>
                <div className="font-semibold">{isBuyer ? 'Buyer (You)' : 'Seller (You)'}</div>
                <div className="text-xs text-gray-600">Your current location</div>
              </Popup>
            </Marker>
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={50}
              pathOptions={{ color: "blue", fillColor: "blue", fillOpacity: 0.2 }}
            />
            
            {/* Other party's location */}
            {otherPartyLocation.lat && otherPartyLocation.lng && (
              <>
                <Marker 
                  position={[parseFloat(otherPartyLocation.lat), parseFloat(otherPartyLocation.lng)]}
                  icon={createCustomIcon('#ef4444', isBuyer ? 'S' : 'B')}
                >
                  <Popup>
                    <div className="font-semibold">{isBuyer ? 'Seller' : 'Buyer'}</div>
                    <div className="text-xs text-gray-600">Other party's location</div>
                    {sessionData.currentDistance && (
                      <div className="text-xs font-medium text-blue-600 mt-1">
                        {parseFloat(sessionData.currentDistance).toFixed(0)}m away
                      </div>
                    )}
                  </Popup>
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

      {/* On My Way Button (Buyer Only) */}
      {isBuyer && sessionData.status === "active" && (
        <div className="p-4 border-t bg-gradient-to-r from-blue-50 to-indigo-50">
          <Button
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-6 text-lg shadow-lg"
            onClick={() => setShowOnMyWayConfirm(true)}
            disabled={!userLocation}
          >
            <Navigation className="w-6 h-6 mr-3" />
            On My Way
          </Button>
          <p className="text-xs text-gray-600 text-center mt-2">
            Notify the seller that you're heading to the meetup point
          </p>
        </div>
      )}

      {/* ETA Display for Buyer (when they are en route) */}
      {isBuyer && sessionData.status === "en_route" && sessionData.enRouteUserId === userId && sessionData.estimatedArrivalTime && (
        <div className="p-4 border-t bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 rounded-full p-3 animate-pulse">
                <Navigation className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">You're on your way!</p>
                <p className="text-sm text-gray-600">
                  Your estimated arrival time
                </p>
              </div>
            </div>
            <ETACountdown estimatedArrivalTime={sessionData.estimatedArrivalTime} />
          </div>
        </div>
      )}

      {/* ETA Display (Seller sees this when buyer is en route) */}
      {!isBuyer && sessionData.status === "en_route" && sessionData.estimatedArrivalMinutes && (
        <div className="p-4 border-t bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-green-600 rounded-full p-3">
                <Navigation className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Buyer is on their way!</p>
                <p className="text-sm text-gray-600">
                  Estimated arrival time
                </p>
              </div>
            </div>
            {sessionData.estimatedArrivalTime && (
              <ETACountdown estimatedArrivalTime={sessionData.estimatedArrivalTime} />
            )}
          </div>
        </div>
      )}

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
          <Button
            variant="outline"
            size="sm"
            onClick={() => sendMessageMutation.mutate("cant_find")}
            disabled={sendMessageMutation.isPending}
            className="col-span-2"
          >
            <AlertCircle className="w-4 h-4 mr-2" />
            Can't Find It
          </Button>
        </div>
        
        {/* Navigation Actions */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button
            variant="default"
            size="sm"
            onClick={openDirections}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Navigation className="w-4 h-4 mr-2" />
            Directions
          </Button>
          {middlePoint && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMeetInMiddle(!showMeetInMiddle)}
            >
              <MapPinned className="w-4 h-4 mr-2" />
              Meet in Middle
            </Button>
          )}
        </div>
        
        {/* Safe Spots Button */}
        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSafeSpots}
            className="w-full border-green-200 hover:bg-green-50"
          >
            <MapPin className="w-4 h-4 mr-2 text-green-600" />
            Suggest Safe Meetup Spots
          </Button>
        </div>
        
        {/* Safe Spots List */}
        {showSafeSpots && safeSpots.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-green-900">Nearby Safe Locations</p>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-green-700"
                onClick={() => setShowSafeSpots(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {safeSpots.map((spot, idx) => (
                <div key={idx} className="bg-white rounded p-2 border border-green-100">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{spot.name}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{spot.address}</p>
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {spot.type}
                      </Badge>
                    </div>
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-blue-600 text-xs ml-2"
                      onClick={() => {
                        window.open(`https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`, '_blank');
                      }}
                    >
                      Navigate
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Meet in Middle Info */}
        {showMeetInMiddle && middlePoint && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
            <div className="flex items-start gap-2">
              <Compass className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">Suggested Midpoint</p>
                <p className="text-xs text-blue-700 mt-1">
                  {middlePoint.lat.toFixed(6)}, {middlePoint.lng.toFixed(6)}
                </p>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-blue-600 text-xs mt-1"
                  onClick={() => {
                    window.open(`https://www.google.com/maps/search/?api=1&query=${middlePoint.lat},${middlePoint.lng}`, '_blank');
                  }}
                >
                  View on Map →
                </Button>
              </div>
            </div>
          </div>
        )}
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

      {/* Location Sharing Permission Dialog */}
      <Dialog open={showLocationPrompt} onOpenChange={setShowLocationPrompt}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4">
              <MapPin className="w-8 h-8 text-blue-600" />
            </div>
            <DialogTitle className="text-center text-xl">
              Share your location with {isBuyer ? 'the seller' : 'the buyer'}?
            </DialogTitle>
            <DialogDescription className="text-center">
              This allows both parties to see each other's live location during the meetup for safety and coordination.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">See real-time distance</p>
                  <p className="text-xs text-blue-700">Know exactly how far apart you are</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Get arrival notifications</p>
                  <p className="text-xs text-blue-700">Receive alerts when the other person is close</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Safer meetups</p>
                  <p className="text-xs text-blue-700">Both parties can verify locations</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-600">
                <strong>Privacy:</strong> Your location is only shared during this meetup session and is automatically deleted after completion.
              </p>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-col gap-2">
            <Button
              onClick={() => {
                startLocationTracking();
                setShowLocationPrompt(false);
              }}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Share My Location
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowLocationPrompt(false)}
              className="w-full"
            >
              Maybe Later
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* On My Way Confirmation Dialog */}
      <Dialog open={showOnMyWayConfirm} onOpenChange={setShowOnMyWayConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mx-auto mb-4">
              <Navigation className="w-8 h-8 text-white" />
            </div>
            <DialogTitle className="text-center text-xl">
              Ready to head to the meetup?
            </DialogTitle>
            <DialogDescription className="text-center">
              The seller will be notified that you're on your way with an estimated arrival time.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {sessionData.suggestedMeetupName && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Meeting at</p>
                    <p className="text-sm text-gray-700">{sessionData.suggestedMeetupName}</p>
                  </div>
                </div>
              </div>
            )}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Estimated travel time</p>
                    <p className="text-xs text-blue-700">Based on current traffic</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">
                    {estimatedTravelTime || '...'}
                  </p>
                  <p className="text-xs text-blue-700">minutes</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs text-green-800">
                <strong>What happens next:</strong> The seller will see your live ETA with a countdown timer. Your location will update automatically as you travel.
              </p>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-col gap-2">
            <Button
              onClick={async () => {
                try {
                  if (!userLocation) {
                    console.error("User location not available");
                    return;
                  }
                  
                  // Update status to en_route with current location
                  const response = await fetch(`/api/meetups/${sessionId}/status`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                      status: "en_route",
                      currentLat: userLocation.lat.toString(),
                      currentLng: userLocation.lng.toString(),
                    }),
                  });
                  
                  if (!response.ok) {
                    throw new Error("Failed to update status");
                  }
                  
                  setShowOnMyWayConfirm(false);
                  refetch();
                } catch (error) {
                  console.error("Error starting journey:", error);
                }
              }}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              disabled={!userLocation}
            >
              <Navigation className="w-4 h-4 mr-2" />
              Yes, I'm On My Way!
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowOnMyWayConfirm(false)}
              className="w-full"
            >
              Not Yet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

