import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/AuthContext";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ListingPaymentSuccess() {
  const [, setLocation] = useLocation();
  const { getToken } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [listingId, setListingId] = useState<string | null>(null);

  useEffect(() => {
    const processPayment = async () => {
      // Get session_id from URL
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get('session_id');

      if (!sessionId) {
        setStatus('error');
        setMessage('No payment session found');
        return;
      }

      try {
        // Verify the payment session
        const token = await getToken();
        const verifyResponse = await fetch(`/api/listing-fee/verify-session/${sessionId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!verifyResponse.ok) {
          throw new Error('Failed to verify payment');
        }

        const verifyData = await verifyResponse.json();
        const { status: paymentStatus, paymentIntentId } = verifyData;

        if (paymentStatus !== 'paid') {
          setStatus('error');
          setMessage('Payment was not completed');
          return;
        }

        // Try to get listing data from localStorage first
        let listingData = null;
        const listingDataJson = localStorage.getItem(`pending_listing_${sessionId}`);
        if (listingDataJson) {
          listingData = JSON.parse(listingDataJson);
          localStorage.removeItem(`pending_listing_${sessionId}`);
        }

        // If we have listing data, try to create it
        if (listingData) {
          const listingResponse = await fetch('/api/listings', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              ...listingData,
              paymentSessionId: sessionId,
            }),
          });

          if (!listingResponse.ok) {
            const error = await listingResponse.json();
            throw new Error(error.message || 'Failed to create listing');
          }

          const listing = await listingResponse.json();
          setListingId(listing.id);
          setStatus('success');
          setMessage('Your listing has been published successfully!');
        } else {
          // Payment succeeded but no listing data in localStorage
          // This can happen if localStorage was cleared or browser restrictions apply
          // Show success - the listing may have already been created or will be processed
          setStatus('success');
          setMessage('Payment completed! Your listing is being processed. Please check My Listings for your item.');
        }

      } catch (error: any) {
        console.error('Error processing payment:', error);
        setStatus('error');
        setMessage(error.message || 'Failed to process payment');
      }
    };

    processPayment();
  }, [getToken]);

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              Processing Payment...
            </CardTitle>
            <CardDescription>
              Please wait while we verify your payment and publish your listing.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-6 w-6" />
              Payment Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button onClick={() => setLocation('/post-ad')} variant="outline">
                Try Again
              </Button>
              <Button onClick={() => setLocation('/my-listings')}>
                My Listings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-6 w-6" />
            Listing Published!
          </CardTitle>
          <CardDescription>
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Your payment has been processed and your listing is now live on SellFast.Now!
            </AlertDescription>
          </Alert>
          <div className="flex gap-2">
            {listingId && (
              <Button onClick={() => setLocation(`/listing/${listingId}`)}>
                View Listing
              </Button>
            )}
            <Button onClick={() => setLocation('/my-listings')} variant="outline">
              My Listings
            </Button>
            <Button onClick={() => setLocation('/post-ad')} variant="outline">
              Post Another
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
