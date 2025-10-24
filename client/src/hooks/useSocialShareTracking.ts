import { useMutation, useQuery } from "@tanstack/react-query";

interface TrackShareParams {
  listingId?: string;
  platform: "facebook" | "twitter" | "whatsapp" | "instagram" | "copy_link";
  shareType: "individual_listing" | "complete_listings_page" | "user_profile";
  shareUrl: string;
}

interface ShareStatistics {
  totalShares: number;
  facebookShares: number;
  twitterShares: number;
  whatsappShares: number;
  copyLinkShares: number;
  lastSharedAt: Date | null;
  sharesByPlatform: Record<string, number>;
  recentShares: any[];
}

export function useSocialShareTracking() {
  const trackShare = useMutation({
    mutationFn: async (params: TrackShareParams) => {
      const response = await fetch("/api/shares/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error("Failed to track share");
      }

      return response.json();
    },
  });

  return {
    trackShare: trackShare.mutate,
    isTracking: trackShare.isPending,
  };
}

export function useListingShareStats(listingId: string | undefined) {
  return useQuery<ShareStatistics>({
    queryKey: ["/api/shares/listing", listingId],
    queryFn: async () => {
      if (!listingId) return null;
      
      const response = await fetch(`/api/shares/listing/${listingId}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch share statistics");
      }

      return response.json();
    },
    enabled: !!listingId,
  });
}

export function useUserShareStats(userId: string | undefined) {
  return useQuery({
    queryKey: ["/api/shares/user", userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const response = await fetch(`/api/shares/user/${userId}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user share statistics");
      }

      return response.json();
    },
    enabled: !!userId,
  });
}

