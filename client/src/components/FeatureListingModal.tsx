import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Sparkles, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!);

interface FeatureListingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingId: string;
  listingTitle: string;
  onSuccess?: () => void;
}

const durations = [
  { value: "24h", label: "24 Hours", price: 5, description: "Featured for 1 day" },
  { value: "48h", label: "48 Hours", price: 10, description: "Featured for 2 days" },
  { value: "7d", label: "7 Days", price: 25, description: "Featured for 1 week", popular: true },
];

function PaymentForm({
  listingId,
  duration,
  onSuccess,
  onCancel,
}: {
  listingId: string;
  duration: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    try {
      // Confirm payment without redirect
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        // Payment succeeded! Now activate the featured status
        try {
          await apiRequest(
            "POST",
            `/api/featured-listings/${listingId}/activate`,
            {
              paymentIntentId: paymentIntent.id,
              duration,
            }
          );
          onSuccess();
        } catch (activateError: any) {
          toast({
            title: "Activation Error",
            description: "Payment succeeded but failed to activate featured status. Please contact support.",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process payment",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={processing}>
          Cancel
        </Button>
        <Button type="submit" disabled={!stripe || processing} className="flex-1">
          {processing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Feature Listing
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

export function FeatureListingModal({
  open,
  onOpenChange,
  listingId,
  listingTitle,
  onSuccess,
}: FeatureListingModalProps) {
  const { toast } = useToast();
  const [selectedDuration, setSelectedDuration] = useState("7d");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    setLoading(true);
    try {
      const res = await apiRequest(
        "POST",
        `/api/featured-listings/${listingId}/feature`,
        { duration: selectedDuration }
      );
      const response = await res.json() as { clientSecret: string; amount: number; duration: string };

      setClientSecret(response.clientSecret);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create payment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    toast({
      title: "Success!",
      description: "Your listing is now featured on the homepage!",
    });
    onOpenChange(false);
    setClientSecret(null);
    if (onSuccess) {
      onSuccess();
    }
  };

  const handleCancel = () => {
    setClientSecret(null);
  };

  const selectedOption = durations.find((d) => d.value === selectedDuration);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Feature Your Listing
          </DialogTitle>
          <DialogDescription>
            Get your listing featured on the homepage carousel for maximum visibility
          </DialogDescription>
        </DialogHeader>

        {!clientSecret ? (
          <div className="space-y-6">
            {/* Duration Selection */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Choose Duration</Label>
              <RadioGroup value={selectedDuration} onValueChange={setSelectedDuration}>
                {durations.map((option) => (
                  <div
                    key={option.value}
                    className={`relative flex items-center space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                      selectedDuration === option.value
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedDuration(option.value)}
                  >
                    <RadioGroupItem value={option.value} id={option.value} />
                    <div className="flex-1">
                      <Label htmlFor={option.value} className="cursor-pointer">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{option.label}</span>
                          <span className="text-lg font-bold">${option.price}</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{option.description}</p>
                      </Label>
                    </div>
                    {option.popular && (
                      <div className="absolute -top-2 -right-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500 text-white">
                          Popular
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Benefits */}
            <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-3">What you get:</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Premium placement on homepage carousel</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Visible to all visitors with "FEATURED" badge</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Auto-scrolling carousel with hover effects</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Significantly increased visibility and clicks</span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleContinue} disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Continue to Payment - ${selectedOption?.price}
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentForm
              listingId={listingId}
              duration={selectedDuration}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  );
}
