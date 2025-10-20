import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Hero from "@/components/Hero";
import CategoryFilters from "@/components/CategoryFilters";
import FilterSidebar from "@/components/FilterSidebar";
import ListingCard from "@/components/ListingCard";
import MapView from "@/components/MapView";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, Loader2, Map, List } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery as useAuthQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { Listing } from "@shared/schema";

export default function Home() {
  const [, setLocation] = useLocation();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedCondition, setSelectedCondition] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [location, setLocation] = useState("");
  const [distance, setDistance] = useState("");
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high'>('newest');

  // Fetch current user's location for map
  const { data: currentUser } = useAuthQuery<any>({
    queryKey: ['/api/auth/user'],
    retry: false,
  });

  const userLocation = currentUser?.locationLatitude && currentUser?.locationLongitude
    ? { latitude: parseFloat(currentUser.locationLatitude), longitude: parseFloat(currentUser.locationLongitude) }
    : undefined;

  // Build query params for search
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.append('q', searchQuery);
    if (selectedCategory) params.append('category', selectedCategory);
    if (selectedCondition) params.append('condition', selectedCondition);
    if (priceMin) params.append('priceMin', priceMin);
    if (priceMax) params.append('priceMax', priceMax);
    if (location) params.append('location', location);
    if (distance) params.append('distance', distance);
    if (sortBy) params.append('sortBy', sortBy);
    return params.toString();
  };

  const queryParams = buildQueryParams();

  // Fetch listings with filters
  const { data: listings = [], isLoading } = useQuery<Listing[]>({
    queryKey: ['/api/listings/search', queryParams],
    queryFn: async () => {
      const url = queryParams 
        ? `/api/listings/search?${queryParams}`
        : '/api/listings';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch listings');
      return response.json();
    },
  });

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category === selectedCategory ? "" : category);
  };

  const handleFiltersChange = (filters: {
    condition?: string;
    priceMin?: string;
    priceMax?: string;
    location?: string;
    distance?: string;
  }) => {
    if (filters.condition !== undefined) setSelectedCondition(filters.condition);
    if (filters.priceMin !== undefined) setPriceMin(filters.priceMin);
    if (filters.priceMax !== undefined) setPriceMax(filters.priceMax);
    if (filters.location !== undefined) setLocation(filters.location);
    if (filters.distance !== undefined) setDistance(filters.distance);
  };

  const formatPrice = (price: string) => {
    return parseFloat(price).toFixed(0);
  };

  const getTimeAgo = (date: Date | string) => {
    const now = new Date();
    const created = new Date(date);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div>
      <Hero onSearch={setSearchQuery} onCategorySelect={handleCategorySelect} />
      <CategoryFilters 
        selectedCategory={selectedCategory}
        onCategorySelect={handleCategorySelect}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-32">
              <FilterSidebar 
                filters={{
                  condition: selectedCondition,
                  priceMin,
                  priceMax,
                  location,
                  distance,
                }}
                onFiltersChange={handleFiltersChange}
              />
            </div>
          </aside>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                {listings.length} {listings.length === 1 ? 'Listing' : 'Listings'}
              </h2>
              
              <div className="flex items-center gap-3">
                {/* View Mode Toggle */}
                <div className="flex items-center border rounded-md">
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-r-none"
                  >
                    <List className="h-4 w-4 mr-2" />
                    List
                  </Button>
                  <Button
                    variant={viewMode === 'map' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('map')}
                    className="rounded-l-none"
                  >
                    <Map className="h-4 w-4 mr-2" />
                    Map
                  </Button>
                </div>

                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-[180px]" data-testid="select-sort">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>

                <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="lg:hidden" data-testid="button-mobile-filters">
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <FilterSidebar 
                        filters={{
                          condition: selectedCondition,
                          priceMin,
                          priceMax,
                          location,
                        }}
                        onFiltersChange={handleFiltersChange}
                      />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg">No listings found</p>
                <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters or search query</p>
              </div>
            ) : viewMode === 'map' ? (
              <MapView
                listings={listings}
                userLocation={userLocation}
                onListingClick={(id) => setLocation(`/listings/${id}`)}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((listing: any) => (
                  <ListingCard 
                    key={listing.id}
                    id={listing.id}
                    image={listing.images[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop'}
                    title={listing.title}
                    price={parseFloat(formatPrice(listing.price))}
                    location={listing.location}
                    timePosted={getTimeAgo(listing.createdAt!)}
                    seller={listing.seller}
                    sellerStats={listing.sellerStats}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
