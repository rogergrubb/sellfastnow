import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './SearchMap.css';
import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';

// Fix for default marker icons in React Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface Listing {
  id: string;
  title: string;
  price: number;
  description: string;
  category: string;
  distance: number;
  location_latitude?: number;
  location_longitude?: number;
  imageUrl?: string;
}

interface SearchMapProps {
  listings: Listing[];
  center: { lat: number; lng: number };
  radius: number; // in km
}

// Component to update map view when center changes
function MapUpdater({ center, radius }: { center: { lat: number; lng: number }; radius: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView([center.lat, center.lng], getZoomLevel(radius));
  }, [center, radius, map]);

  return null;
}

// Calculate appropriate zoom level based on radius
function getZoomLevel(radiusKm: number): number {
  if (radiusKm <= 5) return 13;
  if (radiusKm <= 10) return 12;
  if (radiusKm <= 25) return 11;
  if (radiusKm <= 50) return 10;
  if (radiusKm <= 100) return 9;
  return 8;
}

export default function SearchMap({ listings, center, radius }: SearchMapProps) {
  const mapRef = useRef<L.Map>(null);

  // Filter listings that have valid coordinates
  const validListings = listings.filter(
    (listing) => listing.location_latitude && listing.location_longitude
  );

  return (
    <div className="relative w-full h-[calc(100vh-300px)] min-h-[500px] rounded-lg overflow-hidden border">
      <MapContainer
        ref={mapRef}
        center={[center.lat, center.lng]}
        zoom={getZoomLevel(radius)}
        className="w-full h-full"
        scrollWheelZoom={true}
      >
        <MapUpdater center={center} radius={radius} />
        
        {/* Base Map Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Search Radius Circle */}
        <Circle
          center={[center.lat, center.lng]}
          radius={radius * 1000} // Convert km to meters
          pathOptions={{
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.1,
            weight: 2,
          }}
        />

        {/* Center Marker */}
        <Marker position={[center.lat, center.lng]}>
          <Popup>
            <div className="text-center">
              <p className="font-semibold">Search Center</p>
              <p className="text-xs text-gray-600">Your location</p>
            </div>
          </Popup>
        </Marker>

        {/* Listing Markers with Clustering */}
        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={50}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
        >
          {validListings.map((listing) => (
            <Marker
              key={listing.id}
              position={[listing.location_latitude!, listing.location_longitude!]}
            >
              <Popup maxWidth={300}>
                <div className="p-2">
                  {/* Image */}
                  {listing.imageUrl ? (
                    <img
                      src={listing.imageUrl}
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
                    {listing.distance < 1 
                      ? `${(listing.distance * 1000).toFixed(0)}m away`
                      : `${listing.distance.toFixed(1)}km away`
                    }
                  </p>

                  {/* View Button */}
                  <Link
                    to={`/listing/${listing.id}`}
                    className="block w-full text-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                  >
                    View Details
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      {/* Map Legend */}
      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 z-[1000]">
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-600" />
            <span>Your location</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-600" />
            <span>Listings</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-blue-600 rounded-full" />
            <span>Search radius ({radius}km)</span>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg px-4 py-2 z-[1000]">
        <p className="text-sm font-medium">
          {validListings.length} {validListings.length === 1 ? 'listing' : 'listings'} on map
        </p>
      </div>
    </div>
  );
}

