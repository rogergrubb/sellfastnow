import { useUserOnlineStatus } from "@/hooks/useOnlineStatus";
import { cn } from "@/lib/utils";

interface OnlineStatusIndicatorProps {
  userId: string | undefined;
  size?: "sm" | "md" | "lg";
  showOffline?: boolean;
  className?: string;
}

export default function OnlineStatusIndicator({
  userId,
  size = "md",
  showOffline = false,
  className,
}: OnlineStatusIndicatorProps) {
  const { isOnline, isLoading } = useUserOnlineStatus(userId);

  if (isLoading || (!isOnline && !showOffline)) {
    return null;
  }

  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  return (
    <div
      className={cn(
        "rounded-full border-2 border-white dark:border-gray-900",
        sizeClasses[size],
        isOnline ? "bg-green-500" : "bg-gray-400",
        className
      )}
      title={isOnline ? "Online" : "Offline"}
    />
  );
}

