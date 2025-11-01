import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Building2, Zap, DollarSign, Clock, Package, TrendingUp } from "lucide-react";

export default function EstateSalesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-purple-600 to-purple-800 text-white py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="h-12 w-12" />
            <h1 className="text-5xl font-bold">For Estate Liquidators</h1>
          </div>
          <p className="text-2xl mb-8 text-purple-100">
            Liquidate entire estates 10x faster with AI-powered bulk listings
          </p>
          <p className="text-xl mb-8 max-w-3xl">
            Upload hundreds of items at once. Our AI generates professional descriptions, accurate valuations, 
            and SEO-optimized listings in minutes—not days.
          </p>
          <div className="flex gap-4">
            <Button 
              size="lg" 
              className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-6"
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
          <h2 className="text-3xl font-bold text-center mb-12">The Estate Liquidation Challenge</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 border-red-200 bg-red-50">
              <Clock className="h-10 w-10 text-red-600 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Overwhelming Volume</h3>
              <p className="text-gray-700">
                Cataloging 200-500 items per estate manually takes days of labor-intensive work.
              </p>
            </Card>
            <Card className="p-6 border-red-200 bg-red-50">
              <DollarSign className="h-10 w-10 text-red-600 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Pricing Complexity</h3>
              <p className="text-gray-700">
                Researching fair market values for diverse items requires extensive expertise and time.
              </p>
            </Card>
            <Card className="p-6 border-red-200 bg-red-50">
              <TrendingUp className="h-10 w-10 text-red-600 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Platform Limitations</h3>
              <p className="text-gray-700">
                Traditional platforms aren't built for bulk uploads and charge high commission fees.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-16 bg-gradient-to-b from-purple-50 to-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-4">The Complete Estate Liquidation Solution</h2>
          <p className="text-xl text-center text-gray-600 mb-12">
            Purpose-built for professional estate liquidators
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card className="p-8 border-purple-200 bg-white shadow-lg">
              <Package className="h-12 w-12 text-purple-600 mb-4" />
              <h3 className="text-2xl font-semibold mb-4">Bulk Upload 500+ Items</h3>
              <p className="text-gray-700 mb-4">
                Upload entire estates in a single session. Our AI handles:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                  <span><strong>Automatic Categorization</strong> - AI identifies item types and categories</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                  <span><strong>Professional Descriptions</strong> - Detailed, SEO-optimized content</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                  <span><strong>Market Valuations</strong> - Retail and used pricing based on current market data</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                  <span><strong>Condition Assessment</strong> - AI evaluates item condition from photos</span>
                </li>
              </ul>
            </Card>

            <Card className="p-8 border-green-200 bg-white shadow-lg">
              <DollarSign className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-2xl font-semibold mb-4">Transparent, Fair Pricing</h3>
              <p className="text-gray-700 mb-4">
                Progressive per-item fees based on value—no commission on sales.
              </p>
              <div className="bg-green-50 p-6 rounded-lg mb-4">
                <h4 className="font-semibold text-lg mb-3">Example: 300 Items Estate</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>100 items @ $20 avg:</span>
                    <span className="font-semibold">$2,000 value</span>
                  </div>
                  <div className="flex justify-between">
                    <span>100 items @ $50 avg:</span>
                    <span className="font-semibold">$5,000 value</span>
                  </div>
                  <div className="flex justify-between">
                    <span>100 items @ $100 avg:</span>
                    <span className="font-semibold">$10,000 value</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Total Sale Value:</span>
                    <span>$17,000</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Traditional Platform (10%):</span>
                    <span className="font-semibold">-$1,700</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>SellFast.Now AI Fee:</span>
                    <span className="font-semibold">-$450</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between text-lg font-bold text-green-700">
                    <span>You Save:</span>
                    <span>$1,250</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                * Volume discounts available for 500+ items. No transaction fees for cash/local payments.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Features for Estate Liquidators */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Professional Tools for Estate Liquidators</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6">
              <div className="text-4xl mb-4">📸</div>
              <h3 className="text-xl font-semibold mb-3">Batch Photo Upload</h3>
              <p className="text-gray-700">
                Upload hundreds of photos at once. AI automatically matches photos to items and creates galleries.
              </p>
            </Card>
            <Card className="p-6">
              <div className="text-4xl mb-4">🏷️</div>
              <h3 className="text-xl font-semibold mb-3">Smart Pricing</h3>
              <p className="text-gray-700">
                AI suggests optimal pricing based on condition, market demand, and comparable sales.
              </p>
            </Card>
            <Card className="p-6">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-3">Estate Dashboard</h3>
              <p className="text-gray-700">
                Track each estate separately with dedicated dashboards showing views, offers, and sales.
              </p>
            </Card>
            <Card className="p-6">
              <div className="text-4xl mb-4">🏪</div>
              <h3 className="text-xl font-semibold mb-3">Branded Storefront</h3>
              <p className="text-gray-700">
                Showcase your business with a custom-branded page featuring all your current estates.
              </p>
            </Card>
            <Card className="p-6">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-xl font-semibold mb-3">Mobile App</h3>
              <p className="text-gray-700">
                Photograph and upload items on-site directly from your phone during estate walkthroughs.
              </p>
            </Card>
            <Card className="p-6">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-xl font-semibold mb-3">Buyer Communication</h3>
              <p className="text-gray-700">
                Manage all buyer inquiries in one place with built-in messaging and offer management.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Simple 3-Step Process</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-2xl font-bold text-purple-600 mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-3">Upload Photos & Basic Info</h3>
              <p className="text-gray-700">
                Take photos of items and upload in bulk. Add basic details like location and pickup instructions.
              </p>
            </Card>
            <Card className="p-8 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-2xl font-bold text-purple-600 mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-3">AI Generates Listings</h3>
              <p className="text-gray-700">
                Our AI creates professional titles, descriptions, valuations, and SEO tags for every item automatically.
              </p>
            </Card>
            <Card className="p-8 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-2xl font-bold text-purple-600 mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-3">Review & Publish</h3>
              <p className="text-gray-700">
                Quick review and edit if needed, then publish all listings with one click. Start receiving offers immediately.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Trusted by Professional Liquidators</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-2xl">
                  👨‍💼
                </div>
                <div>
                  <h4 className="font-semibold text-lg">David Thompson</h4>
                  <p className="text-gray-600">Estate Liquidation Services</p>
                </div>
              </div>
              <p className="text-gray-700 italic">
                "We handle 15-20 estates per month. SellFast.Now has cut our listing time by 80%. The AI valuations are surprisingly accurate, 
                and clients love how fast we can get their estates online."
              </p>
            </Card>
            <Card className="p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-2xl">
                  👩‍💼
                </div>
                <div>
                  <h4 className="font-semibold text-lg">Jennifer Wu</h4>
                  <p className="text-gray-600">Professional Estate Liquidator</p>
                </div>
              </div>
              <p className="text-gray-700 italic">
                "The cost savings are game-changing. We used to lose thousands in eBay fees every month. Now we keep 97% of sales 
                and can pass those savings to our clients."
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-purple-800 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Revolutionize Your Estate Liquidation Business?</h2>
          <p className="text-xl mb-8">
            Join the growing network of professional estate liquidators saving time and maximizing profits.
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-6"
              onClick={() => window.location.href = '/partner/bulk-upload'}
            >
              Start Bulk Upload
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
          <p className="mt-6 text-purple-100">
            No credit card required • First 3 items free • Volume discounts available
          </p>
        </div>
      </section>
    </div>
  );
}
