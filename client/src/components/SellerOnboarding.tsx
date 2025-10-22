import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, AlertCircle, CreditCard, DollarSign, Shield } from "lucide-react";

interface AccountStatus {
  hasAccount: boolean;
  onboardingComplete: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  requirements?: {
    currently_due: string[];
    eventually_due: string[];
  };
}

export default function SellerOnboarding() {
  const { getToken } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<AccountStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchAccountStatus();
  }, []);

  const fetchAccountStatus = async () => {
    try {
      const token = await getToken();
      const response = await fetch("/api/stripe-connect/account-status", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch account status");

      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error("Error fetching account status:", error);
      toast({
        title: "Error",
        description: "Failed to load account status",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    setIsCreating(true);
    try {
      const token = await getToken();
      
      // Create account
      const createResponse = await fetch("/api/stripe-connect/create-account", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!createResponse.ok) {
        const error = await createResponse.json();
        throw new Error(error.error || "Failed to create account");
      }

      // Get onboarding link
      const linkResponse = await fetch("/api/stripe-connect/onboarding-link", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!linkResponse.ok) throw new Error("Failed to get onboarding link");

      const { url } = await linkResponse.json();

      // Redirect to Stripe onboarding
      window.location.href = url;
    } catch (error) {
      console.error("Error creating account:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start onboarding",
        variant: "destructive",
      });
      setIsCreating(false);
    }
  };

  const handleContinueOnboarding = async () => {
    setIsCreating(true);
    try {
      const token = await getToken();
      const response = await fetch("/api/stripe-connect/onboarding-link", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to get onboarding link");

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error("Error getting onboarding link:", error);
      toast({
        title: "Error",
        description: "Failed to continue onboarding",
        variant: "destructive",
      });
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  // Account fully set up
  if (status?.onboardingComplete && status?.chargesEnabled && status?.payoutsEnabled) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <CardTitle className="text-green-900">Seller Account Active</CardTitle>
          </div>
          <CardDescription>
            You're all set to receive payments from buyers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Payments enabled</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Payouts enabled</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-green-600" />
              <span>Verification complete</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Account created but onboarding incomplete
  if (status?.hasAccount && !status?.onboardingComplete) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <CardTitle className="text-yellow-900">Complete Seller Setup</CardTitle>
          </div>
          <CardDescription>
            Finish setting up your account to start receiving payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status.requirements && status.requirements.currently_due.length > 0 && (
            <Alert>
              <AlertDescription>
                <strong>Required information:</strong>
                <ul className="list-disc list-inside mt-2 text-sm">
                  {status.requirements.currently_due.map((req) => (
                    <li key={req}>{req.replace(/_/g, " ")}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          <Button 
            onClick={handleContinueOnboarding} 
            disabled={isCreating}
            className="w-full"
          >
            {isCreating ? "Loading..." : "Continue Setup"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // No account yet
  return (
    <Card>
      <CardHeader>
        <CardTitle>Become a Seller</CardTitle>
        <CardDescription>
          Set up secure payments to start selling on SellFast.Now
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <CreditCard className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold">Secure Payments</h4>
              <p className="text-sm text-muted-foreground">
                Get paid directly to your bank account via Stripe
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Shield className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <h4 className="font-semibold">Buyer Protection</h4>
              <p className="text-sm text-muted-foreground">
                Funds held in escrow until buyer confirms receipt
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <DollarSign className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <h4 className="font-semibold">Keep 97.5%</h4>
              <p className="text-sm text-muted-foreground">
                Only 2.5% platform fee on each sale
              </p>
            </div>
          </div>
        </div>

        <Alert>
          <AlertDescription className="text-sm">
            You'll need: Bank account details, SSN/Tax ID, and basic business information
          </AlertDescription>
        </Alert>

        <Button 
          onClick={handleCreateAccount} 
          disabled={isCreating}
          className="w-full"
          size="lg"
        >
          {isCreating ? "Creating Account..." : "Start Seller Setup"}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Powered by Stripe Connect. Your information is secure and encrypted.
        </p>
      </CardContent>
    </Card>
  );
}

