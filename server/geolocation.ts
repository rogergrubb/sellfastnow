/**
 * IP Geolocation Service
 * Auto-detects user location based on IP address
 * Uses ipapi.co free tier (no API key required for basic usage)
 */

export interface GeolocationResult {
  city: string | null;
  region: string | null;
  country: string | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
}

/**
 * Detect location from IP address using ipapi.co
 * Free tier: 1,000 requests/day, no API key required
 * 
 * @param ipAddress - IP address to geolocate (optional, uses request IP if not provided)
 * @returns GeolocationResult with location data
 */
export async function detectLocationFromIP(ipAddress?: string): Promise<GeolocationResult> {
  try {
    // Use ipapi.co free API
    const url = ipAddress 
      ? `https://ipapi.co/${ipAddress}/json/`
      : 'https://ipapi.co/json/';
    
    console.log(`🌍 Detecting location from IP: ${ipAddress || 'auto'}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SellFast.Now/1.0'
      }
    });

    if (!response.ok) {
      console.error(`❌ IP geolocation API error: ${response.status}`);
      return createEmptyResult();
    }

    const data = await response.json();
    
    // Check for API errors
    if (data.error) {
      console.error(`❌ IP geolocation error: ${data.reason}`);
      return createEmptyResult();
    }

    const result: GeolocationResult = {
      city: data.city || null,
      region: data.region || null,
      country: data.country_name || null,
      postalCode: data.postal || null,
      latitude: data.latitude ? parseFloat(data.latitude) : null,
      longitude: data.longitude ? parseFloat(data.longitude) : null,
      timezone: data.timezone || null,
    };

    console.log(`✅ Location detected: ${result.city}, ${result.region}, ${result.country}`);
    return result;

  } catch (error) {
    console.error('❌ Error detecting location from IP:', error);
    return createEmptyResult();
  }
}

/**
 * Alternative: Detect location using ip-api.com (backup service)
 * Free tier: 45 requests/minute, no API key required
 */
export async function detectLocationFromIPBackup(ipAddress?: string): Promise<GeolocationResult> {
  try {
    const url = ipAddress
      ? `http://ip-api.com/json/${ipAddress}`
      : 'http://ip-api.com/json/';
    
    console.log(`🌍 [Backup] Detecting location from IP: ${ipAddress || 'auto'}`);
    
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`❌ Backup IP geolocation API error: ${response.status}`);
      return createEmptyResult();
    }

    const data = await response.json();
    
    if (data.status !== 'success') {
      console.error(`❌ Backup IP geolocation failed: ${data.message}`);
      return createEmptyResult();
    }

    const result: GeolocationResult = {
      city: data.city || null,
      region: data.regionName || null,
      country: data.country || null,
      postalCode: data.zip || null,
      latitude: data.lat || null,
      longitude: data.lon || null,
      timezone: data.timezone || null,
    };

    console.log(`✅ [Backup] Location detected: ${result.city}, ${result.region}, ${result.country}`);
    return result;

  } catch (error) {
    console.error('❌ Error with backup IP geolocation:', error);
    return createEmptyResult();
  }
}

/**
 * Get client IP from request headers
 * Handles various proxy headers
 */
export function getClientIP(req: any): string | undefined {
  // Check various headers for the real client IP
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim();
  }

  return (
    req.headers['x-real-ip'] ||
    req.headers['cf-connecting-ip'] || // Cloudflare
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    undefined
  );
}

/**
 * Helper to create empty result
 */
function createEmptyResult(): GeolocationResult {
  return {
    city: null,
    region: null,
    country: null,
    postalCode: null,
    latitude: null,
    longitude: null,
    timezone: null,
  };
}

/**
 * Detect location with automatic fallback
 * Tries primary service first, falls back to backup if it fails
 */
export async function detectLocationWithFallback(ipAddress?: string): Promise<GeolocationResult> {
  // Try primary service
  let result = await detectLocationFromIP(ipAddress);
  
  // If primary fails, try backup
  if (!result.city && !result.country) {
    console.log('⚠️ Primary geolocation failed, trying backup service...');
    result = await detectLocationFromIPBackup(ipAddress);
  }
  
  return result;
}

