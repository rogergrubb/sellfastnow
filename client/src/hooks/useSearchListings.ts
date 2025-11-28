import { useQuery } from '@tanstack/react-query';

interface SearchParams {
  lat?: number;
  lng?: number;
  radius?: number;
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'distance' | 'price' | 'date';
  order?: 'asc' | 'desc';
}

interface Listing {
  id: string;
  title: string;
  price: number;
  description: string;
  category: string;
  distance: number;
  location_latitude?: number;
  location_longitude?: number;
  images?: string[];
}

async function searchListings(params: SearchParams): Promise<Listing[]> {
  // Don't search if no location is provided
  if (!params.lat || !params.lng) {
    return [];
  }

  const queryParams = new URLSearchParams();
  
  queryParams.set('lat', params.lat.toString());
  queryParams.set('lng', params.lng.toString());
  
  if (params.radius) queryParams.set('radius', params.radius.toString());
  if (params.query) queryParams.set('query', params.query);
  if (params.category) queryParams.set('category', params.category);
  if (params.minPrice) queryParams.set('minPrice', params.minPrice.toString());
  if (params.maxPrice) queryParams.set('maxPrice', params.maxPrice.toString());
  if (params.sortBy) queryParams.set('sortBy', params.sortBy);
  if (params.order) queryParams.set('order', params.order);

  try {
    const response = await fetch(`/api/listings/search?${queryParams.toString()}`);
    
    // Public endpoint - should never return 401, but handle gracefully
    if (response.status === 401) {
      console.warn('Unauthorized access to search endpoint');
      return [];
    }
    
    if (!response.ok) {
      throw new Error(`Failed to search listings: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error searching listings:', error);
    return [];
  }
}

export function useSearchListings(params: SearchParams) {
  return useQuery({
    queryKey: ['search-listings', params],
    queryFn: () => searchListings(params),
    enabled: !!params.lat && !!params.lng, // Only run query if location is set
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 1, // Retry once on failure
    onError: (error) => {
      console.error('Search listings error:', error);
    },
  });
}

