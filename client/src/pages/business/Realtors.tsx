import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Home, Zap, DollarSign, Clock, TrendingUp, Users } from "lucide-react";

export default function RealtorsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-6">
            <Home className="h-12 w-12" />
            <h1 className="text-5xl font-bold">For Realtors</h1>
          </div>
          <p className="text-2xl mb-8 text-blue-100">
            Liquidate estate and property contents in hours, not weeks
          </p>
          <p className="text-xl mb-8 max-w-3xl">
            Upload 100+ items at once with AI-powered descriptions, valuations, and SEO optimization. 
            Keep 97% of your sales revenue—no commission fees.
          </p>
          <div className="flex gap-4">
            <Button 
              size="lg" 
              className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6"
              onClick={() => window.location.href = '/partner/bulk-upload'}
            >
              Start Bulk Upload
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white/10 text-lg px-8 py-6"
              onClick={() => window.location.href = '/pricing'}
            >
              View Pricing
            </Button>
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">The Realtor's Dilemma</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 border-red-200 bg-red-50">
              <Clock className="h-10 w-10 text-red-600 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Time-Consuming Manual Listings</h3>
              <p className="text-gray-700">
                Photographing, describing, and pricing 100+ items manually takes 10+ hours of valuable time.
              </p>
            </Card>
            <Card className="p-6 border-red-200 bg-red-50">
              <DollarSign className="h-10 w-10 text-red-600 mb-4" />
              <h3 className="text-xl font-semibold mb-3">High Commission Fees</h3>
              <p className="text-gray-700">
                Traditional platforms charge 10-13% commission on every sale, eating into your profits.
              </p>
            </Card>
            <Card className="p-6 border-red-200 bg-red-50">
              <TrendingUp className="h-10 w-10 text-red-600 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Poor Search Visibility</h3>
              <p className="text-gray-700">
                Generic descriptions mean your listings don't rank well in search results.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-16 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-4">The SellFast.Now Solution</h2>
          <p className="text-xl text-center text-gray-600 mb-12">
            AI-powered bulk upload that saves you time and maximizes your revenue
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card className="p-8 border-blue-200 bg-white shadow-lg">
              <Zap className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-2xl font-semibold mb-4">Upload 100+ Items in Minutes</h3>
              <p className="text-gray-700 mb-4">
                Simply upload photos and basic info. Our AI automatically generates:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                  <span><strong>Professional Titles</strong> - Optimized for search engines</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                  <span><strong>Detailed Descriptions</strong> - Highlighting key features and condition</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                  <span><strong>Accurate Valuations</strong> - Both retail and used market prices</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                  <span><strong>SEO Meta Tags</strong> - Superior search visibility</span>
                </li>
              </ul>
            </Card>

            <Card className="p-8 border-green-200 bg-white shadow-lg">
              <DollarSign className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-2xl font-semibold mb-4">Keep 97% of Your Sales</h3>
              <p className="text-gray-700 mb-4">
                Pay only a small upfront AI fee per item—no commission on sales.
              </p>
              <div className="bg-green-50 p-6 rounded-lg mb-4">
                <h4 className="font-semibold text-lg mb-3">Example: 100 Items @ $50 Average</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Sale Value:</span>
                    <span className="font-semibold">$5,000</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Traditional Platform (13%):</span>
                    <span className="font-semibold">-$650</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>SellFast.Now AI Fee:</span>
                    <span className="font-semibold">-$150</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between text-lg font-bold text-green-700">
                    <span>You Save:</span>
                    <span>$500</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                * 3% optional transaction fee only if using integrated Stripe payments. Accept cash/Venmo to avoid all transaction fees.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Features for Realtors */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Built Specifically for Realtors</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6">
              <div className="text-4xl mb-4">🏡</div>
              <h3 className="text-xl font-semibold mb-3">Estate Content Sales</h3>
              <p className="text-gray-700">
                Perfect for liquidating furniture, appliances, and personal property from estate sales.
              </p>
            </Card>
            <Card className="p-6">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-xl font-semibold mb-3">Mobile-Friendly</h3>
              <p className="text-gray-700">
                Take photos on-site with your phone and upload directly from the property.
              </p>
            </Card>
            <Card className="p-6">
              <div className="text-4xl mb-4">🏪</div>
              <h3 className="text-xl font-semibold mb-3">Branded Storefront</h3>
              <p className="text-gray-700">
                Get your own custom-branded page to showcase all your listings professionally.
              </p>
            </Card>
            <Card className="p-6">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-3">Analytics Dashboard</h3>
              <p className="text-gray-700">
                Track views, inquiries, and sales performance for all your listings in real-time.
              </p>
            </Card>
            <Card className="p-6">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-xl font-semibold mb-3">Built-In Messaging</h3>
              <p className="text-gray-700">
                Communicate with buyers directly through our secure messaging system.
              </p>
            </Card>
            <Card className="p-6">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold mb-3">Fast Turnaround</h3>
              <p className="text-gray-700">
                List entire estate contents in under an hour and start receiving offers immediately.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Comparison */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Pricing Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-lg shadow-lg">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="p-4 text-left">Platform</th>
                  <th className="p-4 text-right">Commission</th>
                  <th className="p-4 text-right">AI Listing Fee</th>
                  <th className="p-4 text-right">Total Cost (100 items @ $50 avg)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-4 font-semibold">eBay</td>
                  <td className="p-4 text-right text-red-600">13%</td>
                  <td className="p-4 text-right">$0</td>
                  <td className="p-4 text-right font-semibold text-red-600">$650</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-semibold">Facebook Marketplace</td>
                  <td className="p-4 text-right text-red-600">5%</td>
                  <td className="p-4 text-right">$0</td>
                  <td className="p-4 text-right font-semibold text-red-600">$250</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-semibold">Craigslist</td>
                  <td className="p-4 text-right">0%</td>
                  <td className="p-4 text-right">$0</td>
                  <td className="p-4 text-right font-semibold">$0 (but 10+ hours manual work)</td>
                </tr>
                <tr className="bg-green-50 border-2 border-green-500">
                  <td className="p-4 font-bold text-green-700">SellFast.Now</td>
                  <td className="p-4 text-right font-bold text-green-700">0%</td>
                  <td className="p-4 text-right font-bold text-green-700">~$1.50/item</td>
                  <td className="p-4 text-right font-bold text-green-700">$150 + AI automation</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-center text-gray-600 mt-6">
            * Optional 3% transaction fee only when using integrated Stripe payments
          </p>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">What Realtors Are Saying</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                  👨‍💼
                </div>
                <div>
                  <h4 className="font-semibold text-lg">Michael Chen</h4>
                  <p className="text-gray-600">Realtor, Bay Area</p>
                </div>
              </div>
              <p className="text-gray-700 italic">
                "I used to spend an entire weekend listing estate contents. Now I do it in under an hour with SellFast.Now. 
                The AI descriptions are better than what I used to write manually!"
              </p>
            </Card>
            <Card className="p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                  👩‍💼
                </div>
                <div>
                  <h4 className="font-semibold text-lg">Sarah Martinez</h4>
                  <p className="text-gray-600">Real Estate Broker</p>
                </div>
              </div>
              <p className="text-gray-700 italic">
                "The cost savings are incredible. I used to lose hundreds in eBay fees. Now I keep almost everything and my clients are thrilled with the fast turnaround."
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Estate Sales?</h2>
          <p className="text-xl mb-8">
            Join hundreds of realtors who are saving time and maximizing profits with AI-powered bulk listings.
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6"
              onClick={() => window.location.href = '/partner/bulk-upload'}
            >
              Start Your First Bulk Upload
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white/10 text-lg px-8 py-6"
              onClick={() => window.location.href = '/partner/onboard'}
            >
              Become a Partner
            </Button>
          </div>
          <p className="mt-6 text-blue-100">
            No credit card required • First 3 items free • Cancel anytime
          </p>
        </div>
      </section>
    </div>
  );
}
