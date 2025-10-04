import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Star, TrendingUp, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useQuery } from "@tanstack/react-query";

interface UserStatsSummaryProps {
  userId: string;
  role: "buyer" | "seller";
}

interface StatsSummary {
  userId: string;
  displayName: string;
  profileImageUrl?: string;
  averageRating: number;
  totalReviews: number;
  memberSince: Date;
  asBuyer: {
    totalPurchases: number;
    successfulPurchases: number;
    successRate: number;
    cancelledByBuyer: number;
    buyerNoShows: number;
    recentTransactions90d: number;
    recentCancellations90d: number;
    recentNoShows90d: number;
    lastCancellationDaysAgo: number | null;
    avgResponseMinutes: number;
    responseRate: number;
  };
  asSeller: {
    totalSales: number;
    successfulSales: number;
    successRate: number;
    cancelledBySeller: number;
    sellerNoShows: number;
    recentTransactions90d: number;
    recentCancellations90d: number;
    recentNoShows90d: number;
    avgResponseMinutes: number;
    responseRate: number;
  };
  recentCancellations: Array<{
    date: Date;
    item: string;
    role: string;
    timing: string;
    comment: string;
    hasResponse: boolean;
  }>;
  topReviews: Array<{
    rating: number;
    text: string;
    reviewerName: string;
    date: Date;
  }>;
}

function calculateRecommendation(stats: StatsSummary, role: "buyer" | "seller"): {
  level: "excellent" | "good" | "fair" | "poor" | "very poor";
  color: string;
  bgColor: string;
  warnings: string[];
} {
  const roleStats = role === "buyer" ? stats.asBuyer : stats.asSeller;
  const warnings: string[] = [];
  
  const totalTransactions = role === "buyer" ? stats.asBuyer.totalPurchases : stats.asSeller.totalSales;
  const successRate = roleStats.successRate;
  const recentCancellations = roleStats.recentCancellations90d;
  const recentNoShows = roleStats.recentNoShows90d;
  const hasActivity = totalTransactions > 0;

  if (!hasActivity) {
    return {
      level: "fair",
      color: "text-yellow-600 dark:text-yellow-500",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
      warnings: ["No transaction history yet"],
    };
  }

  if (recentNoShows > 0) {
    warnings.push(`${recentNoShows} no-show${recentNoShows > 1 ? 's' : ''} in last 90 days`);
  }

  if (recentCancellations > 2) {
    warnings.push(`${recentCancellations} cancellations in last 90 days`);
  }

  if (roleStats.responseRate < 70) {
    warnings.push(`Low response rate (${roleStats.responseRate}%)`);
  }

  if (successRate >= 90 && warnings.length === 0) {
    return {
      level: "excellent",
      color: "text-green-600 dark:text-green-500",
      bgColor: "bg-green-50 dark:bg-green-950/30",
      warnings,
    };
  }

  if (successRate >= 75 && warnings.length <= 1) {
    return {
      level: "good",
      color: "text-blue-600 dark:text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
      warnings,
    };
  }

  if (successRate >= 60 || warnings.length <= 2) {
    return {
      level: "fair",
      color: "text-yellow-600 dark:text-yellow-500",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
      warnings,
    };
  }

  if (successRate >= 40) {
    return {
      level: "poor",
      color: "text-orange-600 dark:text-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-950/30",
      warnings,
    };
  }

  return {
    level: "very poor",
    color: "text-red-600 dark:text-red-500",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    warnings,
  };
}

export function UserStatsSummary({ userId, role }: UserStatsSummaryProps) {
  const { data: stats, isLoading } = useQuery<StatsSummary>({
    queryKey: ["/api/statistics/user", userId, "summary"],
    queryFn: async () => {
      const res = await fetch(`/api/statistics/user/${userId}/summary`);
      if (!res.ok) throw new Error("Failed to fetch statistics");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <Card data-testid="stats-summary-loading">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              <div className="h-3 w-24 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card data-testid="stats-summary-error">
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Unable to load user statistics</p>
        </CardContent>
      </Card>
    );
  }

  const roleStats = role === "buyer" ? stats.asBuyer : stats.asSeller;
  const recommendation = calculateRecommendation(stats, role);
  const totalTransactions = role === "buyer" ? stats.asBuyer.totalPurchases : stats.asSeller.totalSales;
  const successfulTransactions = role === "buyer" ? stats.asBuyer.successfulPurchases : stats.asSeller.successfulSales;

  return (
    <Card data-testid="stats-summary">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12" data-testid="avatar-user">
            <AvatarImage src={stats.profileImageUrl} />
            <AvatarFallback>{stats.displayName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-lg" data-testid="text-display-name">
              {stats.displayName}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              {stats.averageRating > 0 && (
                <div className="flex items-center gap-1" data-testid="rating-display">
                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{stats.averageRating.toFixed(1)}</span>
                </div>
              )}
              <span className="text-sm text-muted-foreground" data-testid="text-member-since">
                Member {formatDistanceToNow(new Date(stats.memberSince), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className={`p-3 rounded-md ${recommendation.bgColor}`} data-testid="recommendation-card">
          <div className="flex items-center gap-2 mb-2">
            {recommendation.level === "excellent" && <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500" />}
            {recommendation.level === "good" && <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-500" />}
            {(recommendation.level === "fair" || recommendation.level === "poor") && <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />}
            {recommendation.level === "very poor" && <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-500" />}
            <span className={`font-semibold capitalize ${recommendation.color}`} data-testid="text-recommendation-level">
              {recommendation.level} {role === "buyer" ? "Buyer" : "Seller"}
            </span>
          </div>

          {recommendation.warnings.length > 0 && (
            <ul className="space-y-1 ml-7" data-testid="list-warnings">
              {recommendation.warnings.map((warning, idx) => (
                <li key={idx} className={`text-sm ${recommendation.color}`} data-testid={`warning-${idx}`}>
                  {warning}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-3">
          <div data-testid="section-success-rate">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Success Rate</span>
              <span className="text-sm font-semibold" data-testid="text-success-rate">
                {roleStats.successRate.toFixed(0)}%
              </span>
            </div>
            <Progress value={roleStats.successRate} className="h-2" data-testid="progress-success-rate" />
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div data-testid="stat-total-transactions">
              <div className="text-muted-foreground">Total {role === "buyer" ? "Purchases" : "Sales"}</div>
              <div className="font-semibold" data-testid="text-total-transactions">{totalTransactions}</div>
            </div>
            <div data-testid="stat-successful-transactions">
              <div className="text-muted-foreground">Successful</div>
              <div className="font-semibold" data-testid="text-successful-transactions">{successfulTransactions}</div>
            </div>
            <div data-testid="stat-recent-activity">
              <div className="text-muted-foreground">Recent (90d)</div>
              <div className="font-semibold" data-testid="text-recent-activity">{roleStats.recentTransactions90d}</div>
            </div>
            <div data-testid="stat-response-rate">
              <div className="text-muted-foreground">Response Rate</div>
              <div className="font-semibold" data-testid="text-response-rate">{roleStats.responseRate.toFixed(0)}%</div>
            </div>
          </div>
        </div>

        {stats.recentCancellations.length > 0 && (
          <div data-testid="section-recent-cancellations">
            <h4 className="text-sm font-semibold mb-2">Recent Cancellations</h4>
            <div className="space-y-2">
              {stats.recentCancellations.slice(0, 2).map((cancellation: typeof stats.recentCancellations[0], idx: number) => (
                <div key={idx} className="text-sm p-2 rounded bg-muted" data-testid={`cancellation-${idx}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs" data-testid={`badge-timing-${idx}`}>
                      {cancellation.timing}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(cancellation.date), { addSuffix: true })}
                    </span>
                  </div>
                  {cancellation.comment && (
                    <p className="text-xs text-muted-foreground mt-1" data-testid={`text-comment-${idx}`}>
                      "{cancellation.comment.substring(0, 100)}{cancellation.comment.length > 100 ? "..." : ""}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {stats.topReviews.length > 0 && (
          <div data-testid="section-top-reviews">
            <h4 className="text-sm font-semibold mb-2">Top Reviews</h4>
            <div className="space-y-2">
              {stats.topReviews.slice(0, 2).map((review: typeof stats.topReviews[0], idx: number) => (
                <div key={idx} className="text-sm p-2 rounded bg-muted" data-testid={`review-${idx}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < review.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "fill-none text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">by {review.reviewerName}</span>
                  </div>
                  <p className="text-xs text-muted-foreground" data-testid={`text-review-${idx}`}>
                    "{review.text.substring(0, 100)}{review.text.length > 100 ? "..." : ""}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
