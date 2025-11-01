import { Link } from "wouter";
import { useState } from "react";
import { Search, User, MessageSquare, Sparkles } from "lucide-react";
import { useAuth } from '@/lib/AuthContext';
import "./NavbarHover.css";

export default function NavbarHover() {
  const { user, signOut } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="apple-nav">
      <div className="apple-nav-container">
        {/* Logo */}
        <Link href="/">
          <a className="apple-nav-logo">SellFast.Now</a>
        </Link>

        {/* Desktop Navigation */}
        <ul className="apple-nav-menu">
          {/* Sell Dropdown */}
          <li className="apple-nav-item">
            <a href="#" className="apple-nav-link">
              Sell
            </a>
            <ul className="apple-dropdown">
              <li>
                <a href="/post-ad" className="apple-dropdown-item">
                  <span className="apple-dropdown-icon">⚡</span>
                  <div>
                    <div className="apple-dropdown-title">1 to 100 items upload</div>
                    <div className="apple-dropdown-desc">Quick AI listing</div>
                  </div>
                </a>
              </li>
              <li>
                <a href="/partner/bulk-upload" className="apple-dropdown-item">
                  <span className="apple-dropdown-icon">📦</span>
                  <div>
                    <div className="apple-dropdown-title">Bulk Upload</div>
                    <div className="apple-dropdown-desc">100+ items at once</div>
                  </div>
                </a>
              </li>
              <li>
                <a href="/sell/ai-listings" className="apple-dropdown-item">
                  <span className="apple-dropdown-icon">✨</span>
                  <div>
                    <div className="apple-dropdown-title">AI-Powered Listings</div>
                    <div className="apple-dropdown-desc">Auto-generate content</div>
                  </div>
                </a>
              </li>
              <li className="apple-dropdown-divider"></li>
              <li>
                <a href="/sell/pricing" className="apple-dropdown-item-simple">
                  💰 Pricing & Fees
                </a>
              </li>
              <li>
                <a href="/sell/how-it-works" className="apple-dropdown-item-simple">
                  ❓ How It Works
                </a>
              </li>
            </ul>
          </li>

          {/* Buy Dropdown */}
          <li className="apple-nav-item">
            <a href="#" className="apple-nav-link">
              Buy
            </a>
            <ul className="apple-dropdown">
              <li>
                <a href="/search" className="apple-dropdown-item-simple">
                  🔍 Browse All Listings
                </a>
              </li>
              <li>
                <a href="/search" className="apple-dropdown-item-simple">
                  📍 Search by Location
                </a>
              </li>
              <li>
                <a href="/categories" className="apple-dropdown-item-simple">
                  📂 Categories
                </a>
              </li>
            </ul>
          </li>

          {/* Business Dropdown */}
          <li className="apple-nav-item">
            <a href="#" className="apple-nav-link">
              Business
            </a>
            <ul className="apple-dropdown">
              <li>
                <a href="/business/realtors" className="apple-dropdown-item">
                  <span className="apple-dropdown-icon">🏠</span>
                  <div>
                    <div className="apple-dropdown-title">For Realtors</div>
                    <div className="apple-dropdown-desc">Estate & property sales</div>
                  </div>
                </a>
              </li>
              <li>
                <a href="/business/estate-sales" className="apple-dropdown-item">
                  <span className="apple-dropdown-icon">🏛️</span>
                  <div>
                    <div className="apple-dropdown-title">For Estate Liquidators</div>
                    <div className="apple-dropdown-desc">Bulk estate liquidation</div>
                  </div>
                </a>
              </li>
              <li>
                <a href="/business/liquidators" className="apple-dropdown-item">
                  <span className="apple-dropdown-icon">🏢</span>
                  <div>
                    <div className="apple-dropdown-title">For Business Liquidators</div>
                    <div className="apple-dropdown-desc">Commercial inventory</div>
                  </div>
                </a>
              </li>
              <li className="apple-dropdown-divider"></li>
              <li>
                <a href="/partner/onboard" className="apple-dropdown-item-simple">
                  🤝 Partnership Program
                </a>
              </li>
              <li>
                <a href="/sell/pricing" className="apple-dropdown-item-simple">
                  📊 Volume Pricing
                </a>
              </li>
            </ul>
          </li>

          {/* Tools Dropdown */}
          <li className="apple-nav-item">
            <a href="#" className="apple-nav-link">
              Tools
            </a>
            <ul className="apple-dropdown">
              <li>
                <a href="/bulk-edit" className="apple-dropdown-item-simple">
                  ✏️ Bulk Editor
                </a>
              </li>
              <li>
                <a href="/sell/ai-listings" className="apple-dropdown-item-simple">
                  🤖 AI Description Generator
                </a>
              </li>
              <li>
                <a href="/dashboard" className="apple-dropdown-item-simple">
                  📊 Analytics Dashboard
                </a>
              </li>
            </ul>
          </li>

          {/* Resources Dropdown */}
          <li className="apple-nav-item">
            <a href="#" className="apple-nav-link">
              Resources
            </a>
            <ul className="apple-dropdown">
              <li>
                <a href="/sell/how-it-works" className="apple-dropdown-item-simple">
                  📖 How It Works
                </a>
              </li>
              <li>
                <a href="/sell/pricing" className="apple-dropdown-item-simple">
                  💵 Pricing Calculator
                </a>
              </li>
              <li>
                <a href="/help" className="apple-dropdown-item-simple">
                  ❓ Help Center
                </a>
              </li>
            </ul>
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
              <a href="/messages" className="apple-nav-icon" aria-label="Messages">
                <MessageSquare className="h-4 w-4" />
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

          {user && (
            <a href="/dashboard" className="apple-nav-icon" aria-label="Profile">
              <User className="h-4 w-4" />
            </a>
          )}
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
