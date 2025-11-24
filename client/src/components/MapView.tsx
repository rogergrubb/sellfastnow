import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapView.css';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

// Fix for default marker icons in Leaflet using CDN URLs
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface Listing {
  id: string;
  title: string;
  price: string;
  images: string[];
  location: string;
  locationLatitude?: string;
  locationLongitude?: string;
  distance?: number;
}

interface MapViewProps {
  listings: Listing[];
  userLocation?: { latitude: number; longitude: number };
  onListingClick: (listingId: string) => void;
  onClose?: () => void;
}

export default function MapView({ listings, userLocation, onListingClick, onClose }: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Determine initial center and zoom
    let center: [number, number] = [37.7749, -122.4194]; // Default: San Francisco
    let zoom = 10;

    if (userLocation) {
      center = [userLocation.latitude, userLocation.longitude];
      zoom = 11;
    } else if (listings.length > 0) {
      // Find first listing with coordinates
      const firstListing = listings.find(l => l.locationLatitude && l.locationLongitude);
      if (firstListing && firstListing.locationLatitude && firstListing.locationLongitude) {
        center = [parseFloat(firstListing.locationLatitude), parseFloat(firstListing.locationLongitude)];
      }
    }

    // Initialize map
    const map = L.map(mapContainerRef.current).setView(center, zoom);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Add user location marker if available
    if (userLocation) {
      const userMarker = L.circleMarker([userLocation.latitude, userLocation.longitude], {
        radius: 8,
        fillColor: '#3b82f6',
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8,
      }).addTo(map);

      userMarker.bindPopup('<b>Your Location</b>');
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [userLocation]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add listing markers
    const validListings = listings.filter(
      listing => listing.locationLatitude && listing.locationLongitude
    );

    validListings.forEach(listing => {
      const lat = parseFloat(listing.locationLatitude!);
      const lon = parseFloat(listing.locationLongitude!);

      const marker = L.marker([lat, lon]).addTo(mapRef.current!);
      markersRef.current.push(marker);

      // Create popup content
      const imageUrl = listing.images[0] || '/placeholder.png';
      const price = parseFloat(listing.price).toFixed(0);
      const distanceText = listing.distance ? `${listing.distance.toFixed(1)} mi away` : '';

      const popupContent = `
        <div style="min-width: 200px;">
          <img src="${imageUrl}" alt="${listing.title}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 4px; margin-bottom: 8px;" />
          <h3 style="font-size: 14px; font-weight: 600; margin: 0 0 4px 0; line-height: 1.3;">${listing.title}</h3>
          <p style="font-size: 16px; font-weight: 700; color: #16a34a; margin: 0 0 4px 0;">$${price}</p>
          ${distanceText ? `<p style="font-size: 12px; color: #6b7280; margin: 0 0 8px 0;">${distanceText}</p>` : ''}
          <button 
            onclick="window.viewListing('${listing.id}')" 
            style="width: 100%; padding: 6px 12px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500;"
          >
            View Listing
          </button>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 250,
        className: 'listing-popup'
      });
    });

    // Fit bounds to show all markers
    if (validListings.length > 0) {
      const bounds = L.latLngBounds(
        validListings.map(l => [
          parseFloat(l.locationLatitude!),
          parseFloat(l.locationLongitude!)
        ])
      );
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }

    // Add global function for popup button clicks
    (window as any).viewListing = (id: string) => {
      onListingClick(id);
    };

    return () => {
      delete (window as any).viewListing;
    };
  }, [listings, onListingClick]);

  return (
    <Card className="relative overflow-hidden">
      {onClose && (
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-4 right-4 z-[1000] shadow-lg"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      <div 
        ref={mapContainerRef} 
        style={{ height: '600px', width: '100%' }}
        className="rounded-lg"
      />
      {listings.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <p className="text-muted-foreground">No listings with location data to display</p>
        </div>
      )}
    </Card>
  );
}

