import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Map } from "lucide-react";
import { InteractiveMapPicker, type MapLocationData } from "@/components/InteractiveMapPicker";

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

interface LocationSelectionModalWithMapProps {
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

export function LocationSelectionModalWithMap({
  open,
  onOpenChange,
  onSave,
  userLocation,
}: LocationSelectionModalWithMapProps) {
  const [selectedLocation, setSelectedLocation] = useState<MapLocationData | null>(null);
  const [pickupAvailable, setPickupAvailable] = useState(true);
  const [deliveryAvailable, setDeliveryAvailable] = useState(false);
  const [shippingAvailable, setShippingAvailable] = useState(false);

  const handleLocationSelect = (location: MapLocationData) => {
    setSelectedLocation(location);
  };

  const handleSave = () => {
    if (!selectedLocation) {
      return;
    }

    // Convert MapLocationData to LocationData format
    const locationData: LocationData = {
      location: selectedLocation.formattedAddress?.split(',').slice(0, 2).join(',') || 
                `${selectedLocation.city}, ${selectedLocation.region}`,
      locationLatitude: selectedLocation.latitude,
      locationLongitude: selectedLocation.longitude,
      locationCity: selectedLocation.city,
      locationRegion: selectedLocation.region,
      locationCountry: selectedLocation.country,
      locationPostalCode: selectedLocation.postalCode,
      locationNeighborhood: selectedLocation.neighborhood,
      locationStreetAddress: selectedLocation.streetAddress,
      locationFormattedAddress: selectedLocation.formattedAddress,
      locationPrecisionLevel: selectedLocation.precisionLevel,
      locationPrivacyRadius: selectedLocation.privacyRadius,
      locationGeocoded: true,
      locationGeocodedAt: new Date().toISOString(),
      locationGeocodingService: "nominatim",
      locationGeocodingAccuracy: "interactive_map",
      locationTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      pickupAvailable,
      deliveryAvailable,
      shippingAvailable,
      meetingPointsAvailable: false,
    };

    onSave(locationData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Set Item Location
          </DialogTitle>
          <DialogDescription>
            Click anywhere on the map to set your location, or search for an address
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Interactive Map */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Map className="h-4 w-4" />
              <span>Click anywhere on the map to set your location, or search for an address</span>
            </div>
            
            <InteractiveMapPicker
              onLocationSelect={handleLocationSelect}
              initialLocation={
                userLocation?.latitude && userLocation?.longitude
                  ? { lat: userLocation.latitude, lng: userLocation.longitude }
                  : undefined
              }
            />
          </div>

          {/* Pickup/Delivery Options */}
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
              disabled={!selectedLocation}
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
