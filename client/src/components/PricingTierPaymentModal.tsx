import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!);

interface PricingTier {
  id: string;
  name: string;
  price: number;
  listings: number;
  photos: number;
  aiCredits: number;
}

interface PricingTierPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tier: PricingTier | null;
  onSuccess: () => void;
}

function PaymentForm({ tier, onSuccess, onClose }: { tier: PricingTier; onSuccess: () => void; onClose: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/pricing?success=true`,
        },
        redirect: 'if_required',
      });

      if (error) {
        setErrorMessage(error.message || 'Payment failed');
        setIsProcessing(false);
      } else {
        // Payment successful
        onSuccess();
        onClose();
      }
    } catch (err) {
      setErrorMessage('An unexpected error occurred');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-lg mb-2">{tier.name}</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <p>• {tier.listings} listing{tier.listings > 1 ? 's' : ''}</p>
          <p>• {tier.photos} photos per listing</p>
          <p>• {tier.aiCredits} AI credit{tier.aiCredits > 1 ? 's' : ''}</p>
          <p className="font-bold text-lg text-blue-600 mt-2">${tier.price.toFixed(2)}</p>
        </div>
      </div>

      <PaymentElement />

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {errorMessage}
        </div>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isProcessing}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay $${tier.price.toFixed(2)}`
          )}
        </Button>
      </div>

      <p className="text-xs text-gray-500 text-center">
        🔒 Secure payment powered by Stripe
      </p>
    </form>
  );
}

export function PricingTierPaymentModal({ isOpen, onClose, tier, onSuccess }: PricingTierPaymentModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [purchaseId, setPurchaseId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create payment intent when modal opens
  const handleOpen = async () => {
    if (!tier || clientSecret) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/pricing-tiers/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tierId: tier.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const data = await response.json();
      setClientSecret(data.clientSecret);
      setPurchaseId(data.purchaseId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize payment');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset state when modal closes
  const handleClose = () => {
    setClientSecret(null);
    setPurchaseId(null);
    setError(null);
    onClose();
  };

  // Initialize payment when modal opens
  if (isOpen && tier && !clientSecret && !isLoading && !error) {
    handleOpen();
  }

  const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#2563eb',
    },
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Your Purchase</DialogTitle>
          <DialogDescription>
            Enter your payment details to unlock your credits
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {clientSecret && tier && (
          <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
            <PaymentForm tier={tier} onSuccess={onSuccess} onClose={handleClose} />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  );
}
