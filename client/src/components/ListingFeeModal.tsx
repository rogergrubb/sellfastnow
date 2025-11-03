import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Loader2, DollarSign, Info, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "");

interface ListingFeeModalProps {
  open: boolean;
  onClose: () => void;
  onPaymentSuccess: (paymentIntentId: string) => void;
  listingPrice: number;
  listingTitle: string;
}

function PaymentForm({ 
  clientSecret, 
  onSuccess, 
  listingFee 
}: { 
  clientSecret: string; 
  onSuccess: (paymentIntentId: string) => void;
  listingFee: number;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const { error: submitError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/listing-published`,
        },
        redirect: "if_required",
      });

      if (submitError) {
        setError(submitError.message || "Payment failed");
        toast({
          title: "Payment Failed",
          description: submitError.message,
          variant: "destructive",
        });
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        toast({
          title: "Payment Successful!",
          description: `Listing fee of $${listingFee.toFixed(2)} paid successfully.`,
        });
        onSuccess(paymentIntent.id);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      toast({
        title: "Error",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
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

      <Button 
        type="submit" 
        disabled={!stripe || isProcessing} 
        className="w-full bg-primary hover:bg-primary/90"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <DollarSign className="mr-2 h-4 w-4" />
            Pay ${listingFee.toFixed(2)} and Publish Listing
          </>
        )}
      </Button>
    </form>
  );
}

export function ListingFeeModal({ 
  open, 
  onClose, 
  onPaymentSuccess, 
  listingPrice, 
  listingTitle 
}: ListingFeeModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);
  const { toast } = useToast();

  const listingFee = listingPrice * 0.03;

  const createPaymentIntent = async () => {
    setIsCreatingIntent(true);
    try {
      const response = await fetch('/api/listing-fee/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          listingPrice,
          listingTitle,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create payment intent');
      }

      const data = await response.json();
      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to initialize payment",
        variant: "destructive",
      });
      onClose();
    } finally {
      setIsCreatingIntent(false);
    }
  };

  const handlePaymentSuccess = (paymentIntentId: string) => {
    onPaymentSuccess(paymentIntentId);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Listing Fee Required
          </DialogTitle>
          <DialogDescription>
            Items priced at $50 or more require a 3% listing fee to be published.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Fee Breakdown */}
          <Card className="p-4 bg-muted/50">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Item Price:</span>
                <span className="font-medium">${listingPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Listing Fee (3%):</span>
                <span className="font-medium text-primary">${listingFee.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-semibold">
                  <span>Total Due:</span>
                  <span className="text-primary">${listingFee.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              This one-time fee helps maintain our platform and ensures quality listings. 
              You'll receive the full ${listingPrice.toFixed(2)} when your item sells.
            </AlertDescription>
          </Alert>

          {/* Payment Form or Initialize Button */}
          {!clientSecret ? (
            <Button 
              onClick={createPaymentIntent} 
              disabled={isCreatingIntent}
              className="w-full"
            >
              {isCreatingIntent ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Initializing Payment...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Continue to Payment
                </>
              )}
            </Button>
          ) : (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <PaymentForm 
                clientSecret={clientSecret} 
                onSuccess={handlePaymentSuccess}
                listingFee={listingFee}
              />
            </Elements>
          )}

          <Button 
            variant="ghost" 
            onClick={onClose}
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
