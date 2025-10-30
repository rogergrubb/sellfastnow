import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Eye, Heart, MessageCircle, DollarSign, TrendingUp, 
  Package, CheckCircle, BarChart3, Target 
} from "lucide-react";
import { Link } from "wouter";
import PricingInsights from "@/components/PricingInsights";
import SalesChart from "@/components/SalesChart";
import PlatformFeeComparison from "@/components/PlatformFeeComparison";

export default function SellerAnalytics() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["/api/analytics/seller"],
  });

  if (isLoading) {
    return (
      <div className="container max-w-7xl mx-auto py-8 px-4">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="container max-w-7xl mx-auto py-8 px-4">
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    );
  }

  const { summary, topListings, allListings } = analytics;

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Seller Analytics</h1>
        <p className="text-muted-foreground">
          Track your performance and optimize your listings
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {summary.avgViewsPerListing} avg per listing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.activeListings}</div>
            <p className="text-xs text-muted-foreground">
              {summary.totalListings} total listings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items Sold</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.soldListings}</div>
            <p className="text-xs text-muted-foreground">
              {summary.listingToSaleRate}% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalMessages}</div>
            <p className="text-xs text-muted-foreground">
              {summary.viewToMessageRate}% message rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Engagement Metrics</CardTitle>
            <CardDescription>How buyers interact with your listings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                <span className="text-sm font-medium">Favorites</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{summary.totalFavorites}</div>
                <p className="text-xs text-muted-foreground">Total favorites</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium">Messages</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{summary.totalMessages}</div>
                <p className="text-xs text-muted-foreground">{summary.viewToMessageRate}% of views</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium">Offers</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{summary.totalOffers}</div>
                <p className="text-xs text-muted-foreground">{summary.viewToOfferRate}% of views</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Performing Listings</CardTitle>
            <CardDescription>Your most viewed listings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topListings.length === 0 ? (
                <p className="text-sm text-muted-foreground">No listings yet</p>
              ) : (
                topListings.map((listing: any, index: number) => (
                  <Link key={listing.id} href={`/listings/${listing.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm line-clamp-1">{listing.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={listing.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                              {listing.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {listing.viewCount}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All Listings Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Listings Performance</CardTitle>
          <CardDescription>Detailed view of all your listings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {allListings.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No listings yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 text-sm font-medium">Listing</th>
                      <th className="text-center py-3 px-2 text-sm font-medium">Status</th>
                      <th className="text-center py-3 px-2 text-sm font-medium">Views</th>
                      <th className="text-center py-3 px-2 text-sm font-medium">Last Viewed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allListings.map((listing: any) => (
                      <tr key={listing.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-2">
                          <Link href={`/listings/${listing.id}`}>
                            <span className="text-sm font-medium hover:underline cursor-pointer line-clamp-1">
                              {listing.title}
                            </span>
                          </Link>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <Badge 
                            variant={listing.status === 'active' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {listing.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Eye className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{listing.viewCount}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center text-sm text-muted-foreground">
                          {listing.lastViewedAt 
                            ? new Date(listing.lastViewedAt).toLocaleDateString()
                            : 'Never'
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sales Chart */}
      <div className="mt-6">
        <SalesChart />
      </div>

      {/* Platform Fee Comparison */}
      <div className="mt-6">
        <PlatformFeeComparison />
      </div>

      {/* Pricing Insights */}
      <div className="mt-6">
        <PricingInsights />
      </div>

      {/* Tips Card */}
      <Card className="mt-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <CardTitle className="text-blue-900 dark:text-blue-100">Performance Tips</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <p>• <strong>Low views?</strong> Try improving your title and adding more photos</p>
          <p>• <strong>High views but no messages?</strong> Your price might be too high</p>
          <p>• <strong>Getting messages but no sales?</strong> Respond quickly and be flexible with offers</p>
          <p>• <strong>Stale listings?</strong> Consider lowering the price or refreshing the photos</p>
        </CardContent>
      </Card>
    </div>
  );
}

