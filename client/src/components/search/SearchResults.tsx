import { Link } from 'wouter';
import { MapPin, Package } from 'lucide-react';

interface Listing {
  id: string;
  title: string;
  price: number;
  description: string;
  category: string;
  distance: number;
  images?: string[];
}

interface SearchResultsProps {
  listings: Listing[];
}

export default function SearchResults({ listings }: SearchResultsProps) {
  if (listings.length === 0) {
    return (
      <div className="text-center py-20">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          No listings found
        </h3>
        <p className="text-gray-500">
          Try adjusting your search filters or expanding your search radius
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {listings.map((listing) => (
        <Link
          key={listing.id}
          to={`/listing/${listing.id}`}
          className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden border"
        >
          {/* Image */}
          <div className="aspect-video bg-gray-100 relative">
            {listing.images && listing.images.length > 0 ? (
              <img
                src={listing.images[0]}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-12 h-12 text-gray-300" />
              </div>
            )}
            
            {/* Distance Badge */}
            <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {listing.distance < 1 
                ? `${(listing.distance * 1000).toFixed(0)}m`
                : `${listing.distance.toFixed(1)}km`
              }
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <h3 className="font-semibold text-lg text-gray-900 mb-1 line-clamp-1">
              {listing.title}
            </h3>
            
            <p className="text-2xl font-bold text-blue-600 mb-2">
              ${listing.price.toLocaleString()}
            </p>

            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
              {listing.description}
            </p>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="capitalize">{listing.category}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

