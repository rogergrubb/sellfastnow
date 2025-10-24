import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import HeroWithBenefits from "@/components/HeroWithBenefits";
import CategoryFilters from "@/components/CategoryFilters";
import FilterSidebar from "@/components/FilterSidebar";
import ListingCard from "@/components/ListingCard";
import { PendingDeals } from "@/components/PendingDeals";
import MapView from "@/components/MapView";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, Loader2, Map, List, Shield, Star, TrendingUp, Award, CreditCard, Lock } from "lucide-react";
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
  const [, navigate] = useLocation();
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

  // Fetch top-rated sellers for trust section
  const { data: topSellers = [] } = useQuery<any[]>({
    queryKey: ['/api/users/top-rated'],
    queryFn: async () => {
      const response = await fetch('/api/users/top-rated?limit=6');
      if (!response.ok) return [];
      return response.json();
    },
  });

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
      <HeroWithBenefits onSearch={handleSearch} onCategorySelect={handleCategorySelect} />
      <CategoryFilters 
        selectedCategory={selectedCategory}
        onCategorySelect={handleCategorySelect}
      />

      {/* Top Rated Sellers Section - Benefits moved to hero */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-y border-blue-100 py-12 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Old benefit cards removed - now in hero section */}
          <div className="hidden">
            <div className="bg-white rounded-lg p-6 text-center shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Verified Users</h3>
              <p className="text-sm text-gray-600">Phone, email, and ID verification required</p>
            </div>

            <div className="bg-white rounded-lg p-6 text-center shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Reputation System</h3>
              <p className="text-sm text-gray-600">eBay-style ratings track seller reliability</p>
            </div>

            <div className="bg-white rounded-lg p-6 text-center shadow-sm">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Anti-Fraud Detection</h3>
              <p className="text-sm text-gray-600">AI monitors for suspicious patterns and scams</p>
            </div>

            <div className="bg-white rounded-lg p-6 text-center shadow-sm">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Transaction History</h3>
              <p className="text-sm text-gray-600">See every user's complete track record</p>
            </div>

            <div className="bg-white rounded-lg p-6 text-center shadow-sm border-2 border-blue-200">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Secure Payments</h3>
              <p className="text-sm text-gray-600">No cash needed - pay safely online</p>
            </div>

            <div className="bg-white rounded-lg p-6 text-center shadow-sm border-2 border-blue-200">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Escrow Protection</h3>
              <p className="text-sm text-gray-600">Funds held until you confirm receipt</p>
            </div>
          </div>

          {/* Payment Feature Highlight */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-8 text-white text-center">
            <h3 className="text-2xl font-bold mb-3">Safe Electronic Payments - No Cash Required</h3>
            <p className="text-lg mb-4 opacity-90">
              Pay securely with your credit card. Your money is held safely until you confirm receipt of the item.
            </p>
            <div className="flex items-center justify-center gap-8 text-sm">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <span>Buyer Protection</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                <span>Seller Protection</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                <span>2.5% Fee</span>
              </div>
            </div>
          </div>
          </div>

          {/* Top Rated Sellers */}
          {topSellers.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">Top Rated Sellers This Month</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {topSellers.map((seller: any) => (
                  <div
                    key={seller.id}
                    onClick={() => navigate(`/profile/${seller.id}`)}
                    className="bg-white rounded-lg p-4 text-center cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-2 overflow-hidden">
                      {seller.profileImageUrl ? (
                        <img src={seller.profileImageUrl} alt={seller.firstName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 text-xl font-semibold">
                          {seller.firstName?.[0]}{seller.lastName?.[0]}
                        </div>
                      )}
                    </div>
                    <div className="font-medium text-sm text-gray-900 truncate">
                      {seller.firstName} {seller.lastName?.[0]}.
                    </div>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs text-gray-600">{seller.rating || '5.0'}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {seller.transactions || 0} sales
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Pending Deals Dashboard */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <PendingDeals />
      </div>
      
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
                onListingClick={(id) => navigate(`/listings/${id}`)}
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
