import { useEffect, useRef } from "react";
import { soundEffects } from "@/utils/soundEffects";

interface TypingIndicatorProps {
  typingUsers: string[];
  userNames?: Record<string, string>;
}

export default function TypingIndicator({ typingUsers, userNames = {} }: TypingIndicatorProps) {
  const prevTypingUsersRef = useRef<string[]>([]);

  // Play typing sound when someone starts typing
  useEffect(() => {
    const prevTypingUsers = prevTypingUsersRef.current;
    const newTypingUsers = typingUsers.filter(
      userId => !prevTypingUsers.includes(userId)
    );

    if (newTypingUsers.length > 0) {
      soundEffects.playTypingSound();
    }

    prevTypingUsersRef.current = typingUsers;
  }, [typingUsers]);

  if (typingUsers.length === 0) {
    return null;
  }

  // Get display names
  const displayNames = typingUsers.map(
    userId => userNames[userId] || "Someone"
  );

  // Format message
  let message: string;
  if (displayNames.length === 1) {
    message = `${displayNames[0]} is typing...`;
  } else if (displayNames.length === 2) {
    message = `${displayNames[0]} and ${displayNames[1]} are typing...`;
  } else {
    message = `${displayNames[0]} and ${displayNames.length - 1} others are typing...`;
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground animate-pulse">
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
      <span>{message}</span>
    </div>
  );
}

