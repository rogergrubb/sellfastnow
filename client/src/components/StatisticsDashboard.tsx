import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Star, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Shield,
  Mail,
  Phone,
  CreditCard,
  IdCard
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface StatisticsDashboardProps {
  userId: string;
}

export function StatisticsDashboard({ userId }: StatisticsDashboardProps) {
  const { data: statistics, isLoading } = useQuery<any>({
    queryKey: ["/api/statistics/user", userId],
  });

  const { data: monthlyStats } = useQuery<any[]>({
    queryKey: ["/api/statistics/user", userId, "monthly"],
    queryFn: () => fetch(`/api/statistics/user/${userId}/monthly?months=3`).then(res => res.json()),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="py-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded"></div>
              <div className="h-24 bg-muted rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!statistics) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No statistics available</p>
        </CardContent>
      </Card>
    );
  }

  const totalTransactions = (statistics.totalSales || 0) + (statistics.totalPurchases || 0);
  const overallSuccessRate = parseFloat(statistics.overallSuccessRate || "0");
  const sellerSuccessRate = parseFloat(statistics.sellerSuccessRate || "0");
  const buyerSuccessRate = parseFloat(statistics.buyerSuccessRate || "0");
  const avgRating = parseFloat(statistics.averageRating || "0");
  const avgResponseTime = statistics.avgResponseTimeMinutes || 0;

  const getSuccessColor = (rate: number) => {
    if (rate >= 80) return "text-green-600 dark:text-green-400";
    if (rate >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getSuccessBarColor = (rate: number) => {
    if (rate >= 80) return "bg-green-600 dark:bg-green-400";
    if (rate >= 60) return "bg-yellow-600 dark:bg-yellow-400";
    return "bg-red-600 dark:bg-red-400";
  };

  const formatResponseTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div className="space-y-6">
      {/* Overall Summary */}
      <Card data-testid="card-overall-summary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Overall Summary
          </CardTitle>
          <CardDescription>Your performance at a glance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Transactions</p>
              <p className="text-2xl font-bold" data-testid="text-total-transactions">{totalTransactions}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Success Rate</p>
              <p className={`text-2xl font-bold ${getSuccessColor(overallSuccessRate)}`} data-testid="text-success-rate">
                {overallSuccessRate.toFixed(0)}%
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Average Rating</p>
              <p className="text-2xl font-bold flex items-center gap-1" data-testid="text-overall-rating">
                {avgRating > 0 ? avgRating.toFixed(1) : "N/A"}
                {avgRating > 0 && <Star className="h-4 w-4 fill-primary text-primary" />}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Response Time</p>
              <p className="text-2xl font-bold" data-testid="text-response-time">
                {avgResponseTime > 0 ? formatResponseTime(avgResponseTime) : "N/A"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* As Buyer */}
      {statistics.totalPurchases > 0 && (
        <Card data-testid="card-buyer-stats">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🛍️ As Buyer ({statistics.totalPurchases} Transactions)
            </CardTitle>
            <CardDescription>Your performance as a buyer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Purchases</p>
                <p className="text-lg font-bold" data-testid="text-total-purchases">{statistics.totalPurchases}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed Successfully</p>
                <p className="text-lg font-bold text-green-600 dark:text-green-400" data-testid="text-successful-purchases">
                  {statistics.successfulPurchases} ({((statistics.successfulPurchases / statistics.totalPurchases) * 100).toFixed(0)}%)
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cancelled by Buyer</p>
                <p className="text-lg font-bold" data-testid="text-cancelled-by-buyer">
                  {statistics.cancelledByBuyer} ({((statistics.cancelledByBuyer / statistics.totalPurchases) * 100).toFixed(0)}%)
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cancelled by Seller</p>
                <p className="text-lg font-bold" data-testid="text-cancelled-by-seller-on-buyer">
                  {statistics.cancelledBySellerOnBuyer} ({((statistics.cancelledBySellerOnBuyer / statistics.totalPurchases) * 100).toFixed(0)}%)
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Buyer No-Shows</p>
                <p className="text-lg font-bold text-red-600 dark:text-red-400" data-testid="text-buyer-no-shows">
                  {statistics.buyerNoShows} ({((statistics.buyerNoShows / statistics.totalPurchases) * 100).toFixed(0)}%)
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Seller No-Shows</p>
                <p className="text-lg font-bold" data-testid="text-seller-no-shows-on-buyer">
                  {statistics.sellerNoShowsOnBuyer} ({((statistics.sellerNoShowsOnBuyer / statistics.totalPurchases) * 100).toFixed(0)}%)
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Success Rate</p>
                <p className={`text-sm font-bold ${getSuccessColor(buyerSuccessRate)}`} data-testid="text-buyer-success-rate">
                  {buyerSuccessRate.toFixed(0)}%
                </p>
              </div>
              <Progress value={buyerSuccessRate} className="h-2" data-testid="progress-buyer-success" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* As Seller */}
      {statistics.totalSales > 0 && (
        <Card data-testid="card-seller-stats">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🏷️ As Seller ({statistics.totalSales} Transactions)
            </CardTitle>
            <CardDescription>Your performance as a seller</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Sales</p>
                <p className="text-lg font-bold" data-testid="text-total-sales">{statistics.totalSales}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed Successfully</p>
                <p className="text-lg font-bold text-green-600 dark:text-green-400" data-testid="text-successful-sales">
                  {statistics.successfulSales} ({((statistics.successfulSales / statistics.totalSales) * 100).toFixed(0)}%)
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cancelled by Seller</p>
                <p className="text-lg font-bold" data-testid="text-cancelled-by-seller">
                  {statistics.cancelledBySeller} ({((statistics.cancelledBySeller / statistics.totalSales) * 100).toFixed(0)}%)
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cancelled by Buyer</p>
                <p className="text-lg font-bold" data-testid="text-cancelled-by-buyer-on-seller">
                  {statistics.cancelledByBuyerOnSeller} ({((statistics.cancelledByBuyerOnSeller / statistics.totalSales) * 100).toFixed(0)}%)
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Seller No-Shows</p>
                <p className="text-lg font-bold text-red-600 dark:text-red-400" data-testid="text-seller-no-shows">
                  {statistics.sellerNoShows} ({((statistics.sellerNoShows / statistics.totalSales) * 100).toFixed(0)}%)
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Buyer No-Shows</p>
                <p className="text-lg font-bold" data-testid="text-buyer-no-shows-on-seller">
                  {statistics.buyerNoShowsOnSeller} ({((statistics.buyerNoShowsOnSeller / statistics.totalSales) * 100).toFixed(0)}%)
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Success Rate</p>
                <p className={`text-sm font-bold ${getSuccessColor(sellerSuccessRate)}`} data-testid="text-seller-success-rate">
                  {sellerSuccessRate.toFixed(0)}%
                </p>
              </div>
              <Progress value={sellerSuccessRate} className="h-2" data-testid="progress-seller-success" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity (Last 90 Days) */}
      <Card data-testid="card-recent-activity">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📅 Recent Activity (Last 90 Days)
          </CardTitle>
          <CardDescription>Your activity over the past 3 months</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Transactions</p>
              <p className="text-lg font-bold" data-testid="text-recent-transactions">{statistics.recentTransactions90d || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400" data-testid="text-recent-completed">
                {(statistics.recentTransactions90d || 0) - (statistics.recentCancellations90d || 0) - (statistics.recentNoShows90d || 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cancelled</p>
              <p className="text-lg font-bold" data-testid="text-recent-cancelled">{statistics.recentCancellations90d || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">No-Shows</p>
              <p className="text-lg font-bold text-red-600 dark:text-red-400" data-testid="text-recent-no-shows">
                {statistics.recentNoShows90d || 0}
              </p>
            </div>
          </div>

          {/* Monthly Breakdown */}
          {monthlyStats && monthlyStats.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium">Monthly Breakdown</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Month</th>
                        <th className="text-center py-2">Total</th>
                        <th className="text-center py-2">Completed</th>
                        <th className="text-center py-2">Cancelled</th>
                        <th className="text-center py-2">No-Shows</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyStats.map((month) => {
                        const monthName = new Date(month.month + "-01").toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                        return (
                          <tr key={month.month} className="border-b" data-testid={`row-month-${month.month}`}>
                            <td className="py-2" data-testid={`text-month-name-${month.month}`}>{monthName}</td>
                            <td className="text-center" data-testid={`text-month-total-${month.month}`}>{month.total}</td>
                            <td className="text-center" data-testid={`text-month-completed-${month.month}`}>{month.completed}</td>
                            <td className="text-center" data-testid={`text-month-cancelled-${month.month}`}>{month.cancelled}</td>
                            <td className="text-center" data-testid={`text-month-no-shows-${month.month}`}>{month.noShows}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Platform Warnings */}
          {(statistics.recentCancellations90d > 2 || statistics.recentNoShows90d > 0 || buyerSuccessRate < 70) && (
            <>
              <Separator />
              <div className="space-y-2" data-testid="platform-warnings">
                {statistics.recentCancellations90d > 2 && (
                  <div className="flex items-start gap-2 text-yellow-600 dark:text-yellow-400">
                    <AlertTriangle className="h-4 w-4 mt-0.5" />
                    <p className="text-sm" data-testid="warning-cancellations">
                      This user has {statistics.recentCancellations90d} cancellations in the last 90 days, 
                      which is above the platform average of 0.5/90 days.
                    </p>
                  </div>
                )}
                {statistics.recentNoShows90d > 0 && (
                  <div className="flex items-start gap-2 text-red-600 dark:text-red-400">
                    <XCircle className="h-4 w-4 mt-0.5" />
                    <p className="text-sm" data-testid="warning-no-shows">
                      This user has {statistics.recentNoShows90d} no-show{statistics.recentNoShows90d > 1 ? 's' : ''} in the last 90 days.
                    </p>
                  </div>
                )}
                {buyerSuccessRate < 70 && statistics.totalPurchases > 0 && (
                  <div className="flex items-start gap-2 text-yellow-600 dark:text-yellow-400">
                    <AlertTriangle className="h-4 w-4 mt-0.5" />
                    <p className="text-sm" data-testid="warning-buyer-success">
                      This buyer has a success rate of {buyerSuccessRate.toFixed(0)}%, 
                      which is below the platform average of 90%.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Communication & Timing */}
      {(statistics.totalMessagesReceived > 0 || statistics.totalCheckins > 0) && (
        <Card data-testid="card-communication">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              ⏱️ Communication & Timing
            </CardTitle>
            <CardDescription>Response times and punctuality</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Response Statistics */}
            {statistics.totalMessagesReceived > 0 && (
              <div className="space-y-3">
                <p className="font-medium">Response Statistics</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Response Time</p>
                    <p className="text-lg font-bold" data-testid="text-avg-response-minutes">
                      {avgResponseTime > 0 ? formatResponseTime(avgResponseTime) : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Response Rate</p>
                    <p className="text-lg font-bold" data-testid="text-response-rate-percent">
                      {statistics.responseRatePercent ? parseFloat(statistics.responseRatePercent).toFixed(0) : 0}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Within 1 hour</p>
                    <p className="text-lg font-bold" data-testid="text-responses-1hour">
                      {((statistics.responsesWithin1hour / statistics.totalMessagesReceived) * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Within 24 hours</p>
                    <p className="text-lg font-bold" data-testid="text-responses-24hours">
                      {((statistics.responsesWithin24hours / statistics.totalMessagesReceived) * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Punctuality */}
            {statistics.totalCheckins > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <p className="font-medium">Punctuality (Meetup Check-ins)</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Checked in Early</p>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400" data-testid="text-checked-in-early">
                        {statistics.checkedInEarly} ({((statistics.checkedInEarly / statistics.totalCheckins) * 100).toFixed(0)}%)
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">On Time</p>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400" data-testid="text-checked-in-on-time">
                        {statistics.checkedInOnTime} ({((statistics.checkedInOnTime / statistics.totalCheckins) * 100).toFixed(0)}%)
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Late (5-15min)</p>
                      <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400" data-testid="text-checked-in-late">
                        {statistics.checkedInLate} ({((statistics.checkedInLate / statistics.totalCheckins) * 100).toFixed(0)}%)
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">On-time Rate</p>
                      <p className="text-lg font-bold" data-testid="text-on-time-rate">
                        {(((statistics.checkedInEarly + statistics.checkedInOnTime) / statistics.totalCheckins) * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Reviews Received */}
      {statistics.totalReviewsReceived > 0 && (
        <Card data-testid="card-reviews-received">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              💬 Reviews Received
            </CardTitle>
            <CardDescription>
              Average Rating: {avgRating.toFixed(1)} out of 5.0 ({statistics.totalReviewsReceived} reviews)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = statistics[`${["one", "two", "three", "four", "five"][stars - 1]}StarReviews`] || 0;
              const total = statistics.totalReviewsReceived || 1;
              const percentage = (count / total) * 100;
              
              return (
                <div key={stars} className="flex items-center gap-3" data-testid={`rating-row-${stars}`}>
                  <div className="flex items-center gap-1 w-20">
                    <span className="text-sm font-medium">{stars}</span>
                    <Star className="h-3 w-3 fill-primary text-primary" />
                  </div>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${percentage}%` }}
                      data-testid={`rating-bar-${stars}`}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-16 text-right" data-testid={`rating-count-${stars}`}>
                    {count} ({percentage.toFixed(0)}%)
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Verification Status */}
      <Card data-testid="card-verification">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Verification Status
          </CardTitle>
          <CardDescription>Account verification details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              {statistics.phoneVerified ? (
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : (
                <XCircle className="h-4 w-4 text-muted-foreground" />
              )}
              <div className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                <span className="text-sm" data-testid="text-phone-verified">
                  {statistics.phoneVerified ? "Phone Verified" : "Phone Not Verified"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {statistics.emailVerified ? (
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : (
                <XCircle className="h-4 w-4 text-muted-foreground" />
              )}
              <div className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                <span className="text-sm" data-testid="text-email-verified">
                  {statistics.emailVerified ? "Email Verified" : "Email Not Verified"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {statistics.stripeConnected ? (
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : (
                <XCircle className="h-4 w-4 text-muted-foreground" />
              )}
              <div className="flex items-center gap-1">
                <CreditCard className="h-3 w-3" />
                <span className="text-sm" data-testid="text-stripe-connected">
                  {statistics.stripeConnected ? "Stripe Connected" : "Stripe Not Connected"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {statistics.idVerified ? (
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : (
                <XCircle className="h-4 w-4 text-muted-foreground" />
              )}
              <div className="flex items-center gap-1">
                <IdCard className="h-3 w-3" />
                <span className="text-sm" data-testid="text-id-verified">
                  {statistics.idVerified ? "ID Verified" : "ID Not Verified"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Empty State for New Users */}
      {totalTransactions === 0 && (
        <Card data-testid="card-empty-state">
          <CardContent className="py-12 text-center">
            <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No transaction history yet</h3>
            <p className="text-muted-foreground">
              Start buying or selling to build your statistics and reputation.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
