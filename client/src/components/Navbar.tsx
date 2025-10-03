import { Search, Plus, User, Menu, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Query for authenticated user
  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/auth/user'],
    retry: false,
  });

  const isLoggedIn = !!user;

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDarkMode]);

  const handleLogin = () => {
    // Trigger backend OAuth flow
    window.location.href = '/api/login';
  };

  const handleLogout = async () => {
    // Logout via backend
    window.location.href = '/api/logout';
  };

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

            {isLoading ? (
              <div className="w-20 h-9" />
            ) : isLoggedIn ? (
              <>
                <Button 
                  variant="default" 
                  className="hidden sm:flex bg-secondary hover:bg-secondary"
                  data-testid="button-post-ad"
                  onClick={() => window.location.href = '/post-ad'}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Post Ad
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="rounded-full"
                      data-testid="button-user-menu"
                    >
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      data-testid="menu-my-listings"
                      onClick={() => window.location.href = '/my-listings'}
                    >
                      My Listings
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      data-testid="menu-messages"
                      onClick={() => window.location.href = '/messages'}
                    >
                      Messages
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      data-testid="menu-favorites"
                      onClick={() => window.location.href = '/favorites'}
                    >
                      Favorites
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      data-testid="menu-profile"
                      onClick={() => window.location.href = '/profile'}
                    >
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      data-testid="menu-logout"
                      onClick={handleLogout}
                    >
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button 
                  variant="ghost"
                  data-testid="button-login"
                  onClick={handleLogin}
                >
                  Login
                </Button>
                <Button 
                  variant="default"
                  data-testid="button-signup"
                  onClick={handleLogin}
                >
                  Sign Up
                </Button>
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
