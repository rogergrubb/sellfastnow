import { Search, Plus, User, Menu, Moon, Sun, ListChecks } from "lucide-react";
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

export default function Navbar() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();

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
