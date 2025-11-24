import { Heart, MapPin, Clock, Zap, Star, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Link } from "wouter";
import { ReviewBadge } from "./ReviewBadge";
import { VerificationBadges } from "./VerificationBadge";

interface ListingCardProps {
  id: string;
  image?: string;
  title: string;
  price: number;
  location: string;
  timePosted: string;
  isFavorite?: boolean;
  isPromoted?: boolean;
  seller?: {
    id: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
    emailVerified?: boolean;
    phoneVerified?: boolean;
    idVerified?: boolean;
    addressVerified?: boolean;
  };
  sellerStats?: {
    averageRating?: number | null;
    totalReviews?: number;
    successRate?: number | null;
  };
}

export default function ListingCard({
  id,
  image,
  title,
  price,
  location,
  timePosted,
  isFavorite = false,
  isPromoted = false,
  seller,
  sellerStats,
}: ListingCardProps) {
  const [favorite, setFavorite] = useState(isFavorite);
  
  const sellerName = seller 
    ? `${seller.firstName || ''} ${seller.lastName || ''}`.trim() || 'Seller'
    : 'Seller';

  const hasReviews = sellerStats?.totalReviews && sellerStats.totalReviews > 0;
  const rating = sellerStats?.averageRating ? Number(sellerStats.averageRating) : 0;

  return (
    <Link href={`/listings/${id}`}>
      <Card className="overflow-hidden hover-elevate cursor-pointer group" data-testid={`card-listing-${id}`}>
        <div 
          className="relative aspect-[4/3] bg-muted overflow-hidden"
        >
        {image ? (
          <img 
            src={image} 
            alt={title} 
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            No image
          </div>
        )}
        {isPromoted && (
          <div className="absolute top-2 left-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
            <Zap className="h-3 w-3" />
            PROMOTED
          </div>
        )}
        
        {/* Seller Rating Badge - Top Right Corner (More Prominent) */}
        {seller && (
          <div 
            className="absolute bottom-2 left-2 right-2 bg-white/95 backdrop-blur-sm rounded-lg px-2 py-1.5 shadow-md"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.location.href = `/users/${seller.id}`;
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs font-medium text-gray-700 truncate">{sellerName}</span>
                <VerificationBadges user={seller} size="sm" showLabels={false} />
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {hasReviews ? (
                  <>
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-3 w-3 ${
                            star <= Math.round(rating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-semibold text-gray-800">{rating.toFixed(1)}</span>
                    <span className="text-xs text-gray-500">({sellerStats?.totalReviews})</span>
                  </>
                ) : (
                  <span className="text-xs text-gray-500 italic">New seller</span>
                )}
              </div>
            </div>
          </div>
        )}
        
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm hover:bg-white"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setFavorite(!favorite);
            console.log(`Favorite toggled for ${id}`);
          }}
          data-testid={`button-favorite-${id}`}
        >
          <Heart className={`h-4 w-4 ${favorite ? 'fill-red-500 text-red-500' : ''}`} />
        </Button>
      </div>

      <div className="p-4">
        <div className="text-2xl font-bold text-primary mb-2" data-testid={`text-price-${id}`}>
          ${price.toLocaleString()}
        </div>
        <h3 className="font-semibold text-base mb-3 line-clamp-2" data-testid={`text-title-${id}`}>
          {title}
        </h3>
        
        {/* View Seller Profile Link */}
        {seller && (
          <div 
            className="mb-3 flex items-center justify-between"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <Link 
              href={`/users/${seller.id}`}
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
            >
              View seller profile & reviews
              <ExternalLink className="h-3 w-3" />
            </Link>
            {sellerStats?.successRate !== undefined && sellerStats.successRate !== null && (
              <span className="text-xs text-green-600 font-medium">
                {Number(sellerStats.successRate).toFixed(0)}% success
              </span>
            )}
          </div>
        )}
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            <span>{location}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{timePosted}</span>
          </div>
        </div>
      </div>
    </Card>
    </Link>
  );
}
