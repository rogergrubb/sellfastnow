import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, SkipForward } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@clerk/clerk-react";

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
  { credits: 50, price: 4.99, pricePerCredit: 0.10, popular: false, badge: "40% off" },
  { credits: 75, price: 6.99, pricePerCredit: 0.09, popular: false, badge: "50% off" },
  { credits: 100, price: 8.99, pricePerCredit: 0.09, popular: false, badge: "55% off" },
  { credits: 500, price: 39.99, pricePerCredit: 0.08, popular: false, badge: "BEST VALUE - 60% off" },
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
  const { user } = useUser();

  const handleBuyCredits = (creditAmount: number) => {
    let stripeLink;
    
    switch(creditAmount) {
      case 25:
        stripeLink = import.meta.env.VITE_STRIPE_25_CREDITS_LINK;
        break;
      case 50:
        stripeLink = import.meta.env.VITE_STRIPE_50_CREDITS_LINK;
        break;
      case 75:
        stripeLink = import.meta.env.VITE_STRIPE_75_CREDITS_LINK;
        break;
      case 100:
        stripeLink = import.meta.env.VITE_STRIPE_100_CREDITS_LINK;
        break;
      case 500:
        stripeLink = import.meta.env.VITE_STRIPE_500_CREDITS_LINK;
        break;
      default:
        toast({
          title: "Invalid Credit Amount",
          description: `${creditAmount} credits is not a valid bundle size.`,
          variant: "destructive",
        });
        return;
    }
    
    if (!stripeLink) {
      toast({
        title: "Payment Link Not Configured",
        description: `Payment link for ${creditAmount} credits is not configured yet. Please contact support.`,
        variant: "destructive",
      });
      return;
    }
    
    // Save pending items state before redirect
    if (onBeforeRedirect) {
      console.log('💾 Calling onBeforeRedirect to save state');
      onBeforeRedirect();
      console.log('✅ onBeforeRedirect completed');
    } else {
      console.warn('⚠️ No onBeforeRedirect callback provided');
    }
    
    const userId = user?.id || '';
    const userEmail = user?.primaryEmailAddress?.emailAddress || '';
    const checkoutUrl = `${stripeLink}?client_reference_id=${userId}&prefilled_email=${userEmail}`;
    
    console.log('💳 Redirecting to Stripe checkout:', checkoutUrl);
    
    // Try multiple redirect strategies for iframe/embedded environments
    try {
      // Strategy 1: Try to break out of iframe to parent window
      if (window.top && window.top !== window.self) {
        console.log('📍 Attempting top-level redirect');
        window.top.location.href = checkoutUrl;
      } else {
        // Strategy 2: Direct redirect if not in iframe
        console.log('📍 Attempting direct redirect');
        window.location.href = checkoutUrl;
      }
    } catch (error) {
      console.error('❌ Redirect error (trying fallback):', error);
      // Strategy 3: Fallback - open in new tab
      console.log('📍 Opening in new tab as fallback');
      const newWindow = window.open(checkoutUrl, '_blank');
      if (!newWindow) {
        toast({
          title: "Popup Blocked",
          description: "Please allow popups to complete your purchase, then try again.",
          variant: "destructive",
        });
      }
    }
  };

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
                }`}
                onClick={() => handleBuyCredits(bundle.credits)}
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
                      data-testid={`button-buy-bundle-${bundle.credits}`}
                    >
                      Buy Now
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
