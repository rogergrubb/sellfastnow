import { Link, useLocation } from "wouter";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, User, MessageSquare, Sparkles } from "lucide-react";
import { useAuth } from '@/lib/AuthContext';
import "./NavbarHover.css";

export default function NavbarHover() {
  const { user, signOut } = useAuth();
  const [location] = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch unread message count
  const { data: unreadData } = useQuery<{ unreadCount: number }>({
    queryKey: ['/api/messages/unread-count'],
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const unreadCount = unreadData?.unreadCount || 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <nav className="apple-nav">
      <div className="apple-nav-container">
        {/* Logo */}
        <Link href="/">
          <a className="apple-nav-logo">SellFast.Now</a>
        </Link>

        {/* Desktop Navigation - Simplified */}
        <ul className="apple-nav-menu">
          {/* For Sellers Dropdown */}
          <li className="apple-nav-item">
            <a href="#" className="apple-nav-link">
              For Sellers
            </a>
            <ul className="apple-dropdown">
              <li>
                <a href="/post-ad" className="apple-dropdown-item">
                  <span className="apple-dropdown-icon">⚡</span>
                  <div>
                    <div className="apple-dropdown-title">Start Selling</div>
                    <div className="apple-dropdown-desc">List items with AI assistance</div>
                  </div>
                </a>
              </li>
              <li>
                <a href="/sell/pricing" className="apple-dropdown-item-simple">
                  💰 Pricing & Fees
                </a>
              </li>
              <li>
                <a href="/sell/how-it-works" className="apple-dropdown-item-simple">
                  📖 How It Works
                </a>
              </li>
            </ul>
          </li>

          {/* For Buyers Dropdown */}
          <li className="apple-nav-item">
            <a href="#" className="apple-nav-link">
              For Buyers
            </a>
            <ul className="apple-dropdown">
              <li>
                <a href="/search" className="apple-dropdown-item">
                  <span className="apple-dropdown-icon">🔍</span>
                  <div>
                    <div className="apple-dropdown-title">Browse Listings</div>
                    <div className="apple-dropdown-desc">Search items near you</div>
                  </div>
                </a>
              </li>
              <li>
                <a href="/categories" className="apple-dropdown-item-simple">
                  📂 Categories
                </a>
              </li>
              <li>
                <a href="/how-it-works" className="apple-dropdown-item-simple">
                  🛡️ Buyer Protection
                </a>
              </li>
            </ul>
          </li>

          {/* How It Works - Standalone Link */}
          <li className="apple-nav-item">
            <a href="/how-it-works" className="apple-nav-link">
              How It Works
            </a>
          </li>

          {/* Account Dropdown - Logged In */}
          {user && (
            <>
              <li className="apple-nav-item apple-nav-standalone">
                <a href="/dashboard" className="apple-nav-link">
                  My Listings
                </a>
              </li>
              <li className="apple-nav-item apple-nav-standalone">
                <a href="/messages" className="apple-nav-link">
                  Messages
                </a>
              </li>
            </>
          )}

          {/* Account Dropdown */}
          {user ? (
            <li className="apple-nav-item">
              <a href="#" className="apple-nav-link">
                Account
              </a>
              <ul className="apple-dropdown">
                <li>
                  <a href="/dashboard" className="apple-dropdown-item-simple">
                    📋 Dashboard
                  </a>
                </li>
                <li>
                  <a href="/settings" className="apple-dropdown-item-simple">
                    ⚙️ Settings
                  </a>
                </li>
                <li className="apple-dropdown-divider"></li>
                <li>
                  <button onClick={signOut} className="apple-dropdown-item-simple">
                    🚪 Logout
                  </button>
                </li>
              </ul>
            </li>
          ) : (
            <li className="apple-nav-item">
              <a href="/auth/login" className="apple-nav-link">
                Login
              </a>
            </li>
          )}
        </ul>

        {/* Right Section */}
        <div className="apple-nav-right">
          <button
            className="apple-nav-icon"
            onClick={() => setSearchOpen(!searchOpen)}
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </button>

          {user && (
            <>
              <a href="/messages" className="apple-nav-icon" aria-label="Messages" style={{ position: 'relative' }}>
                <MessageSquare className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    borderRadius: '9999px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    minWidth: '16px',
                    height: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 4px',
                  }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </a>
              <div className="apple-nav-credits">
                <Sparkles className="h-3 w-3" />
                <span>169</span>
              </div>
            </>
          )}

          <a href="/post-ad" className="apple-nav-cta">
            Post Ad
          </a>


        </div>

        {/* Mobile Menu Button */}
        <button
          className="apple-nav-mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Search Overlay */}
      {searchOpen && (
        <div className="apple-search-overlay">
          <div className="apple-search-container">
            <input
              type="text"
              placeholder="Search listings..."
              className="apple-search-input"
              autoFocus
            />
          </div>
        </div>
      )}
    </nav>
  );
}
