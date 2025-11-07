import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from "react-leaflet";
import { Icon, LatLng } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MapPin, Search, Navigation, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Fix Leaflet icon issue with Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

export interface MapLocationData {
  latitude: number;
  longitude: number;
  city?: string;
  region?: string;
  country?: string;
  postalCode?: string;
  neighborhood?: string;
  streetAddress?: string;
  formattedAddress?: string;
  precisionLevel: "exact" | "proximity" | "city" | "region";
  privacyRadius?: number;
}

interface InteractiveMapPickerProps {
  onLocationSelect: (location: MapLocationData) => void;
  initialLocation?: { lat: number; lng: number };
  initialZoom?: number;
}

// Component to handle map clicks
function MapClickHandler({ onLocationClick }: { onLocationClick: (latlng: LatLng) => void }) {
  useMapEvents({
    click: (e) => {
      onLocationClick(e.latlng);
    },
  });
  return null;
}

// Component to recenter map
function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export function InteractiveMapPicker({
  onLocationSelect,
  initialLocation,
  initialZoom = 13,
}: InteractiveMapPickerProps) {
  const { toast } = useToast();
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(
    initialLocation ? [initialLocation.lat, initialLocation.lng] : null
  );
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    initialLocation ? [initialLocation.lat, initialLocation.lng] : [37.7749, -122.4194] // Default to SF
  );
  const [precisionLevel, setPrecisionLevel] = useState<"exact" | "proximity" | "city" | "region">("proximity");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [locationInfo, setLocationInfo] = useState<string>("");

  // Calculate privacy radius based on precision level
  const privacyRadius = precisionLevel === "exact" ? 0 : 
                       precisionLevel === "proximity" ? 500 : 
                       precisionLevel === "city" ? 5000 : 10000;

  const handleMapClick = async (latlng: LatLng) => {
    const position: [number, number] = [latlng.lat, latlng.lng];
    setMarkerPosition(position);
    
    // Reverse geocode to get address
    await reverseGeocode(latlng.lat, latlng.lng);
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'SellFast.Now/1.0'
          }
        }
      );

      if (!response.ok) throw new Error("Reverse geocoding failed");

      const data = await response.json();
      const address = data.address || {};

      const locationData: MapLocationData = {
        latitude: lat,
        longitude: lng,
        city: address.city || address.town || address.village || address.hamlet,
        region: address.state,
        country: address.country,
        postalCode: address.postcode,
        neighborhood: address.neighbourhood || address.suburb,
        streetAddress: `${address.house_number || ''} ${address.road || ''}`.trim(),
        formattedAddress: data.display_name,
        precisionLevel,
        privacyRadius: privacyRadius > 0 ? privacyRadius : undefined,
      };

      // Update display info
      const displayParts = [];
      if (precisionLevel === "exact" && locationData.streetAddress) {
        displayParts.push(locationData.streetAddress);
      }
      if (locationData.city) displayParts.push(locationData.city);
      if (locationData.region) displayParts.push(locationData.region);
      if (locationData.postalCode) displayParts.push(locationData.postalCode);
      
      setLocationInfo(displayParts.join(", "));
      
      // Call parent callback
      onLocationSelect(locationData);
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      toast({
        title: "Error",
        description: "Failed to get address for this location",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Error",
        description: "Please enter a location to search",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'SellFast.Now/1.0'
          }
        }
      );

      if (!response.ok) throw new Error("Geocoding failed");

      const data = await response.json();
      
      if (data.length === 0) {
        throw new Error("Location not found");
      }

      const result = data[0];
      const lat = parseFloat(result.lat);
      const lng = parseFloat(result.lon);
      
      const position: [number, number] = [lat, lng];
      setMarkerPosition(position);
      setMapCenter(position);
      
      // Reverse geocode to get full details
      await reverseGeocode(lat, lng);
      
      toast({
        title: "Success",
        description: "Location found!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to find location",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "Geolocation is not supported by your browser",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const pos: [number, number] = [lat, lng];
        
        setMarkerPosition(pos);
        setMapCenter(pos);
        
        await reverseGeocode(lat, lng);
        setLoading(false);
        
        toast({
          title: "Success",
          description: "Using your current location",
        });
      },
      (error) => {
        setLoading(false);
        toast({
          title: "Error",
          description: "Failed to get your location. Please enable location services.",
          variant: "destructive",
        });
      }
    );
  };

  return (
    <div className="space-y-4">
      {/* Search and Controls */}
      <div className="space-y-4">
        {/* Address Search */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Search for address, city, or ZIP code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
          <Button onClick={handleUseCurrentLocation} variant="outline" disabled={loading}>
            <Navigation className="h-4 w-4" />
          </Button>
        </div>

        {/* Privacy Level Selection */}
        <div className="space-y-2">
          <Label>Location Privacy</Label>
          <RadioGroup value={precisionLevel} onValueChange={(value: any) => {
            setPrecisionLevel(value);
            if (markerPosition) {
              reverseGeocode(markerPosition[0], markerPosition[1]);
            }
          }}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="exact" id="exact" />
              <Label htmlFor="exact" className="font-normal cursor-pointer">
                Exact Address - Show precise location
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="proximity" id="proximity" />
              <Label htmlFor="proximity" className="font-normal cursor-pointer">
                Approximate - Show ~500m radius (Recommended)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="city" id="city" />
              <Label htmlFor="city" className="font-normal cursor-pointer">
                City Only - Show city-level location
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Location Info */}
        {locationInfo && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Selected Location</p>
                <p className="text-sm text-blue-700 dark:text-blue-300">{locationInfo}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Map */}
      <div className="border rounded-lg overflow-hidden" style={{ height: '400px' }}>
        <MapContainer
          center={mapCenter}
          zoom={initialZoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapClickHandler onLocationClick={handleMapClick} />
          <RecenterMap center={mapCenter} />
          
          {markerPosition && (
            <>
              <Marker position={markerPosition} />
              {privacyRadius > 0 && (
                <Circle
                  center={markerPosition}
                  radius={privacyRadius}
                  pathOptions={{
                    color: '#6366f1',
                    fillColor: '#6366f1',
                    fillOpacity: 0.1,
                  }}
                />
              )}
            </>
          )}
        </MapContainer>
      </div>

      {/* Instructions */}
      <div className="text-sm text-muted-foreground space-y-1">
        <p>💡 <strong>Click anywhere on the map</strong> to set your location</p>
        <p>🔍 Or search for an address above</p>
        <p>📍 The circle shows the approximate area buyers will see</p>
      </div>
    </div>
  );
}
