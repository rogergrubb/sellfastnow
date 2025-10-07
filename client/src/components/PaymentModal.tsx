import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Sparkles, SkipForward, CreditCard, Package } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@clerk/clerk-react";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  processedCount: number;
  remainingCount: number;
  onSkip: () => void;
}

const CREDIT_BUNDLES = [
  { credits: 25, price: 2.99, pricePerCredit: 0.12, popular: true, savings: "40% off" },
  { credits: 50, price: 4.99, pricePerCredit: 0.10, popular: false, savings: "50% off" },
  { credits: 100, price: 8.99, pricePerCredit: 0.09, popular: false, savings: "55% off" },
  { credits: 1000, price: 59.99, pricePerCredit: 0.06, popular: false, savings: "70% off" },
];

export function PaymentModal({
  open,
  onOpenChange,
  processedCount,
  remainingCount,
  onSkip,
}: PaymentModalProps) {
  const [, setLocation] = useLocation();
  const [selectedTab, setSelectedTab] = useState<'pay-per-use' | 'bundles'>('pay-per-use');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { getToken } = useAuth();
  const subtotal = remainingCount * 0.20;
  const payPerUsePrice = Math.max(0.50, subtotal).toFixed(2);
  const hasMinimumApplied = subtotal < 0.50;

  const handlePayPerUse = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      
      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to continue with payment",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const response = await fetch('/api/create-checkout-session/pay-per-use', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ itemCount: remainingCount }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create checkout session');
      }

      const data = await response.json();
      
      if (data.url) {
        // Break out of Replit iframe - Stripe requires top-level navigation
        if (window.top) {
          window.top.location.href = data.url;
        } else {
          window.location.href = data.url;
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create checkout session",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleBundlePurchase = async (credits: number, price: number) => {
    try {
      setLoading(true);
      const token = await getToken();
      
      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to continue with payment",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const response = await fetch('/api/create-checkout-session/credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ credits, amount: price }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create checkout session');
      }

      const data = await response.json();
      
      if (data.url) {
        // Break out of Replit iframe - Stripe requires top-level navigation
        if (window.top) {
          window.top.location.href = data.url;
        } else {
          window.location.href = data.url;
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create checkout session",
        variant: "destructive",
      });
      setLoading(false);
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
              We've generated AI descriptions for your first {processedCount} items. Review them below.
            </p>
            <p className="font-medium text-foreground">
              You have {remainingCount} more item{remainingCount > 1 ? 's' : ''} remaining.
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-sm font-medium">CHOOSE YOUR PRICING:</div>
          
          {/* Pricing Tabs */}
          <div className="flex gap-2 border-b">
            <button
              onClick={() => setSelectedTab('pay-per-use')}
              className={`flex-1 pb-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                selectedTab === 'pay-per-use' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              data-testid="tab-pay-per-use"
            >
              <CreditCard className="h-4 w-4 inline mr-2" />
              Pay Per Use
            </button>
            <button
              onClick={() => setSelectedTab('bundles')}
              className={`flex-1 pb-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                selectedTab === 'bundles' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              data-testid="tab-bundles"
            >
              <Package className="h-4 w-4 inline mr-2" />
              Credit Bundles
            </button>
          </div>

          {/* Pay Per Use Tab */}
          {selectedTab === 'pay-per-use' && (
            <div className="space-y-4">
              <Card className="p-4 border-2 border-primary/20">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">Pay As You Go</h3>
                      <p className="text-sm text-muted-foreground">Only pay for what you need right now</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">${payPerUsePrice}</div>
                      <div className="text-xs text-muted-foreground">
                        {hasMinimumApplied ? "$0.50 minimum" : "$0.20 per item"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span>Generate AI for {remainingCount} item{remainingCount > 1 ? 's' : ''}</span>
                  </div>
                  {hasMinimumApplied && (
                    <p className="text-xs text-muted-foreground">
                      Note: $0.50 minimum charge applies (payment processor requirement)
                    </p>
                  )}
                  <Button 
                    className="w-full gap-2" 
                    onClick={handlePayPerUse}
                    disabled={loading}
                    data-testid="button-pay-per-use"
                  >
                    {loading ? "Redirecting to checkout..." : `Continue with $${payPerUsePrice}`}
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* Credit Bundles Tab */}
          {selectedTab === 'bundles' && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Buy credits in bulk and save up to 70%. Credits never expire!
              </p>
              <div className="grid gap-3">
                {CREDIT_BUNDLES.map((bundle) => (
                  <Card 
                    key={bundle.credits} 
                    className={`p-4 cursor-pointer transition-all hover-elevate ${
                      bundle.popular ? 'border-2 border-primary' : ''
                    }`}
                    onClick={() => !loading && handleBundlePurchase(bundle.credits, bundle.price)}
                    data-testid={`card-bundle-${bundle.credits}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{bundle.credits} Credits</h4>
                          {bundle.popular && (
                            <Badge variant="default" className="text-xs" data-testid="badge-popular">
                              POPULAR
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-xs" data-testid={`badge-savings-${bundle.credits}`}>
                            {bundle.savings}
                          </Badge>
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
                          disabled={loading}
                          data-testid={`button-buy-bundle-${bundle.credits}`}
                        >
                          {loading ? "Processing..." : "Buy Now"}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

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
