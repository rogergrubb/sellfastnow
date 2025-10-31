import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapPin, List, Map, Search, SlidersHorizontal } from 'lucide-react';
import SearchFilters from '../components/search/SearchFilters';
import SearchResults from '../components/search/SearchResults';
import SearchMap from '../components/search/SearchMap';
import LocationInput from '../components/search/LocationInput';
import { useSearchListings } from '../hooks/useSearchListings';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [showFilters, setShowFilters] = useState(false);

  // Search state
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);
  const [radius, setRadius] = useState(25); // km
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [sortBy, setSortBy] = useState<'distance' | 'price' | 'date'>('distance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Initialize from URL params
  useEffect(() => {
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const address = searchParams.get('address');
    
    if (lat && lng) {
      setLocation({
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        address: address || 'Selected Location'
      });
    }

    const radiusParam = searchParams.get('radius');
    if (radiusParam) setRadius(parseInt(radiusParam));

    const queryParam = searchParams.get('query');
    if (queryParam) setQuery(queryParam);

    const categoryParam = searchParams.get('category');
    if (categoryParam) setCategory(categoryParam);

    const minPriceParam = searchParams.get('minPrice');
    if (minPriceParam) setMinPrice(parseInt(minPriceParam));

    const maxPriceParam = searchParams.get('maxPrice');
    if (maxPriceParam) setMaxPrice(parseInt(maxPriceParam));

    const sortByParam = searchParams.get('sortBy') as 'distance' | 'price' | 'date';
    if (sortByParam) setSortBy(sortByParam);

    const sortOrderParam = searchParams.get('order') as 'asc' | 'desc';
    if (sortOrderParam) setSortOrder(sortOrderParam);
  }, [searchParams]);

  // Fetch search results
  const { data: listings, isLoading, error } = useSearchListings({
    lat: location?.lat,
    lng: location?.lng,
    radius,
    query,
    category,
    minPrice,
    maxPrice,
    sortBy,
    order: sortOrder,
  });

  // Update URL when search params change
  const updateSearchParams = () => {
    const params = new URLSearchParams();
    
    if (location) {
      params.set('lat', location.lat.toString());
      params.set('lng', location.lng.toString());
      params.set('address', location.address);
    }
    
    params.set('radius', radius.toString());
    if (query) params.set('query', query);
    if (category) params.set('category', category);
    if (minPrice) params.set('minPrice', minPrice.toString());
    if (maxPrice) params.set('maxPrice', maxPrice.toString());
    params.set('sortBy', sortBy);
    params.set('order', sortOrder);

    setSearchParams(params);
  };

  // Request user's current location
  const handleUseMyLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Reverse geocode to get address
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            
            setLocation({
              lat: latitude,
              lng: longitude,
              address: data.display_name || 'Current Location'
            });
          } catch (error) {
            setLocation({
              lat: latitude,
              lng: longitude,
              address: 'Current Location'
            });
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your location. Please enter a location manually.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Location Search */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <LocationInput
                value={location}
                onChange={setLocation}
                onUseCurrentLocation={handleUseMyLocation}
              />
            </div>
            
            {/* Radius Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Within</span>
              <select
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value))}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value={5}>5 km</option>
                <option value={10}>10 km</option>
                <option value={25}>25 km</option>
                <option value={50}>50 km</option>
                <option value={100}>100 km</option>
              </select>
            </div>

            {/* Search Button */}
            <button
              onClick={updateSearchParams}
              disabled={!location}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
          </div>

          {/* Search Bar and Controls */}
          <div className="flex items-center gap-4">
            {/* Keyword Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && updateSearchParams()}
                placeholder="Search for items..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filters Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </button>

            {/* View Mode Toggle */}
            <div className="flex border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 flex items-center gap-2 ${
                  viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-50'
                }`}
              >
                <List className="w-4 h-4" />
                List
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-4 py-2 flex items-center gap-2 ${
                  viewMode === 'map' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-50'
                }`}
              >
                <Map className="w-4 h-4" />
                Map
              </button>
            </div>
          </div>

          {/* Active Location Display */}
          {location && (
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>Searching near: {location.address}</span>
              <button
                onClick={() => setLocation(null)}
                className="text-blue-600 hover:underline"
              >
                Change
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <SearchFilters
              category={category}
              setCategory={setCategory}
              minPrice={minPrice}
              setMinPrice={setMinPrice}
              maxPrice={maxPrice}
              setMaxPrice={setMaxPrice}
              sortBy={sortBy}
              setSortBy={setSortBy}
              sortOrder={sortOrder}
              setSortOrder={setSortOrder}
              onApply={updateSearchParams}
              onReset={() => {
                setCategory('');
                setMinPrice(undefined);
                setMaxPrice(undefined);
                setSortBy('distance');
                setSortOrder('asc');
              }}
            />
          </div>
        </div>
      )}

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {!location ? (
          <div className="text-center py-20">
            <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">
              Find items near you
            </h2>
            <p className="text-gray-500 mb-6">
              Enter a location or use your current location to start searching
            </p>
            <button
              onClick={handleUseMyLocation}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
            >
              <MapPin className="w-5 h-5" />
              Use My Location
            </button>
          </div>
        ) : isLoading ? (
          <div className="text-center py-20">
            <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600">Searching for listings...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-600">Error loading results. Please try again.</p>
          </div>
        ) : (
          <>
            {/* Results Count */}
            <div className="mb-4 text-sm text-gray-600">
              Found {listings?.length || 0} listings within {radius}km
            </div>

            {/* List or Map View */}
            {viewMode === 'list' ? (
              <SearchResults listings={listings || []} />
            ) : (
              <SearchMap
                listings={listings || []}
                center={location}
                radius={radius}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

