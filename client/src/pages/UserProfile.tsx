import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, MapPin, Calendar, Package, TrendingUp, MessageCircle, X, Filter } from "lucide-react";
import { useState, useEffect } from "react";
import { ReviewCard } from "@/components/ReviewCard";
import { StatisticsDashboard } from "@/components/StatisticsDashboard";
import { RespondToReviewModal } from "@/components/RespondToReviewModal";
import type { ReviewWithMetadata } from "@shared/schema";

interface ReviewFilters {
  stars?: number;
  role?: 'seller' | 'buyer' | 'all';
  period?: '30d' | '3m' | '6m' | '12m' | 'all';
  sort?: 'recent' | 'oldest' | 'highest' | 'lowest' | 'helpful';
}

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("about");
  const [showFilters, setShowFilters] = useState(false);
  const [offset, setOffset] = useState(0);
  const [allReviews, setAllReviews] = useState<ReviewWithMetadata[]>([]);
  const [respondModalOpen, setRespondModalOpen] = useState(false);
  const [selectedReviewForResponse, setSelectedReviewForResponse] = useState<ReviewWithMetadata | null>(null);
  
  // Parse filters from URL
  const getFiltersFromURL = (): ReviewFilters => {
    const params = new URLSearchParams(window.location.search);
    return {
      stars: params.get('stars') ? parseInt(params.get('stars')!) : undefined,
      role: (params.get('role') as 'seller' | 'buyer' | 'all') || 'all',
      period: (params.get('period') as '30d' | '3m' | '6m' | '12m' | 'all') || 'all',
      sort: (params.get('sort') as 'recent' | 'oldest' | 'highest' | 'lowest' | 'helpful') || 'recent',
    };
  };

  const [filters, setFilters] = useState<ReviewFilters>(getFiltersFromURL());

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.stars) params.set('stars', filters.stars.toString());
    if (filters.role && filters.role !== 'all') params.set('role', filters.role);
    if (filters.period && filters.period !== 'all') params.set('period', filters.period);
    if (filters.sort && filters.sort !== 'recent') params.set('sort', filters.sort);
    
    const query = params.toString();
    const newPath = `/users/${userId}${query ? `?${query}` : ''}`;
    window.history.replaceState({}, '', newPath);
  }, [filters, userId]);

  const { data: currentUser } = useQuery<any>({
    queryKey: ['/api/auth/user'],
    retry: false,
  });

  const { data: user, isLoading: userLoading } = useQuery<any>({
    queryKey: ["/api/users", userId],
  });

  const { data: statistics, isLoading: statsLoading } = useQuery<any>({
    queryKey: ["/api/statistics/user", userId],
  });

  // Build query params for reviews
  const buildReviewQueryParams = () => {
    const params = new URLSearchParams();
    if (filters.stars) params.set('stars', filters.stars.toString());
    if (filters.role && filters.role !== 'all') params.set('role', filters.role);
    if (filters.period && filters.period !== 'all') params.set('period', filters.period);
    if (filters.sort) params.set('sort', filters.sort);
    params.set('limit', '20');
    params.set('offset', offset.toString());
    return params.toString();
  };

  const { data: reviews, isLoading: reviewsLoading } = useQuery<ReviewWithMetadata[]>({
    queryKey: ["/api/reviews/user", userId, buildReviewQueryParams()],
    queryFn: async () => {
      const params = buildReviewQueryParams();
      const res = await fetch(`/api/reviews/user/${userId}?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch reviews');
      return res.json();
    },
  });

  const { data: reviewCount } = useQuery<{ count: number }>({
    queryKey: ["/api/reviews/user", userId, "count", filters.stars, filters.role, filters.period],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.stars) params.set('stars', filters.stars.toString());
      if (filters.role && filters.role !== 'all') params.set('role', filters.role);
      if (filters.period && filters.period !== 'all') params.set('period', filters.period);
      const res = await fetch(`/api/reviews/user/${userId}/count?${params.toString()}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch count');
      return res.json();
    },
  });

  const { data: timeline, isLoading: timelineLoading } = useQuery<any[]>({
    queryKey: ["/api/statistics/user", userId, "timeline"],
  });

  const { data: transactionHistory, isLoading: historyLoading } = useQuery<any[]>({
    queryKey: ["/api/transactions/user", userId, "history"],
  });

  // Update accumulated reviews when data changes
  useEffect(() => {
    if (reviews) {
      if (offset === 0) {
        setAllReviews(reviews);
      } else {
        setAllReviews(prev => [...prev, ...reviews]);
      }
    }
  }, [reviews, offset]);

  // Reset offset when filters change
  useEffect(() => {
    setOffset(0);
    setAllReviews([]);
  }, [filters]);

  // Handler for responding to reviews
  const handleRespondToReview = (reviewId: string) => {
    const review = allReviews.find(r => r.id === reviewId);
    if (review) {
      setSelectedReviewForResponse(review);
      setRespondModalOpen(true);
    }
  };

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
          <StatisticsDashboard userId={userId!} />
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4">
          {/* Filter Controls */}
          <Card>
            <CardContent className="pt-6">
              {/* Mobile Filter Toggle */}
              <div className="md:hidden mb-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowFilters(!showFilters)}
                  data-testid="button-toggle-filters"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters & Sort
                </Button>
              </div>

              {/* Filter Controls */}
              <div className={`space-y-4 ${!showFilters && 'hidden md:block'}`}>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Stars</label>
                    <Select
                      value={filters.stars?.toString() || 'all'}
                      onValueChange={(value) => setFilters({...filters, stars: value === 'all' ? undefined : parseInt(value)})}
                    >
                      <SelectTrigger data-testid="select-stars">
                        <SelectValue placeholder="All Stars" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Stars</SelectItem>
                        <SelectItem value="5">5 Stars</SelectItem>
                        <SelectItem value="4">4 Stars</SelectItem>
                        <SelectItem value="3">3 Stars</SelectItem>
                        <SelectItem value="2">2 Stars</SelectItem>
                        <SelectItem value="1">1 Star</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Role</label>
                    <Select
                      value={filters.role || 'all'}
                      onValueChange={(value) => setFilters({...filters, role: value as 'seller' | 'buyer' | 'all'})}
                    >
                      <SelectTrigger data-testid="select-role">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="seller">As Seller</SelectItem>
                        <SelectItem value="buyer">As Buyer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Period</label>
                    <Select
                      value={filters.period || 'all'}
                      onValueChange={(value) => setFilters({...filters, period: value as '30d' | '3m' | '6m' | '12m' | 'all'})}
                    >
                      <SelectTrigger data-testid="select-period">
                        <SelectValue placeholder="All Time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="30d">Last 30 Days</SelectItem>
                        <SelectItem value="3m">Last 3 Months</SelectItem>
                        <SelectItem value="6m">Last 6 Months</SelectItem>
                        <SelectItem value="12m">Last 12 Months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sort by</label>
                    <Select
                      value={filters.sort || 'recent'}
                      onValueChange={(value) => setFilters({...filters, sort: value as 'recent' | 'oldest' | 'highest' | 'lowest' | 'helpful'})}
                    >
                      <SelectTrigger data-testid="select-sort">
                        <SelectValue placeholder="Most Recent" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recent">Most Recent</SelectItem>
                        <SelectItem value="oldest">Oldest First</SelectItem>
                        <SelectItem value="highest">Highest Rating</SelectItem>
                        <SelectItem value="lowest">Lowest Rating</SelectItem>
                        <SelectItem value="helpful">Most Helpful</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Active Filters */}
                {(filters.stars || (filters.role && filters.role !== 'all') || (filters.period && filters.period !== 'all')) && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Active Filters:</p>
                    <div className="flex flex-wrap gap-2">
                      {filters.stars && (
                        <Badge variant="secondary" className="gap-1" data-testid="badge-filter-stars">
                          {filters.stars} Stars
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => setFilters({...filters, stars: undefined})}
                            data-testid="button-remove-stars-filter"
                          />
                        </Badge>
                      )}
                      {filters.role && filters.role !== 'all' && (
                        <Badge variant="secondary" className="gap-1" data-testid="badge-filter-role">
                          As {filters.role === 'seller' ? 'Seller' : 'Buyer'}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => setFilters({...filters, role: 'all'})}
                            data-testid="button-remove-role-filter"
                          />
                        </Badge>
                      )}
                      {filters.period && filters.period !== 'all' && (
                        <Badge variant="secondary" className="gap-1" data-testid="badge-filter-period">
                          {filters.period === '30d' ? 'Last 30 Days' : 
                           filters.period === '3m' ? 'Last 3 Months' :
                           filters.period === '6m' ? 'Last 6 Months' : 'Last 12 Months'}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => setFilters({...filters, period: 'all'})}
                            data-testid="button-remove-period-filter"
                          />
                        </Badge>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFilters({role: 'all', period: 'all', sort: 'recent'})}
                        data-testid="button-clear-filters"
                      >
                        Clear All Filters
                      </Button>
                    </div>
                  </div>
                )}

                {/* Review Count */}
                <p className="text-sm text-muted-foreground" data-testid="text-review-count-filtered">
                  Showing {reviewCount?.count || 0} reviews
                  {(filters.stars || (filters.role && filters.role !== 'all') || (filters.period && filters.period !== 'all')) && 
                    ` (filtered from ${statistics?.totalReviewsReceived || 0} total)`}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Reviews List */}
          {reviewsLoading ? (
            <Card>
              <CardContent className="py-8">
                <div className="animate-pulse space-y-4">
                  <div className="h-24 bg-muted rounded"></div>
                  <div className="h-24 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          ) : allReviews && allReviews.length > 0 ? (
            <>
              {allReviews.map((review) => (
                <ReviewCard 
                  key={review.id} 
                  review={review}
                  currentUserId={currentUser?.user?.id}
                  onRespond={handleRespondToReview}
                  queryKey={["/api/reviews/user", userId, buildReviewQueryParams()]}
                />
              ))}
              
              {/* Load More Button */}
              {reviewCount && allReviews.length < reviewCount.count && (
                <Card>
                  <CardContent className="py-4 text-center">
                    <Button
                      variant="outline"
                      onClick={() => setOffset(offset + 20)}
                      data-testid="button-load-more"
                    >
                      Load More Reviews ({reviewCount.count - allReviews.length} remaining)
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-8 text-center space-y-4">
                {(filters.stars || (filters.role && filters.role !== 'all') || (filters.period && filters.period !== 'all')) ? (
                  <>
                    <p className="text-muted-foreground font-medium">No reviews match your filters</p>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Active filters:</p>
                      <ul className="list-disc list-inside">
                        {filters.stars && <li>{filters.stars} Star reviews</li>}
                        {filters.role && filters.role !== 'all' && <li>As {filters.role === 'seller' ? 'Seller' : 'Buyer'}</li>}
                        {filters.period && filters.period !== 'all' && (
                          <li>
                            {filters.period === '30d' ? 'Last 30 Days' : 
                             filters.period === '3m' ? 'Last 3 Months' :
                             filters.period === '6m' ? 'Last 6 Months' : 'Last 12 Months'}
                          </li>
                        )}
                      </ul>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setFilters({role: 'all', period: 'all', sort: 'recent'})}
                      data-testid="button-clear-filters-empty"
                    >
                      Clear All Filters
                    </Button>
                  </>
                ) : (
                  <p className="text-muted-foreground">No reviews yet</p>
                )}
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

      {/* Respond to Review Modal */}
      {selectedReviewForResponse && (
        <RespondToReviewModal
          isOpen={respondModalOpen}
          onClose={() => {
            setRespondModalOpen(false);
            setSelectedReviewForResponse(null);
          }}
          review={selectedReviewForResponse}
          queryKey={["/api/reviews/user", userId, buildReviewQueryParams()]}
        />
      )}
    </div>
  );
}
