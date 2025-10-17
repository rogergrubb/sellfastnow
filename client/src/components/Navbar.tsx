import { Search, Plus, User, Menu, Moon, Sun, ListChecks, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useAuth, useUser, UserButton, SignInButton, SignUpButton } from "@clerk/clerk-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import type { UserCredits } from "@shared/schema";

export default function Navbar() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const { user } = useUser();

  // Fetch user credits with authentication
  const { data: credits, isLoading: creditsLoading, error: creditsError, refetch: refetchCredits } = useQuery<UserCredits>({
    queryKey: ['/api/user/credits'],
    queryFn: async () => {
      if (!isSignedIn) return null;
      const token = await getToken();
      console.log('Fetching credits with token:', token ? 'present' : 'missing');
      const res = await fetch('/api/user/credits', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('Credits API response status:', res.status);
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Credits API error:', errorText);
        throw new Error('Failed to fetch credits');
      }
      const data = await res.json();
      console.log('Credits data:', data);
      return data;
    },
    enabled: isSignedIn && isLoaded,
    retry: 3,
    retryDelay: 1000,
    refetchInterval: 5000, // Refetch every 5 seconds to detect payment completion
  });

  // Log credits state for debugging
  useEffect(() => {
    console.log('Navbar state:', { isSignedIn, isLoaded, credits, creditsLoading, creditsError });
  }, [isSignedIn, isLoaded, credits, creditsLoading, creditsError]);

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDarkMode]);

  return (
    <nav className="sticky top-0 z-50 bg-background border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <div className="flex items-center gap-6">
            <button 
              className="text-2xl font-bold text-primary hover-elevate active-elevate-2 px-2 py-1 rounded-md"
              data-testid="link-home"
              onClick={() => window.location.href = '/'}
            >
              SellFast.Now
            </button>
            
            <div className="hidden md:flex items-center flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search listings..."
                  className="pl-10 h-10"
                  data-testid="input-search"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsDarkMode(!isDarkMode)}
              data-testid="button-theme-toggle"
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {!isLoaded ? (
              <div className="w-20 h-9" />
            ) : isSignedIn ? (
              <>
                {/* AI Credits Display */}
                <Badge 
                  variant="secondary" 
                  className="flex items-center gap-1 px-2 sm:px-3 cursor-pointer hover-elevate text-xs sm:text-sm"
                  onClick={() => window.location.href = '/credits'}
                  data-testid="badge-credits"
                >
                  <Sparkles className="h-3 w-3" />
                  <span data-testid="text-credits-balance">
                    {creditsLoading ? '...' : credits?.creditsRemaining ?? 0}
                  </span>
                </Badge>
                <Button 
                  variant="ghost" 
                  className="hidden md:flex"
                  data-testid="button-my-listings"
                  onClick={() => window.location.href = '/dashboard'}
                >
                  <ListChecks className="h-4 w-4 mr-2" />
                  My Listings
                </Button>
                <Button 
                  variant="default" 
                  className="hidden sm:flex bg-secondary hover:bg-secondary"
                  data-testid="button-post-ad"
                  onClick={() => window.location.href = '/post-ad'}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Post Ad
                </Button>
                <div data-testid="user-button">
                  <UserButton 
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: "w-9 h-9"
                      }
                    }}
                  />
                </div>
              </>
            ) : (
              <>
                <SignInButton mode="modal">
                  <Button 
                    variant="ghost"
                    data-testid="button-login"
                  >
                    Login
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button 
                    variant="default"
                    data-testid="button-signup"
                  >
                    Sign Up
                  </Button>
                </SignUpButton>
              </>
            )}
          </div>
        </div>

        <div className="md:hidden pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search listings..."
              className="pl-10 h-10"
              data-testid="input-search-mobile"
            />
          </div>
        </div>
      </div>
    </nav>
  );
}
