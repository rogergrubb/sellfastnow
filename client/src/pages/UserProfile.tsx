import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Star, MapPin, Calendar, Package, TrendingUp, MessageCircle } from "lucide-react";
import { useState } from "react";
import { ReviewCard } from "@/components/ReviewCard";
import type { ReviewWithMetadata } from "@shared/schema";

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const [activeTab, setActiveTab] = useState("about");

  const { data: user, isLoading: userLoading } = useQuery<any>({
    queryKey: ["/api/users", userId],
  });

  const { data: statistics, isLoading: statsLoading } = useQuery<any>({
    queryKey: ["/api/statistics/user", userId],
  });

  const { data: reviews, isLoading: reviewsLoading } = useQuery<ReviewWithMetadata[]>({
    queryKey: ["/api/reviews/user", userId],
  });

  const { data: timeline, isLoading: timelineLoading } = useQuery<any[]>({
    queryKey: ["/api/statistics/user", userId, "timeline"],
  });

  const { data: transactionHistory, isLoading: historyLoading } = useQuery<any[]>({
    queryKey: ["/api/transactions/user", userId, "history"],
  });

  if (userLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-lg"></div>
          <div className="h-64 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!user) {
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

  const userName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user.firstName || user.lastName || "User";

  const initials = userName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase();

  const avgRating = statistics?.averageRating ? parseFloat(statistics.averageRating) : 0;

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* User Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <Avatar className="h-24 w-24" data-testid="avatar-user">
              <AvatarImage src={user.profileImageUrl} alt={userName} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-3">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold" data-testid="text-username">{userName}</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span data-testid="text-member-since">
                    Member since {new Date(statistics?.memberSince || user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {avgRating > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= avgRating
                            ? "fill-primary text-primary"
                            : "fill-muted text-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium" data-testid="text-avg-rating">
                    {avgRating.toFixed(1)}
                  </span>
                  <span className="text-sm text-muted-foreground" data-testid="text-review-count">
                    ({statistics?.totalReviewsReceived || 0} reviews)
                  </span>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {user.location && (
                  <Badge variant="secondary" data-testid="badge-location">
                    <MapPin className="h-3 w-3 mr-1" />
                    {user.location}
                  </Badge>
                )}
                {statistics?.totalListingsSold > 0 && (
                  <Badge variant="secondary" data-testid="badge-sold">
                    <Package className="h-3 w-3 mr-1" />
                    {statistics.totalListingsSold} sold
                  </Badge>
                )}
                {statistics?.responseRate && (
                  <Badge variant="secondary" data-testid="badge-response-rate">
                    <MessageCircle className="h-3 w-3 mr-1" />
                    {statistics.responseRate}% response
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex md:flex-col gap-2">
              <Button variant="default" data-testid="button-message">
                <MessageCircle className="h-4 w-4 mr-2" />
                Message
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4" data-testid="tabs-user-profile">
          <TabsTrigger value="about" data-testid="tab-about">About</TabsTrigger>
          <TabsTrigger value="statistics" data-testid="tab-statistics">Statistics</TabsTrigger>
          <TabsTrigger value="reviews" data-testid="tab-reviews">
            Reviews ({statistics?.totalReviewsReceived || 0})
          </TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">Transaction History</TabsTrigger>
        </TabsList>

        <TabsContent value="about" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {user.bio ? (
                <p className="text-muted-foreground" data-testid="text-bio">{user.bio}</p>
              ) : (
                <p className="text-muted-foreground italic">No bio available</p>
              )}
              
              <Separator />
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Active Listings</p>
                  <p className="text-2xl font-bold" data-testid="text-active-listings">
                    {statistics?.totalListingsActive || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed Sales</p>
                  <p className="text-2xl font-bold" data-testid="text-completed-sales">
                    {statistics?.totalListingsSold || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Response Rate</p>
                  <p className="text-2xl font-bold" data-testid="text-response-rate">
                    {statistics?.responseRate || 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          {statsLoading ? (
            <Card>
              <CardContent className="py-8">
                <div className="animate-pulse space-y-4">
                  <div className="h-8 bg-muted rounded"></div>
                  <div className="h-24 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Rating Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Rating Breakdown</CardTitle>
                  <CardDescription>Distribution of customer reviews</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = statistics?.[`${["one", "two", "three", "four", "five"][stars - 1]}StarReviews`] || 0;
                    const total = statistics?.totalReviewsReceived || 1;
                    const percentage = (count / total) * 100;
                    
                    return (
                      <div key={stars} className="flex items-center gap-3">
                        <div className="flex items-center gap-1 w-20">
                          <span className="text-sm font-medium">{stars}</span>
                          <Star className="h-3 w-3 fill-primary text-primary" />
                        </div>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-12 text-right" data-testid={`text-${stars}-star-count`}>
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Avg. Response Time</p>
                      <p className="text-lg font-bold" data-testid="text-avg-response-time">
                        {statistics?.avgResponseTime || "N/A"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Repeat Customers</p>
                      <p className="text-lg font-bold" data-testid="text-repeat-customers">
                        {statistics?.repeatCustomers || 0}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Total Revenue</p>
                      <p className="text-lg font-bold" data-testid="text-total-revenue">
                        ${statistics?.totalRevenue || "0"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Cancellation Rate</p>
                      <p className="text-lg font-bold" data-testid="text-cancellation-rate">
                        {statistics?.cancellationRate || 0}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4">
          {reviewsLoading ? (
            <Card>
              <CardContent className="py-8">
                <div className="animate-pulse space-y-4">
                  <div className="h-24 bg-muted rounded"></div>
                  <div className="h-24 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          ) : reviews && reviews.length > 0 ? (
            reviews.map((review) => (
              <ReviewCard 
                key={review.id} 
                review={review}
                queryKey={["/api/reviews/user", userId]}
              />
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No reviews yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {historyLoading ? (
            <Card>
              <CardContent className="py-8">
                <div className="animate-pulse space-y-4">
                  <div className="h-16 bg-muted rounded"></div>
                  <div className="h-16 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          ) : transactionHistory && transactionHistory.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>Recent buying and selling activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transactionHistory.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 pb-4 border-b last:border-0"
                      data-testid={`row-transaction-${item.id}`}
                    >
                      <div className="flex-1">
                        <p className="font-medium" data-testid={`text-item-title-${item.id}`}>
                          {item.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        variant={item.status === "sold" ? "default" : "secondary"}
                        data-testid={`badge-status-${item.id}`}
                      >
                        {item.status}
                      </Badge>
                      <p className="font-bold" data-testid={`text-price-${item.id}`}>
                        ${item.price}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No transaction history</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
