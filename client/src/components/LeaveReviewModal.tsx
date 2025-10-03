import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Star, Upload, X, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface LeaveReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingId: string;
  reviewedUserId: string;
  reviewerRole: "buyer" | "seller";
  currentUserId: string;
  queryKey?: any[];
}

interface RatingCategory {
  key: string;
  label: string;
  value: number;
}

export function LeaveReviewModal({
  open,
  onOpenChange,
  listingId,
  reviewedUserId,
  reviewerRole,
  currentUserId,
  queryKey = ["/api/reviews"],
}: LeaveReviewModalProps) {
  const { toast } = useToast();
  
  const [overallRating, setOverallRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  
  const [ratings, setRatings] = useState<RatingCategory[]>([
    { key: "communicationRating", label: "Communication", value: 0 },
    { key: "asDescribedRating", label: "Item as Described", value: 0 },
    { key: "punctualityRating", label: "Punctuality", value: 0 },
    { key: "professionalismRating", label: "Professionalism", value: 0 },
  ]);
  
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [wouldTransactAgain, setWouldTransactAgain] = useState<string>("yes_definitely");
  const [photos, setPhotos] = useState<string[]>([]);

  const createReviewMutation = useMutation({
    mutationFn: async (reviewData: any) => {
      return await apiRequest("POST", "/api/reviews/create", reviewData);
    },
    onSuccess: () => {
      toast({
        title: "Review submitted",
        description: "Thank you for your feedback!",
      });
      queryClient.invalidateQueries({ queryKey });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setOverallRating(0);
    setHoverRating(0);
    setRatings(ratings.map(r => ({ ...r, value: 0 })));
    setReviewTitle("");
    setReviewText("");
    setWouldTransactAgain("yes_definitely");
    setPhotos([]);
  };

  const handleSubmit = () => {
    if (overallRating === 0) {
      toast({
        title: "Rating required",
        description: "Please provide an overall rating.",
        variant: "destructive",
      });
      return;
    }

    if (reviewText.trim().length === 0) {
      toast({
        title: "Review text required",
        description: "Please write a review.",
        variant: "destructive",
      });
      return;
    }

    const reviewData = {
      listingId,
      reviewerId: currentUserId,
      reviewedUserId,
      overallRating,
      communicationRating: ratings.find(r => r.key === "communicationRating")?.value || null,
      asDescribedRating: ratings.find(r => r.key === "asDescribedRating")?.value || null,
      punctualityRating: ratings.find(r => r.key === "punctualityRating")?.value || null,
      professionalismRating: ratings.find(r => r.key === "professionalismRating")?.value || null,
      reviewTitle: reviewTitle.trim() || null,
      reviewText: reviewText.trim(),
      reviewPhotos: photos,
      reviewerRole,
      wouldTransactAgain,
      verifiedTransaction: true,
    };

    createReviewMutation.mutate(reviewData);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileArray = Array.from(files);
    let processedCount = 0;

    // In a real app, you would upload these to object storage
    // For now, we'll just create data URLs
    fileArray.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos((prev) => {
          // Use functional update to ensure we have the latest state
          if (prev.length >= 5) {
            if (processedCount === 0) {
              toast({
                title: "Maximum photos reached",
                description: "You can upload up to 5 photos.",
                variant: "destructive",
              });
            }
            return prev;
          }
          processedCount++;
          return [...prev, reader.result as string];
        });
      };
      reader.readAsDataURL(file);
    });

    // Clear the input so the same files can be selected again if removed
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const updateRating = (key: string, value: number) => {
    setRatings((prev) =>
      prev.map((r) => (r.key === key ? { ...r, value } : r))
    );
  };

  const displayRating = hoverRating || overallRating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="modal-leave-review">
        <DialogHeader>
          <DialogTitle>Leave a Review</DialogTitle>
          <DialogDescription>
            Share your experience with this {reviewerRole === "buyer" ? "seller" : "buyer"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Overall Rating */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">Overall Rating *</Label>
            <div className="flex items-center gap-4">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setOverallRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-110"
                    data-testid={`star-overall-${star}`}
                    aria-label={`Rate ${star} stars`}
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= displayRating
                          ? "fill-primary text-primary"
                          : "fill-muted text-muted"
                      }`}
                    />
                  </button>
                ))}
              </div>
              {overallRating > 0 && (
                <span className="text-sm text-muted-foreground">
                  {overallRating}.0 / 5.0
                </span>
              )}
            </div>
          </div>

          {/* Detailed Ratings */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Detailed Ratings</Label>
            {ratings.map((rating) => (
              <div key={rating.key} className="flex items-center justify-between">
                <span className="text-sm">{rating.label}</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => updateRating(rating.key, star)}
                      className="transition-transform hover:scale-110"
                      data-testid={`star-${rating.key}-${star}`}
                      aria-label={`Rate ${rating.label} ${star} stars`}
                    >
                      <Star
                        className={`h-5 w-5 ${
                          star <= rating.value
                            ? "fill-primary text-primary"
                            : "fill-muted text-muted"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Review Title */}
          <div className="space-y-2">
            <Label htmlFor="review-title">Review Title</Label>
            <Input
              id="review-title"
              placeholder="Summarize your experience in a few words"
              value={reviewTitle}
              onChange={(e) => setReviewTitle(e.target.value)}
              maxLength={200}
              data-testid="input-review-title"
            />
            <p className="text-xs text-muted-foreground">
              {reviewTitle.length}/200 characters
            </p>
          </div>

          {/* Review Text */}
          <div className="space-y-2">
            <Label htmlFor="review-text">Your Review *</Label>
            <Textarea
              id="review-text"
              placeholder="Share details about your experience..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={5}
              data-testid="textarea-review-text"
            />
          </div>

          {/* Photos */}
          <div className="space-y-2">
            <Label>Add Photos (Optional)</Label>
            <div className="space-y-3">
              {photos.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {photos.map((photo, index) => (
                    <div
                      key={index}
                      className="relative w-20 h-20 rounded-md overflow-hidden bg-muted"
                      data-testid={`photo-preview-${index}`}
                    >
                      <img
                        src={photo}
                        alt={`Review photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 bg-background/80 rounded-full p-1 hover:bg-background"
                        data-testid={`button-remove-photo-${index}`}
                        aria-label={`Remove photo ${index + 1}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {photos.length < 5 && (
                <label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                    data-testid="input-photo-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={(e) => {
                      e.preventDefault();
                      (e.currentTarget.previousElementSibling as HTMLInputElement)?.click();
                    }}
                    data-testid="button-upload-photos"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Photos ({photos.length}/5)
                  </Button>
                </label>
              )}
            </div>
          </div>

          {/* Would Transact Again */}
          <div className="space-y-2">
            <Label>Would you transact with this {reviewerRole === "buyer" ? "seller" : "buyer"} again?</Label>
            <RadioGroup value={wouldTransactAgain} onValueChange={setWouldTransactAgain}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes_definitely" id="yes_definitely" data-testid="radio-yes-definitely" />
                <Label htmlFor="yes_definitely" className="font-normal">
                  Yes, definitely
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="maybe" id="maybe" data-testid="radio-maybe" />
                <Label htmlFor="maybe" className="font-normal">
                  Maybe
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="no" data-testid="radio-no" />
                <Label htmlFor="no" className="font-normal">
                  No
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createReviewMutation.isPending}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createReviewMutation.isPending}
            data-testid="button-submit-review"
          >
            {createReviewMutation.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Submit Review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
