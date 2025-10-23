import { useState } from "react";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface PaymentFormProps {
  sessionId: string;
  amount: number;
}

export default function PaymentForm({ sessionId, amount }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Create payment intent and get client secret
  const { data: paymentData, isLoading: isCreatingIntent, error: intentError } = useQuery({
    queryKey: ['payment-intent', sessionId],
    queryFn: async () => {
      const response = await fetch(`/api/payment-sessions/${sessionId}/create-payment-intent`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create payment');
      }

      return response.json();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message || 'Payment failed');
        setIsProcessing(false);
        return;
      }

      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success?session=${sessionId}`,
        },
      });

      if (confirmError) {
        setError(confirmError.message || 'Payment failed');
        setIsProcessing(false);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
      setIsProcessing(false);
    }
  };

  if (isCreatingIntent) {
    return (
      <div className="text-center py-8">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Preparing payment...</p>
      </div>
    );
  }

  if (intentError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {intentError instanceof Error ? intentError.message : 'Failed to initialize payment'}
        </AlertDescription>
      </Alert>
    );
  }

  if (success) {
    return (
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          Payment successful! Funds are being held in escrow until delivery is confirmed.
        </AlertDescription>
      </Alert>
    );
  }

  if (!paymentData?.clientSecret) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Payment initialization failed. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement options={{ layout: 'tabs' }} />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="pt-4 border-t">
        <div className="flex justify-between items-center mb-4">
          <span className="font-semibold">Total Amount:</span>
          <span className="text-2xl font-bold">${amount.toFixed(2)}</span>
        </div>

        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay $${amount.toFixed(2)}`
          )}
        </Button>
      </div>

      <p className="text-xs text-center text-gray-500">
        By completing this payment, you agree to our terms of service.
        Funds will be held in escrow until the seller confirms delivery.
      </p>
    </form>
  );
}

