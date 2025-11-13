import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, History, ShoppingCart, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { UserCredits } from "@shared/schema";
import { useState, useEffect } from "react";

const CREDIT_BUNDLES = [
  { credits: 25, price: 2.99, pricePerCredit: 0.12, popular: true, badge: "POPULAR" },
  { credits: 50, price: 4.99, pricePerCredit: 0.10, popular: false, badge: "17% off" },
  { credits: 75, price: 6.99, pricePerCredit: 0.09, popular: false, badge: "25% off" },
  { credits: 100, price: 8.99, pricePerCredit: 0.09, popular: false, badge: "25% off" },
  { credits: 500, price: 39.99, pricePerCredit: 0.08, popular: false, badge: "BEST VALUE - 34% off" },
];

export default function Credits() {
  const { getToken } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch user credits
  const { data: credits, isLoading, refetch } = useQuery<UserCredits>({
    queryKey: ['/api/user/credits'],
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch('/api/user/credits', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch credits');
      return res.json();
    },
  });

  // Handle payment success event
  useEffect(() => {
    const handlePaymentSuccess = () => {
      console.log('💳 Payment success event received, refreshing credits...');
      queryClient.invalidateQueries({ queryKey: ['/api/user/credits'] });
      refetch();
    };
    
    window.addEventListener('paymentSuccess', handlePaymentSuccess);
    return () => window.removeEventListener('paymentSuccess', handlePaymentSuccess);
  }, [queryClient, refetch]);

  // Handle return from Stripe checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    const success = params.get('success');
    
    if (success === 'true' || sessionId) {
      console.log('✅ Detected return from Stripe, refreshing credits...');
      queryClient.invalidateQueries({ queryKey: ['/api/user/credits'] });
      refetch();
      
      // Clean up URL
      window.history.replaceState({}, '', '/credits');
    }
  }, [queryClient, refetch]);

  const handleBuyCredits = async (creditAmount: number) => {
    setIsProcessing(true);
    
    try {
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
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-48 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="h-32 bg-muted rounded"></div>
              <div className="h-32 bg-muted rounded"></div>
              <div className="h-32 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">AI Credits</h1>
          <p className="text-muted-foreground">
            Manage your AI credits for automatic product descriptions and pricing
          </p>
        </div>

        {/* Credit Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Current Balance */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-muted-foreground">Available Credits</h3>
            </div>
            <p className="text-4xl font-bold">{credits?.creditsRemaining || 0}</p>
            <p className="text-sm text-muted-foreground mt-2">
              {credits?.creditsRemaining === 0 ? "Purchase credits to continue" : "Ready to use"}
            </p>
          </Card>

          {/* Total Purchased */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-green-500" />
              </div>
              <h3 className="font-semibold text-muted-foreground">Total Purchased</h3>
            </div>
            <p className="text-4xl font-bold">{credits?.creditsPurchased || 0}</p>
            <p className="text-sm text-muted-foreground mt-2">All-time purchases</p>
          </Card>

          {/* Total Used */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
              <h3 className="font-semibold text-muted-foreground">Total Used</h3>
            </div>
            <p className="text-4xl font-bold">{credits?.creditsUsed || 0}</p>
            <p className="text-sm text-muted-foreground mt-2">AI generations completed</p>
          </Card>
        </div>

        {/* Low Credit Warning */}
        {credits && credits.creditsRemaining < 10 && (
          <Card className="p-4 mb-8 border-orange-500 bg-orange-500/5">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-orange-500" />
              <div>
                <h4 className="font-semibold">Low Credit Balance</h4>
                <p className="text-sm text-muted-foreground">
                  You have {credits.creditsRemaining} credits remaining. Purchase more to continue using AI features.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Purchase Options */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Purchase Credits</h2>
          <p className="text-muted-foreground mb-6">
            Buy credits in bulk and save up to 60%. Credits never expire!
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CREDIT_BUNDLES.map((bundle) => (
              <Card 
                key={bundle.credits} 
                className={`p-6 cursor-pointer transition-all hover-elevate ${
                  bundle.popular ? 'border-2 border-primary' : ''
                } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
                onClick={() => !isProcessing && handleBuyCredits(bundle.credits)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold">{bundle.credits}</h3>
                    <p className="text-sm text-muted-foreground">Credits</p>
                  </div>
                  {bundle.badge && (
                    <Badge variant={bundle.popular ? "default" : "secondary"} className="text-xs">
                      {bundle.badge}
                    </Badge>
                  )}
                </div>
                
                <div className="mb-4">
                  <div className="text-3xl font-bold">${bundle.price.toFixed(2)}</div>
                  <p className="text-sm text-muted-foreground">
                    ${bundle.pricePerCredit.toFixed(2)} per credit
                  </p>
                </div>

                <Button 
                  className="w-full" 
                  variant={bundle.popular ? "default" : "outline"}
                  disabled={isProcessing}
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
              </Card>
            ))}
          </div>
        </div>

        {/* How Credits Work */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <History className="h-5 w-5 text-primary" />
            <h3 className="text-xl font-semibold">How AI Credits Work</h3>
          </div>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>• <strong>1 credit = 1 AI-generated product description</strong> with title, category, pricing, and tags</p>
            <p>• Credits are used when you upload images and generate AI descriptions</p>
            <p>• <strong>First 5 items are always free</strong> for each bulk upload session</p>
            <p>• Credits never expire - use them whenever you need</p>
            <p>• Bulk purchases save up to 60% compared to single credits</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

