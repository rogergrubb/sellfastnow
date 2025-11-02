import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, CreditCard, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface PhotoUnlockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photoCount: number;
  listingId?: number;
  onSuccess: () => void;
}

function PaymentForm({ photoCount, listingId, onSuccess, onCancel }: {
  photoCount: number;
  listingId?: number;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { getToken } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Confirm payment
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message || 'Payment failed');
        setProcessing(false);
        return;
      }

      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/post-ad',
        },
        redirect: 'if_required',
      });

      if (confirmError) {
        setError(confirmError.message || 'Payment failed');
        setProcessing(false);
        return;
      }

      // Payment successful
      onSuccess();
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'An error occurred during payment');
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={processing}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || processing}
          className="flex-1"
        >
          {processing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Pay $0.99
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

export function PhotoUnlockModal({
  open,
  onOpenChange,
  photoCount,
  listingId,
  onSuccess,
}: PhotoUnlockModalProps) {
  const { getToken } = useAuth();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [photoUnlockId, setPhotoUnlockId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Create payment intent when modal opens
  const handleOpenChange = async (newOpen: boolean) => {
    if (newOpen && !clientSecret) {
      setLoading(true);
      try {
        const token = await getToken();
        const response = await fetch('/api/photo-unlock/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            photoCount,
            listingId,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create payment intent');
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
        setPhotoUnlockId(data.photoUnlockId);
      } catch (error) {
        console.error('Error creating payment intent:', error);
      } finally {
        setLoading(false);
      }
    }

    onOpenChange(newOpen);
  };

  const handleSuccess = async () => {
    setSuccess(true);
    setTimeout(() => {
      onSuccess();
      onOpenChange(false);
      // Reset state
      setClientSecret(null);
      setPhotoUnlockId(null);
      setSuccess(false);
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Unlock Photos for Your Listing
          </DialogTitle>
          <DialogDescription>
            Add up to 25 photos to make your listing stand out
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-green-700">Photos Unlocked!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                You can now publish your listing with all {photoCount} photos
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Pricing Breakdown */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  First photo
                </span>
                <span className="font-semibold text-green-600">FREE</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Camera className="h-4 w-4 text-primary" />
                  Photos 2-{photoCount}
                </span>
                <span className="font-semibold">$0.99</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="text-lg font-bold text-primary">$0.99</span>
                </div>
              </div>
            </div>

            {/* Separate Charges Notice */}
            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Note:</strong> AI generation uses credits separately. This $0.99 fee is only for unlocking multiple photos.
              </AlertDescription>
            </Alert>

            {/* Payment Form */}
            {loading ? (
              <div className="py-8 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : clientSecret ? (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'stripe',
                  },
                }}
              >
                <PaymentForm
                  photoCount={photoCount}
                  listingId={listingId}
                  onSuccess={handleSuccess}
                  onCancel={() => onOpenChange(false)}
                />
              </Elements>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
