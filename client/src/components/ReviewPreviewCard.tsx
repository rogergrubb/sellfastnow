import { Star } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Review {
  id: string;
  reviewerName: string;
  overallRating: number;
  reviewText: string;
  reviewTitle?: string;
  createdAt: Date;
}

interface ReviewPreviewCardProps {
  userId: string;
  userName: string;
  reviews: Review[];
  totalReviews: number;
  averageRating?: number | null;
}

export function ReviewPreviewCard({
  userId,
  userName,
  reviews,
  totalReviews,
  averageRating,
}: ReviewPreviewCardProps) {
  const displayReviews = reviews.slice(0, 3);

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - new Date(date).getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  };

  if (displayReviews.length === 0) {
    return (
      <Card data-testid="card-review-preview-empty">
        <CardHeader>
          <CardTitle>Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No reviews yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-review-preview">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>What people are saying</span>
          {averageRating && (
            <div className="flex items-center gap-2 text-base font-normal">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{Number(averageRating).toFixed(1)}</span>
              <span className="text-muted-foreground">/5.0</span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {displayReviews.map((review) => (
          <div key={review.id} className="border-b last:border-0 pb-4 last:pb-0" data-testid={`review-preview-${review.id}`}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= review.overallRating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">{getTimeAgo(review.createdAt)}</span>
            </div>
            {review.reviewTitle && (
              <p className="font-semibold text-sm mb-1">{review.reviewTitle}</p>
            )}
            <p className="text-sm text-muted-foreground line-clamp-2">{review.reviewText}</p>
            <p className="text-xs text-muted-foreground mt-1">- {review.reviewerName}</p>
          </div>
        ))}

        {totalReviews > 3 && (
          <Link href={`/users/${userId}#reviews`}>
            <Button variant="outline" className="w-full" data-testid="button-view-all-reviews">
              Read All {totalReviews} Reviews →
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
