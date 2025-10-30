import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Search, Navigation, Building2, Shield } from "lucide-react";
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

interface LocationSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (locationData: LocationData) => void;
  userLocation?: {
    city?: string;
    region?: string;
    country?: string;
  };
}

export default function LocationSelectionModal({
  open,
  onOpenChange,
  onSave,
  userLocation,
}: LocationSelectionModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [precisionLevel, setPrecisionLevel] = useState<"exact" | "proximity" | "city" | "region">("proximity");
  const [searchQuery, setSearchQuery] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [pickupAvailable, setPickupAvailable] = useState(true);
  const [deliveryAvailable, setDeliveryAvailable] = useState(false);
  const [shippingAvailable, setShippingAvailable] = useState(false);

  // Pre-fill with user's profile location if available
  useEffect(() => {
    if (userLocation?.city && userLocation?.region) {
      setSearchQuery(`${userLocation.city}, ${userLocation.region}`);
    }
  }, [userLocation]);

  const geocodeLocation = async (query: string): Promise<LocationData | null> => {
    try {
      // Use Nominatim (OpenStreetMap) for geocoding - free and no API key required
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`,
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
      const address = result.address || {};

      return {
        location: result.display_name.split(',').slice(0, 2).join(','), // Short display name
        locationLatitude: parseFloat(result.lat),
        locationLongitude: parseFloat(result.lon),
        locationCity: address.city || address.town || address.village || address.hamlet,
        locationRegion: address.state,
        locationCountry: address.country,
        locationPostalCode: address.postcode,
        locationNeighborhood: address.neighbourhood || address.suburb,
        locationFormattedAddress: result.display_name,
        locationPrecisionLevel: precisionLevel,
        locationPrivacyRadius: precisionLevel === "proximity" ? 1000 : undefined, // 1km radius for proximity
        locationGeocoded: true,
        locationGeocodedAt: new Date().toISOString(),
        locationGeocodingService: "nominatim",
        locationGeocodingAccuracy: result.type,
        locationPlaceId: result.place_id?.toString(),
        locationTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        pickupAvailable,
        deliveryAvailable,
        shippingAvailable,
        meetingPointsAvailable: false,
      };
    } catch (error) {
      console.error("Geocoding error:", error);
      return null;
    }
  };

  const handleSearchLocation = async () => {
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
      const locationData = await geocodeLocation(searchQuery);
      
      if (!locationData) {
        throw new Error("Could not find location");
      }

      onSave(locationData);
      onOpenChange(false);
      
      toast({
        title: "Success",
        description: "Location set successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to geocode location",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePostalCodeSearch = async () => {
    if (!postalCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a postal code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const locationData = await geocodeLocation(postalCode);
      
      if (!locationData) {
        throw new Error("Could not find postal code");
      }

      onSave(locationData);
      onOpenChange(false);
      
      toast({
        title: "Success",
        description: "Location set successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to find postal code",
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
        try {
          // Reverse geocode the coordinates
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'SellFast.Now/1.0'
              }
            }
          );

          if (!response.ok) throw new Error("Reverse geocoding failed");

          const data = await response.json();
          const address = data.address || {};

          const locationData: LocationData = {
            location: data.display_name.split(',').slice(0, 2).join(','),
            locationLatitude: position.coords.latitude,
            locationLongitude: position.coords.longitude,
            locationCity: address.city || address.town || address.village,
            locationRegion: address.state,
            locationCountry: address.country,
            locationPostalCode: address.postcode,
            locationNeighborhood: address.neighbourhood || address.suburb,
            locationFormattedAddress: data.display_name,
            locationPrecisionLevel: precisionLevel,
            locationPrivacyRadius: precisionLevel === "proximity" ? 1000 : undefined,
            locationGeocoded: true,
            locationGeocodedAt: new Date().toISOString(),
            locationGeocodingService: "nominatim",
            locationGeocodingAccuracy: "gps",
            locationPlaceId: data.place_id?.toString(),
            locationTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            pickupAvailable,
            deliveryAvailable,
            shippingAvailable,
            meetingPointsAvailable: false,
          };

          onSave(locationData);
          onOpenChange(false);
          
          toast({
            title: "Success",
            description: "Location set from your current position",
          });
        } catch (error: any) {
          toast({
            title: "Error",
            description: "Failed to get location details",
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
          description: "Failed to get your location. Please check permissions.",
          variant: "destructive",
        });
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Set Item Location
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Privacy Level Selection */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Privacy Level
            </Label>
            <RadioGroup value={precisionLevel} onValueChange={(value: any) => setPrecisionLevel(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="exact" id="exact" />
                <Label htmlFor="exact" className="font-normal cursor-pointer">
                  <div>
                    <div className="font-medium">Exact Address</div>
                    <div className="text-sm text-muted-foreground">Show precise location (address visible after commitment)</div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="proximity" id="proximity" />
                <Label htmlFor="proximity" className="font-normal cursor-pointer">
                  <div>
                    <div className="font-medium">General Proximity (Recommended)</div>
                    <div className="text-sm text-muted-foreground">Show approximate area (~1km radius)</div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="city" id="city" />
                <Label htmlFor="city" className="font-normal cursor-pointer">
                  <div>
                    <div className="font-medium">City Only</div>
                    <div className="text-sm text-muted-foreground">Show only city name</div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Location Input Methods */}
          <Tabs defaultValue="search" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="search">
                <Search className="h-4 w-4 mr-2" />
                Search
              </TabsTrigger>
              <TabsTrigger value="postal">
                <Building2 className="h-4 w-4 mr-2" />
                Postal Code
              </TabsTrigger>
              <TabsTrigger value="gps">
                <Navigation className="h-4 w-4 mr-2" />
                GPS
              </TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search for Address or City</Label>
                <Input
                  id="search"
                  placeholder="e.g., 123 Main St, San Pablo, CA or San Pablo, CA"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchLocation()}
                />
              </div>
              <Button onClick={handleSearchLocation} disabled={loading} className="w-full">
                {loading ? "Searching..." : "Search Location"}
              </Button>
            </TabsContent>

            <TabsContent value="postal" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="postal">Enter Postal/ZIP Code</Label>
                <Input
                  id="postal"
                  placeholder="e.g., 94806"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handlePostalCodeSearch()}
                />
              </div>
              <Button onClick={handlePostalCodeSearch} disabled={loading} className="w-full">
                {loading ? "Searching..." : "Find Location"}
              </Button>
            </TabsContent>

            <TabsContent value="gps" className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Use your device's GPS to automatically detect your current location.
              </div>
              <Button onClick={handleUseCurrentLocation} disabled={loading} className="w-full">
                {loading ? "Getting Location..." : "Use Current Location"}
              </Button>
            </TabsContent>
          </Tabs>

          {/* Pickup/Delivery Options */}
          <div className="space-y-3 pt-4 border-t">
            <Label>Availability Options</Label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pickupAvailable}
                  onChange={(e) => setPickupAvailable(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Local pickup available</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deliveryAvailable}
                  onChange={(e) => setDeliveryAvailable(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Local delivery available</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shippingAvailable}
                  onChange={(e) => setShippingAvailable(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Shipping available</span>
              </label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

