/**
 * ETA Calculation Service
 * Uses Google Maps Distance Matrix API for accurate travel time estimates
 * Falls back to Haversine formula if API is unavailable
 */

interface ETAResult {
  distance: number; // in kilometers
  duration: number; // in minutes
  durationInTraffic?: number; // in minutes (if traffic data available)
  estimatedArrivalTime: Date;
}

/**
 * Calculate ETA using Google Maps Distance Matrix API
 */
export async function calculateETA(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): Promise<ETAResult> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  // If Google Maps API key is available, use it for accurate ETA
  if (apiKey) {
    try {
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originLat},${originLng}&destinations=${destLat},${destLng}&departure_time=now&traffic_model=best_guess&key=${apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === "OK" && data.rows[0]?.elements[0]?.status === "OK") {
        const element = data.rows[0].elements[0];
        const distanceKm = element.distance.value / 1000; // Convert meters to km
        const durationMinutes = Math.ceil(element.duration.value / 60); // Convert seconds to minutes
        const durationInTrafficMinutes = element.duration_in_traffic 
          ? Math.ceil(element.duration_in_traffic.value / 60)
          : durationMinutes;
        
        const eta = new Date();
        eta.setMinutes(eta.getMinutes() + durationInTrafficMinutes);
        
        return {
          distance: parseFloat(distanceKm.toFixed(2)),
          duration: durationMinutes,
          durationInTraffic: durationInTrafficMinutes,
          estimatedArrivalTime: eta,
        };
      }
    } catch (error) {
      console.error("Google Maps API error, falling back to Haversine:", error);
    }
  }
  
  // Fallback: Use Haversine formula for straight-line distance
  return calculateETAHaversine(originLat, originLng, destLat, destLng);
}

/**
 * Fallback ETA calculation using Haversine formula
 * Assumes average city driving speed of 40 km/h
 */
function calculateETAHaversine(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): ETAResult {
  const R = 6371; // Earth's radius in km
  const dLat = (destLat - originLat) * Math.PI / 180;
  const dLon = (destLng - originLng) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(originLat * Math.PI / 180) * Math.cos(destLat * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in km
  
  // Estimate time assuming average speed of 40 km/h in city traffic
  // Add 20% buffer for stops, turns, etc.
  const estimatedMinutes = Math.ceil((distance / 40) * 60 * 1.2);
  
  const eta = new Date();
  eta.setMinutes(eta.getMinutes() + estimatedMinutes);
  
  return {
    distance: parseFloat(distance.toFixed(2)),
    duration: estimatedMinutes,
    estimatedArrivalTime: eta,
  };
}

/**
 * Format ETA for display
 */
export function formatETA(minutes: number): string {
  if (minutes < 1) {
    return "Less than 1 minute";
  } else if (minutes === 1) {
    return "1 minute";
  } else if (minutes < 60) {
    return `${minutes} minutes`;
  } else {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    return `${hours} hour${hours > 1 ? 's' : ''} ${mins} minute${mins > 1 ? 's' : ''}`;
  }
}

