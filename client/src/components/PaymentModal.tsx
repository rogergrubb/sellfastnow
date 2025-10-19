import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, SkipForward, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  processedCount: number;
  remainingCount: number;
  onSkip: () => void;
  onBeforeRedirect?: () => void; // Called before redirecting to save state
}

const CREDIT_BUNDLES = [
  { credits: 25, price: 2.99, pricePerCredit: 0.12, popular: true, badge: "POPULAR" },
  { credits: 50, price: 4.99, pricePerCredit: 0.10, popular: false, badge: "17% off" },
  { credits: 75, price: 6.99, pricePerCredit: 0.09, popular: false, badge: "25% off" },
  { credits: 100, price: 8.99, pricePerCredit: 0.09, popular: false, badge: "25% off" },
  { credits: 500, price: 39.99, pricePerCredit: 0.08, popular: false, badge: "BEST VALUE - 34% off" },
];

export function PaymentModal({
  open,
  onOpenChange,
  processedCount,
  remainingCount,
  onSkip,
  onBeforeRedirect,
}: PaymentModalProps) {
  const { toast } = useToast();
  const { getToken } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBuyCredits = async (creditAmount: number) => {
    setIsProcessing(true);
    
    try {
      // Call onBeforeRedirect to save state
      if (onBeforeRedirect) {
        console.log('💾 Calling onBeforeRedirect to capture initial credits');
        onBeforeRedirect();
      }
      
      // Create Checkout Session
      const token = await getToken();
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ credits: creditAmount }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      
      console.log('✅ Checkout session created, redirecting to Stripe...');
      
      // Redirect to Stripe Checkout
      window.location.href = url;
      
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  }

  const handleSkipClick = () => {
    onOpenChange(false);
    onSkip();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-payment-modal">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
            <DialogTitle data-testid="text-payment-modal-title">
              First {processedCount} Items Processed!
            </DialogTitle>
          </div>
          <DialogDescription className="text-left space-y-2 pt-2">
            <p>
              We've generated AI descriptions for your first {processedCount} items.
            </p>
            <p className="font-medium text-foreground">
              You have {remainingCount} more item{remainingCount > 1 ? 's' : ''} remaining.
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-sm font-medium">Choose a Credit Bundle:</div>
          
          <p className="text-sm text-muted-foreground">
            Buy credits in bulk and save up to 60%. Credits never expire!
          </p>

          <div className="grid gap-3">
            {CREDIT_BUNDLES.map((bundle) => (
              <Card 
                key={bundle.credits} 
                className={`p-4 cursor-pointer transition-all hover-elevate ${
                  bundle.popular ? 'border-2 border-primary' : ''
                } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
                onClick={() => !isProcessing && handleBuyCredits(bundle.credits)}
                data-testid={`card-bundle-${bundle.credits}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{bundle.credits} Credits</h4>
                      {bundle.badge && (
                        <Badge 
                          variant={bundle.popular ? "default" : "secondary"} 
                          className="text-xs" 
                          data-testid={`badge-${bundle.credits}`}
                        >
                          {bundle.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      ${bundle.pricePerCredit.toFixed(2)} per credit
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">${bundle.price.toFixed(2)}</div>
                    <Button 
                      size="sm" 
                      className="mt-2"
                      disabled={isProcessing}
                      data-testid={`button-buy-bundle-${bundle.credits}`}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Buy Now'
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Skip Option */}
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleSkipClick}
              disabled={isProcessing}
              data-testid="button-skip-ai"
            >
              <SkipForward className="h-4 w-4" />
              Skip AI - I'll enter details manually
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

