import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, ExternalLink, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface StripeAccountStatus {
  connected: boolean;
  accountId?: string;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  detailsSubmitted?: boolean;
  requirementsCurrentlyDue?: string[];
  requirementsEventuallyDue?: string[];
}

export default function PartnerStripeConnect() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

  // Fetch Stripe account status
  const { data: status, isLoading } = useQuery<StripeAccountStatus>({
    queryKey: ['/api/partners/stripe/account-status'],
  });

  // Create Stripe account mutation
  const createAccountMutation = useMutation({
    mutationFn: async () => {
      setIsCreating(true);
      const response = await apiRequest('/api/partners/stripe/create-account', 'POST');
      return response;
    },
    onSuccess: async () => {
      // After creating account, get onboarding link
      const linkResponse = await apiRequest('/api/partners/stripe/onboarding-link', 'POST');
      
      if (linkResponse.url) {
        // Redirect to Stripe onboarding
        window.location.href = linkResponse.url;
      }
    },
    onError: (error: any) => {
      setIsCreating(false);
      toast({
        title: "Error",
        description: error.message || "Failed to create Stripe account",
        variant: "destructive",
      });
    },
  });

  // Get onboarding link mutation
  const getOnboardingLinkMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/partners/stripe/onboarding-link', 'POST');
      return response;
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to get onboarding link",
        variant: "destructive",
      });
    },
  });

  // Get dashboard link mutation
  const getDashboardLinkMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/partners/stripe/dashboard-link', 'POST');
      return response;
    },
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, '_blank');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to open Stripe dashboard",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!status?.connected) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Connect Stripe to Receive Payments
            </h3>
            <p className="text-gray-600 mb-4">
              Set up your Stripe account to receive payouts from sales. You'll keep 97% of each sale, 
              and funds will be automatically transferred to your bank account.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-blue-900 mb-2">What you'll need:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Business tax ID (EIN or SSN)</li>
                <li>• Bank account information</li>
                <li>• Business address</li>
                <li>• Personal identification</li>
              </ul>
            </div>
            <Button 
              onClick={() => createAccountMutation.mutate()}
              disabled={isCreating || createAccountMutation.isPending}
              size="lg"
            >
              {isCreating || createAccountMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Connect Stripe Account
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Account is connected
  const isFullySetup = status.chargesEnabled && status.payoutsEnabled && status.detailsSubmitted;
  const hasRequirements = (status.requirementsCurrentlyDue?.length || 0) > 0;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isFullySetup ? 'bg-green-100' : 'bg-yellow-100'
        }`}>
          {isFullySetup ? (
            <CheckCircle className="w-6 h-6 text-green-600" />
          ) : (
            <AlertCircle className="w-6 h-6 text-yellow-600" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {isFullySetup ? 'Stripe Connected' : 'Stripe Setup Incomplete'}
          </h3>
          
          {isFullySetup ? (
            <div className="space-y-4">
              <p className="text-gray-600">
                Your Stripe account is fully set up and ready to receive payments.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Account Status</p>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="font-semibold text-gray-900">Active</span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Payouts</p>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="font-semibold text-gray-900">Enabled</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  onClick={() => getDashboardLinkMutation.mutate()}
                  disabled={getDashboardLinkMutation.isPending}
                >
                  {getDashboardLinkMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <ExternalLink className="w-4 h-4 mr-2" />
                  )}
                  Open Stripe Dashboard
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600">
                Complete your Stripe setup to start receiving payments.
              </p>
              
              {hasRequirements && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-900 mb-2">Action Required:</h4>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    {status.requirementsCurrentlyDue?.map((req, i) => (
                      <li key={i}>• {req.replace(/_/g, ' ')}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Charges</p>
                  <div className="flex items-center gap-2">
                    {status.chargesEnabled ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="font-semibold text-gray-900">Enabled</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                        <span className="font-semibold text-gray-900">Disabled</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Payouts</p>
                  <div className="flex items-center gap-2">
                    {status.payoutsEnabled ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="font-semibold text-gray-900">Enabled</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                        <span className="font-semibold text-gray-900">Disabled</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <Button 
                onClick={() => getOnboardingLinkMutation.mutate()}
                disabled={getOnboardingLinkMutation.isPending}
              >
                {getOnboardingLinkMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ExternalLink className="w-4 h-4 mr-2" />
                )}
                Complete Stripe Setup
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

