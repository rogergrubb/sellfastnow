import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MapPin, Search, Navigation, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface LocationData {
  // Display text
  location: string;
  
  // Core coordinates
  locationLatitude?: number;
  locationLongitude?: number;
  
  // Address components
  locationCity?: string;
  locationRegion?: string;
  locationCountry?: string;
  locationPostalCode?: string;
  locationNeighborhood?: string;
  locationStreetAddress?: string;
  locationFormattedAddress?: string;
  
  // Privacy & precision
  locationPrecisionLevel: "exact" | "proximity" | "city" | "region";
  locationPrivacyRadius?: number;
  
  // Geocoding metadata
  locationGeocoded: boolean;
  locationGeocodedAt?: string;
  locationGeocodingService?: string;
  locationGeocodingAccuracy?: string;
  locationPlaceId?: string;
  locationTimezone?: string;
  
  // Pickup/delivery options
  pickupAvailable: boolean;
  deliveryAvailable: boolean;
  shippingAvailable: boolean;
  meetingPointsAvailable: boolean;
}

interface SimpleLocationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (locationData: LocationData) => void;
  userLocation?: {
    city?: string;
    region?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };
}

export function SimpleLocationModal({
  open,
  onOpenChange,
  onSave,
  userLocation,
}: SimpleLocationModalProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [locationData, setLocationData] = useState<any>(null);
  const [precisionLevel, setPrecisionLevel] = useState<"exact" | "proximity" | "city" | "region">("proximity");
  const [pickupAvailable, setPickupAvailable] = useState(true);
  const [deliveryAvailable, setDeliveryAvailable] = useState(false);
  const [shippingAvailable, setShippingAvailable] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Error",
        description: "Please enter a location to search",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&addressdetails=1&limit=1`,
        {
          headers: {
            'User-Agent': 'SellFast.Now/1.0'
          }
        }
      );

      if (!response.ok) throw new Error("Search failed");

      const data = await response.json();
      
      if (data.length === 0) {
        toast({
          title: "No Results",
          description: "No location found. Try a different search term.",
          variant: "destructive",
        });
        return;
      }

      const result = data[0];
      const address = result.address || {};

      setLocationData({
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        city: address.city || address.town || address.village || address.hamlet,
        region: address.state,
        country: address.country,
        postalCode: address.postcode,
        neighborhood: address.neighbourhood || address.suburb,
        streetAddress: `${address.house_number || ''} ${address.road || ''}`.trim(),
        formattedAddress: result.display_name,
      });

      toast({
        title: "Location Found",
        description: result.display_name,
      });
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Error",
        description: "Failed to search for location. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Not Supported",
        description: "Geolocation is not supported by your browser",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Reverse geocode
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'SellFast.Now/1.0'
              }
            }
          );

          if (!response.ok) throw new Error("Reverse geocoding failed");

          const data = await response.json();
          const address = data.address || {};

          setLocationData({
            latitude,
            longitude,
            city: address.city || address.town || address.village || address.hamlet,
            region: address.state,
            country: address.country,
            postalCode: address.postcode,
            neighborhood: address.neighbourhood || address.suburb,
            streetAddress: `${address.house_number || ''} ${address.road || ''}`.trim(),
            formattedAddress: data.display_name,
          });

          toast({
            title: "Location Detected",
            description: data.display_name,
          });
        } catch (error) {
          console.error("Geolocation error:", error);
          toast({
            title: "Error",
            description: "Failed to get your location",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        setLoading(false);
        toast({
          title: "Error",
          description: "Failed to access your location. Please check permissions.",
          variant: "destructive",
        });
      }
    );
  };

  const handleSave = () => {
    if (!locationData) {
      toast({
        title: "Error",
        description: "Please search for a location first",
        variant: "destructive",
      });
      return;
    }

    const privacyRadius = 
      precisionLevel === "exact" ? 0 :
      precisionLevel === "proximity" ? 500 :
      precisionLevel === "city" ? 5000 :
      10000;

    const finalLocationData: LocationData = {
      location: locationData.formattedAddress?.split(',').slice(0, 2).join(',') || 
                `${locationData.city}, ${locationData.region}`,
      locationLatitude: locationData.latitude,
      locationLongitude: locationData.longitude,
      locationCity: locationData.city,
      locationRegion: locationData.region,
      locationCountry: locationData.country,
      locationPostalCode: locationData.postalCode,
      locationNeighborhood: locationData.neighborhood,
      locationStreetAddress: locationData.streetAddress,
      locationFormattedAddress: locationData.formattedAddress,
      locationPrecisionLevel: precisionLevel,
      locationPrivacyRadius: privacyRadius > 0 ? privacyRadius : undefined,
      locationGeocoded: true,
      locationGeocodedAt: new Date().toISOString(),
      locationGeocodingService: "nominatim",
      locationGeocodingAccuracy: "search",
      locationTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      pickupAvailable,
      deliveryAvailable,
      shippingAvailable,
      meetingPointsAvailable: false,
    };

    onSave(finalLocationData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Set Item Location
          </DialogTitle>
          <DialogDescription>
            Search for your location or use your current location
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Search Section */}
          <div className="space-y-3">
            <Label>Search for Location</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter city, address, or ZIP code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                disabled={loading}
              />
              <Button
                onClick={handleSearch}
                disabled={loading || !searchQuery.trim()}
                className="shrink-0"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            <Button
              variant="outline"
              onClick={handleUseCurrentLocation}
              disabled={loading}
              className="w-full"
            >
              <Navigation className="h-4 w-4 mr-2" />
              Use My Current Location
            </Button>
          </div>

          {/* Location Display */}
          {locationData && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-green-900">Location Found</p>
                  <p className="text-sm text-green-700 break-words">{locationData.formattedAddress}</p>
                  <p className="text-xs text-green-600 mt-1">
                    Coordinates: {locationData.latitude.toFixed(6)}, {locationData.longitude.toFixed(6)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Privacy Level */}
          <div className="space-y-3">
            <Label>Privacy Level</Label>
            <RadioGroup value={precisionLevel} onValueChange={(value: any) => setPrecisionLevel(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="exact" id="exact" />
                <Label htmlFor="exact" className="font-normal cursor-pointer">
                  <span className="font-medium">Exact Address</span>
                  <span className="block text-sm text-muted-foreground">
                    Show precise location (address visible after commitment)
                  </span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="proximity" id="proximity" />
                <Label htmlFor="proximity" className="font-normal cursor-pointer">
                  <span className="font-medium">General Proximity (Recommended)</span>
                  <span className="block text-sm text-muted-foreground">
                    Show approximate area (~500m radius)
                  </span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="city" id="city" />
                <Label htmlFor="city" className="font-normal cursor-pointer">
                  <span className="font-medium">City Only</span>
                  <span className="block text-sm text-muted-foreground">
                    Show only city name (~5km radius)
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Availability Options */}
          <div className="space-y-3 pt-4 border-t">
            <Label>Availability Options</Label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pickupAvailable}
                  onChange={(e) => setPickupAvailable(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Local Pickup Available</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deliveryAvailable}
                  onChange={(e) => setDeliveryAvailable(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Local Delivery Available</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shippingAvailable}
                  onChange={(e) => setShippingAvailable(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Shipping Available</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!locationData}
              className="flex-1"
            >
              Save Location
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
