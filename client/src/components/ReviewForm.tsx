// Review Form Component
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Star, Loader2 } from "lucide-react";

interface ReviewFormProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId: string;
  listingId: string;
  reviewedUserId: string;
  reviewedUserName: string;
  reviewerRole: "buyer" | "seller";
}

export function ReviewForm({
  isOpen,
  onClose,
  transactionId,
  listingId,
  reviewedUserId,
  reviewedUserName,
  reviewerRole,
}: ReviewFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state (ratings are 1-10 internally, displayed as 0.5-5.0 stars)
  const [overallRating, setOverallRating] = useState(10); // Default 5 stars
  const [communicationRating, setCommunicationRating] = useState(10);
  const [asDescribedRating, setAsDescribedRating] = useState(10);
  const [punctualityRating, setPunctualityRating] = useState(10);
  const [professionalismRating, setProfessionalismRating] = useState(10);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [wouldTransactAgain, setWouldTransactAgain] = useState<string>("yes_definitely");

  // Submit review mutation
  const submitReviewMutation = useMutation({
    mutationFn: async (reviewData: any) => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch("/api/reviews", {
        method: "POST",
        headers,
        body: JSON.stringify(reviewData),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to submit review");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Review submitted!",
        description: "Thank you for your feedback",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/reviews/user/${reviewedUserId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/reviews/transaction/${transactionId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/reviews/stats/${reviewedUserId}`] });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!reviewText.trim()) {
      toast({
        title: "Error",
        description: "Please write a review",
        variant: "destructive",
      });
      return;
    }

    submitReviewMutation.mutate({
      transactionId,
      listingId,
      reviewedUserId,
      overallRating,
      communicationRating,
      asDescribedRating,
      punctualityRating,
      professionalismRating,
      reviewTitle: reviewTitle.trim() || null,
      reviewText: reviewText.trim(),
      reviewerRole,
      wouldTransactAgain,
    });
  };

  const StarRating = ({ value, onChange, label }: { value: number; onChange: (val: number) => void; label: string }) => {
    const displayValue = value / 2; // Convert 1-10 to 0.5-5.0

    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star * 2)}
              className="focus:outline-none transition-transform hover:scale-110"
            >
              <Star
                className={`h-6 w-6 ${
                  star <= displayValue
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-gray-200 text-gray-200"
                }`}
              />
            </button>
          ))}
          <span className="text-sm text-muted-foreground ml-2">
            {displayValue.toFixed(1)} stars
          </span>
        </div>
      </div>
    );
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review {reviewedUserName}</DialogTitle>
          <DialogDescription>
            Share your experience with this {reviewerRole === "buyer" ? "seller" : "buyer"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Overall Rating */}
          <StarRating
            value={overallRating}
            onChange={setOverallRating}
            label="Overall Rating *"
          />

          {/* Detailed Ratings */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-semibold text-sm">Detailed Ratings</h4>
            
            <StarRating
              value={communicationRating}
              onChange={setCommunicationRating}
              label="Communication"
            />

            <StarRating
              value={asDescribedRating}
              onChange={setAsDescribedRating}
              label={reviewerRole === "buyer" ? "Item as Described" : "Transaction Quality"}
            />

            <StarRating
              value={punctualityRating}
              onChange={setPunctualityRating}
              label="Punctuality"
            />

            <StarRating
              value={professionalismRating}
              onChange={setProfessionalismRating}
              label="Professionalism"
            />
          </div>

          {/* Review Title */}
          <div className="space-y-2">
            <Label htmlFor="reviewTitle">Review Title (Optional)</Label>
            <Input
              id="reviewTitle"
              value={reviewTitle}
              onChange={(e) => setReviewTitle(e.target.value)}
              placeholder="Summarize your experience"
              maxLength={200}
            />
          </div>

          {/* Review Text */}
          <div className="space-y-2">
            <Label htmlFor="reviewText">Your Review *</Label>
            <Textarea
              id="reviewText"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share details about your experience..."
              className="min-h-[120px]"
              required
            />
          </div>

          {/* Would Transact Again */}
          <div className="space-y-2">
            <Label>Would you transact with them again?</Label>
            <RadioGroup value={wouldTransactAgain} onValueChange={setWouldTransactAgain}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes_definitely" id="yes_definitely" />
                <Label htmlFor="yes_definitely" className="font-normal cursor-pointer">
                  Yes, definitely
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="maybe" id="maybe" />
                <Label htmlFor="maybe" className="font-normal cursor-pointer">
                  Maybe
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="no" />
                <Label htmlFor="no" className="font-normal cursor-pointer">
                  No
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={submitReviewMutation.isPending || !reviewText.trim()}
              className="flex-1"
            >
              {submitReviewMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Review"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={submitReviewMutation.isPending}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

