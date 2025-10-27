// Enhanced Message Modal with Typing Indicators and Read Receipts
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { useWebSocket } from "@/hooks/useWebSocket";
import { OfferMessageCard } from "@/components/OfferMessageCard";
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
import { Send, Loader2, Check, CheckCheck } from "lucide-react";
import type { Message } from "@shared/schema";

interface MessageModalEnhancedProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
  receiverId: string;
  listingTitle: string;
}

export function MessageModalEnhanced({
  isOpen,
  onClose,
  listingId,
  receiverId,
  listingTitle,
}: MessageModalEnhancedProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [messageText, setMessageText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    joinConversation,
    leaveConversation,
    sendTypingIndicator,
    onNewMessage,
    onMessageRead,
    onUserTyping,
  } = useWebSocket();

  // Fetch messages for this conversation
  const { data: messagesData, isLoading } = useQuery<{
    messages: Message[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>({
    queryKey: [`/api/conversations/${listingId}/${receiverId}`],
    enabled: isOpen && !!user,
  });

  const messages = messagesData?.messages || [];

  // Join conversation room when modal opens
  useEffect(() => {
    if (isOpen && user) {
      joinConversation(listingId, receiverId);
      console.log('📥 Joined conversation:', { listingId, receiverId });

      return () => {
        leaveConversation(listingId, receiverId);
        console.log('📤 Left conversation:', { listingId, receiverId });
      };
    }
  }, [isOpen, user, listingId, receiverId, joinConversation, leaveConversation]);

  // Listen for new messages
  useEffect(() => {
    if (!user) return;

    const cleanup = onNewMessage((message: Message) => {
      // Check if message is for this conversation
      if (
        message.listingId === listingId &&
        (message.senderId === receiverId || message.receiverId === receiverId)
      ) {
        console.log('📨 New message in current conversation, refreshing');
        queryClient.invalidateQueries({ 
          queryKey: [`/api/conversations/${listingId}/${receiverId}`] 
        });

        // Mark as read if we're the receiver
        if (message.receiverId === user.id) {
          markMessageAsRead(message.id);
        }
      }
    });

    return cleanup;
  }, [user, listingId, receiverId, onNewMessage, queryClient]);

  // Listen for typing indicators
  useEffect(() => {
    if (!user) return;

    const cleanup = onUserTyping((data) => {
      // Check if typing indicator is for this conversation
      if (data.listingId === listingId && data.userId === receiverId) {
        setOtherUserTyping(data.isTyping);
        console.log(`⌨️ ${data.username} is ${data.isTyping ? 'typing' : 'stopped typing'}`);
      }
    });

    return cleanup;
  }, [user, listingId, receiverId, onUserTyping]);

  // Listen for read receipts
  useEffect(() => {
    if (!user) return;

    const cleanup = onMessageRead((data) => {
      console.log('✅ Message read:', data);
      // Refresh messages to update read status
      queryClient.invalidateQueries({ 
        queryKey: [`/api/conversations/${listingId}/${receiverId}`] 
      });
    });

    return cleanup;
  }, [user, listingId, receiverId, onMessageRead, queryClient]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark message as read
  const markMessageAsRead = async (messageId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      await fetch(`/api/messages/${messageId}/read`, {
        method: "POST",
        headers,
        credentials: "include",
      });
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
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
          receiverId,
          content,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to send message");
      }

      return response.json();
    },
    onSuccess: () => {
      setMessageText("");
      setIsTyping(false);
      sendTypingIndicator(listingId, receiverId, false);
      queryClient.invalidateQueries({ 
        queryKey: [`/api/conversations/${listingId}/${receiverId}`] 
      });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!messageText.trim() || !user) return;
    sendMessageMutation.mutate(messageText.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle typing indicator
  const handleTyping = (value: string) => {
    setMessageText(value);

    // Send typing indicator
    if (!isTyping && value.length > 0) {
      setIsTyping(true);
      sendTypingIndicator(listingId, receiverId, true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTypingIndicator(listingId, receiverId, false);
    }, 2000);
  };

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getUserInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] h-[600px] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>{listingTitle}</DialogTitle>
          <DialogDescription>
            Conversation with {receiverId.substring(0, 8)}
          </DialogDescription>
        </DialogHeader>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-muted-foreground">No messages yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Start the conversation!
              </p>
            </div>
          ) : (
            messages.map((message: any) => {
              const isOwnMessage = message.senderId === user.id;
              const isOfferMessage = message.messageType && message.messageType !== "text";
              
              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${isOwnMessage ? "flex-row-reverse" : "flex-row"}`}
                >
                  {!isOfferMessage && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback>
                        {getUserInitials(isOwnMessage ? "You" : "User")}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div className={`flex flex-col ${isOwnMessage ? "items-end" : "items-start"} ${isOfferMessage ? "w-full" : "max-w-[70%]"}`}>
                    {isOfferMessage ? (
                      <>
                        <OfferMessageCard
                          messageType={message.messageType}
                          metadata={message.metadata}
                          content={message.content}
                          isOwnMessage={isOwnMessage}
                          listingId={listingId}
                        />
                        <span className="text-xs text-muted-foreground mt-1">
                          {formatTime(message.createdAt || new Date())}
                        </span>
                      </>
                    ) : (
                      <>
                        <div
                          className={`rounded-lg px-4 py-2 ${
                            isOwnMessage
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {formatTime(message.createdAt || new Date())}
                          </span>
                          {isOwnMessage && (
                            <span className="text-xs text-muted-foreground">
                              {message.isRead ? (
                                <CheckCheck className="h-3 w-3 text-blue-500" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )}
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Typing Indicator */}
          {otherUserTyping && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-lg px-4 py-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t px-6 py-4">
          <div className="flex gap-2">
            <Textarea
              value={messageText}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="min-h-[80px] resize-none"
              disabled={sendMessageMutation.isPending}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!messageText.trim() || sendMessageMutation.isPending}
              size="icon"
              className="h-[80px] w-[80px]"
            >
              {sendMessageMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

