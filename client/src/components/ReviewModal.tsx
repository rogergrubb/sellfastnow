import { useState } from "react";
import { X } from "lucide-react";
import { InteractiveStarRating } from "./StarRating";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
  transactionId?: string;
  reviewedUserId: string;
  reviewedUserName: string;
  reviewerRole: "buyer" | "seller";
}

export default function ReviewModal({
  isOpen,
  onClose,
  listingId,
  transactionId,
  reviewedUserId,
  reviewedUserName,
  reviewerRole,
}: ReviewModalProps) {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    overallRating: 10, // Default 5 stars (10/2)
    communicationRating: 10,
    asDescribedRating: 10,
    punctualityRating: 10,
    professionalismRating: 10,
    reviewTitle: "",
    reviewText: "",
    wouldTransactAgain: "yes_definitely" as "yes_definitely" | "maybe" | "no",
  });

  const createReviewMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit review");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      queryClient.invalidateQueries({ queryKey: ["userStats"] });
      onClose();
      // Reset form
      setFormData({
        overallRating: 10,
        communicationRating: 10,
        asDescribedRating: 10,
        punctualityRating: 10,
        professionalismRating: 10,
        reviewTitle: "",
        reviewText: "",
        wouldTransactAgain: "yes_definitely",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    createReviewMutation.mutate({
      listingId,
      transactionId,
      reviewedUserId,
      reviewerRole,
      ...formData,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            Leave a Review for {reviewedUserName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Overall Rating */}
          <InteractiveStarRating
            label="Overall Experience"
            value={formData.overallRating}
            onChange={(value) =>
              setFormData({ ...formData, overallRating: value })
            }
            required
          />

          {/* Category Ratings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InteractiveStarRating
              label="Communication"
              value={formData.communicationRating}
              onChange={(value) =>
                setFormData({ ...formData, communicationRating: value })
              }
            />

            <InteractiveStarRating
              label={reviewerRole === "buyer" ? "Item as Described" : "Payment & Reliability"}
              value={formData.asDescribedRating}
              onChange={(value) =>
                setFormData({ ...formData, asDescribedRating: value })
              }
            />

            <InteractiveStarRating
              label="Punctuality"
              value={formData.punctualityRating}
              onChange={(value) =>
                setFormData({ ...formData, punctualityRating: value })
              }
            />

            <InteractiveStarRating
              label="Professionalism"
              value={formData.professionalismRating}
              onChange={(value) =>
                setFormData({ ...formData, professionalismRating: value })
              }
            />
          </div>

          {/* Review Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review Title (Optional)
            </label>
            <input
              type="text"
              value={formData.reviewTitle}
              onChange={(e) =>
                setFormData({ ...formData, reviewTitle: e.target.value })
              }
              placeholder="Sum up your experience"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={200}
            />
          </div>

          {/* Review Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Review <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.reviewText}
              onChange={(e) =>
                setFormData({ ...formData, reviewText: e.target.value })
              }
              placeholder="Share details about your experience..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={5}
              required
              minLength={20}
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimum 20 characters
            </p>
          </div>

          {/* Would Transact Again */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Would you transact with this user again?
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="wouldTransactAgain"
                  value="yes_definitely"
                  checked={formData.wouldTransactAgain === "yes_definitely"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      wouldTransactAgain: e.target.value as any,
                    })
                  }
                  className="mr-2"
                />
                Yes, definitely
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="wouldTransactAgain"
                  value="maybe"
                  checked={formData.wouldTransactAgain === "maybe"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      wouldTransactAgain: e.target.value as any,
                    })
                  }
                  className="mr-2"
                />
                Maybe
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="wouldTransactAgain"
                  value="no"
                  checked={formData.wouldTransactAgain === "no"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      wouldTransactAgain: e.target.value as any,
                    })
                  }
                  className="mr-2"
                />
                No
              </label>
            </div>
          </div>

          {/* Verified Transaction Badge */}
          {transactionId && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-700">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium">Verified Transaction</span>
              </div>
              <p className="text-sm text-blue-600 mt-1">
                This review is from a confirmed transaction on SellFast.Now
              </p>
            </div>
          )}

          {/* Error Message */}
          {createReviewMutation.isError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {createReviewMutation.error instanceof Error
                ? createReviewMutation.error.message
                : "Failed to submit review"}
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              disabled={createReviewMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
              disabled={createReviewMutation.isPending}
            >
              {createReviewMutation.isPending ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

