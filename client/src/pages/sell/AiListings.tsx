import { CheckCircle, Zap, Sparkles, Package, UploadCloud } from "lucide-react";

export default function AiListingsPage() {
  return (
    <div className="bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-20 px-4 text-center">
        <div className="absolute inset-0 bg-black opacity-30"></div>
        <div className="relative max-w-4xl mx-auto">
          <Sparkles className="h-16 w-16 mx-auto mb-4 text-yellow-300" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">AI-Powered Listings: Sell 10x Faster</h1>
          <p className="text-lg md:text-xl mb-8">Let our AI do the work. Get professional, high-converting listings in seconds.</p>
          <button 
            className="bg-white text-orange-500 font-bold py-3 px-8 rounded-full hover:bg-gray-100 transition-colors"
            onClick={() => window.location.href = 
'/post-ad'}
          >
            Start Your First AI Listing
          </button>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How Our AI Transforms Your Listings</h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <UploadCloud className="h-12 w-12 mx-auto mb-4 text-orange-500" />
              <h3 className="text-xl font-semibold mb-2">1. Upload Anything</h3>
              <p className="text-gray-600">Snap a photo or upload a spreadsheet. Our AI can handle single items or 10,000-item inventories.</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md">
              <Zap className="h-12 w-12 mx-auto mb-4 text-orange-500" />
              <h3 className="text-xl font-semibold mb-2">2. AI Does the Work</h3>
              <p className="text-gray-600">Our AI instantly generates titles, descriptions, categories, valuations, and SEO tags for every item.</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-orange-500" />
              <h3 className="text-xl font-semibold mb-2">3. Go Live in Seconds</h3>
              <p className="text-gray-600">Review and approve your listings. Go live on SellFast.Now and watch the offers roll in.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">What Our AI Generates For You</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="p-6 bg-gray-100 rounded-lg">
              <h4 className="font-semibold text-lg mb-2">✅ Professional Titles</h4>
              <p className="text-gray-600">SEO-optimized titles that attract buyers.</p>
            </div>
            <div className="p-6 bg-gray-100 rounded-lg">
              <h4 className="font-semibold text-lg mb-2">✅ Compelling Descriptions</h4>
              <p className="text-gray-600">Detailed, persuasive descriptions that sell.</p>
            </div>
            <div className="p-6 bg-gray-100 rounded-lg">
              <h4 className="font-semibold text-lg mb-2">✅ Accurate Valuations</h4>
              <p className="text-gray-600">Retail and used price estimates to maximize profit.</p>
            </div>
            <div className="p-6 bg-gray-100 rounded-lg">
              <h4 className="font-semibold text-lg mb-2">✅ Smart Categorization</h4>
              <p className="text-gray-600">Automatic placement in the right categories.</p>
            </div>
            <div className="p-6 bg-gray-100 rounded-lg">
              <h4 className="font-semibold text-lg mb-2">✅ SEO Meta Tags</h4>
              <p className="text-gray-600">Boost your visibility on Google and other search engines.</p>
            </div>
            <div className="p-6 bg-gray-100 rounded-lg">
              <h4 className="font-semibold text-lg mb-2">✅ Condition Assessment</h4>
              <p className="text-gray-600">Suggests item condition based on images.</p>
            </div>
            <div className="p-6 bg-gray-100 rounded-lg">
              <h4 className="font-semibold text-lg mb-2">✅ Brand & Model Detection</h4>
              <p className="text-gray-600">Identifies key product attributes automatically.</p>
            </div>
            <div className="p-6 bg-gray-100 rounded-lg">
              <h4 className="font-semibold text-lg mb-2">✅ Cross-Selling Suggestions</h4>
              <p className="text-gray-600">Recommends related items to bundle.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Use Cases Section */}
      <div className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Perfect For Every Seller</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-2">Individual Sellers</h3>
              <p className="text-gray-600">Sell your stuff faster and for more money. No more writer's block or guessing prices.</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-2">Small Businesses</h3>
              <p className="text-gray-600">Manage your inventory with ease. Get professional listings without hiring a copywriter.</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-2">Enterprise Liquidators</h3>
              <p className="text-gray-600">Liquidate entire warehouses at scale. Our AI handles technical specs and massive volumes.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-orange-500 text-white py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to Supercharge Your Sales?</h2>
          <p className="text-lg mb-8">Stop wasting time on manual listings. Let our AI do the heavy lifting so you can focus on what you do best.</p>
          <div className="flex justify-center gap-4">
            <button 
              className="bg-white text-orange-500 font-bold py-3 px-8 rounded-full hover:bg-gray-100 transition-colors"
              onClick={() => window.location.href = 
'/partner/bulk-upload'}
            >
              Try Bulk Upload
            </button>
            <button 
              className="bg-transparent border-2 border-white text-white font-bold py-3 px-8 rounded-full hover:bg-white hover:text-orange-500 transition-colors"
              onClick={() => window.location.href = 
'/pricing'}
            >
              View Pricing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
