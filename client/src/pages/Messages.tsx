import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Inbox } from "lucide-react";
import { MessageModal } from "@/components/MessageModal";
import type { Message, Listing, User } from "@shared/schema";

interface EnrichedThread {
  listingId: string;
  listingTitle: string;
  listingImage?: string;
  otherUserId: string;
  otherUserName: string;
  lastMessage: string;
  lastMessageTime: Date | string;
  unreadCount: number;
}

export default function Messages() {
  const { user } = useAuth();
  const [selectedThread, setSelectedThread] = useState<EnrichedThread | null>(null);
  const [threads, setThreads] = useState<EnrichedThread[]>([]);

  // Fetch all messages for current user
  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ['/api/messages'],
    enabled: !!user,
  });

  // Fetch all listings (needed to get titles and images)
  const { data: listings = [], isLoading: listingsLoading } = useQuery<Listing[]>({
    queryKey: ['/api/listings'],
    enabled: !!user && messages.length > 0,
  });

  useEffect(() => {
    if (!user || messages.length === 0) {
      setThreads([]);
      return;
    }

    // Group messages into threads by listing
    const threadMap = new Map<string, Message[]>();

    messages.forEach((msg) => {
      if (!threadMap.has(msg.listingId)) {
        threadMap.set(msg.listingId, []);
      }
      threadMap.get(msg.listingId)!.push(msg);
    });

    // Create thread summaries
    const enrichedThreads: EnrichedThread[] = [];
    
    threadMap.forEach((msgs, listingId) => {
      const sortedMsgs = msgs.sort((a, b) => 
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
      const lastMsg = sortedMsgs[0];
      
      // Determine the other user (not current user)
      const otherUserId = lastMsg.senderId === user.id ? lastMsg.receiverId : lastMsg.senderId;
      
      // Count unread messages (where current user is receiver and not read)
      const unreadCount = msgs.filter(m => m.receiverId === user.id && !m.isRead).length;

      // Find listing data
      const listing = listings.find(l => l.id === listingId);

      enrichedThreads.push({
        listingId,
        listingTitle: listing?.title || "Listing",
        listingImage: listing?.images?.[0],
        otherUserId,
        otherUserName: otherUserId.substring(0, 8), // Show first 8 chars of ID for now
        lastMessage: lastMsg.content,
        lastMessageTime: lastMsg.createdAt || new Date(),
        unreadCount,
      });
    });

    // Sort threads by most recent message
    enrichedThreads.sort((a, b) => 
      new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    );

    setThreads(enrichedThreads);
  }, [messages, listings, user]);

  const formatTime = (date: Date | string) => {
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

  const isLoading = messagesLoading || listingsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <MessageCircle className="h-8 w-8" />
        <h1 className="text-3xl font-bold">Messages</h1>
      </div>

      {threads.length === 0 ? (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <Inbox className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No messages yet</h2>
            <p className="text-muted-foreground">
              When you message sellers or receive messages, they'll appear here
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {threads.map((thread) => (
            <Card
              key={thread.listingId}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setSelectedThread(thread)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {thread.listingImage ? (
                    <img 
                      src={thread.listingImage} 
                      alt={thread.listingTitle}
                      className="h-16 w-16 object-cover rounded flex-shrink-0"
                    />
                  ) : (
                    <Avatar className="h-16 w-16 flex-shrink-0">
                      <AvatarFallback>
                        <MessageCircle className="h-8 w-8" />
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <h3 className="font-semibold truncate">
                          {thread.listingTitle}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          User {thread.otherUserName}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {thread.unreadCount > 0 && (
                          <Badge variant="default" className="rounded-full">
                            {thread.unreadCount}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatTime(thread.lastMessageTime)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {thread.lastMessage}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Message Modal */}
      {selectedThread && (
        <MessageModal
          isOpen={!!selectedThread}
          onClose={() => setSelectedThread(null)}
          listingId={selectedThread.listingId}
          sellerId={selectedThread.otherUserId}
          sellerName={`User ${selectedThread.otherUserName}`}
          listingTitle={selectedThread.listingTitle}
        />
      )}
    </div>
  );
}

