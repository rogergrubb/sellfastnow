import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import SellerMeetupInterface from "@/components/SellerMeetupInterface";

export default function SellerMeetupPage() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const listingId = params.id;

  // Fetch listing details
  const { data: listing, isLoading, error } = useQuery({
    queryKey: ['listing', listingId],
    queryFn: async () => {
      const response = await fetch(`/api/listings/${listingId}`);
      if (!response.ok) {
        throw new Error('Failed to load listing');
      }
      return response.json();
    },
    enabled: !!listingId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading listing...</p>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Listing Not Found</h2>
          <p className="text-gray-600 mb-4">
            {error instanceof Error ? error.message : 'This listing could not be found.'}
          </p>
          <Button onClick={() => setLocation('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Button
          variant="ghost"
          onClick={() => setLocation(`/listings/${listingId}`)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Listing
        </Button>

        <SellerMeetupInterface
          listingId={listingId!}
          listingTitle={listing.title}
          originalPrice={parseFloat(listing.price)}
        />
      </div>
    </div>
  );
}

