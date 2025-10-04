import { Heart, MapPin, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Link } from "wouter";
import { ReviewBadge } from "./ReviewBadge";

interface ListingCardProps {
  id: string;
  image?: string;
  title: string;
  price: number;
  location: string;
  timePosted: string;
  isFavorite?: boolean;
  seller?: {
    id: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
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
  seller,
  sellerStats,
}: ListingCardProps) {
  const [favorite, setFavorite] = useState(isFavorite);
  
  const sellerName = seller 
    ? `${seller.firstName || ''} ${seller.lastName || ''}`.trim() || 'Unknown Seller'
    : 'Unknown Seller';

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
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm hover:bg-white"
          onClick={(e) => {
            e.stopPropagation();
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
        
        {seller && (
          <div className="mb-3 pb-3 border-b">
            <p className="text-sm text-muted-foreground mb-1">Seller: {sellerName}</p>
            <ReviewBadge
              userId={seller.id}
              userName={sellerName}
              rating={sellerStats?.averageRating}
              reviewCount={sellerStats?.totalReviews || 0}
              showLink={false}
              size="small"
              variant="compact"
            />
            {sellerStats?.successRate !== undefined && sellerStats.successRate !== null && (
              <p className="text-xs text-muted-foreground mt-1">
                {Number(sellerStats.successRate).toFixed(0)}% success rate
              </p>
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
