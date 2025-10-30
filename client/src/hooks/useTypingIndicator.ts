import { useEffect, useState, useCallback, useRef } from "react";

/**
 * Hook to manage typing indicator for a conversation
 */
export function useTypingIndicator(conversationId: string | undefined) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch typing users periodically
  useEffect(() => {
    if (!conversationId) {
      setTypingUsers([]);
      setIsLoading(false);
      return;
    }

    const fetchTypingUsers = async () => {
      try {
        const response = await fetch(`/api/realtime/typing/${conversationId}`, {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setTypingUsers(data.typingUsers || []);
        }
      } catch (error) {
        console.error("Failed to fetch typing users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTypingUsers();

    // Poll every 1 second for real-time updates
    const interval = setInterval(fetchTypingUsers, 1000);

    return () => clearInterval(interval);
  }, [conversationId]);

  // Send typing indicator
  const setTyping = useCallback(async () => {
    if (!conversationId) return;

    try {
      await fetch(`/api/realtime/typing/${conversationId}`, {
        method: "POST",
        credentials: "include",
      });

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Auto-remove typing indicator after 3 seconds
      typingTimeoutRef.current = setTimeout(async () => {
        await removeTyping();
      }, 3000);
    } catch (error) {
      console.error("Failed to set typing indicator:", error);
    }
  }, [conversationId]);

  // Remove typing indicator
  const removeTyping = useCallback(async () => {
    if (!conversationId) return;

    try {
      await fetch(`/api/realtime/typing/${conversationId}`, {
        method: "DELETE",
        credentials: "include",
      });

      // Clear timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    } catch (error) {
      console.error("Failed to remove typing indicator:", error);
    }
  }, [conversationId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      removeTyping();
    };
  }, [removeTyping]);

  return {
    typingUsers,
    isLoading,
    setTyping,
    removeTyping,
  };
}

