import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './SearchMap.css';
import { Link } from 'wouter';
import { Package, Minus, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Fix for default marker icons in React Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  iconRetinaUrl: iconRetina,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom listing marker icon
const ListingIcon = L.divIcon({
  className: 'custom-listing-marker',
  html: `<div style="background-color: #dc2626; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

interface Listing {
  id: string;
  title: string;
  price: number;
  description: string;
  category: string;
  distance: number;
  locationLatitude?: string | number;
  locationLongitude?: string | number;
  location_latitude?: number;
  location_longitude?: number;
  images?: string[];
}

interface SearchMapProps {
  listings: Listing[];
  center: { lat: number; lng: number };
  radius: number; // in km
  onRadiusChange?: (newRadius: number) => void;
}

// Convert miles to km and vice versa
const milesToKm = (miles: number) => miles * 1.60934;
const kmToMiles = (km: number) => km / 1.60934;

// Component to update map view when center changes
function MapUpdater({ center, radius }: { center: { lat: number; lng: number }; radius: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView([center.lat, center.lng], getZoomLevel(radius));
  }, [center, radius, map]);

  return null;
}

// Calculate appropriate zoom level based on radius (in km)
function getZoomLevel(radiusKm: number): number {
  if (radiusKm <= 3) return 14;
  if (radiusKm <= 5) return 13;
  if (radiusKm <= 10) return 12;
  if (radiusKm <= 25) return 11;
  if (radiusKm <= 50) return 10;
  if (radiusKm <= 100) return 9;
  return 8;
}

// Draggable radius handle component
function DraggableRadiusHandle({ 
  center, 
  radius, 
  onRadiusChange 
}: { 
  center: { lat: number; lng: number }; 
  radius: number; 
  onRadiusChange: (newRadius: number) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  
  // Calculate handle position (east of center)
  const handlePosition = useCallback(() => {
    const earthRadius = 6371; // km
    const lat = center.lat * Math.PI / 180;
    const handleLat = center.lat;
    const handleLng = center.lng + (radius / (earthRadius * Math.cos(lat))) * (180 / Math.PI);
    
    return L.latLng(handleLat, handleLng);
  }, [center, radius]);

  useMapEvents({
    mousemove: (e) => {
      if (isDragging) {
        const centerLatLng = L.latLng(center.lat, center.lng);
        const newRadius = centerLatLng.distanceTo(e.latlng) / 1000; // Convert to km
        // Clamp between 1km and 200km
        const clampedRadius = Math.max(1, Math.min(320, newRadius));
        onRadiusChange(clampedRadius);
      }
    },
    mouseup: () => {
      setIsDragging(false);
    },
  });

  const handleIcon = L.divIcon({
    className: 'radius-handle',
    html: `<div style="
      background-color: #3b82f6; 
      width: 20px; 
      height: 20px; 
      border-radius: 50%; 
      border: 3px solid white; 
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
      cursor: ew-resize;
      display: flex;
      align-items: center;
      justify-content: center;
    "><span style="color: white; font-size: 10px;">↔</span></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  return (
    <Marker
      position={handlePosition()}
      icon={handleIcon}
      draggable={true}
      eventHandlers={{
        dragstart: () => setIsDragging(true),
        drag: (e) => {
          const marker = e.target;
          const newPos = marker.getLatLng();
          const centerLatLng = L.latLng(center.lat, center.lng);
          const newRadius = centerLatLng.distanceTo(newPos) / 1000;
          const clampedRadius = Math.max(1, Math.min(320, newRadius));
          onRadiusChange(clampedRadius);
        },
        dragend: () => setIsDragging(false),
      }}
    >
      <Popup>
        <div className="text-xs text-center">
          <strong>Drag to adjust radius</strong>
          <br />
          Current: {kmToMiles(radius).toFixed(1)} miles
        </div>
      </Popup>
    </Marker>
  );
}

export default function SearchMap({ listings, center, radius, onRadiusChange }: SearchMapProps) {
  const [localRadius, setLocalRadius] = useState(radius);
  const [manualMiles, setManualMiles] = useState(kmToMiles(radius).toFixed(1));
  
  // Sync with prop changes
  useEffect(() => {
    setLocalRadius(radius);
    setManualMiles(kmToMiles(radius).toFixed(1));
  }, [radius]);

  // Handle radius change from dragging
  const handleRadiusChange = (newRadius: number) => {
    setLocalRadius(newRadius);
    setManualMiles(kmToMiles(newRadius).toFixed(1));
    onRadiusChange?.(newRadius);
  };

  // Handle manual miles input
  const handleManualMilesChange = (value: string) => {
    setManualMiles(value);
    const miles = parseFloat(value);
    if (!isNaN(miles) && miles > 0) {
      const km = milesToKm(miles);
      setLocalRadius(km);
      onRadiusChange?.(km);
    }
  };

  // Quick radius presets in miles
  const radiusPresets = [5, 10, 25, 50, 100];

  // Filter listings that have valid coordinates
  const validListings = listings.filter((listing) => {
    const lat = listing.locationLatitude || listing.location_latitude;
    const lng = listing.locationLongitude || listing.location_longitude;
    return lat && lng;
  });

  return (
    <div className="relative w-full h-[calc(100vh-300px)] min-h-[500px] rounded-lg overflow-hidden border">
      {/* Radius Control Panel */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 z-[1000] min-w-[220px]">
        <h3 className="text-sm font-semibold mb-3">🎯 Search Radius</h3>
        
        {/* Manual Input */}
        <div className="flex items-center gap-2 mb-3">
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            onClick={() => {
              const currentMiles = parseFloat(manualMiles);
              if (currentMiles > 1) {
                handleManualMilesChange((currentMiles - 1).toString());
              }
            }}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Input
            id="manual-radius-miles"
            name="manualRadiusMiles"
            type="number"
            value={manualMiles}
            onChange={(e) => handleManualMilesChange(e.target.value)}
            className="h-8 w-20 text-center"
            min="1"
            max="200"
          />
          <span className="text-sm text-gray-600 font-medium">miles</span>
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            onClick={() => {
              const currentMiles = parseFloat(manualMiles);
              if (currentMiles < 200) {
                handleManualMilesChange((currentMiles + 1).toString());
              }
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap gap-1 mb-3">
          {radiusPresets.map((miles) => (
            <button
              key={miles}
              onClick={() => handleManualMilesChange(miles.toString())}
              className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                Math.abs(kmToMiles(localRadius) - miles) < 0.5
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {miles} mi
            </button>
          ))}
        </div>

        {/* Drag instruction */}
        <p className="text-xs text-gray-500 border-t pt-2">
          💡 Tip: Drag the blue handle on the circle edge to adjust radius
        </p>
      </div>

      <MapContainer
        center={[center.lat, center.lng]}
        zoom={getZoomLevel(localRadius)}
        className="w-full h-full"
        scrollWheelZoom={true}
      >
        <MapUpdater center={center} radius={localRadius} />
        
        {/* Base Map Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          subdomains={['a', 'b', 'c']}
        />

        {/* Search Radius Circle */}
        <Circle
          center={[center.lat, center.lng]}
          radius={localRadius * 1000} // Convert km to meters
          pathOptions={{
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.1,
            weight: 2,
            dashArray: '8, 8',
          }}
        />

        {/* Draggable Radius Handle */}
        <DraggableRadiusHandle
          center={center}
          radius={localRadius}
          onRadiusChange={handleRadiusChange}
        />

        {/* Center Marker */}
        <Marker position={[center.lat, center.lng]}>
          <Popup>
            <div className="text-center">
              <p className="font-semibold">📍 Your Location</p>
              <p className="text-xs text-gray-600">Search center</p>
            </div>
          </Popup>
        </Marker>

        {/* Listing Markers */}
        {validListings.map((listing) => {
          const lat = Number(listing.locationLatitude || listing.location_latitude);
          const lng = Number(listing.locationLongitude || listing.location_longitude);
          
          return (
            <Marker
              key={listing.id}
              position={[lat, lng]}
              icon={ListingIcon}
            >
              <Popup maxWidth={300}>
                <div className="p-2 min-w-[200px]">
                  {/* Image */}
                  {listing.images && listing.images.length > 0 ? (
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="w-full h-32 object-cover rounded mb-2"
                    />
                  ) : (
                    <div className="w-full h-32 bg-gray-100 rounded mb-2 flex items-center justify-center">
                      <Package className="w-8 h-8 text-gray-300" />
                    </div>
                  )}

                  {/* Title */}
                  <h3 className="font-semibold text-base mb-1 line-clamp-2">
                    {listing.title}
                  </h3>

                  {/* Price */}
                  <p className="text-lg font-bold text-blue-600 mb-2">
                    ${listing.price.toLocaleString()}
                  </p>

                  {/* Distance */}
                  <p className="text-xs text-gray-600 mb-3">
                    📍 {(listing.distance * 0.621371).toFixed(1)} miles away
                  </p>

                  {/* View Button */}
                  <Link
                    href={`/listings/${listing.id}`}
                    className="block w-full text-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                  >
                    View Details
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 z-[1000]">
        <div className="text-xs space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow" />
            <span>Your location</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-600 border-2 border-white shadow" />
            <span>Listings ({validListings.length})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-600 border-dashed rounded-full" />
            <span className="font-medium">{kmToMiles(localRadius).toFixed(1)} mi radius</span>
          </div>
        </div>
      </div>
    </div>
  );
}
