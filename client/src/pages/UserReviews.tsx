// User Reviews Page - Display all reviews for a user
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useAuth } from "@/lib/AuthContext";
import { ReviewDisplay } from "@/components/ReviewDisplay";
import { ReviewStats } from "@/components/ReviewStats";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Star } from "lucide-react";

export default function UserReviews() {
  const { userId } = useParams();
  const { user } = useAuth();

  // Fetch all reviews for the user
  const { data: allReviews, isLoading: allLoading } = useQuery({
    queryKey: [`/api/reviews/user/${userId}`],
    queryFn: async () => {
      const response = await fetch(`/api/reviews/user/${userId}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch reviews");
      return response.json();
    },
    enabled: !!userId,
  });

  // Fetch reviews as buyer
  const { data: buyerReviews, isLoading: buyerLoading } = useQuery({
    queryKey: [`/api/reviews/user/${userId}`, "buyer"],
    queryFn: async () => {
      const response = await fetch(`/api/reviews/user/${userId}?role=buyer`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch buyer reviews");
      return response.json();
    },
    enabled: !!userId,
  });

  // Fetch reviews as seller
  const { data: sellerReviews, isLoading: sellerLoading } = useQuery({
    queryKey: [`/api/reviews/user/${userId}`, "seller"],
    queryFn: async () => {
      const response = await fetch(`/api/reviews/user/${userId}?role=seller`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch seller reviews");
      return response.json();
    },
    enabled: !!userId,
  });

  if (!userId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">User not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isOwnProfile = user?.id === userId;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-3">
          <Star className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Reviews</h1>
            <p className="text-muted-foreground">
              {isOwnProfile ? "Your reputation and feedback" : "User reputation and feedback"}
            </p>
          </div>
        </div>

        {/* Review Stats */}
        <ReviewStats userId={userId} />

        {/* Reviews Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">
              All Reviews ({allReviews?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="as-seller">
              As Seller ({sellerReviews?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="as-buyer">
              As Buyer ({buyerReviews?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            {allLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="py-6">
                      <Skeleton className="h-24 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : allReviews && allReviews.length > 0 ? (
              <div className="space-y-4">
                {allReviews.map((review: any) => (
                  <ReviewDisplay
                    key={review.id}
                    review={review}
                    showResponse={true}
                    allowResponse={isOwnProfile}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No reviews yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {isOwnProfile
                      ? "Complete transactions to receive reviews"
                      : "This user hasn't received any reviews yet"}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="as-seller" className="mt-6">
            {sellerLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="py-6">
                      <Skeleton className="h-24 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : sellerReviews && sellerReviews.length > 0 ? (
              <div className="space-y-4">
                {sellerReviews.map((review: any) => (
                  <ReviewDisplay
                    key={review.id}
                    review={review}
                    showResponse={true}
                    allowResponse={isOwnProfile}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No seller reviews yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {isOwnProfile
                      ? "Sell items to receive reviews as a seller"
                      : "This user hasn't received any reviews as a seller"}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="as-buyer" className="mt-6">
            {buyerLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="py-6">
                      <Skeleton className="h-24 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : buyerReviews && buyerReviews.length > 0 ? (
              <div className="space-y-4">
                {buyerReviews.map((review: any) => (
                  <ReviewDisplay
                    key={review.id}
                    review={review}
                    showResponse={true}
                    allowResponse={isOwnProfile}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No buyer reviews yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {isOwnProfile
                      ? "Buy items to receive reviews as a buyer"
                      : "This user hasn't received any reviews as a buyer"}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

