import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@clerk/clerk-react";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { getToken } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [details, setDetails] = useState<{ type: string; creditsAdded?: number; itemCount?: number }>({ type: '' });

  useEffect(() => {
    // Check if opened in popup window
    const isPopup = window.opener && !window.opener.closed;
    
    const verifyPayment = async () => {
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get('session_id');

      if (!sessionId) {
        setStatus('error');
        return;
      }

      try {
        const token = await getToken();
        
        if (!token) {
          setStatus('error');
          toast({
            title: "Authentication Required",
            description: "Please sign in to verify your payment.",
            variant: "destructive",
          });
          return;
        }

        const response = await fetch('/api/verify-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ sessionId }),
        });

        if (!response.ok) {
          throw new Error('Failed to verify payment');
        }

        const data = await response.json();
        
        if (data.success) {
          setDetails({
            type: data.type,
            creditsAdded: data.creditsAdded,
            itemCount: data.itemCount,
          });
          setStatus('success');
          
          // If opened in popup, close it after showing success
          if (isPopup) {
            setTimeout(() => {
              window.close();
            }, 1500); // Close after 1.5 seconds
          }
          
          queryClient.invalidateQueries({ queryKey: ['/api/user/credits'] });
          queryClient.invalidateQueries({ queryKey: ['/api/ai/usage'] });
          
          if (data.type === 'credits') {
            toast({
              title: "Purchase Successful!",
              description: `${data.creditsAdded} AI credits have been added to your account.`,
            });
            
            // Check if there are pending items to resume processing
            const hasPendingItems = localStorage.getItem('pendingItems');
            if (hasPendingItems) {
              // Redirect back to post-ad with payment success flag to trigger auto-resume
              setTimeout(() => {
                setLocation(`/post-ad?payment=success&credits=${data.creditsAdded}`);
              }, 2000); // Give user a moment to see success message
              return;
            }
          } else {
            toast({
              title: "Payment Successful!",
              description: `Payment confirmed for ${data.itemCount} items.`,
            });
          }
        } else {
          setStatus('error');
        }
      } catch (error) {
        console.error("Error verifying payment:", error);
        setStatus('error');
        toast({
          title: "Error",
          description: "Failed to verify your payment. Please contact support.",
          variant: "destructive",
        });
      }
    };

    verifyPayment();
  }, [toast, getToken]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <CardTitle className="mt-4">Processing your payment...</CardTitle>
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
            <CardTitle>Payment Verification Failed</CardTitle>
            <CardDescription>
              We couldn't confirm your payment. If you were charged, please contact support.
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
          <CardTitle>Payment Successful!</CardTitle>
          <CardDescription>
            {details.type === 'credits' 
              ? `${details.creditsAdded} AI credits have been added to your account`
              : `Payment confirmed for ${details.itemCount} items`
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            {details.type === 'credits'
              ? "Your credits never expire! Use them anytime for AI-powered listing generation."
              : "You can now continue generating AI descriptions for your items."
            }
          </p>
          <Button 
            onClick={() => setLocation('/post-ad')} 
            className="w-full"
            data-testid="button-create-listing"
          >
            {details.type === 'credits' ? 'Create a Listing' : 'Continue to Listing'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
