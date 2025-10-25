import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, CreditCard, Shield, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

// Initialize Stripe (you'll need to add your publishable key to env)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "");

interface DepositSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
  listingTitle: string;
  listingPrice: number;
  sellerId: string;
}

function DepositForm({ 
  listingId, 
  listingTitle, 
  listingPrice, 
  onSuccess, 
  onCancel 
}: {
  listingId: string;
  listingTitle: string;
  listingPrice: number;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // Calculate suggested deposit amounts
  const suggestedAmounts = [
    { label: "5%", value: listingPrice * 0.05 },
    { label: "10%", value: listingPrice * 0.10 },
    { label: "25%", value: listingPrice * 0.25 },
    { label: "50%", value: listingPrice * 0.50 },
  ];

  // Submit deposit mutation
  const submitDepositMutation = useMutation({
    mutationFn: async (amount: number) => {
      // Get user's location if available
      let latitude, longitude;
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
        } catch (error) {
          console.log("Location access denied, continuing without location");
        }
      }

      const response = await fetch("/api/deposits/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          listingId,
          amount,
          latitude,
          longitude,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to submit deposit");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
      toast({
        title: "Payment Setup Ready",
        description: "Please enter your payment details to authorize the deposit.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmitDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid deposit amount",
        variant: "destructive",
      });
      return;
    }

    if (amount > listingPrice) {
      toast({
        title: "Amount Too High",
        description: "Deposit cannot exceed the listing price",
        variant: "destructive",
      });
      return;
    }

    await submitDepositMutation.mutateAsync(amount);
  };

  const handleConfirmPayment = async () => {
    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/listing/${listingId}`,
        },
        redirect: "if_required",
      });

      if (error) {
        toast({
          title: "Payment Error",
          description: error.message,
          variant: "destructive",
        });
      } else if (paymentIntent && paymentIntent.status === "requires_capture") {
        toast({
          title: "Deposit Submitted! 🎉",
          description: "Your deposit has been authorized. Waiting for seller acceptance.",
        });
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process payment",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">How Deposits Work</p>
            <p>You and the seller agree on a deposit amount. Your payment will be authorized but not charged until the seller accepts. The seller must accept your deposit for it to become active.</p>
          </div>
        </div>
      </div>

      {!clientSecret ? (
        <>
          {/* Listing Info */}
          <div>
            <h4 className="font-medium text-sm text-gray-500 mb-1">Item</h4>
            <p className="font-semibold">{listingTitle}</p>
            <p className="text-lg font-bold text-green-600 mt-1">
              ${listingPrice.toFixed(2)}
            </p>
          </div>

          {/* Deposit Amount Input */}
          <div>
            <Label htmlFor="depositAmount">Deposit Amount</Label>
            <div className="relative mt-1">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="depositAmount"
                type="number"
                placeholder="0.00"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="pl-9"
                step="0.01"
                min="0"
                max={listingPrice}
              />
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div>
            <p className="text-sm text-gray-600 mb-2">Suggested amounts:</p>
            <div className="grid grid-cols-4 gap-2">
              {suggestedAmounts.map((suggestion) => (
                <Button
                  key={suggestion.label}
                  variant="outline"
                  size="sm"
                  onClick={() => setDepositAmount(suggestion.value.toFixed(2))}
                  className="text-xs"
                >
                  {suggestion.label}
                  <br />
                  ${suggestion.value.toFixed(0)}
                </Button>
              ))}
            </div>
          </div>

          {/* Platform Fee Info */}
          {depositAmount && parseFloat(depositAmount) > 0 && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Deposit Amount:</span>
                    <span className="font-semibold">${parseFloat(depositAmount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Platform Fee (2.5%):</span>
                    <span>${(parseFloat(depositAmount) * 0.025).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Seller Receives:</span>
                    <span>${(parseFloat(depositAmount) * 0.975).toFixed(2)}</span>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitDeposit}
              disabled={!depositAmount || parseFloat(depositAmount) <= 0 || submitDepositMutation.isPending}
              className="flex-1"
            >
              {submitDepositMutation.isPending ? "Processing..." : "Continue to Payment"}
            </Button>
          </div>
        </>
      ) : (
        <>
          {/* Payment Element */}
          <div>
            <Label>Payment Details</Label>
            <div className="mt-2 p-4 border rounded-lg">
              <PaymentElement />
            </div>
          </div>

          {/* Security Notice */}
          <Alert>
            <CreditCard className="h-4 w-4" />
            <AlertDescription>
              <p className="text-sm">
                Your payment will be <strong>authorized</strong> but not charged until the seller accepts your deposit. 
                This is a secure hold on your card.
              </p>
            </AlertDescription>
          </Alert>

          {/* Confirm Button */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isProcessing}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmPayment}
              disabled={!stripe || isProcessing}
              className="flex-1"
            >
              {isProcessing ? "Authorizing..." : `Authorize $${depositAmount}`}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export function DepositSubmissionModal({
  isOpen,
  onClose,
  listingId,
  listingTitle,
  listingPrice,
  sellerId,
}: DepositSubmissionModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const handleSuccess = () => {
    onClose();
    // Refresh page or update UI
    window.location.reload();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Submit Deposit
          </DialogTitle>
          <DialogDescription>
            Place a secure deposit to show the seller you're serious about this purchase.
          </DialogDescription>
        </DialogHeader>

        <Elements stripe={stripePromise}>
          <DepositForm
            listingId={listingId}
            listingTitle={listingTitle}
            listingPrice={listingPrice}
            onSuccess={handleSuccess}
            onCancel={onClose}
          />
        </Elements>
      </DialogContent>
    </Dialog>
  );
}

