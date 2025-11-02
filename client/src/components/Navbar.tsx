import { Search, Plus, ListChecks, Sparkles, User, LogOut, Settings, MessageCircle, Bell, Menu, Package, Zap, Store, ChevronDown, ShoppingBag, Briefcase, Wrench, BookOpen, UserCircle } from "lucide-react";
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
import { NotificationBell } from "@/components/NotificationBell";
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
      <div className="max-w-[1440px] mx-auto px-4">
        <div className="flex items-center justify-between h-11">
          {/* Logo */}
          <button 
            className="text-lg font-medium hover:text-gray-300 transition-colors flex-shrink-0"
            data-testid="link-home"
            onClick={() => window.location.href = '/'}
          >
            SellFast.Now
          </button>

          {/* Desktop Navigation - Six Dropdowns */}
          <div className="hidden lg:flex items-center gap-6 flex-1 justify-center">
            {/* Sell Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-xs hover:text-gray-300 transition-colors flex items-center gap-1">
                  Sell
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-white text-black w-56">
                <DropdownMenuItem onClick={() => window.location.href = '/post-ad'}>
                  <Zap className="mr-2 h-4 w-4 text-blue-600" />
                  <div>
                    <div className="font-medium">1 to 100 items upload</div>
                    <div className="text-xs text-gray-500">Quick AI listing</div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.location.href = '/partner/bulk-upload'}>
                  <Package className="mr-2 h-4 w-4 text-purple-600" />
                  <div>
                    <div className="font-medium">Bulk Upload</div>
                    <div className="text-xs text-gray-500">100+ items at once</div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.location.href = '/sell/ai-listings'}>
                  <Sparkles className="mr-2 h-4 w-4 text-yellow-600" />
                  <div>
                    <div className="font-medium">AI-Powered Listings</div>
                    <div className="text-xs text-gray-500">Auto-generate content</div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => window.location.href = '/sell/pricing'}>
                  <span className="mr-2">💰</span>
                  Pricing & Fees
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.location.href = '/sell/how-it-works'}>
                  <span className="mr-2">❓</span>
                  How It Works
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Buy Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-xs hover:text-gray-300 transition-colors flex items-center gap-1">
                  Buy
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-white text-black w-56">
                <DropdownMenuItem onClick={() => window.location.href = '/'}>
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Browse All Listings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.location.href = '/search'}>
                  <Search className="mr-2 h-4 w-4" />
                  Search by Location
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.location.href = '/categories'}>
                  <span className="mr-2">📂</span>
                  Categories
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => window.location.href = '/saved-searches'}>
                  <Bell className="mr-2 h-4 w-4" />
                  Saved Searches
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.location.href = '/favorites'}>
                  <span className="mr-2">❤️</span>
                  Favorites
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Business Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-xs hover:text-gray-300 transition-colors flex items-center gap-1">
                  Business
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-white text-black w-64">
                <DropdownMenuItem onClick={() => window.location.href = '/business/realtors'}>
                  <span className="mr-2">🏡</span>
                  <div>
                    <div className="font-medium">For Realtors</div>
                    <div className="text-xs text-gray-500">Estate & property sales</div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.location.href = '/business/estate-sales'}>
                  <span className="mr-2">🏛️</span>
                  <div>
                    <div className="font-medium">For Estate Liquidators</div>
                    <div className="text-xs text-gray-500">Bulk estate liquidation</div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.location.href = '/business/liquidators'}>
                  <span className="mr-2">🏢</span>
                  <div>
                    <div className="font-medium">For Business Liquidators</div>
                    <div className="text-xs text-gray-500">Commercial inventory</div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => window.location.href = '/partner/dashboard'}>
                  <Store className="mr-2 h-4 w-4 text-green-600" />
                  <div>
                    <div className="font-medium">Branded Storefronts</div>
                    <div className="text-xs text-gray-500">Custom business page</div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.location.href = '/partner/onboard'}>
                  <span className="mr-2">🤝</span>
                  Partnership Program
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.location.href = '/pricing#volume'}>
                  <span className="mr-2">📊</span>
                  Volume Pricing
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Tools Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-xs hover:text-gray-300 transition-colors flex items-center gap-1">
                  Tools
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-white text-black w-56">
                <DropdownMenuItem onClick={() => window.location.href = '/bulk-edit'}>
                  <span className="mr-2">✏️</span>
                  Bulk Editor
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.location.href = '/tools/ai-generator'}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  AI Description Generator
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.location.href = '/tools/image-upload'}>
                  <span className="mr-2">📸</span>
                  Image Uploader
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.location.href = '/dashboard'}>
                  <span className="mr-2">📈</span>
                  Analytics Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.location.href = '/tools/qr-upload'}>
                  <span className="mr-2">📱</span>
                  QR Code Upload
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Resources Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-xs hover:text-gray-300 transition-colors flex items-center gap-1">
                  Resources
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-white text-black w-56">
                <DropdownMenuItem onClick={() => window.location.href = '/how-it-works'}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  How It Works
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.location.href = '/pricing-calculator'}>
                  <span className="mr-2">🧮</span>
                  Pricing Calculator
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.location.href = '/success-stories'}>
                  <span className="mr-2">⭐</span>
                  Success Stories
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => window.location.href = '/blog'}>
                  <span className="mr-2">📝</span>
                  Blog
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.location.href = '/help'}>
                  <span className="mr-2">❓</span>
                  Help Center
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.location.href = '/api-docs'}>
                  <span className="mr-2">🔧</span>
                  API Documentation
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Account Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-xs hover:text-gray-300 transition-colors flex items-center gap-1">
                  {isSignedIn ? 'Account' : 'Login'}
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-white text-black w-56">
                {isSignedIn ? (
                  <>
                    <DropdownMenuItem onClick={() => window.location.href = '/dashboard'}>
                      <ListChecks className="mr-2 h-4 w-4" />
                      My Listings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.location.href = '/messages'}>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      <div className="flex items-center justify-between flex-1">
                        <span>Messages</span>
                        {unreadCount > 0 && (
                          <Badge variant="destructive" className="ml-2">{unreadCount}</Badge>
                        )}
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.location.href = '/dashboard'}>
                      <span className="mr-2">📊</span>
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.location.href = '/credits'}>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Credits & Billing
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => window.location.href = '/settings'}>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem onClick={() => window.location.href = '/sign-in'}>
                      <span className="mr-2">🔐</span>
                      Login
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.location.href = '/sign-up'}>
                      <span className="mr-2">✨</span>
                      Sign Up
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* User Links - Only show when logged in */}
          {isSignedIn && (
            <div className="hidden lg:flex items-center gap-6">
              <button
                className="text-xs hover:text-gray-300 transition-colors"
                onClick={() => window.location.href = '/dashboard'}
              >
                My Listings
              </button>
              <button
                className="text-xs hover:text-gray-300 transition-colors relative"
                onClick={() => window.location.href = '/messages'}
              >
                Messages
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Search Icon */}
            <button
              className="hidden lg:block hover:text-gray-300 transition-colors"
              onClick={() => setSearchOpen(!searchOpen)}
              data-testid="button-search"
            >
              <Search className="h-4 w-4" />
            </button>

            {!isLoaded ? (
              <div className="w-20 h-9" />
            ) : isSignedIn ? (
              <>
                {/* Notification Bell */}
                <div className="hidden lg:block">
                  <NotificationBell />
                </div>

                {/* AI Credits - Compact */}
                <button
                  className="hidden lg:flex items-center gap-1 text-xs hover:text-gray-300 transition-colors"
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
                  className="hidden lg:flex items-center gap-1 bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs px-3 py-1.5 rounded-full transition-colors font-medium"
                  data-testid="button-post-ad"
                  onClick={() => window.location.href = '/post-ad'}
                >
                  <Plus className="h-3 w-3" />
                  Post Ad
                </button>
                
                {/* User Profile Avatar */}
                <button 
                  className="hidden lg:block hover:text-gray-300 transition-colors" 
                  data-testid="user-button"
                  onClick={() => window.location.href = '/dashboard'}
                >
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-gray-600 text-white text-xs">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </>
            ) : (
              <>
                <button
                  className="hidden lg:block text-xs hover:text-gray-300 transition-colors"
                  data-testid="button-login"
                  onClick={() => window.location.href = '/sign-in'}
                >
                  Login
                </button>
                
                <button
                  className="hidden lg:flex items-center gap-1 bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs px-3 py-1.5 rounded-full transition-colors font-medium"
                  data-testid="button-post-ad"
                  onClick={() => window.location.href = '/post-ad'}
                >
                  <Plus className="h-3 w-3" />
                  Post Ad
                </button>
              </>
            )}

            {/* Mobile Menu */}
            <button className="lg:hidden hover:text-gray-300 transition-colors">
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Search Overlay */}
        {searchOpen && (
          <div className="absolute left-0 right-0 top-11 bg-[#1d1d1f] border-t border-gray-700 p-4">
            <div className="max-w-[1440px] mx-auto">
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
