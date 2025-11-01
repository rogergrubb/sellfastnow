import { CheckCircle, Zap, Sparkles, Package, UploadCloud, Search, MessageCircle, DollarSign } from "lucide-react";

export default function HowItWorksPage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="py-20 px-4 text-center bg-gray-50">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">How SellFast.Now Works</h1>
        <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">The smartest, fastest way to sell your stuff online. Here’s how we do it.</p>
      </div>

      {/* For Sellers Section */}
      <div className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">For Sellers: 3 Easy Steps</h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="p-8">
              <UploadCloud className="h-12 w-12 mx-auto mb-4 text-blue-500" />
              <h3 className="text-xl font-semibold mb-2">1. Create Your Listing</h3>
              <p className="text-gray-600">Upload photos and let our AI generate a professional title, description, and price. Or, upload a spreadsheet of 10,000 items at once.</p>
            </div>
            <div className="p-8">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-blue-500" />
              <h3 className="text-xl font-semibold mb-2">2. Connect with Buyers</h3>
              <p className="text-gray-600">Get messages from interested buyers. Our secure messaging system keeps your contact info private.</p>
            </div>
            <div className="p-8">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-blue-500" />
              <h3 className="text-xl font-semibold mb-2">3. Get Paid</h3>
              <p className="text-gray-600">Arrange a local pickup and get paid in cash, or use our secure online payment system. You keep 100% of local sales.</p>
            </div>
          </div>
        </div>
      </div>

      {/* For Buyers Section */}
      <div className="bg-gray-50 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">For Buyers: Find Amazing Deals</h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="p-8">
              <Search className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <h3 className="text-xl font-semibold mb-2">1. Discover Items</h3>
              <p className="text-gray-600">Search by keyword, category, or location. Our smart search helps you find exactly what you’re looking for.</p>
            </div>
            <div className="p-8">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <h3 className="text-xl font-semibold mb-2">2. Contact Sellers</h3>
              <p className="text-gray-600">Ask questions, negotiate prices, and arrange a meetup through our secure messaging system.</p>
            </div>
            <div className="p-8">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <h3 className="text-xl font-semibold mb-2">3. Pay Securely</h3>
              <p className="text-gray-600">Pay in person or use our secure online payment system with buyer protection. Your choice.</p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Magic Section */}
      <div className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Sparkles className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
          <h2 className="text-3xl font-bold mb-4">The AI Magic Behind It All</h2>
          <p className="text-lg text-gray-600">Our secret sauce is a powerful AI engine that automates the most tedious parts of selling. It analyzes your photos and generates high-quality listing content in seconds, saving you hours of work and helping you sell faster.</p>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 text-white py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg mb-8">Join thousands of sellers and buyers who are experiencing the future of online commerce.</p>
          <div className="flex justify-center gap-4">
            <button 
              className="bg-white text-blue-600 font-bold py-3 px-8 rounded-full hover:bg-gray-100 transition-colors"
              onClick={() => window.location.href = 
'/post-ad'}
            >
              Sell Your First Item
            </button>
            <button 
              className="bg-transparent border-2 border-white text-white font-bold py-3 px-8 rounded-full hover:bg-white hover:text-blue-600 transition-colors"
              onClick={() => window.location.href = 
'/'}
            >
              Browse Listings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
