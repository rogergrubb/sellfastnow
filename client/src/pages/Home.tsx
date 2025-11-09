import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ListingCard from "@/components/ListingCard";
import { FeaturedCarousel } from "@/components/FeaturedCarousel";
import { 
  Search, Plus, TrendingUp, Zap, DollarSign, 
  Package, Sparkles, CheckCircle, ArrowRight 
} from "lucide-react";
import type { Listing } from "@shared/schema";

export default function HomeNew() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch recent listings
  const { data: recentListings = [] } = useQuery<Listing[]>({
    queryKey: ['/api/listings/recent'],
    queryFn: async () => {
      const response = await fetch('/api/listings?sortBy=newest&limit=8');
      if (!response.ok) return [];
      return response.json();
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <>
      <Helmet>
        <title>SellFast.Now - Sell in Bulk, Save More | AI-Powered Marketplace</title>
        <meta name="description" content="The smarter way to sell. Bulk upload tools, AI-powered listings, and keep 97% of your sales. Compare: eBay 12.9%, Facebook 5%, Craigslist spam." />
      </Helmet>

      <div className="min-h-screen">
        {/* Hero Section - Clean & Minimal */}
        <section className="relative bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 pt-16 md:pt-24 pb-12 md:pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 md:mb-12">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4 px-2">
                Sell Smart. Sell Safe. SellFast.Now
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-green-600 dark:text-green-400 font-semibold mb-6 md:mb-8">
                Post for FREE* <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-normal">(Limitations apply)</span>
              </p>

              {/* Quick Actions - Craigslist Style */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center mb-8 md:mb-12 max-w-4xl mx-auto px-4">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 shadow-lg hover:shadow-xl"
                  onClick={() => navigate('/post-ad')}
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Post an Item
                </Button>
                
                <form onSubmit={handleSearch} className="w-full sm:flex-1 sm:max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <Input
                      type="text"
                      placeholder="Search for anything..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 sm:pl-10 py-5 sm:py-6 text-base sm:text-lg shadow-md"
                    />
                  </div>
                </form>
              </div>
            </div>

            {/* Featured Listings Carousel */}
            <div className="mt-8 md:mt-12">
              <FeaturedCarousel />
            </div>
          </div>
        </section>

        {/* Bulk Sellers Section - Top Priority */}
        <section className="py-12 md:py-16 lg:py-20 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 md:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 md:mb-4 px-2">
                Built for Business Sellers
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 px-4">
                Liquidators, estate sales, realtors, and bulk sellers save thousands
              </p>
            </div>

            {/* Price Comparison Table */}
            <div className="max-w-5xl mx-auto mb-8 md:mb-12">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-xl md:rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg">
                <h3 className="text-xl sm:text-2xl font-bold text-center mb-4 sm:mb-6">Platform Fee Comparison</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                  {/* SellFast.Now */}
                  <div className="bg-white dark:bg-gray-900 rounded-lg md:rounded-xl p-3 sm:p-4 md:p-6 border-2 md:border-4 border-green-500 relative col-span-2 md:col-span-1">
                    <div className="absolute -top-2 md:-top-3 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-2 sm:px-3 md:px-4 py-0.5 md:py-1 rounded-full text-xs md:text-sm font-bold">
                      Best Value
                    </div>
                    <div className="text-center mt-3 md:mt-4">
                      <div className="text-sm sm:text-base md:text-lg font-semibold mb-1 md:mb-2">SellFast.Now</div>
                      <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-green-600 mb-1 md:mb-2">3%</div>
                      <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-1 md:mb-2">You keep 97%</div>
                      <div className="text-xs md:text-sm font-semibold text-green-700 dark:text-green-400 mb-2 md:mb-3">
                        Post for FREE*
                        <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 font-normal">(Limitations apply)</div>
                      </div>
                      <div className="text-[10px] md:text-xs text-green-600 mb-2 md:mb-3 hidden sm:block">Buyer and seller verification and rating system to protect you</div>
                      <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-green-500 mx-auto" />
                    </div>
                  </div>

                  {/* eBay */}
                  <div className="bg-white dark:bg-gray-900 rounded-lg md:rounded-xl p-3 sm:p-4 md:p-6 border border-gray-200">
                    <div className="text-center">
                      <div className="text-sm sm:text-base md:text-lg font-semibold mb-1 md:mb-2">eBay</div>
                      <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-red-600 mb-1 md:mb-2">12.9%</div>
                      <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-2 md:mb-4">+ listing fees</div>
                      <div className="text-[10px] md:text-xs text-red-600">4.3x more</div>
                    </div>
                  </div>

                  {/* Facebook Marketplace */}
                  <div className="bg-white dark:bg-gray-900 rounded-lg md:rounded-xl p-3 sm:p-4 md:p-6 border border-gray-200">
                    <div className="text-center">
                      <div className="text-sm sm:text-base md:text-lg font-semibold mb-1 md:mb-2">Facebook</div>
                      <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-orange-600 mb-1 md:mb-2">5%</div>
                      <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-2 md:mb-4">+ payment fees</div>
                      <div className="text-[10px] md:text-xs text-orange-600">1.7x more</div>
                    </div>
                  </div>

                  {/* Craigslist */}
                  <div className="bg-white dark:bg-gray-900 rounded-lg md:rounded-xl p-3 sm:p-4 md:p-6 border border-gray-200 col-span-2 md:col-span-1">
                    <div className="text-center">
                      <div className="text-sm sm:text-base md:text-lg font-semibold mb-1 md:mb-2">Craigslist</div>
                      <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-600 mb-1 md:mb-2">Free</div>
                      <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-2 md:mb-4">But...</div>
                      <div className="text-[10px] md:text-xs text-gray-500">No bulk tools, spam, scams</div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Bulk Seller Features */}
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 md:mb-8">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg md:rounded-xl p-4 sm:p-5 md:p-6">
                <Package className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600 mb-3 md:mb-4" />
                <h3 className="text-lg sm:text-xl font-bold mb-2">Bulk Upload Tools</h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                  Upload hundreds of items at once via CSV. Perfect for estate sales and liquidations.
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg md:rounded-xl p-4 sm:p-5 md:p-6">
                <TrendingUp className="w-10 h-10 sm:w-12 sm:h-12 text-green-600 mb-3 md:mb-4" />
                <h3 className="text-lg sm:text-xl font-bold mb-2">Branded Storefront</h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                  Custom URL, your logo, your colors. Professional presence for your business.
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg md:rounded-xl p-4 sm:p-5 md:p-6 sm:col-span-2 md:col-span-1">
                <DollarSign className="w-10 h-10 sm:w-12 sm:h-12 text-purple-600 mb-3 md:mb-4" />
                <h3 className="text-lg sm:text-xl font-bold mb-2">Direct Payments</h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                  Stripe integration. 97% goes directly to your bank account. No waiting.
                </p>
              </div>
            </div>

            <div className="text-center px-4">
              <Button 
                size="lg" 
                className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 shadow-lg hover:shadow-xl"
                onClick={() => navigate('/partner/onboard')}
              >
                Become a Business Partner
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
              </Button>
            </div>
          </div>
        </section>

        {/* AI Features Section */}
        <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 md:mb-12">
              <div className="inline-flex items-center gap-2 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-3 md:mb-4 text-sm sm:text-base">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-semibold">AI-Powered</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 md:mb-4 px-2">
                List Items in Seconds
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 px-4">
                Our AI analyzes your photos and writes the listing for you
              </p>
            </div>

            <div className="max-w-5xl mx-auto">
              <div className="grid md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                {/* Individual Items */}
                <div className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-lg">
                  <Zap className="w-12 h-12 text-yellow-500 mb-4" />
                  <h3 className="text-2xl font-bold mb-4">Single Items</h3>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                      <span>Upload photo, AI identifies the object</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                      <span>Auto-generates title and description</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                      <span>Suggests category and tags</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                      <span>Recommends pricing</span>
                    </li>
                  </ul>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-bold text-green-600">Free</span> with every listing
                  </div>
                </div>

                {/* Bulk Items */}
                <div className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-lg border-2 border-purple-500">
                  <div className="flex items-center gap-2 mb-4">
                    <Package className="w-12 h-12 text-purple-500" />
                    <span className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full text-sm font-bold">
                      Bulk Discount
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Bulk Processing</h3>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                      <span>Process 100+ items at once</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                      <span>AI analyzes all photos in batch</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                      <span>Auto-fills CSV with titles & descriptions</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                      <span>Perfect for estate sales</span>
                    </li>
                  </ul>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-bold text-purple-600">$0.10/item</span> (save hours of work)
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-white dark:bg-gray-900 rounded-xl text-center">
                <p className="text-lg text-gray-700 dark:text-gray-300">
                  <span className="font-bold">Example:</span> Process 200 estate sale items for just <span className="text-purple-600 font-bold">$20</span>
                  <br />
                  <span className="text-sm text-gray-500">vs. 10+ hours of manual data entry</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Listings - Compact */}
        <section className="py-12 md:py-16 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-6 md:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Recently Posted
              </h2>
              <Button variant="outline" onClick={() => navigate('/search')} className="text-sm sm:text-base">
                View All
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-2" />
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {recentListings.slice(0, 8).map((listing) => (
                <ListingCard 
                  key={listing.id}
                  id={listing.id}
                  title={listing.title}
                  price={parseFloat(listing.price)}
                  location={listing.location || 'Unknown'}
                  timePosted={new Date(listing.createdAt).toISOString()}
                  image={listing.images?.[0]}
                  seller={listing.seller}
                  sellerStats={listing.sellerStats}
                />
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

