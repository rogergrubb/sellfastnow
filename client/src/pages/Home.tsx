import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { FeaturedCarousel } from "@/components/FeaturedCarousel";
import { 
  ChevronDown, Zap, TrendingUp, Sparkles, 
  BarChart3, Lock, Gauge, Users, Rocket
} from "lucide-react";
import type { Listing } from "@shared/schema";

const navigate = (path: string) => {
  window.location.href = path;
};

const MegaDropdown = ({ title, isOpen, onOpenChange, items }: any) => {
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    // Clear any existing timeout
    if (hoverTimeout) clearTimeout(hoverTimeout);
    
    // Open menu after 200ms delay
    const timeout = setTimeout(() => {
      onOpenChange(true);
    }, 200);
    setHoverTimeout(timeout);
  };

  const handleMouseLeave = () => {
    // Clear any existing timeout
    if (hoverTimeout) clearTimeout(hoverTimeout);
    
    // Close menu after 500ms delay (allows moving to submenu)
    const timeout = setTimeout(() => {
      onOpenChange(false);
    }, 500);
    setHoverTimeout(timeout);
  };

  return (
    <div 
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        {title}
        <ChevronDown 
          className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => onOpenChange(false)}
          />
          
          {/* Mega Menu */}
          <div 
            className="absolute left-0 top-full mt-0 w-screen bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-xl z-50 opacity-100 transition-opacity duration-300"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {items.map((item: any, idx: number) => (
                  <div key={idx}>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      {item.icon && <item.icon className="w-5 h-5 text-blue-600" />}
                      {item.label}
                    </h3>
                    <ul className="space-y-3">
                      {item.links.map((link: any, linkIdx: number) => (
                        <li key={linkIdx}>
                          <a
                            href={link.href}
                            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all duration-200 hover:translate-x-1 block"
                            onClick={() => onOpenChange(false)}
                          >
                            {link.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default function Home() {
  const [scrollY, setScrollY] = useState(0);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  // Track scroll for animations
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch featured listings
  const { data: recentListings = [] } = useQuery<Listing[]>({
    queryKey: ['/api/listings/featured'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/listings?limit=8&sortBy=featured');
        if (!response.ok) throw new Error('Failed to fetch');
        return response.json();
      } catch {
        return [];
      }
    },
  });

  const sellItems = [
    {
      label: "Getting Started",
      icon: Rocket,
      links: [
        { name: "How to Post a Listing", href: "/post-ad" },
        { name: "Pricing & Fees", href: "/sell/pricing" },
        { name: "AI Listings", href: "/sell/ai-listings" },
        { name: "Best Practices", href: "/sell/how-it-works" },
      ],
    },
    {
      label: "For Bulk Sellers",
      icon: BarChart3,
      links: [
        { name: "Bulk Upload", href: "/post-ad" },
        { name: "AI Credits", href: "/credits" },
        { name: "Business Plans", href: "/business/estate-sales" },
        { name: "Seller Analytics", href: "/seller-analytics" },
      ],
    },
    {
      label: "Manage Your Business",
      icon: Gauge,
      links: [
        { name: "My Listings", href: "/dashboard" },
        { name: "Sales Dashboard", href: "/seller-analytics" },
        { name: "Messages", href: "/messages" },
        { name: "Settings", href: "/settings" },
      ],
    },
  ];

  const buyItems = [
    {
      label: "Browse",
      icon: TrendingUp,
      links: [
        { name: "All Listings", href: "/search" },
        { name: "Search by Category", href: "/search" },
        { name: "Trending Items", href: "/#trending" },
        { name: "Saved Searches", href: "/saved-searches" },
      ],
    },
    {
      label: "Smart Buying",
      icon: Sparkles,
      links: [
        { name: "Saved Searches", href: "/saved-searches" },
        { name: "My Collections", href: "/dashboard" },
        { name: "How to Buy", href: "/how-it-works" },
        { name: "Buyer Protection", href: "/how-it-works" },
      ],
    },
  ];

  const trustItems = [
    {
      label: "Safety & Trust",
      icon: Lock,
      links: [
        { name: "How It Works", href: "/how-it-works" },
        { name: "Seller Verification", href: "/verification" },
        { name: "Reviews & Ratings", href: "/dashboard" },
        { name: "Report Issues", href: "/settings" },
      ],
    },
    {
      label: "Learn More",
      icon: Users,
      links: [
        { name: "About SellFast.Now", href: "/#" },
        { name: "FAQ & Support", href: "/how-it-works" },
        { name: "Contact Us", href: "/settings" },
        { name: "Community Guidelines", href: "/how-it-works" },
      ],
    },
  ];

  return (
    <>
      <Helmet>
        <title>SellFast.Now - Sell Smart. Sell Safe. | AI-Powered Marketplace</title>
        <meta name="description" content="The modern way to sell. Bulk upload, AI pricing, keep 100% on items under $100. No hidden fees. Simple. Fast. Honest." />
      </Helmet>

      {/* MEGA NAVIGATION BAR */}
      <nav className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/20 dark:border-gray-800/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 hover:opacity-70 transition-opacity"
            >
              <div className="text-xl font-bold text-gray-900 dark:text-white">SellFast</div>
              <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">.Now</div>
            </button>

            {/* Mega Menu Navigation */}
            <div className="hidden md:flex items-center gap-1">
              <MegaDropdown
                title="Sell"
                isOpen={openMenu === "sell"}
                onOpenChange={(open: boolean) => setOpenMenu(open ? "sell" : null)}
                items={sellItems}
              />
              <MegaDropdown
                title="Buy"
                isOpen={openMenu === "buy"}
                onOpenChange={(open: boolean) => setOpenMenu(open ? "buy" : null)}
                items={buyItems}
              />
              <MegaDropdown
                title="Trust & Safety"
                isOpen={openMenu === "trust"}
                onOpenChange={(open: boolean) => setOpenMenu(open ? "trust" : null)}
                items={trustItems}
              />
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/messages")}
                className="hidden sm:flex"
              >
                Messages
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/settings")}
                className="hidden sm:flex"
              >
                Account
              </Button>
              <Button
                onClick={() => navigate("/post-ad")}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
              >
                Post Ad
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO SECTION - Apple inspired */}
      <section className="relative min-h-screen bg-white dark:bg-gray-900 flex flex-col items-center justify-center px-4 overflow-hidden">
        {/* Background gradient blob */}
        <div
          className="absolute top-0 right-0 w-96 h-96 bg-blue-100 dark:bg-blue-900/20 rounded-full blur-3xl opacity-50 mix-blend-multiply"
          style={{
            transform: `translateY(${scrollY * 0.3}px)`,
            transition: "transform 0.5s cubic-bezier(0.33, 0.66, 0.66, 1)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-96 h-96 bg-purple-100 dark:bg-purple-900/20 rounded-full blur-3xl opacity-50 mix-blend-multiply"
          style={{
            transform: `translateY(${scrollY * -0.2}px)`,
            transition: "transform 0.5s cubic-bezier(0.33, 0.66, 0.66, 1)",
          }}
        />

        {/* Hero Content */}
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <h1
            className="text-5xl sm:text-6xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight tracking-tight"
            style={{
              opacity: Math.max(0.5, 1 - scrollY / 300),
              transform: `translateY(${scrollY * 0.1}px)`,
              transition: "all 0.5s cubic-bezier(0.33, 0.66, 0.66, 1)",
            }}
          >
            Sell Smart.<br />Sell Safe.<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">SellFast.Now</span>
          </h1>

          <p
            className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 mb-4 max-w-2xl mx-auto"
            style={{
              opacity: Math.max(0.5, 1 - scrollY / 400),
              transform: `translateY(${scrollY * 0.15}px)`,
              transition: "all 0.5s cubic-bezier(0.33, 0.66, 0.66, 1)",
            }}
          >
            The modern marketplace for bulk sellers. Post for free. Keep 100% on items under $100.
          </p>

          {/* Value Props */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mb-12 text-sm font-medium">
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <Zap className="w-5 h-5 text-blue-600" />
              <span>AI-Powered Listings</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <Lock className="w-5 h-5 text-blue-600" />
              <span>Buyer Protection</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <Gauge className="w-5 h-5 text-blue-600" />
              <span>Zero Hidden Fees</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button
              onClick={() => navigate("/post-ad")}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transform hover:scale-105 transition-all duration-200"
            >
              Start Selling Now
            </Button>
            <Button
              onClick={() => navigate("/search")}
              variant="outline"
              className="px-8 py-3 font-semibold rounded-lg border-2 transform hover:scale-105 transition-all duration-200"
            >
              Browse Listings
            </Button>
          </div>

          {/* Trust Line */}
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Join 10,000+ sellers. No credit card required.
          </p>
        </div>
      </section>

      {/* FEATURED SECTION */}
      <section className="relative py-20 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              🔥 Trending Right Now
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              See what's selling fast in our community
            </p>
          </div>

          <FeaturedCarousel />

          <div className="text-center mt-12">
            <Button
              onClick={() => navigate("/search")}
              variant="outline"
              className="px-8 py-3 font-semibold rounded-lg border-2"
            >
              View All Listings
            </Button>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-12 text-center">
            Why Choose SellFast.Now
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Sparkles,
                title: "AI-Powered Descriptions",
                description: "Get perfect product descriptions instantly. Our AI analyzes photos and generates SEO-optimized listings in seconds.",
              },
              {
                icon: TrendingUp,
                title: "Bulk Upload Tools",
                description: "Post 1 or 100 items at once. Our bulk upload system saves business sellers hours every week.",
              },
              {
                icon: Lock,
                title: "Verified & Secure",
                description: "Built-in buyer protection, seller verification, and dispute resolution. Safe for everyone.",
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="p-8 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-300 hover:shadow-lg dark:hover:shadow-blue-900/20 group"
              >
                <feature.icon className="w-12 h-12 text-blue-600 mb-4 group-hover:scale-110 transition-transform duration-300" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Simple, Honest Pricing
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              No hidden fees. Ever.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Basic",
                price: "Free",
                items: [
                  "Post unlimited items",
                  "100% of sales on items <$100",
                  "Built-in messaging",
                  "Buyer protection",
                ],
              },
              {
                title: "AI Credits",
                price: "$1.50",
                subtext: "for 25 credits",
                items: [
                  "Auto-generated descriptions",
                  "SEO optimization",
                  "Category detection",
                  "Bulk pricing",
                ],
                highlight: true,
              },
              {
                title: "Business",
                price: "Custom",
                items: [
                  "Dedicated support",
                  "API access",
                  "Advanced analytics",
                  "Custom integrations",
                ],
              },
            ].map((plan, idx) => (
              <div
                key={idx}
                className={`p-8 rounded-xl border-2 transition-all duration-300 ${
                  plan.highlight
                    ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 shadow-lg"
                    : "border-gray-200 dark:border-gray-800 hover:border-gray-300"
                }`}
              >
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {plan.title}
                </h3>
                <p className="text-3xl font-bold text-blue-600 mb-1">
                  {plan.price}
                </p>
                {plan.subtext && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    {plan.subtext}
                  </p>
                )}
                <ul className="space-y-3 mb-8">
                  {plan.items.map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                      <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                        <span className="text-white text-sm">✓</span>
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => navigate(idx === 0 ? "/post-ad" : "/credits")}
                  className={`w-full ${
                    plan.highlight
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600"
                  } text-white font-semibold rounded-lg py-2`}
                >
                  {idx === 0 ? "Start Free" : idx === 1 ? "Buy Credits" : "Contact Us"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FOOTER */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to start selling?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of successful sellers. Post your first listing for free today.
          </p>
          <Button
            onClick={() => navigate("/post-ad")}
            className="px-8 py-3 bg-white text-blue-600 hover:bg-blue-50 font-semibold rounded-lg transform hover:scale-105 transition-all duration-200"
          >
            Post Your First Ad
          </Button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-semibold mb-4">Selling</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="/post-ad" className="hover:text-white transition-colors">How to Sell</a></li>
                <li><a href="/sell/pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="/resources" className="hover:text-white transition-colors">Best Practices</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Buying</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="/buy" className="hover:text-white transition-colors">Browse Listings</a></li>
                <li><a href="/resources" className="hover:text-white transition-colors">Buyer Protection</a></li>
                <li><a href="/resources" className="hover:text-white transition-colors">Saved Searches</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="/resources" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="/resources" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="/resources" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="/resources" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="/resources" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="/resources" className="hover:text-white transition-colors">Guidelines</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8">
            <div className="flex justify-between items-center">
              <p className="text-sm">&copy; 2024 SellFast.Now. All rights reserved.</p>
              <div className="flex gap-6 text-sm">
                <a href="/resources" className="hover:text-white transition-colors">Terms of Service</a>
                <a href="/resources" className="hover:text-white transition-colors">Privacy Policy</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

