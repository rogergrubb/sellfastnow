import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MapPin, Loader2, Check } from "lucide-react";

export interface LocationData {
  city: string;
  region: string;
  country: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  displayPrecision?: 'exact' | 'neighborhood' | 'city' | 'region';
}

interface LocationInputProps {
  value?: LocationData;
  onChange: (location: LocationData) => void;
  onAutoDetect?: () => void;
  autoDetecting?: boolean;
  required?: boolean;
}

export function LocationInput({ 
  value, 
  onChange, 
  onAutoDetect,
  autoDetecting = false,
  required = false 
}: LocationInputProps) {
  const [city, setCity] = useState(value?.city || "");
  const [region, setRegion] = useState(value?.region || "");
  const [country, setCountry] = useState(value?.country || "");
  const [postalCode, setPostalCode] = useState(value?.postalCode || "");

  const handleUpdate = () => {
    if (city && country) {
      onChange({
        city,
        region,
        country,
        postalCode,
        displayPrecision: 'city'
      });
    }
  };

  const isComplete = city && country;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">
          📍 Your Location {required && <span className="text-red-500">*</span>}
        </Label>
        {onAutoDetect && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAutoDetect}
            disabled={autoDetecting}
          >
            {autoDetecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Detecting...
              </>
            ) : (
              <>
                <MapPin className="mr-2 h-4 w-4" />
                Auto-Detect
              </>
            )}
          </Button>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        Your location helps buyers find items near them. We'll only show your city publicly.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">City {required && <span className="text-red-500">*</span>}</Label>
          <Input
            id="city"
            placeholder="e.g., New York, London, Tokyo"
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              setTimeout(handleUpdate, 500);
            }}
            required={required}
          />
        </div>

        <div>
          <Label htmlFor="region">State/Province/Region</Label>
          <Input
            id="region"
            placeholder="e.g., NY, California, Ontario"
            value={region}
            onChange={(e) => {
              setRegion(e.target.value);
              setTimeout(handleUpdate, 500);
            }}
          />
        </div>

        <div>
          <Label htmlFor="country">Country {required && <span className="text-red-500">*</span>}</Label>
          <Input
            id="country"
            placeholder="e.g., USA, UK, Canada, Japan"
            value={country}
            onChange={(e) => {
              setCountry(e.target.value);
              setTimeout(handleUpdate, 500);
            }}
            required={required}
          />
        </div>

        <div>
          <Label htmlFor="postalCode">Postal/ZIP Code (Optional)</Label>
          <Input
            id="postalCode"
            placeholder="e.g., 10001, SW1A 1AA"
            value={postalCode}
            onChange={(e) => {
              setPostalCode(e.target.value);
              setTimeout(handleUpdate, 500);
            }}
          />
        </div>
      </div>

      {isComplete && (
        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-md">
          <Check className="h-4 w-4" />
          <span>
            Location set: <strong>{city}, {region ? `${region}, ` : ''}{country}</strong>
          </span>
        </div>
      )}

      <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-md">
        <strong>Privacy:</strong> Only your city and country will be shown publicly on your listings. 
        Your exact address is never shared.
      </div>
    </div>
  );
}

