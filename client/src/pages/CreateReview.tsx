import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Star, Upload, X, Loader2, CheckCircle2 } from "lucide-react";

interface RatingCategory {
  key: string;
  label: string;
  value: number;
}

export default function CreateReview() {
  const [, params] = useRoute("/create-review/:token");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const token = params?.token;

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
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Validate token and fetch transaction details
  const { data: tokenData, isLoading: validatingToken, error: tokenError } = useQuery<{
    valid: boolean;
    listingId: string;
    userId: string;
    listing: any;
    user: any;
  }>({
    queryKey: ['/api/reviews/validate-token', token],
    enabled: !!token,
  });

  const createReviewMutation = useMutation({
    mutationFn: async (reviewData: any) => {
      return await apiRequest("/api/reviews/create", "POST", reviewData);
    },
    onSuccess: () => {
      setReviewSubmitted(true);
      toast({
        title: "Review submitted",
        description: "Thank you for your feedback!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRatingClick = (categoryKey: string | null, value: number) => {
    if (categoryKey === null) {
      setOverallRating(value);
    } else {
      setRatings(prev =>
        prev.map(cat => (cat.key === categoryKey ? { ...cat, value } : cat))
      );
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setPhotos(prev => [...prev, reader.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleSubmit = () => {
    if (!overallRating) {
      toast({
        title: "Missing rating",
        description: "Please provide an overall rating.",
        variant: "destructive",
      });
      return;
    }

    if (!reviewText.trim()) {
      toast({
        title: "Missing review",
        description: "Please write a review.",
        variant: "destructive",
      });
      return;
    }

    if (!tokenData) return;

    const reviewData = {
      listingId: tokenData.listingId,
      reviewedUserId: tokenData.listing.sellerId,
      reviewerRole: "buyer",
      overallRating,
      ...ratings.reduce((acc, cat) => ({ ...acc, [cat.key]: cat.value }), {}),
      reviewTitle: reviewTitle.trim(),
      reviewText: reviewText.trim(),
      wouldTransactAgain,
      photos,
    };

    createReviewMutation.mutate(reviewData);
  };

  const renderStars = (
    currentValue: number,
    hoverValue: number,
    onHover: (value: number) => void,
    onClick: (value: number) => void,
    categoryKey: string | null = null
  ) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => onHover(star)}
            onMouseLeave={() => onHover(0)}
            onClick={() => onClick(star)}
            className="focus:outline-none transition-transform hover:scale-110"
            data-testid={`star-${categoryKey || 'overall'}-${star}`}
          >
            <Star
              className={`w-6 h-6 ${
                star <= (hoverValue || currentValue)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (validatingToken) {
    return (
      <div className="container mx-auto py-12 px-4 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Validating your review link...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (tokenError || !tokenData) {
    return (
      <div className="container mx-auto py-12 px-4 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Invalid Link</CardTitle>
            <CardDescription>
              This review link is invalid, has expired, or has already been used.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")} className="w-full" data-testid="button-go-home">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (reviewSubmitted) {
    return (
      <div className="container mx-auto py-12 px-4 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-center">Review Submitted!</CardTitle>
            <CardDescription className="text-center">
              Thank you for sharing your feedback. Your review helps build trust in our community.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => navigate("/")} className="w-full" data-testid="button-browse-listings">
              Browse Listings
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate(`/profile/${tokenData.listing.sellerId}`)} 
              className="w-full"
              data-testid="button-view-seller-profile"
            >
              View Seller Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Leave a Review</CardTitle>
          <CardDescription>
            Share your experience with this transaction
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Transaction Details */}
          <div className="bg-muted rounded-lg p-4">
            <h3 className="font-semibold mb-2">Transaction Details</h3>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Item:</span> {tokenData.listing.title}
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Seller:</span> {tokenData.listing.seller?.username || 'Unknown'}
            </p>
          </div>

          {/* Overall Rating */}
          <div>
            <Label className="text-base font-semibold mb-3 block">
              Overall Rating <span className="text-destructive">*</span>
            </Label>
            {renderStars(
              overallRating,
              hoverRating,
              setHoverRating,
              (value) => handleRatingClick(null, value)
            )}
          </div>

          {/* Detailed Ratings */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Detailed Ratings</Label>
            {ratings.map((category) => (
              <div key={category.key} className="flex items-center justify-between">
                <span className="text-sm">{category.label}</span>
                {renderStars(
                  category.value,
                  0,
                  () => {},
                  (value) => handleRatingClick(category.key, value),
                  category.key
                )}
              </div>
            ))}
          </div>

          {/* Review Title */}
          <div>
            <Label htmlFor="review-title">Review Title (Optional)</Label>
            <Input
              id="review-title"
              placeholder="Sum up your experience"
              value={reviewTitle}
              onChange={(e) => setReviewTitle(e.target.value)}
              maxLength={100}
              data-testid="input-review-title"
            />
          </div>

          {/* Review Text */}
          <div>
            <Label htmlFor="review-text">
              Your Review <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="review-text"
              placeholder="Share details about your experience..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={6}
              data-testid="input-review-text"
            />
          </div>

          {/* Would Transact Again */}
          <div>
            <Label className="text-base font-semibold mb-3 block">
              Would you transact with this person again?
            </Label>
            <RadioGroup value={wouldTransactAgain} onValueChange={setWouldTransactAgain}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes_definitely" id="yes_definitely" data-testid="radio-yes-definitely" />
                <Label htmlFor="yes_definitely" className="font-normal cursor-pointer">
                  Yes, definitely
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes_probably" id="yes_probably" data-testid="radio-yes-probably" />
                <Label htmlFor="yes_probably" className="font-normal cursor-pointer">
                  Yes, probably
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="not_sure" id="not_sure" data-testid="radio-not-sure" />
                <Label htmlFor="not_sure" className="font-normal cursor-pointer">
                  Not sure
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no_probably_not" id="no_probably_not" data-testid="radio-no-probably-not" />
                <Label htmlFor="no_probably_not" className="font-normal cursor-pointer">
                  No, probably not
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no_definitely_not" id="no_definitely_not" data-testid="radio-no-definitely-not" />
                <Label htmlFor="no_definitely_not" className="font-normal cursor-pointer">
                  No, definitely not
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Photo Upload */}
          <div>
            <Label className="text-base font-semibold mb-3 block">
              Add Photos (Optional)
            </Label>
            <div className="space-y-3">
              {photos.length > 0 && (
                <div className="grid grid-cols-5 gap-2">
                  {photos.map((photo, idx) => (
                    <div key={idx} className="relative aspect-square">
                      <img
                        src={photo}
                        alt={`Review photo ${idx + 1}`}
                        className="w-full h-full object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => setPhotos(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                        data-testid={`button-remove-photo-${idx}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {photos.length < 5 && (
                <div>
                  <input
                    type="file"
                    id="photo-upload"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <Label
                    htmlFor="photo-upload"
                    className="flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 cursor-pointer hover-elevate"
                    data-testid="button-upload-photo"
                  >
                    <Upload className="h-5 w-5" />
                    <span>Upload Photos ({photos.length}/5)</span>
                  </Label>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              className="flex-1"
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createReviewMutation.isPending}
              className="flex-1"
              data-testid="button-submit-review"
            >
              {createReviewMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Submit Review
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
