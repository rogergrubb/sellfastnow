import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * Hook to track and update user's online status
 */
export function useOnlineStatus() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Send heartbeat every 30 seconds
    const sendHeartbeat = async () => {
      try {
        await fetch("/api/realtime/heartbeat", {
          method: "POST",
          credentials: "include",
        });
      } catch (error) {
        console.error("Failed to send heartbeat:", error);
      }
    };

    // Send initial heartbeat
    sendHeartbeat();

    // Set up interval
    const interval = setInterval(sendHeartbeat, 30000);

    // Send heartbeat on visibility change (when user returns to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        sendHeartbeat();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);
}

/**
 * Hook to check if a specific user is online
 */
export function useUserOnlineStatus(userId: string | undefined) {
  const { data, isLoading } = useQuery({
    queryKey: [`/api/realtime/status/${userId}`],
    enabled: !!userId,
    refetchInterval: 10000, // Refetch every 10 seconds
    staleTime: 5000, // Consider data stale after 5 seconds
  });

  return {
    isOnline: data?.online || false,
    isLoading,
  };
}

/**
 * Hook to check online status for multiple users
 */
export function useBatchOnlineStatus(userIds: string[]) {
  const [statuses, setStatuses] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userIds.length === 0) {
      setStatuses({});
      setIsLoading(false);
      return;
    }

    const fetchStatuses = async () => {
      try {
        const response = await fetch("/api/realtime/status/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ userIds }),
        });

        if (response.ok) {
          const data = await response.json();
          setStatuses(data);
        }
      } catch (error) {
        console.error("Failed to fetch batch statuses:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatuses();

    // Refetch every 10 seconds
    const interval = setInterval(fetchStatuses, 10000);

    return () => clearInterval(interval);
  }, [userIds.join(",")]);

  return { statuses, isLoading };
}

