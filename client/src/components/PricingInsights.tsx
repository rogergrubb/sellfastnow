import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingDown, TrendingUp, Minus, AlertTriangle, DollarSign } from "lucide-react";
import { Link } from "wouter";

export default function PricingInsights() {
  const { data: insights, isLoading } = useQuery({
    queryKey: ["/api/analytics/seller/pricing-insights"],
  });

  const { data: staleListings } = useQuery({
    queryKey: ["/api/analytics/seller/stale-listings"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pricing Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insights) {
    return null;
  }

  const { pricingBreakdown, staleCount, insights: actionableInsights } = insights;

  return (
    <div className="space-y-4">
      {/* Stale Listings Alert */}
      {staleCount > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have <strong>{staleCount}</strong> listing{staleCount > 1 ? 's' : ''} that haven't received views recently. 
            Consider updating the price or refreshing the photos.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Pricing Insights
          </CardTitle>
          <CardDescription>
            How your prices compare to the market
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Pricing Breakdown */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingDown className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-900 dark:text-green-100">Below Market</span>
              </div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {pricingBreakdown.below}
              </div>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                Could increase price
              </p>
            </div>

            <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Minus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">At Market</span>
              </div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {pricingBreakdown.at}
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                Competitive pricing
              </p>
            </div>

            <div className="text-center p-3 rounded-lg bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                <span className="text-sm font-medium text-orange-900 dark:text-orange-100">Above Market</span>
              </div>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {pricingBreakdown.above}
              </div>
              <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                May sell slower
              </p>
            </div>
          </div>

          {/* Actionable Insights */}
          {actionableInsights.length > 0 && (
            <div className="space-y-3 mt-6">
              <h4 className="text-sm font-semibold">Recommended Actions</h4>
              {actionableInsights.slice(0, 5).map((insight: any) => (
                <Link key={insight.listingId} href={`/listings/${insight.listingId}`}>
                  <div className="p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm line-clamp-1">{insight.title}</p>
                          <Badge 
                            variant={
                              insight.pricePosition === "below" ? "default" :
                              insight.pricePosition === "above" ? "destructive" :
                              "secondary"
                            }
                            className="text-xs"
                          >
                            {insight.pricePosition === "below" ? "Low Price" :
                             insight.pricePosition === "above" ? "High Price" :
                             "Fair Price"}
                          </Badge>
                          {insight.isStale && (
                            <Badge variant="outline" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Stale
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{insight.recommendation}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">${insight.currentPrice.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
              {actionableInsights.length > 5 && (
                <p className="text-sm text-muted-foreground text-center">
                  +{actionableInsights.length - 5} more listings need attention
                </p>
              )}
            </div>
          )}

          {actionableInsights.length === 0 && (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">
                All your listings are competitively priced! 🎉
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stale Listings Detail */}
      {staleListings && staleListings.length > 0 && (
        <Card className="border-orange-200 dark:border-orange-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900 dark:text-orange-100">
              <AlertTriangle className="h-5 w-5" />
              Stale Listings
            </CardTitle>
            <CardDescription>
              These listings haven't received views recently
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {staleListings.slice(0, 5).map((listing: any) => (
                <Link key={listing.id} href={`/listings/${listing.id}`}>
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                    <div>
                      <p className="font-medium text-sm line-clamp-1">{listing.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {listing.viewCount} views • Last viewed {listing.daysSinceLastView !== null ? `${listing.daysSinceLastView} days ago` : 'never'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">${listing.price.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{listing.daysSinceCreated} days old</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

