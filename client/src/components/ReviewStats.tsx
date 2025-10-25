// Review Stats Component - Display reputation summary
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Star } from "lucide-react";

interface ReviewStatsProps {
  userId: string;
}

export function ReviewStats({ userId }: ReviewStatsProps) {
  const { data: stats, isLoading } = useQuery({
    queryKey: [`/api/reviews/stats/${userId}`],
    queryFn: async () => {
      const response = await fetch(`/api/reviews/stats/${userId}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch review stats");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Loading reputation...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (!stats || stats.totalReviewsReceived === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">No Reviews Yet</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This user hasn't received any reviews yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  const averageRating = parseFloat(stats.averageRating) || 0;
  const totalReviews = stats.totalReviewsReceived || 0;

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative">
            <Star className="h-5 w-5 fill-gray-200 text-gray-200" />
            <Star 
              className="h-5 w-5 fill-yellow-400 text-yellow-400 absolute top-0 left-0" 
              style={{ clipPath: "inset(0 50% 0 0)" }}
            />
          </div>
        );
      } else {
        stars.push(
          <Star key={i} className="h-5 w-5 fill-gray-200 text-gray-200" />
        );
      }
    }

    return stars;
  };

  const getRatingPercentage = (count: number) => {
    return totalReviews > 0 ? (count / totalReviews) * 100 : 0;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Reputation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Rating */}
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-4xl font-bold">{averageRating.toFixed(1)}</div>
            <div className="flex justify-center mt-1">
              {renderStars(averageRating)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
            </div>
          </div>

          {/* Rating Breakdown */}
          <div className="flex-1 space-y-2">
            {[
              { stars: 5, count: stats.fiveStarReviews || 0 },
              { stars: 4, count: stats.fourStarReviews || 0 },
              { stars: 3, count: stats.threeStarReviews || 0 },
              { stars: 2, count: stats.twoStarReviews || 0 },
              { stars: 1, count: stats.oneStarReviews || 0 },
            ].map(({ stars, count }) => (
              <div key={stars} className="flex items-center gap-2 text-sm">
                <span className="w-8 text-right">{stars}</span>
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <Progress
                  value={getRatingPercentage(count)}
                  className="flex-1 h-2"
                />
                <span className="w-12 text-muted-foreground">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Indicators */}
        {averageRating >= 4.5 && totalReviews >= 10 && (
          <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg">
            <p className="text-sm font-semibold text-green-700 dark:text-green-300">
              ⭐ Highly Rated Seller
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              This user has consistently received excellent reviews
            </p>
          </div>
        )}

        {averageRating >= 4.0 && totalReviews >= 5 && averageRating < 4.5 && (
          <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
              👍 Trusted Seller
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              This user has a good track record
            </p>
          </div>
        )}

        {totalReviews >= 50 && (
          <div className="bg-purple-50 dark:bg-purple-950 p-3 rounded-lg">
            <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">
              🏆 Experienced Seller
            </p>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
              This user has completed {totalReviews}+ transactions
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

