import { useState, useEffect } from "react";
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

interface FilterSidebarProps {
  filters: {
    condition: string;
    priceMin: string;
    priceMax: string;
    location: string;
  };
  onFiltersChange: (filters: {
    condition?: string;
    priceMin?: string;
    priceMax?: string;
    location?: string;
  }) => void;
}

export default function FilterSidebar({ filters, onFiltersChange }: FilterSidebarProps) {
  const [priceMin, setPriceMin] = useState(filters.priceMin || "");
  const [priceMax, setPriceMax] = useState(filters.priceMax || "");
  const [condition, setCondition] = useState(filters.condition || "");
  const [location, setLocation] = useState(filters.location || "");

  useEffect(() => {
    setPriceMin(filters.priceMin || "");
    setPriceMax(filters.priceMax || "");
    setCondition(filters.condition || "");
    setLocation(filters.location || "");
  }, [filters]);

  const handleReset = () => {
    setPriceMin("");
    setPriceMax("");
    setCondition("");
    setLocation("");
    onFiltersChange({
      priceMin: "",
      priceMax: "",
      condition: "",
      location: "",
    });
  };

  const handleApply = () => {
    onFiltersChange({
      priceMin,
      priceMax,
      condition,
      location,
    });
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-6">Filters</h3>
      
      <div className="space-y-6">
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

        <div>
          <Label htmlFor="location" className="mb-3 block">Location</Label>
          <Input
            id="location"
            placeholder="Enter city or zip code"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            data-testid="input-location"
          />
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
