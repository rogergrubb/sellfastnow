import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Loader2, TrendingUp, Check, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "");

interface BoostListingModalProps {
  open: boolean;
  onClose: () => void;
  listingId: string;
  listingTitle: string;
}

const BOOST_OPTIONS = [
  {
    type: "3_day_boost",
    label: "3-Day Boost",
    price: 5.00,
    days: 3,
    features: ["Featured at top of search", "3x more visibility", "Best for quick sales"],
    popular: false,
  },
  {
    type: "7_day_boost",
    label: "7-Day Boost",
    price: 10.00,
    days: 7,
    features: ["Featured at top of search", "7x more visibility", "Most popular choice"],
    popular: true,
  },
  {
    type: "30_day_boost",
    label: "30-Day Boost",
    price: 30.00,
    days: 30,
    features: ["Featured at top of search", "30x more visibility", "Best value"],
    popular: false,
  },
];

function PaymentForm({ clientSecret, onSuccess }: { clientSecret: string; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/my-listings`,
      },
      redirect: "if_required",
    });

    if (error) {
      toast({
        title: "Payment failed",
        description: error.message,
        variant: "destructive",
      });
      setIsProcessing(false);
    } else {
      toast({
        title: "Boost activated!",
        description: "Your listing is now featured at the top of search results.",
      });
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button type="submit" disabled={!stripe || isProcessing} className="w-full">
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          "Pay Now"
        )}
      </Button>
    </form>
  );
}

export function BoostListingModal({ open, onClose, listingId, listingTitle }: BoostListingModalProps) {
  const [selectedBoost, setSelectedBoost] = useState(BOOST_OPTIONS[1]);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCreatePaymentIntent = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/boosts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, boostType: selectedBoost.type }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create payment intent");
      }

      const data = await response.json();
      setClientSecret(data.clientSecret);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Boost Your Listing: {listingTitle}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {!clientSecret ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Choose a boost to get more visibility and sell faster.</p>
              <div className="space-y-3">
                {BOOST_OPTIONS.map((option) => (
                  <Card
                    key={option.type}
                    className={`p-4 border-2 cursor-pointer ${selectedBoost.type === option.type ? "border-blue-500" : ""}`}
                    onClick={() => setSelectedBoost(option)}
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold">{option.label}</h3>
                      <p className="font-bold text-lg">${option.price.toFixed(2)}</p>
                    </div>
                    <ul className="mt-2 text-sm text-gray-600 space-y-1">
                      {option.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    {option.popular && (
                      <div className="mt-2 text-xs font-semibold text-blue-600">MOST POPULAR</div>
                    )}
                  </Card>
                ))}
              </div>
              <Button onClick={handleCreatePaymentIntent} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting payment...
                  </>
                ) : (
                  "Continue to Payment"
                )}
              </Button>
            </div>
          ) : (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <PaymentForm clientSecret={clientSecret} onSuccess={() => { setClientSecret(null); onClose(); }} />
            </Elements>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

