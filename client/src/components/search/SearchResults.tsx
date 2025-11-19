import { Package } from 'lucide-react';
import ListingCard from '../ListingCard';

interface Seller {
  id: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  emailVerified: boolean | null;
  phoneVerified: boolean | null;
  idVerified: boolean | null;
  addressVerified: boolean | null;
}

interface SellerStats {
  averageRating: string | null;
  totalReviews: number;
  successRate: string | null;
}

interface Listing {
  id: string;
  title: string;
  price: number;
  description: string;
  category: string;
  condition: string;
  location: string;
  distance: number;
  images?: string[];
  createdAt: string;
  seller?: Seller;
  sellerStats?: SellerStats | null;
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
      {listings.map((listing) => {
        // Calculate time posted
        const createdDate = new Date(listing.createdAt);
        const now = new Date();
        const diffMs = now.getTime() - createdDate.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        let timePosted: string;
        if (diffMins < 60) {
          timePosted = `${diffMins}m ago`;
        } else if (diffHours < 24) {
          timePosted = `${diffHours}h ago`;
        } else {
          timePosted = `${diffDays}d ago`;
        }

        return (
          <ListingCard
            key={listing.id}
            id={listing.id}
            title={listing.title}
            price={listing.price}
            location={listing.location}
            timePosted={timePosted}
            image={listing.images && listing.images.length > 0 ? listing.images[0] : undefined}
            condition={listing.condition}
            seller={listing.seller}
            sellerStats={listing.sellerStats}
            distance={listing.distance}
          />
        );
      })}
    </div>
  );
}
