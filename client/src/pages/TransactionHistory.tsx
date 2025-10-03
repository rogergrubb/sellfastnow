import { useQuery } from "@tanstack/react-query";
import { useParams, useSearch, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, XCircle, AlertTriangle, Star } from "lucide-react";
import { format } from "date-fns";

interface TransactionHistoryItem {
  eventType: string;
  createdAt: string;
  listing: {
    id: string;
    title: string;
    price: string;
    images: string[];
  };
  role: "buyer" | "seller";
  otherParty: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
  otherPartyStats?: {
    averageRating: string;
    totalReviewsReceived: number;
  };
  reviews: any[];
  cancellationComment?: {
    comment: string;
    cancelledRole: string;
    cancellationTiming?: string;
  };
}

export default function TransactionHistory() {
  const params = useParams();
  const userId = params.userId;
  const searchString = useSearch();
  const [, setLocation] = useLocation();

  // Parse query params
  const searchParams = new URLSearchParams(searchString);
  const statusFilter = searchParams.get("status") || "all";
  const roleFilter = searchParams.get("role") || "all";

  const { data: transactions, isLoading } = useQuery<TransactionHistoryItem[]>({
    queryKey: ["/api/transactions/user", userId, "history", { status: statusFilter !== "all" ? statusFilter : undefined, role: roleFilter !== "all" ? roleFilter : undefined }],
  });

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchString);
    if (value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    setLocation(`/users/${userId}/history${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const getStatusBadge = (eventType: string, role: string, cancellationComment?: any) => {
    switch (eventType) {
      case "completed":
        return (
          <Badge variant="default" className="bg-green-600 hover:bg-green-700 gap-1" data-testid={`badge-status-completed`}>
            <CheckCircle2 className="w-3 h-3" />
            COMPLETED
          </Badge>
        );
      case "cancelled":
        const cancelledBy = cancellationComment?.cancelledRole || role;
        return (
          <Badge variant="destructive" className="gap-1" data-testid={`badge-status-cancelled`}>
            <XCircle className="w-3 h-3" />
            CANCELLED BY {cancelledBy.toUpperCase()}
          </Badge>
        );
      case "buyer_noshow":
      case "seller_noshow":
        const noShowRole = eventType.split("_")[0];
        return (
          <Badge variant="secondary" className="bg-orange-600 hover:bg-orange-700 text-white gap-1" data-testid={`badge-status-noshow`}>
            <AlertTriangle className="w-3 h-3" />
            NO-SHOW BY {noShowRole.toUpperCase()}
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" data-testid={`badge-status-${eventType}`}>
            {eventType.toUpperCase()}
          </Badge>
        );
    }
  };

  const getTransactionCounts = () => {
    if (!transactions) return { completed: 0, cancelled: 0, noshow: 0 };
    
    return {
      completed: transactions.filter(t => t.eventType === "completed").length,
      cancelled: transactions.filter(t => t.eventType === "cancelled").length,
      noshow: transactions.filter(t => t.eventType.includes("noshow") || t.eventType.includes("no_show")).length,
    };
  };

  const counts = getTransactionCounts();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-6 w-96 mb-8" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" data-testid="heading-transaction-history">Transaction History</h1>
          <p className="text-muted-foreground mb-4" data-testid="text-transaction-count">
            Showing {transactions?.length || 0} transactions
          </p>
          <div className="flex gap-3 flex-wrap">
            <Badge variant="default" className="bg-green-600 hover:bg-green-700" data-testid="badge-count-completed">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              {counts.completed} completed
            </Badge>
            <Badge variant="destructive" data-testid="badge-count-cancelled">
              <XCircle className="w-3 h-3 mr-1" />
              {counts.cancelled} cancelled
            </Badge>
            <Badge variant="secondary" className="bg-orange-600 hover:bg-orange-700 text-white" data-testid="badge-count-noshow">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {counts.noshow} no-show
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={(value) => updateFilter("status", value)}>
                <SelectTrigger data-testid="select-status-filter">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="buyer_noshow">Buyer No-Show</SelectItem>
                  <SelectItem value="seller_noshow">Seller No-Show</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Role</label>
              <Select value={roleFilter} onValueChange={(value) => updateFilter("role", value)}>
                <SelectTrigger data-testid="select-role-filter">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="buyer">As Buyer</SelectItem>
                  <SelectItem value="seller">As Seller</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Transaction List */}
        {!transactions || transactions.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground text-lg" data-testid="text-no-transactions">
              No transactions yet. Start browsing!
            </p>
            <Button className="mt-4" onClick={() => setLocation("/")} data-testid="button-browse-listings">
              Browse Listings
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => {
              const userReview = transaction.reviews.find(
                (r) => r.reviewerId === userId
              );
              const otherPartyReview = transaction.reviews.find(
                (r) => r.reviewerId === transaction.otherParty.id
              );

              return (
                <Card key={transaction.listing.id + transaction.createdAt} className="p-6" data-testid={`card-transaction-${transaction.listing.id}`}>
                  {/* Status and Date */}
                  <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
                    {getStatusBadge(transaction.eventType, transaction.role, transaction.cancellationComment)}
                    <span className="text-sm text-muted-foreground" data-testid={`text-transaction-date-${transaction.listing.id}`}>
                      {format(new Date(transaction.createdAt), "MMMM d, yyyy")}
                    </span>
                  </div>

                  {/* Listing Info */}
                  <div className="flex gap-4 mb-4">
                    {transaction.listing.images && transaction.listing.images[0] && (
                      <img
                        src={transaction.listing.images[0]}
                        alt={transaction.listing.title}
                        className="w-20 h-20 object-cover rounded-md"
                        data-testid={`img-listing-${transaction.listing.id}`}
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1" data-testid={`text-listing-title-${transaction.listing.id}`}>
                        {transaction.listing.title}
                      </h3>
                      <p className="text-xl font-bold text-primary" data-testid={`text-listing-price-${transaction.listing.id}`}>
                        ${transaction.listing.price}
                      </p>
                    </div>
                  </div>

                  {/* Other Party Info */}
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={transaction.otherParty.profileImageUrl} />
                      <AvatarFallback>
                        {transaction.otherParty.firstName?.[0]}
                        {transaction.otherParty.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium" data-testid={`text-other-party-${transaction.listing.id}`}>
                        {transaction.role === "buyer" ? "Seller" : "Buyer"}:{" "}
                        {transaction.otherParty.firstName} {transaction.otherParty.lastName}
                      </p>
                      {transaction.otherPartyStats && transaction.otherPartyStats.averageRating && (
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span data-testid={`text-rating-${transaction.listing.id}`}>
                            {Number(transaction.otherPartyStats.averageRating).toFixed(1)}/5.0
                          </span>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLocation(`/users/${transaction.otherParty.id}`)}
                      data-testid={`button-view-profile-${transaction.listing.id}`}
                    >
                      View Profile
                    </Button>
                  </div>

                  <div className="mb-3">
                    <Badge variant="secondary" data-testid={`badge-role-${transaction.listing.id}`}>
                      Role: {transaction.role === "buyer" ? "Buyer" : "Seller"}
                    </Badge>
                  </div>

                  {/* Reviews */}
                  {(userReview || otherPartyReview) && (
                    <div className="border-t pt-3 mt-3 space-y-2">
                      {userReview && (
                        <div className="text-sm" data-testid={`review-user-${transaction.listing.id}`}>
                          <div className="flex items-center gap-1 mb-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">Your Review:</span>
                            <span className="text-yellow-600">{"⭐".repeat(userReview.overallRating)}</span>
                          </div>
                          <p className="text-muted-foreground">"{userReview.reviewText}"</p>
                        </div>
                      )}
                      {otherPartyReview && (
                        <div className="text-sm" data-testid={`review-other-${transaction.listing.id}`}>
                          <div className="flex items-center gap-1 mb-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">
                              {transaction.otherParty.firstName}'s Review:
                            </span>
                            <span className="text-yellow-600">
                              {"⭐".repeat(otherPartyReview.overallRating)}
                            </span>
                          </div>
                          <p className="text-muted-foreground">"{otherPartyReview.reviewText}"</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cancellation Comment */}
                  {transaction.cancellationComment && (
                    <div className="border-t pt-3 mt-3" data-testid={`cancellation-comment-${transaction.listing.id}`}>
                      <p className="text-sm font-medium mb-1">💬 Cancellation Comment:</p>
                      <p className="text-sm text-muted-foreground">
                        "{transaction.cancellationComment.comment}"
                      </p>
                      {transaction.cancellationComment.cancellationTiming && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {transaction.cancellationComment.cancellationTiming}
                        </p>
                      )}
                    </div>
                  )}

                  {/* View Details Button */}
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setLocation(`/listings/${transaction.listing.id}`)}
                      data-testid={`button-view-details-${transaction.listing.id}`}
                    >
                      View Transaction Details
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
