import { CheckCircle, XCircle, Sparkles, Package } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="bg-gray-50">
      {/* Hero Section */}
      <div className="py-20 px-4 text-center bg-white">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Simple, Transparent Pricing</h1>
        <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">Keep more of your money. No hidden fees, no commissions on local sales. Ever.</p>
      </div>

      {/* Pricing Table Section */}
      <div className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <div className="border rounded-lg p-8 bg-white shadow-lg">
              <h3 className="text-2xl font-bold text-center mb-4">Free</h3>
              <p className="text-5xl font-bold text-center mb-6">$0</p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" /> Up to 3 listings</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" /> Basic AI features</li>
                <li className="flex items-center"><XCircle className="h-5 w-5 text-red-500 mr-2" /> Bulk Upload</li>
                <li className="flex items-center"><XCircle className="h-5 w-5 text-red-500 mr-2" /> Advanced AI</li>
              </ul>
              <button className="w-full bg-gray-200 text-gray-700 font-bold py-3 rounded-full">Your Current Plan</button>
            </div>

            {/* Pro Plan */}
            <div className="border-2 border-blue-500 rounded-lg p-8 bg-white shadow-2xl relative">
              <div className="absolute top-0 -translate-y-1/2 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">MOST POPULAR</div>
              <h3 className="text-2xl font-bold text-center mb-4">Pro Seller</h3>
              <p className="text-5xl font-bold text-center mb-2">$1.50</p>
              <p className="text-center text-gray-500 mb-6">per AI listing</p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" /> Unlimited listings</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" /> Advanced AI features</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" /> Bulk Upload</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" /> SEO Optimization</li>
              </ul>
              <button 
                className="w-full bg-blue-500 text-white font-bold py-3 rounded-full hover:bg-blue-600 transition-colors"
                onClick={() => window.location.href = 
'/credits'}
              >
                Get Started
              </button>
            </div>

            {/* Enterprise Plan */}
            <div className="border rounded-lg p-8 bg-white shadow-lg">
              <h3 className="text-2xl font-bold text-center mb-4">Enterprise</h3>
              <p className="text-5xl font-bold text-center mb-2">Custom</p>
              <p className="text-center text-gray-500 mb-6">for high-volume sellers</p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" /> Volume discounts</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" /> Dedicated support</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" /> White-label storefronts</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" /> API Access</li>
              </ul>
              <button 
                className="w-full bg-gray-800 text-white font-bold py-3 rounded-full hover:bg-gray-900 transition-colors"
                onClick={() => window.location.href = 
'/partner/onboard'}
              >
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fee Comparison Section */}
      <div className="bg-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How We Compare</h2>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="py-4">Platform</th>
                <th className="py-4 text-center">Commission Fee</th>
                <th className="py-4 text-center">AI Listing Fee</th>
                <th className="py-4 text-center">Your Net Profit*</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-4 font-bold">SellFast.Now</td>
                <td className="py-4 text-center text-green-600 font-bold">0% (for local sales)</td>
                <td className="py-4 text-center">~$1.50 / item</td>
                <td className="py-4 text-center text-green-600 font-bold">$9,850</td>
              </tr>
              <tr className="border-b">
                <td className="py-4">eBay</td>
                <td className="py-4 text-center">~13.25%</td>
                <td className="py-4 text-center">$0</td>
                <td className="py-4 text-center">$8,675</td>
              </tr>
              <tr className="border-b">
                <td className="py-4">Facebook Marketplace</td>
                <td className="py-4 text-center">5% (for shipped items)</td>
                <td className="py-4 text-center">$0</td>
                <td className="py-4 text-center">$9,500</td>
              </tr>
              <tr>
                <td className="py-4">Craigslist</td>
                <td className="py-4 text-center">0%</td>
                <td className="py-4 text-center">$0</td>
                <td className="py-4 text-center">$10,000 (but manual work)</td>
              </tr>
            </tbody>
          </table>
          <p className="text-xs text-gray-500 mt-4">*Based on selling 100 items with a total value of $10,000. Assumes local/cash sales on SellFast.Now and Craigslist.</p>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-8">
            <div>
              <h4 className="font-semibold text-lg mb-2">What are AI credits?</h4>
              <p className="text-gray-600">AI credits are used to pay for AI-powered listings. One credit equals one listing. You can buy credits in packs, and the more you buy, the cheaper they get.</p>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Are there any transaction fees?</h4>
              <p className="text-gray-600">We charge a 0% commission on local or cash sales. If you use our integrated payment processor (Stripe) for online payments, a standard 2.9% + 30¢ processing fee applies. This is paid by the buyer.</p>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">Can I try before I buy?</h4>
              <p className="text-gray-600">Yes! Your first 3 AI-powered listings are on us. Experience the magic of AI-generated content for free.</p>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-2">What if I have thousands of items?</h4>
              <p className="text-gray-600">Our Enterprise plan is for you. We offer volume discounts, dedicated support, and custom solutions for high-volume sellers. Contact our sales team to learn more.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
