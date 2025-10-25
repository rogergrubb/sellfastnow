// Updated Messages Page with Conversation Grouping and Real-time Updates
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Inbox } from "lucide-react";
import { MessageModalEnhanced } from "@/components/MessageModalEnhanced";
import { MessageSearch } from "@/components/MessageSearch";
import { NotificationPrompt } from "@/components/NotificationPrompt";
import { useWebSocket } from "@/hooks/useWebSocket";
import { NotificationService } from "@/services/notificationService";
import type { Message } from "@shared/schema";

interface Conversation {
  listingId: string;
  otherUserId: string;
  lastMessage: {
    id: string;
    content: string;
    senderId: string;
    receiverId: string;
    isRead: boolean;
    createdAt: Date;
  };
  unreadCount: number;
  messageCount: number;
  otherUser: {
    id: string;
    username: string | null;
    email: string | null;
    fullName: string | null;
  } | null;
  listing: {
    id: string;
    title: string;
    price: number;
    images: string[];
  } | null;
}

export default function MessagesNew() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const { isConnected, onNewMessage } = useWebSocket();

  // Fetch conversations (grouped messages)
  const { data: conversations = [], isLoading } = useQuery<Conversation[]>({
    queryKey: ['/api/conversations'],
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds as backup
  });

  // Listen for real-time messages
  useEffect(() => {
    if (!user) return;

    const cleanup = onNewMessage((message: Message) => {
      console.log('📨 New message received, refreshing conversations');
      
      // Invalidate conversations query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      
      // If this message is for the currently open conversation, refresh it too
      if (selectedConversation && 
          message.listingId === selectedConversation.listingId &&
          (message.senderId === selectedConversation.otherUserId || 
           message.receiverId === selectedConversation.otherUserId)) {
        queryClient.invalidateQueries({ 
          queryKey: [`/api/messages/listing/${selectedConversation.listingId}`] 
        });
      }
      
      // Show browser notification if message is for current user and window is not focused
      if (message.receiverId === user.id && !document.hasFocus()) {
        const conversation = conversations.find(
          c => c.listingId === message.listingId && c.otherUserId === message.senderId
        );
        
        const senderName = conversation?.otherUser?.fullName || 
                          conversation?.otherUser?.username || 
                          'Someone';
        const listingTitle = conversation?.listing?.title || 'Item';
        
        NotificationService.showNewMessageNotification(
          senderName,
          message.content.substring(0, 100),
          listingTitle,
          () => {
            // Navigate to messages page
            window.location.href = '/messages';
          }
        );
      }
    });

    return cleanup;
  }, [user, onNewMessage, queryClient, selectedConversation, conversations]);

  const formatTime = (date: Date | string) => {
    const messageDate = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - messageDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return messageDate.toLocaleDateString();
  };

  const getUserDisplayName = (conv: Conversation) => {
    if (conv.otherUser?.fullName) return conv.otherUser.fullName;
    if (conv.otherUser?.username) return conv.otherUser.username;
    if (conv.otherUser?.email) return conv.otherUser.email.split('@')[0];
    return 'User';
  };

  const getUserInitials = (conv: Conversation) => {
    const name = getUserDisplayName(conv);
    return name.substring(0, 2).toUpperCase();
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">Please sign in to view messages</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Messages</h1>
            <p className="text-muted-foreground mt-1">
              {isConnected && <span className="text-green-500 mr-2">● Connected</span>}
              Your conversations will appear here
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Inbox className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No messages yet</h2>
            <p className="text-muted-foreground text-center max-w-md">
              When you start conversations with sellers or buyers, they'll appear here.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Messages</h1>
            <p className="text-muted-foreground mt-1">
              {isConnected && <span className="text-green-500 mr-2">● Connected</span>}
              {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        {/* Message Search */}
        <MessageSearch
          onResultClick={(listingId, otherUserId) => {
            const conversation = conversations.find(
              c => c.listingId === listingId && c.otherUserId === otherUserId
            );
            if (conversation) {
              setSelectedConversation(conversation);
            }
          }}
        />
      </div>

      <div className="grid gap-4">
        {conversations.map((conv) => (
          <Card
            key={`${conv.listingId}-${conv.otherUserId}`}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedConversation(conv)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>{getUserInitials(conv)}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">
                        {getUserDisplayName(conv)}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {conv.listing?.title || 'Listing'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatTime(conv.lastMessage.createdAt)}
                      </span>
                      {conv.unreadCount > 0 && (
                        <Badge variant="default" className="h-5 min-w-[20px] flex items-center justify-center">
                          {conv.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {conv.lastMessage.senderId === user.id && (
                      <span className="font-medium">You: </span>
                    )}
                    {conv.lastMessage.content}
                  </p>

                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <MessageCircle className="h-3 w-3" />
                    <span>{conv.messageCount} message{conv.messageCount !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                {conv.listing?.images?.[0] && (
                  <img
                    src={conv.listing.images[0]}
                    alt={conv.listing.title}
                    className="w-16 h-16 rounded object-cover flex-shrink-0"
                  />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedConversation && (
        <MessageModalEnhanced
          isOpen={true}
          onClose={() => setSelectedConversation(null)}
          listingId={selectedConversation.listingId}
          receiverId={selectedConversation.otherUserId}
          listingTitle={selectedConversation.listing?.title || 'Listing'}
        />
      )}
      
      {/* Notification Permission Prompt */}
      <NotificationPrompt />
    </div>
  );
}

