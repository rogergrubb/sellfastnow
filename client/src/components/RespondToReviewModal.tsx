import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Lightbulb, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ReviewWithMetadata } from "@shared/schema";

interface RespondToReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: ReviewWithMetadata;
  listingTitle?: string;
  queryKey?: any[];
}

export function RespondToReviewModal({
  isOpen,
  onClose,
  review,
  listingTitle,
  queryKey = ["/api/reviews"],
}: RespondToReviewModalProps) {
  const { toast } = useToast();
  const [responseText, setResponseText] = useState(review.sellerResponse || "");
  const isEditing = !!review.sellerResponse;

  const respondMutation = useMutation({
    mutationFn: async (text: string) => {
      return await apiRequest(`/api/reviews/${review.id}/response`, "POST", { responseText: text });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: isEditing ? "Response updated" : "Response posted",
        description: isEditing 
          ? "Your response has been successfully updated."
          : "Your response is now visible to everyone.",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to post response. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!responseText.trim()) {
      toast({
        title: "Response required",
        description: "Please write a response before submitting.",
        variant: "destructive",
      });
      return;
    }

    if (responseText.length > 500) {
      toast({
        title: "Response too long",
        description: "Response must be 500 characters or less.",
        variant: "destructive",
      });
      return;
    }

    respondMutation.mutate(responseText);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating
            ? "fill-yellow-400 text-yellow-400"
            : "fill-muted text-muted-foreground"
        }`}
      />
    ));
  };

  const charCount = responseText.length;
  const charLimit = 500;
  const isOverLimit = charCount > charLimit;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle data-testid="text-modal-title">
            {isEditing ? "Edit Your Response" : `Respond to ${review.reviewerName || "Reviewer"}'s Review`}
          </DialogTitle>
          <DialogDescription>
            {listingTitle && `Transaction: ${listingTitle}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-md">
            <Avatar className="w-10 h-10">
              <AvatarImage src={review.reviewerProfileImage} />
              <AvatarFallback>
                {review.reviewerName?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-sm" data-testid="text-reviewer-name">
                  {review.reviewerName || "Anonymous"}
                </p>
                <div className="flex items-center gap-1">
                  {renderStars(review.overallRating)}
                </div>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3" data-testid="text-review-text">
                "{review.reviewText}"
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="response-textarea">
              Your Response:
            </label>
            <Textarea
              id="response-textarea"
              data-testid="textarea-response"
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Thank you for your feedback! It was a pleasure working with you..."
              className="min-h-[120px] resize-none"
              disabled={respondMutation.isPending}
            />
            <div className="flex justify-end">
              <span
                className={`text-sm ${
                  isOverLimit ? "text-destructive font-medium" : "text-muted-foreground"
                }`}
                data-testid="text-char-count"
              >
                {charCount} / {charLimit} characters
              </span>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-md space-y-3">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
              <Lightbulb className="w-5 h-5" />
              <h4 className="font-semibold text-sm">TIPS FOR GOOD RESPONSES:</h4>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2 text-green-700 dark:text-green-400">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Thank the reviewer</span>
              </div>
              <div className="flex items-start gap-2 text-green-700 dark:text-green-400">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Keep it brief and professional</span>
              </div>
              <div className="flex items-start gap-2 text-green-700 dark:text-green-400">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Address specific points they mentioned</span>
              </div>
              <div className="flex items-start gap-2 text-green-700 dark:text-green-400">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Remain courteous even for negative reviews</span>
              </div>
              
              <Separator className="my-2" />
              
              <div className="flex items-start gap-2 text-destructive">
                <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Don't argue or be defensive</span>
              </div>
              <div className="flex items-start gap-2 text-destructive">
                <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Don't share personal contact information</span>
              </div>
              <div className="flex items-start gap-2 text-destructive">
                <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Don't request removal of negative reviews</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Note: Your response will be public and can only be edited within 24 hours.
            Be professional and thoughtful.
          </p>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={respondMutation.isPending}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={respondMutation.isPending || !responseText.trim() || isOverLimit}
              data-testid="button-submit-response"
            >
              {respondMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {isEditing ? "Update Response" : "Post Response"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
