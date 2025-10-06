import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

export default function PurchaseSuccess() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [creditsAdded, setCreditsAdded] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentIntentId = params.get('paymentIntentId');

    if (!paymentIntentId) {
      setStatus('error');
      return;
    }

    apiRequest("POST", "/api/confirm-ai-credit-purchase", { paymentIntentId })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCreditsAdded(data.creditsAdded);
          setStatus('success');
          queryClient.invalidateQueries({ queryKey: ['/api/ai/usage'] });
          toast({
            title: "Purchase Successful!",
            description: `${data.creditsAdded} AI credits have been added to your account.`,
          });
        } else {
          setStatus('error');
        }
      })
      .catch((error) => {
        console.error("Error confirming purchase:", error);
        setStatus('error');
        toast({
          title: "Error",
          description: "Failed to confirm your purchase. Please contact support.",
          variant: "destructive",
        });
      });
  }, [toast]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <CardTitle className="mt-4">Processing your purchase...</CardTitle>
            <CardDescription>Please wait while we confirm your payment</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Purchase Failed</CardTitle>
            <CardDescription>
              We couldn't confirm your purchase. If you were charged, please contact support.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => setLocation('/post-ad')} data-testid="button-back-to-listings">
              Back to Create Listing
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
            <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle>Purchase Successful!</CardTitle>
          <CardDescription>
            {creditsAdded} AI credits have been added to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            You can now use AI-powered product descriptions for your listings. Your credits never expire!
          </p>
          <Button 
            onClick={() => setLocation('/post-ad')} 
            className="w-full"
            data-testid="button-create-listing"
          >
            Create a Listing
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
