/**
 * Geocoding utility to convert location strings to coordinates
 * Uses OpenStreetMap Nominatim API (free, no API key required)
 */

interface GeocodeResult {
  latitude: number;
  longitude: number;
  city?: string;
  region?: string;
  country?: string;
  postalCode?: string;
}

export async function geocodeLocation(locationString: string): Promise<GeocodeResult | null> {
  try {
    // Clean up the location string
    const cleanLocation = locationString.trim();
    
    if (!cleanLocation) {
      return null;
    }

    // Use Nominatim API (OpenStreetMap's free geocoding service)
    // Prioritize US results with countrycodes parameter
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanLocation)}&format=json&limit=1&addressdetails=1&countrycodes=us`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SellFast.Now Marketplace App', // Required by Nominatim
      },
    });

    if (!response.ok) {
      console.error('Geocoding API error:', response.status);
      return null;
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      console.log(`No geocoding results for: ${cleanLocation}`);
      return null;
    }

    const result = data[0];
    const address = result.address || {};

    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      city: address.city || address.town || address.village || address.municipality,
      region: address.state || address.province || address.region,
      country: address.country,
      postalCode: address.postcode,
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Batch geocode multiple locations with rate limiting
 * Nominatim allows 1 request per second
 */
export async function geocodeLocations(locations: string[]): Promise<Map<string, GeocodeResult>> {
  const results = new Map<string, GeocodeResult>();
  
  for (const location of locations) {
    const result = await geocodeLocation(location);
    if (result) {
      results.set(location, result);
    }
    // Rate limit: 1 request per second
    await new Promise(resolve => setTimeout(resolve, 1100));
  }
  
  return results;
}

