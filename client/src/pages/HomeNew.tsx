import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ListingCard from "@/components/ListingCard";
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
        <section className="relative bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 pt-20 pb-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
                Sell Smarter.
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8">
                Keep 97% of your sales. Upload in bulk. AI-powered listings.
              </p>

              {/* Quick Actions - Craigslist Style */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto text-lg px-8 py-6"
                  onClick={() => navigate('/post-ad')}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Post an Item
                </Button>
                
                <form onSubmit={handleSearch} className="w-full sm:w-96">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      type="text"
                      placeholder="Search for anything..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 py-6 text-lg"
                    />
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* Bulk Sellers Section - Top Priority */}
        <section className="py-16 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Built for Business Sellers
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Liquidators, estate sales, realtors, and bulk sellers save thousands
              </p>
            </div>

            {/* Price Comparison Table */}
            <div className="max-w-4xl mx-auto mb-12">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-8 shadow-lg">
                <h3 className="text-2xl font-bold text-center mb-6">Platform Fee Comparison</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* SellFast.Now */}
                  <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border-4 border-green-500 relative">
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                      Best Value
                    </div>
                    <div className="text-center mt-4">
                      <div className="text-lg font-semibold mb-2">SellFast.Now</div>
                      <div className="text-4xl font-bold text-green-600 mb-2">3%</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">You keep 97%</div>
                      <div className="text-xs text-green-600 mb-3">Buyer and seller verification and rating system to protect you</div>
                      <CheckCircle className="w-6 h-6 text-green-500 mx-auto" />
                    </div>
                  </div>

                  {/* eBay */}
                  <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200">
                    <div className="text-center">
                      <div className="text-lg font-semibold mb-2">eBay</div>
                      <div className="text-4xl font-bold text-red-600 mb-2">12.9%</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">+ listing fees</div>
                      <div className="text-xs text-red-600">4.3x more expensive</div>
                    </div>
                  </div>

                  {/* Facebook Marketplace */}
                  <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200">
                    <div className="text-center">
                      <div className="text-lg font-semibold mb-2">Facebook</div>
                      <div className="text-4xl font-bold text-orange-600 mb-2">5%</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">+ payment fees</div>
                      <div className="text-xs text-orange-600">1.7x more expensive</div>
                    </div>
                  </div>

                  {/* Craigslist */}
                  <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200">
                    <div className="text-center">
                      <div className="text-lg font-semibold mb-2">Craigslist</div>
                      <div className="text-4xl font-bold text-gray-600 mb-2">Free</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">But...</div>
                      <div className="text-xs text-gray-500">No bulk tools, spam, scams, no buyer and seller rating system</div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Bulk Seller Features */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                <Package className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">Bulk Upload Tools</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Upload hundreds of items at once via CSV. Perfect for estate sales and liquidations.
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                <TrendingUp className="w-12 h-12 text-green-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">Branded Storefront</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Custom URL, your logo, your colors. Professional presence for your business.
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                <DollarSign className="w-12 h-12 text-purple-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">Direct Payments</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Stripe integration. 97% goes directly to your bank account. No waiting.
                </p>
              </div>
            </div>

            <div className="text-center">
              <Button 
                size="lg" 
                className="text-lg px-8 py-6"
                onClick={() => navigate('/partner/onboard')}
              >
                Become a Business Partner
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </section>

        {/* AI Features Section */}
        <section className="py-16 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-900">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-full mb-4">
                <Sparkles className="w-5 h-5" />
                <span className="font-semibold">AI-Powered</span>
              </div>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                List Items in Seconds
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Our AI analyzes your photos and writes the listing for you
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8">
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
        <section className="py-16 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                Recently Posted
              </h2>
              <Button variant="outline" onClick={() => navigate('/search')}>
                View All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentListings.slice(0, 8).map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

