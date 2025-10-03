import { useState } from "react";
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

export default function FilterSidebar() {
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [condition, setCondition] = useState("");
  const [location, setLocation] = useState("");

  const handleReset = () => {
    setPriceRange([0, 5000]);
    setCondition("");
    setLocation("");
    console.log("Filters reset");
  };

  const handleApply = () => {
    console.log("Filters applied:", { priceRange, condition, location });
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-6">Filters</h3>
      
      <div className="space-y-6">
        <div>
          <Label className="mb-3 block">Price Range</Label>
          <div className="px-2">
            <Slider
              value={priceRange}
              onValueChange={setPriceRange}
              max={5000}
              step={50}
              className="mb-4"
              data-testid="slider-price"
            />
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={priceRange[0]}
              onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
              className="h-9"
              data-testid="input-price-min"
            />
            <span className="text-muted-foreground">to</span>
            <Input
              type="number"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
              className="h-9"
              data-testid="input-price-max"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="condition" className="mb-3 block">Condition</Label>
          <Select value={condition} onValueChange={setCondition}>
            <SelectTrigger id="condition" data-testid="select-condition">
              <SelectValue placeholder="Any condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="like-new">Like New</SelectItem>
              <SelectItem value="good">Good</SelectItem>
              <SelectItem value="fair">Fair</SelectItem>
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
