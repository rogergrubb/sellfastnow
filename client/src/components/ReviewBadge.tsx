import { Star } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

interface ReviewBadgeProps {
  userId: string;
  userName?: string;
  rating?: number | null;
  reviewCount?: number;
  showLink?: boolean;
  size?: "small" | "medium" | "large";
  variant?: "default" | "inline" | "compact";
  className?: string;
  onClick?: () => void;
}

export function ReviewBadge({
  userId,
  userName,
  rating,
  reviewCount = 0,
  showLink = true,
  size = "medium",
  variant = "default",
  className = "",
  onClick,
}: ReviewBadgeProps) {
  const displayRating = rating ? Number(rating).toFixed(1) : "New";
  const hasReviews = reviewCount > 0 && rating;

  const sizeClasses = {
    small: "text-xs gap-1",
    medium: "text-sm gap-1.5",
    large: "text-base gap-2",
  };

  const starSizes = {
    small: "h-3 w-3",
    medium: "h-4 w-4",
    large: "h-5 w-5",
  };

  const content = (
    <div 
      className={`flex items-center ${sizeClasses[size]} ${className}`}
      data-testid={`review-badge-${userId}`}
    >
      {variant === "compact" ? (
        <>
          <Star className={`${starSizes[size]} ${hasReviews ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
          <span className="font-medium">{displayRating}</span>
          {reviewCount > 0 && (
            <span className="text-muted-foreground">({reviewCount})</span>
          )}
        </>
      ) : variant === "inline" ? (
        <>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`${starSizes[size]} ${
                  hasReviews && star <= Math.round(Number(rating))
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-muted-foreground'
                }`}
              />
            ))}
          </div>
          <span className="font-medium">{displayRating}/5.0</span>
          {reviewCount > 0 && (
            <span className="text-muted-foreground">({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})</span>
          )}
        </>
      ) : (
        // default variant
        <>
          <Star className={`${starSizes[size]} ${hasReviews ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
          <span className="font-medium">{displayRating}</span>
          {reviewCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
            </Badge>
          )}
        </>
      )}
    </div>
  );

  if (!showLink || reviewCount === 0) {
    return content;
  }

  return (
    <Link
      href={`/users/${userId}#reviews`}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      aria-label={userName ? `View ${userName}'s ${reviewCount} reviews` : `View ${reviewCount} reviews`}
      data-testid={`link-reviews-${userId}`}
    >
      <div className="hover-elevate active-elevate-2 rounded-md px-2 py-1 -mx-2 -my-1 transition-colors">
        {content}
      </div>
    </Link>
  );
}
