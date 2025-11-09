import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Send, Loader2 } from "lucide-react";
import type { Message, User } from "@shared/schema";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import TypingIndicator from "@/components/TypingIndicator";
import OnlineStatusIndicator from "@/components/OnlineStatusIndicator";
import { soundEffects } from "@/utils/soundEffects";

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
  sellerId: string;
  sellerName: string;
  listingTitle: string;
}

interface MessageWithSender extends Message {
  senderName?: string;
}

export function MessageModal({
  isOpen,
  onClose,
  listingId,
  sellerId,
  sellerName,
  listingTitle,
}: MessageModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(0);

  // Typing indicator
  const { typingUsers, setTyping, removeTyping } = useTypingIndicator(listingId);

  // Filter out current user from typing users
  const otherUsersTyping = typingUsers.filter(userId => userId !== user?.id);

  // Fetch messages for this listing
  const { data: messages = [], isLoading } = useQuery<MessageWithSender[]>({
    queryKey: [`/api/messages/listing/${listingId}`],
    enabled: isOpen && !!user,
    refetchInterval: 5000, // Poll every 5 seconds for new messages
  });

  // Mark messages as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/messages/${messageId}/read`, {
        method: "POST",
        headers,
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to mark message as read");
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate queries to refresh unread counts
      queryClient.invalidateQueries({ queryKey: [`/api/messages/listing/${listingId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      // Get Supabase auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch("/api/messages", {
        method: "POST",
        headers,
        body: JSON.stringify({
          listingId,
          receiverId: sellerId,
          content,
        }),
        credentials: "include",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Message send failed:', { status: response.status, error: errorData });
        throw new Error(errorData.message || errorData.error || "Failed to send message");
      }
      return response.json();
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: [`/api/messages/listing/${listingId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
    },
    onError: (error: any) => {
      console.error('Message mutation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to send messages.",
        variant: "destructive",
      });
      return;
    }
    removeTyping(); // Remove typing indicator when sending
    sendMessageMutation.mutate(messageText.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle typing indicator
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageText(e.target.value);
    if (e.target.value.trim()) {
      setTyping(); // Set typing indicator when user types
    } else {
      removeTyping(); // Remove when input is empty
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Play sound when new message arrives
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current && prevMessageCountRef.current > 0) {
      // New message arrived
      const lastMessage = messages[messages.length - 1];
      // Only play sound if message is from other user
      if (lastMessage.senderId !== user?.id) {
        soundEffects.playMessageSound();
      }
    }
    prevMessageCountRef.current = messages.length;
  }, [messages, user]);

  // Mark unread messages as read when modal opens or messages change
  useEffect(() => {
    if (!isOpen || !user || !messages.length) return;

    // Find all unread messages where current user is the receiver
    const unreadMessages = messages.filter(
      (msg) => msg.receiverId === user.id && !msg.isRead
    );

    // Mark each unread message as read
    unreadMessages.forEach((msg) => {
      markAsReadMutation.mutate(msg.id);
    });
  }, [isOpen, messages, user]);

  const formatMessageTime = (date: Date | string | null) => {
    if (!date) return "";
    const messageDate = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - messageDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return messageDate.toLocaleDateString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle>Message about: {listingTitle}</DialogTitle>
          <DialogDescription>
            Conversation with {sellerName}
          </DialogDescription>
        </DialogHeader>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-muted/20 rounded-lg">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-muted-foreground mb-2">No messages yet</p>
              <p className="text-sm text-muted-foreground">
                Start the conversation by sending a message below
              </p>
            </div>
          ) : (
            <>
              {messages.map((message) => {
                const isCurrentUser = message.senderId === user?.id;
                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${isCurrentUser ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="text-xs">
                        {isCurrentUser
                          ? user?.firstName?.charAt(0) || "U"
                          : sellerName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`flex flex-col max-w-[70%] ${
                        isCurrentUser ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`rounded-lg px-4 py-2 ${
                          isCurrentUser
                            ? "bg-primary text-primary-foreground"
                            : "bg-background border"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground mt-1">
                        {formatMessageTime(message.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
          
          {/* Typing Indicator */}
          {otherUsersTyping.length > 0 && (
            <TypingIndicator 
              typingUsers={otherUsersTyping} 
              userNames={{ [sellerId]: sellerName }}
            />
          )}
        </div>

        {/* Message Input */}
        <div className="flex gap-2 pt-4 border-t">
          <Textarea
            placeholder="Type your message..."
            value={messageText}
            onChange={handleTextChange}
            onKeyPress={handleKeyPress}
            className="resize-none"
            rows={3}
            disabled={sendMessageMutation.isPending}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!messageText.trim() || sendMessageMutation.isPending}
            size="icon"
            className="h-auto"
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

