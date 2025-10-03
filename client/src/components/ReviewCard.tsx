import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Star, ThumbsUp, ThumbsDown, MoreVertical, Flag, CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ReviewWithMetadata } from "@shared/schema";

interface ReviewCardProps {
  review: ReviewWithMetadata;
  currentUserId?: string;
  showReviewer?: boolean;
  onRespond?: (reviewId: string) => void;
  queryKey?: any[];
}

export function ReviewCard({ 
  review, 
  currentUserId, 
  showReviewer = true, 
  onRespond,
  queryKey = ["/api/reviews"]
}: ReviewCardProps) {
  const { toast } = useToast();
  const [userVote, setUserVote] = useState<string | null>(null);
  const [isFlagged, setIsFlagged] = useState(review.isFlagged);

  const voteMutation = useMutation({
    mutationFn: async (voteType: string) => {
      return await apiRequest(`/api/reviews/${review.id}/vote`, "POST", { voteType });
    },
    onMutate: async (voteType) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });
      
      // Snapshot previous value
      const previousData = queryClient.getQueryData(queryKey);
      
      // Optimistically update counts
      queryClient.setQueryData(queryKey, (old: any) => {
        if (Array.isArray(old)) {
          return old.map((r: ReviewWithMetadata) => {
            if (r.id === review.id) {
              const helpfulDelta = voteType === "helpful" && userVote !== "helpful" ? 1 : userVote === "helpful" ? -1 : 0;
              const notHelpfulDelta = voteType === "not_helpful" && userVote !== "not_helpful" ? 1 : userVote === "not_helpful" ? -1 : 0;
              
              return {
                ...r,
                helpfulCount: (r.helpfulCount || 0) + helpfulDelta,
                notHelpfulCount: (r.notHelpfulCount || 0) + notHelpfulDelta,
              };
            }
            return r;
          });
        }
        return old;
      });
      
      return { previousData };
    },
    onSuccess: (data, voteType) => {
      setUserVote(voteType);
      toast({
        title: "Vote recorded",
        description: "Thank you for your feedback!",
      });
    },
    onError: (_error, _voteType, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      toast({
        title: "Error",
        description: "Failed to record vote. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const flagMutation = useMutation({
    mutationFn: async (reason: string) => {
      return await apiRequest(`/api/reviews/${review.id}/flag`, "PUT", { reason });
    },
    onSuccess: () => {
      setIsFlagged(true);
      toast({
        title: "Review flagged",
        description: "Thank you for reporting. We'll review this content.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to flag review. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleVote = (voteType: string) => {
    if (!currentUserId) {
      toast({
        title: "Sign in required",
        description: "Please sign in to vote on reviews.",
        variant: "destructive",
      });
      return;
    }
    if (voteMutation.isPending) return;
    voteMutation.mutate(voteType);
  };

  const handleFlag = (reason: string) => {
    if (!currentUserId) {
      toast({
        title: "Sign in required",
        description: "Please sign in to flag reviews.",
        variant: "destructive",
      });
      return;
    }
    if (isFlagged) {
      toast({
        title: "Already flagged",
        description: "You have already flagged this review.",
      });
      return;
    }
    flagMutation.mutate(reason);
  };

  const canRespond = currentUserId && review.reviewedUserId === currentUserId && !review.sellerResponse;

  return (
    <Card className="overflow-hidden" data-testid={`card-review-${review.id}`}>
      <CardContent className="pt-6 space-y-4">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 space-y-3">
            {/* Star Rating */}
            <div className="flex items-center gap-2">
              <div className="flex" role="img" aria-label={`${review.overallRating} out of 5 stars`}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= review.overallRating
                        ? "fill-primary text-primary"
                        : "fill-muted text-muted"
                    }`}
                    data-testid={`star-${star}-${review.id}`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium" data-testid={`text-rating-${review.id}`}>
                {review.overallRating}.0
              </span>
            </div>

            {/* Reviewer Info */}
            {showReviewer && (
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={review.reviewerProfileImage || undefined} />
                  <AvatarFallback className="text-xs">
                    {review.reviewerName?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium" data-testid={`text-reviewer-${review.id}`}>
                  {review.reviewerName || "Anonymous"}
                </span>
                <span className="text-sm text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground" data-testid={`text-date-${review.id}`}>
                  {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : "N/A"}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {review.verifiedTransaction && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="gap-1" data-testid={`badge-verified-${review.id}`}>
                    <CheckCircle2 className="h-3 w-3" />
                    Verified
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>This review is from a verified transaction</p>
                </TooltipContent>
              </Tooltip>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" data-testid={`button-menu-${review.id}`} aria-label="Review options">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={() => handleFlag("Inappropriate content")} 
                  data-testid={`button-flag-inappropriate-${review.id}`}
                  disabled={isFlagged || flagMutation.isPending}
                >
                  {flagMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Flag className="h-4 w-4 mr-2" />
                  )}
                  Flag as inappropriate
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleFlag("Spam")}
                  disabled={isFlagged || flagMutation.isPending}
                  data-testid={`button-flag-spam-${review.id}`}
                >
                  <Flag className="h-4 w-4 mr-2" />
                  Flag as spam
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleFlag("False information")}
                  disabled={isFlagged || flagMutation.isPending}
                >
                  <Flag className="h-4 w-4 mr-2" />
                  Flag as false information
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Review Title */}
        {review.reviewTitle && (
          <h3 className="font-semibold" data-testid={`text-review-title-${review.id}`}>
            {review.reviewTitle}
          </h3>
        )}

        {/* Review Text */}
        {review.reviewText && (
          <p className="text-sm leading-relaxed" data-testid={`text-review-${review.id}`}>
            {review.reviewText}
          </p>
        )}

        {/* Review Photos */}
        {review.reviewPhotos && review.reviewPhotos.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {review.reviewPhotos.map((photo, index) => (
              <button
                key={index}
                className="relative w-20 h-20 rounded-md overflow-hidden bg-muted hover-elevate"
                data-testid={`image-review-${review.id}-${index}`}
                aria-label={`Review photo ${index + 1}`}
              >
                <img
                  src={photo}
                  alt={`Review photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Detailed Ratings */}
        {(review.communicationRating || review.asDescribedRating || review.punctualityRating || review.professionalismRating) && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-2">
            {review.communicationRating && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Communication</p>
                <div className="flex justify-center mt-1" role="img" aria-label={`Communication: ${review.communicationRating} stars`}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3 w-3 ${
                        star <= review.communicationRating!
                          ? "fill-primary text-primary"
                          : "fill-muted text-muted"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
            {review.asDescribedRating && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground">As Described</p>
                <div className="flex justify-center mt-1" role="img" aria-label={`As described: ${review.asDescribedRating} stars`}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3 w-3 ${
                        star <= review.asDescribedRating!
                          ? "fill-primary text-primary"
                          : "fill-muted text-muted"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
            {review.punctualityRating && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Punctuality</p>
                <div className="flex justify-center mt-1" role="img" aria-label={`Punctuality: ${review.punctualityRating} stars`}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3 w-3 ${
                        star <= review.punctualityRating!
                          ? "fill-primary text-primary"
                          : "fill-muted text-muted"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
            {review.professionalismRating && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Professionalism</p>
                <div className="flex justify-center mt-1" role="img" aria-label={`Professionalism: ${review.professionalismRating} stars`}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3 w-3 ${
                        star <= review.professionalismRating!
                          ? "fill-primary text-primary"
                          : "fill-muted text-muted"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Seller Response */}
        {review.sellerResponse && (
          <>
            <Separator />
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium">Seller Response</p>
              <p className="text-sm text-muted-foreground" data-testid={`text-response-${review.id}`}>
                {review.sellerResponse}
              </p>
              {review.sellerResponseAt && (
                <p className="text-xs text-muted-foreground">
                  {new Date(review.sellerResponseAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </>
        )}

        {/* Action Buttons */}
        <Separator />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote("helpful")}
              disabled={voteMutation.isPending || !currentUserId}
              className={userVote === "helpful" ? "text-primary" : ""}
              data-testid={`button-helpful-${review.id}`}
              aria-label="Mark review as helpful"
            >
              {voteMutation.isPending && userVote === "helpful" ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <ThumbsUp className="h-4 w-4 mr-1" />
              )}
              Helpful ({review.helpfulCount || 0})
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote("not_helpful")}
              disabled={voteMutation.isPending || !currentUserId}
              className={userVote === "not_helpful" ? "text-primary" : ""}
              data-testid={`button-not-helpful-${review.id}`}
              aria-label="Mark review as not helpful"
            >
              {voteMutation.isPending && userVote === "not_helpful" ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <ThumbsDown className="h-4 w-4 mr-1" />
              )}
              ({review.notHelpfulCount || 0})
            </Button>
          </div>

          {canRespond && onRespond && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRespond(review.id)}
              data-testid={`button-respond-${review.id}`}
            >
              Respond
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
