import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useListingShareStats } from "@/hooks/useSocialShareTracking";
import { Facebook, Twitter, MessageCircle, Copy, Share2, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ShareStatisticsProps {
  listingId: string;
}

export function ShareStatistics({ listingId }: ShareStatisticsProps) {
  const { data: stats, isLoading } = useListingShareStats(listingId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats || stats.totalShares === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Statistics
          </CardTitle>
          <CardDescription>
            No shares yet. Share this listing to track engagement!
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Share Statistics
        </CardTitle>
        <CardDescription>
          This listing has been shared {stats.totalShares} time{stats.totalShares !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Total Shares */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="font-medium">Total Shares</span>
            </div>
            <span className="text-2xl font-bold">{stats.totalShares}</span>
          </div>

          {/* Platform Breakdown */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">By Platform</h4>
            
            {stats.facebookShares > 0 && (
              <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                <div className="flex items-center gap-2">
                  <Facebook className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Facebook</span>
                </div>
                <span className="text-sm font-medium">{stats.facebookShares}</span>
              </div>
            )}

            {stats.twitterShares > 0 && (
              <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                <div className="flex items-center gap-2">
                  <Twitter className="h-4 w-4 text-sky-500" />
                  <span className="text-sm">Twitter / X</span>
                </div>
                <span className="text-sm font-medium">{stats.twitterShares}</span>
              </div>
            )}

            {stats.whatsappShares > 0 && (
              <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">WhatsApp</span>
                </div>
                <span className="text-sm font-medium">{stats.whatsappShares}</span>
              </div>
            )}

            {stats.copyLinkShares > 0 && (
              <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                <div className="flex items-center gap-2">
                  <Copy className="h-4 w-4 text-gray-600" />
                  <span className="text-sm">Link Copied</span>
                </div>
                <span className="text-sm font-medium">{stats.copyLinkShares}</span>
              </div>
            )}
          </div>

          {/* Last Shared */}
          {stats.lastSharedAt && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                Last shared {new Date(stats.lastSharedAt).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

