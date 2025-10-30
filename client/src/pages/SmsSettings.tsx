import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import SmsPreferencesEnhanced from "@/components/SmsPreferencesEnhanced";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SmsSettings() {
  const { getToken } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current user data
  const { data: currentUser, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  // Update SMS preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (preferences: {
      phoneNumber?: string;
      smsWeeklyUpdates?: boolean;
      smsMonthlyUpdates?: boolean;
      smsCreditGiveaways?: boolean;
      smsPromotional?: boolean;
    }) => {
      const token = await getToken();
      const response = await fetch("/api/auth/user", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        throw new Error("Failed to update preferences");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });

  const handleUpdate = async (preferences: any) => {
    await updatePreferencesMutation.mutateAsync(preferences);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">SMS Notifications</h1>
          <p className="text-muted-foreground mt-2">
            Manage your SMS notification preferences and stay updated on the go
          </p>
        </div>

        <SmsPreferencesEnhanced
          phoneNumber={currentUser?.phoneNumber}
          smsWeeklyUpdates={currentUser?.smsWeeklyUpdates}
          smsMonthlyUpdates={currentUser?.smsMonthlyUpdates}
          smsCreditGiveaways={currentUser?.smsCreditGiveaways}
          smsPromotional={currentUser?.smsPromotional}
          smsOfferReceived={currentUser?.smsOfferReceived}
          smsOfferResponse={currentUser?.smsOfferResponse}
          smsPaymentConfirmed={currentUser?.smsPaymentConfirmed}
          smsNewMessage={currentUser?.smsNewMessage}
          smsListingPublished={currentUser?.smsListingPublished}
          smsListingEngagement={currentUser?.smsListingEngagement}
          smsListingSold={currentUser?.smsListingSold}
          smsReviewReceived={currentUser?.smsReviewReceived}
          smsMeetupReminder={currentUser?.smsMeetupReminder}
          onUpdate={handleUpdate}
        />
      </div>
    </div>
  );
}

