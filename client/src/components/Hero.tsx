import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import heroImage from "@assets/generated_images/Marketplace_hero_collage_image_05e817b0.png";

const categories = ["Electronics", "Furniture", "Clothing", "Vehicles", "Services", "More"];

interface HeroProps {
  onSearch: (query: string) => void;
}

export default function Hero({ onSearch }: HeroProps) {
  const [searchInput, setSearchInput] = useState("");
  return (
    <div className="relative h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/50 to-black/30" />
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
          Buy & Sell Anything Locally
        </h1>
        <p className="text-lg sm:text-xl text-white/90 mb-8">
          Your trusted marketplace for finding great deals and selling items fast
        </p>

        <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="What are you looking for?"
              className="pl-10 h-12 text-base bg-white/95 backdrop-blur-sm border-white/20"
              data-testid="input-hero-search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearch(searchInput)}
            />
          </div>
          <Button 
            size="lg" 
            className="h-12 px-8 bg-secondary hover:bg-secondary text-secondary-foreground"
            data-testid="button-hero-search"
            onClick={() => onSearch(searchInput)}
          >
            Search
          </Button>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant="outline"
              size="sm"
              className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20"
              data-testid={`button-category-${category.toLowerCase()}`}
              onClick={() => console.log(`Category ${category} clicked`)}
            >
              {category}
            </Button>
          ))}
        </div>

        <div className="mt-10">
          <Button 
            size="lg" 
            className="bg-secondary hover:bg-secondary text-secondary-foreground h-12 px-8"
            data-testid="button-hero-post"
            onClick={() => console.log("Post your ad clicked")}
          >
            Post Your Ad - It's Free!
          </Button>
        </div>
      </div>
    </div>
  );
}
