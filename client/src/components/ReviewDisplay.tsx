// Review Display Component
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Star, ThumbsUp, ThumbsDown, MessageSquare, CheckCircle2, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface Review {
  id: string;
  listingId: string;
  transactionId: string | null;
  reviewerId: string;
  reviewedUserId: string;
  overallRating: number;
  communicationRating: number | null;
  asDescribedRating: number | null;
  punctualityRating: number | null;
  professionalismRating: number | null;
  reviewTitle: string | null;
  reviewText: string;
  reviewerRole: string;
  verifiedTransaction: boolean;
  wouldTransactAgain: string | null;
  sellerResponse: string | null;
  sellerResponseAt: string | null;
  helpfulCount: number;
  notHelpfulCount: number;
  isPublic: boolean;
  isFlagged: boolean;
  createdAt: string;
  reviewer?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  };
}

interface ReviewDisplayProps {
  review: Review;
  showResponse?: boolean;
  allowResponse?: boolean;
}

export function ReviewDisplay({ review, showResponse = true, allowResponse = false }: ReviewDisplayProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isResponding, setIsResponding] = useState(false);
  const [responseText, setResponseText] = useState("");

  // Convert 1-10 rating to 0.5-5.0 stars
  const displayRating = review.overallRating / 2;

  // Submit response mutation
  const submitResponseMutation = useMutation({
    mutationFn: async (response: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/reviews/${review.id}/response`, {
        method: "POST",
        headers,
        body: JSON.stringify({ responseText: response }),
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to submit response");
      }

      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Response posted!",
        description: "Your response has been added to the review",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/reviews/user/${review.reviewedUserId}`] });
      setIsResponding(false);
      setResponseText("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mark helpful mutation
  const markHelpfulMutation = useMutation({
    mutationFn: async (helpful: boolean) => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/reviews/${review.id}/helpful`, {
        method: "POST",
        headers,
        body: JSON.stringify({ helpful }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to update review");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/reviews/user/${review.reviewedUserId}`] });
    },
  });

  const handleSubmitResponse = () => {
    if (!responseText.trim()) {
      toast({
        title: "Error",
        description: "Please write a response",
        variant: "destructive",
      });
      return;
    }
    submitResponseMutation.mutate(responseText.trim());
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" style={{ clipPath: "inset(0 50% 0 0)" }} />
        );
      } else {
        stars.push(
          <Star key={i} className="h-4 w-4 fill-gray-200 text-gray-200" />
        );
      }
    }

    return stars;
  };

  const getInitials = (firstName: string | null, lastName: string | null) => {
    const first = firstName?.[0] || "";
    const last = lastName?.[0] || "";
    return (first + last).toUpperCase() || "?";
  };

  const getWouldTransactText = (value: string | null) => {
    switch (value) {
      case "yes_definitely":
        return "Would transact again";
      case "maybe":
        return "Might transact again";
      case "no":
        return "Would not transact again";
      default:
        return null;
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Avatar>
              <AvatarImage src={review.reviewer?.profileImageUrl || undefined} />
              <AvatarFallback>
                {getInitials(review.reviewer?.firstName || null, review.reviewer?.lastName || null)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold">
                  {review.reviewer?.firstName} {review.reviewer?.lastName}
                </p>
                {review.verifiedTransaction && (
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Verified Purchase
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex">{renderStars(displayRating)}</div>
                <span className="text-sm text-muted-foreground">
                  {displayRating.toFixed(1)}
                </span>
                <span className="text-sm text-muted-foreground">
                  • {format(new Date(review.createdAt), "MMM d, yyyy")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Review Title */}
        {review.reviewTitle && (
          <h4 className="font-semibold">{review.reviewTitle}</h4>
        )}

        {/* Review Text */}
        <p className="text-sm">{review.reviewText}</p>

        {/* Detailed Ratings */}
        {(review.communicationRating || review.asDescribedRating || review.punctualityRating || review.professionalismRating) && (
          <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t">
            {review.communicationRating && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Communication:</span>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span>{(review.communicationRating / 2).toFixed(1)}</span>
                </div>
              </div>
            )}
            {review.asDescribedRating && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">As Described:</span>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span>{(review.asDescribedRating / 2).toFixed(1)}</span>
                </div>
              </div>
            )}
            {review.punctualityRating && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Punctuality:</span>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span>{(review.punctualityRating / 2).toFixed(1)}</span>
                </div>
              </div>
            )}
            {review.professionalismRating && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Professionalism:</span>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span>{(review.professionalismRating / 2).toFixed(1)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Would Transact Again */}
        {review.wouldTransactAgain && (
          <div className="text-sm">
            <Badge variant={review.wouldTransactAgain === "yes_definitely" ? "default" : "secondary"}>
              {getWouldTransactText(review.wouldTransactAgain)}
            </Badge>
          </div>
        )}

        {/* Seller Response */}
        {showResponse && review.sellerResponse && (
          <div className="bg-muted p-4 rounded-lg mt-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4" />
              <span className="font-semibold text-sm">Response from seller</span>
              {review.sellerResponseAt && (
                <span className="text-xs text-muted-foreground">
                  • {format(new Date(review.sellerResponseAt), "MMM d, yyyy")}
                </span>
              )}
            </div>
            <p className="text-sm">{review.sellerResponse}</p>
          </div>
        )}

        {/* Response Form */}
        {allowResponse && user?.id === review.reviewedUserId && !review.sellerResponse && (
          <div className="pt-4 border-t">
            {!isResponding ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsResponding(true)}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Respond to Review
              </Button>
            ) : (
              <div className="space-y-2">
                <Textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Write your response..."
                  className="min-h-[80px]"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSubmitResponse}
                    disabled={submitResponseMutation.isPending || !responseText.trim()}
                  >
                    {submitResponseMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      "Post Response"
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsResponding(false);
                      setResponseText("");
                    }}
                    disabled={submitResponseMutation.isPending}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Helpful Buttons */}
        <div className="flex items-center gap-4 pt-2 border-t text-sm">
          <span className="text-muted-foreground">Was this review helpful?</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markHelpfulMutation.mutate(true)}
            disabled={markHelpfulMutation.isPending}
          >
            <ThumbsUp className="h-4 w-4 mr-1" />
            {review.helpfulCount}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markHelpfulMutation.mutate(false)}
            disabled={markHelpfulMutation.isPending}
          >
            <ThumbsDown className="h-4 w-4 mr-1" />
            {review.notHelpfulCount}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

