import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";

interface FilterSidebarProps {
  filters: {
    condition: string;
    priceMin: string;
    priceMax: string;
    location: string;
    distance?: string;
  };
  onFiltersChange: (filters: {
    condition?: string;
    priceMin?: string;
    priceMax?: string;
    location?: string;
    distance?: string;
  }) => void;
}

export default function FilterSidebar({ filters, onFiltersChange }: FilterSidebarProps) {
  const [priceMin, setPriceMin] = useState(filters.priceMin || "");
  const [priceMax, setPriceMax] = useState(filters.priceMax || "");
  const [condition, setCondition] = useState(filters.condition || "");
  const [location, setLocation] = useState(filters.location || "");
  const [distance, setDistance] = useState(filters.distance || "25");

  // Fetch current user's location - gracefully handle unauthenticated users
  const { data: currentUser } = useQuery<any>({
    queryKey: ['/api/auth/user'],
    retry: false,
    queryFn: async ({ queryKey }) => {
      try {
        const res = await fetch(queryKey.join("/") as string, {
          credentials: "include",
        });
        if (res.status === 401) {
          return null; // User not authenticated, return null instead of throwing
        }
        if (!res.ok) {
          throw new Error(`${res.status}: ${res.statusText}`);
        }
        return await res.json();
      } catch (error) {
        console.error('Error fetching user data:', error);
        return null;
      }
    },
  });

  const hasUserLocation = currentUser?.locationLatitude && currentUser?.locationLongitude;

  useEffect(() => {
    setPriceMin(filters.priceMin || "");
    setPriceMax(filters.priceMax || "");
    setCondition(filters.condition || "");
    setLocation(filters.location || "");
    setDistance(filters.distance || "25");
  }, [filters]);

  const handleReset = () => {
    setPriceMin("");
    setPriceMax("");
    setCondition("");
    setLocation("");
    setDistance("25");
    onFiltersChange({
      priceMin: "",
      priceMax: "",
      condition: "",
      location: "",
      distance: "",
    });
  };

  const handleApply = () => {
    onFiltersChange({
      priceMin,
      priceMax,
      condition,
      location,
      distance: hasUserLocation ? distance : "",
    });
  };

  const distanceOptions = [
    { value: "5", label: "5 miles" },
    { value: "10", label: "10 miles" },
    { value: "25", label: "25 miles" },
    { value: "50", label: "50 miles" },
    { value: "100", label: "100 miles" },
    { value: "250", label: "250 miles" },
    { value: "500", label: "500 miles" },
  ];

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-6">Filters</h3>
      
      <div className="space-y-6">
        {/* Distance Filter - only show if user has location */}
        {hasUserLocation && (
          <div>
            <Label className="mb-3 block flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Distance from You
            </Label>
            <Select value={distance} onValueChange={setDistance}>
              <SelectTrigger data-testid="select-distance">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {distanceOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentUser?.locationCity && (
              <p className="text-xs text-muted-foreground mt-2">
                From {currentUser.locationCity}, {currentUser.locationRegion}
              </p>
            )}
          </div>
        )}

        {/* Location Search - show if no user location */}
        {!hasUserLocation && (
          <div>
            <Label htmlFor="location" className="mb-3 block">Location</Label>
            <Input
              id="location"
              placeholder="Enter city or zip code"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              data-testid="input-location"
            />
            <p className="text-xs text-muted-foreground mt-2">
              <a href="/settings" className="text-primary hover:underline">
                Set your location
              </a> for distance-based search
            </p>
          </div>
        )}

        <div>
          <Label className="mb-3 block">Price Range</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              className="h-9"
              data-testid="input-price-min"
            />
            <span className="text-muted-foreground">to</span>
            <Input
              type="number"
              placeholder="Max"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              className="h-9"
              data-testid="input-price-max"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="condition" className="mb-3 block">Condition</Label>
          <Select value={condition || "any"} onValueChange={(value) => setCondition(value === "any" ? "" : value)}>
            <SelectTrigger id="condition" data-testid="select-condition">
              <SelectValue placeholder="Any condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any condition</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="like-new">Like New</SelectItem>
              <SelectItem value="good">Good</SelectItem>
              <SelectItem value="fair">Fair</SelectItem>
              <SelectItem value="poor">Poor</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 pt-4">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={handleReset}
            data-testid="button-reset-filters"
          >
            Reset
          </Button>
          <Button 
            className="flex-1 bg-secondary hover:bg-secondary"
            onClick={handleApply}
            data-testid="button-apply-filters"
          >
            Apply
          </Button>
        </div>
      </div>
    </Card>
  );
}

