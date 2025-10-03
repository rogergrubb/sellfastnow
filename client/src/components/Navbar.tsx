import { Search, Plus, User, Menu, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true); //todo: remove mock functionality

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
              onClick={() => console.log("Navigate to home")}
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

            {isLoggedIn ? (
              <>
                <Button 
                  variant="default" 
                  className="hidden sm:flex bg-secondary hover:bg-secondary"
                  data-testid="button-post-ad"
                  onClick={() => console.log("Post ad clicked")}
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
                    <DropdownMenuItem data-testid="menu-my-listings">My Listings</DropdownMenuItem>
                    <DropdownMenuItem data-testid="menu-messages">Messages</DropdownMenuItem>
                    <DropdownMenuItem data-testid="menu-favorites">Favorites</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem data-testid="menu-profile">Profile</DropdownMenuItem>
                    <DropdownMenuItem data-testid="menu-logout">Logout</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button 
                  variant="ghost"
                  data-testid="button-login"
                  onClick={() => console.log("Login clicked")}
                >
                  Login
                </Button>
                <Button 
                  variant="default"
                  data-testid="button-signup"
                  onClick={() => console.log("Sign up clicked")}
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
