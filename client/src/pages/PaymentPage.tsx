import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useState, useEffect } from "react";
import PaymentForm from "@/components/PaymentForm";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

export default function PaymentPage() {
  const params = useParams();
  const sessionId = params.sessionId;
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // Fetch payment session details
  const { data: session, isLoading, error } = useQuery({
    queryKey: ['payment-session', sessionId],
    queryFn: async () => {
      const response = await fetch(`/api/payment-sessions/${sessionId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to load payment session');
      }
      return response.json();
    },
    enabled: !!sessionId,
  });

  // Create payment intent when session is ready
  useEffect(() => {
    if (session && ((session.status === 'pending' && session.initiatedBy === 'seller') || session.status === 'accepted')) {
      // Create payment intent
      fetch(`/api/payment-sessions/${sessionId}/create-payment-intent`, {
        method: 'POST',
        credentials: 'include',
      })
        .then(res => res.json())
        .then(data => {
          if (data.clientSecret) {
            setClientSecret(data.clientSecret);
          }
        })
        .catch(err => console.error('Failed to create payment intent:', err));
    }
  }, [session, sessionId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Payment Session Not Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>
                {error instanceof Error ? error.message : 'This payment link is invalid or has expired.'}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canPay = (session.status === 'pending' && session.initiatedBy === 'seller') || session.status === 'accepted';

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle>Complete Your Purchase</CardTitle>
            <CardDescription>
              Secure payment powered by Stripe
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Item Details */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">{session.listing.title}</h3>
              {session.listing.description && (
                <p className="text-sm text-gray-600 mb-3">
                  {session.listing.description.substring(0, 150)}
                  {session.listing.description.length > 150 ? '...' : ''}
                </p>
              )}
              
              <div className="flex justify-between items-center pt-3 border-t">
                <span className="text-sm text-gray-600">Seller:</span>
                <span className="font-medium">{session.seller.name}</span>
              </div>
              
              {session.amount !== session.originalAmount && (
                <div className="flex justify-between items-center pt-2">
                  <span className="text-sm text-gray-600">Original Price:</span>
                  <span className="text-sm line-through text-gray-500">
                    ${session.originalAmount.toFixed(2)}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between items-center pt-2">
                <span className="font-semibold">Amount to Pay:</span>
                <span className="text-2xl font-bold text-green-600">
                  ${session.amount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payment Status */}
            {session.status === 'pending' && session.initiatedBy === 'buyer' && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Waiting for seller to accept your offer. You'll be able to pay once they approve.
                </AlertDescription>
              </Alert>
            )}

            {session.status === 'accepted' && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Seller has accepted your offer! You can now complete payment.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Payment Form */}
        {canPay && clientSecret && (
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
              <CardDescription>
                Your payment is protected by escrow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Elements 
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'stripe',
                  },
                }}
              >
                <PaymentForm sessionId={sessionId!} amount={session.amount} />
              </Elements>
            </CardContent>
          </Card>
        )}

        {canPay && !clientSecret && (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Preparing payment...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Security Info */}
        <div className="text-center text-sm text-gray-600">
          <p>🛡️ Secure payment • 🔒 Encrypted connection • ✅ Escrow protected</p>
        </div>
      </div>
    </div>
  );
}

