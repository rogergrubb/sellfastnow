import { Search, Plus, ListChecks, Sparkles, User, LogOut, Settings, MessageCircle, Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useWebSocket } from "@/hooks/useWebSocket";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import type { UserCredits, Message } from "@shared/schema";

export default function Navbar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const { user, session, loading, signOut, getToken } = useAuth();
  const queryClient = useQueryClient();
  const { socket } = useWebSocket();
  const isSignedIn = !!user && !!session;
  const isLoaded = !loading;

  // Fetch messages for unread count
  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ['/api/messages'],
    enabled: isSignedIn && isLoaded,
    retry: false,
  });

  // Listen for new messages via WebSocket and refresh unread count
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data: any) => {
      console.log('📨 New message received in Navbar, refreshing unread count');
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, queryClient]);

  const unreadCount = Array.isArray(messages) 
    ? messages.filter(m => m.receiverId === user?.id && !m.isRead).length 
    : 0;

  // Fetch user credits
  const { data: credits, isLoading: creditsLoading, error: creditsError, refetch: refetchCredits } = useQuery<UserCredits>({
    queryKey: ['/api/user/credits'],
    queryFn: async () => {
      if (!isSignedIn) return null;
      const token = await getToken();
      const res = await fetch('/api/user/credits', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch credits');
      return res.json();
    },
    enabled: isSignedIn && isLoaded,
    retry: 3,
    retryDelay: 1000,
    refetchInterval: 5000,
  });

  useEffect(() => {
    const handlePaymentSuccess = () => {
      refetchCredits();
    };
    window.addEventListener('paymentSuccess', handlePaymentSuccess);
    return () => window.removeEventListener('paymentSuccess', handlePaymentSuccess);
  }, [refetchCredits]);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  const getUserInitials = () => {
    if (!user?.email) return 'U';
    return user.email.charAt(0).toUpperCase();
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#1d1d1f] text-white">
      <div className="max-w-[980px] mx-auto px-4">
        <div className="flex items-center justify-between h-11">
          {/* Left Section */}
          <div className="flex items-center gap-8">
            <button 
              className="text-lg font-medium hover:text-gray-300 transition-colors"
              data-testid="link-home"
              onClick={() => window.location.href = '/'}
            >
              SellFast.Now
            </button>
            
            {!isSignedIn ? (
              <>
                <button
                  className="hidden md:block text-xs hover:text-gray-300 transition-colors"
                  onClick={() => window.location.href = '/search'}
                >
                  Browse
                </button>
                <button
                  className="hidden md:block text-xs hover:text-gray-300 transition-colors"
                  onClick={() => window.location.href = '/how-it-works'}
                >
                  How It Works
                </button>
                <button
                  className="hidden md:block text-xs hover:text-gray-300 transition-colors"
                  onClick={() => window.location.href = '/partner/onboard'}
                >
                  For Business
                </button>
              </>
            ) : (
              <>
                <button
                  className="hidden md:block text-xs hover:text-gray-300 transition-colors"
                  onClick={() => window.location.href = '/search'}
                >
                  Browse
                </button>
                <button
                  className="hidden md:block text-xs hover:text-gray-300 transition-colors"
                  onClick={() => window.location.href = '/dashboard'}
                >
                  My Listings
                </button>
                <button
                  className="hidden md:block text-xs hover:text-gray-300 transition-colors relative"
                  onClick={() => window.location.href = '/messages'}
                >
                  Messages
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </>
            )}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Search Icon */}
            <button
              className="hidden md:block hover:text-gray-300 transition-colors"
              onClick={() => setSearchOpen(!searchOpen)}
              data-testid="button-search"
            >
              <Search className="h-4 w-4" />
            </button>

            {!isLoaded ? (
              <div className="w-20 h-9" />
            ) : isSignedIn ? (
              <>
                {/* AI Credits - Compact */}
                <button
                  className="hidden md:flex items-center gap-1 text-xs hover:text-gray-300 transition-colors"
                  onClick={() => window.location.href = '/credits'}
                  data-testid="badge-credits"
                >
                  <Sparkles className="h-3 w-3" />
                  <span data-testid="text-credits-balance">
                    {creditsLoading ? '...' : credits?.creditsRemaining ?? 0}
                  </span>
                </button>

                {/* Post Ad Button */}
                <button
                  className="hidden md:block bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs px-3 py-1.5 rounded-full transition-colors font-medium"
                  data-testid="button-post-ad"
                  onClick={() => window.location.href = '/post-ad'}
                >
                  Post Ad
                </button>
                
                {/* User Profile */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="hover:text-gray-300 transition-colors" data-testid="user-button">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-gray-600 text-white text-xs">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white text-black">
                    <DropdownMenuItem onClick={() => window.location.href = `/users/${user?.id}`}>
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.location.href = '/dashboard'}>
                      <ListChecks className="mr-2 h-4 w-4" />
                      My Listings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.location.href = '/messages'}>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Messages
                      {unreadCount > 0 && (
                        <Badge variant="destructive" className="ml-2">{unreadCount}</Badge>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.location.href = '/settings'}>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.location.href = '/saved-searches'}>
                      <Bell className="mr-2 h-4 w-4" />
                      Saved Searches
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <button
                  className="hidden md:block text-xs hover:text-gray-300 transition-colors"
                  data-testid="button-login"
                  onClick={() => window.location.href = '/sign-in'}
                >
                  Login
                </button>
                <button
                  className="hidden md:block bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs px-3 py-1.5 rounded-full transition-colors font-medium"
                  data-testid="button-post-ad"
                  onClick={() => window.location.href = '/post-ad'}
                >
                  Post Ad
                </button>
              </>
            )}

            {/* Mobile Menu */}
            <button className="md:hidden hover:text-gray-300 transition-colors">
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Search Overlay */}
        {searchOpen && (
          <div className="absolute left-0 right-0 top-11 bg-[#1d1d1f] border-t border-gray-700 p-4">
            <div className="max-w-[980px] mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="search"
                  placeholder="Search listings..."
                  className="w-full bg-[#2d2d2f] text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
                  data-testid="input-search"
                  autoFocus
                  onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
