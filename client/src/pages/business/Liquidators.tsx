import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Briefcase, Zap, DollarSign, Clock, Package, TrendingUp, Building } from "lucide-react";

export default function LiquidatorsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-indigo-600 to-indigo-800 text-white py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-6">
            <Briefcase className="h-12 w-12" />
            <h1 className="text-5xl font-bold">For Business Liquidators</h1>
          </div>
          <p className="text-2xl mb-8 text-indigo-100">
            Liquidate commercial inventory, equipment, and assets at scale
          </p>
          <p className="text-xl mb-8 max-w-3xl">
            Handle business closures, overstock, and equipment sales with AI-powered bulk listings. 
            Upload 1000+ items and maximize recovery rates with zero commission fees.
          </p>
          <div className="flex gap-4">
            <Button 
              size="lg" 
              className="bg-white text-indigo-600 hover:bg-gray-100 text-lg px-8 py-6"
              onClick={() => window.location.href = '/partner/bulk-upload'}
            >
              Start Bulk Upload
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white/10 text-lg px-8 py-6"
              onClick={() => window.location.href = '/pricing#volume'}
            >
              View Volume Pricing
            </Button>
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">The Business Liquidation Challenge</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 border-red-200 bg-red-50">
              <Clock className="h-10 w-10 text-red-600 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Massive Scale</h3>
              <p className="text-gray-700">
                Business liquidations involve 500-5000+ items that need rapid processing and listing.
              </p>
            </Card>
            <Card className="p-6 border-red-200 bg-red-50">
              <DollarSign className="h-10 w-10 text-red-600 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Recovery Rate Pressure</h3>
              <p className="text-gray-700">
                Every percentage point in fees reduces recovery rates for creditors and stakeholders.
              </p>
            </Card>
            <Card className="p-6 border-red-200 bg-red-50">
              <TrendingUp className="h-10 w-10 text-red-600 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Specialized Equipment</h3>
              <p className="text-gray-700">
                Commercial equipment requires technical descriptions and accurate market valuations.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-16 bg-gradient-to-b from-indigo-50 to-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-4">Enterprise-Grade Liquidation Platform</h2>
          <p className="text-xl text-center text-gray-600 mb-12">
            Built for professional business liquidators handling complex commercial assets
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card className="p-8 border-indigo-200 bg-white shadow-lg">
              <Package className="h-12 w-12 text-indigo-600 mb-4" />
              <h3 className="text-2xl font-semibold mb-4">Unlimited Scale Bulk Upload</h3>
              <p className="text-gray-700 mb-4">
                Handle entire business inventories in a single upload session:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                  <span><strong>Commercial Equipment</strong> - AI identifies specs, models, and conditions</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                  <span><strong>Inventory Batches</strong> - Handle pallets and bulk lots efficiently</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                  <span><strong>Technical Descriptions</strong> - AI generates spec sheets and feature lists</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                  <span><strong>Market Valuations</strong> - Commercial pricing based on wholesale and retail data</span>
                </li>
              </ul>
            </Card>

            <Card className="p-8 border-green-200 bg-white shadow-lg">
              <DollarSign className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-2xl font-semibold mb-4">Maximize Recovery Rates</h3>
              <p className="text-gray-700 mb-4">
                Volume pricing with zero commission—keep more for creditors.
              </p>
              <div className="bg-green-50 p-6 rounded-lg mb-4">
                <h4 className="font-semibold text-lg mb-3">Example: 1000-Item Business Liquidation</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Liquidation Value:</span>
                    <span className="font-semibold">$100,000</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Auction House (20-25%):</span>
                    <span className="font-semibold">-$22,500</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>eBay (13%):</span>
                    <span className="font-semibold">-$13,000</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>SellFast.Now (Volume Rate):</span>
                    <span className="font-semibold">-$1,200</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between text-lg font-bold text-green-700">
                    <span>Additional Recovery:</span>
                    <span>$11,800+</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                * Volume discounts for 500+ items. Custom enterprise pricing available for 5000+ items.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Perfect For All Business Liquidation Scenarios</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6">
              <Building className="h-10 w-10 text-indigo-600 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Business Closures</h3>
              <p className="text-gray-700 mb-3">
                Retail stores, restaurants, offices—liquidate all assets quickly and efficiently.
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Furniture & fixtures</li>
                <li>• POS systems & equipment</li>
                <li>• Inventory & supplies</li>
              </ul>
            </Card>
            <Card className="p-6">
              <Package className="h-10 w-10 text-indigo-600 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Overstock & Returns</h3>
              <p className="text-gray-700 mb-3">
                Move excess inventory and customer returns at scale with minimal effort.
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Seasonal overstock</li>
                <li>• Customer returns</li>
                <li>• Discontinued products</li>
              </ul>
            </Card>
            <Card className="p-6">
              <Briefcase className="h-10 w-10 text-indigo-600 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Equipment Sales</h3>
              <p className="text-gray-700 mb-3">
                Commercial equipment, machinery, and specialized tools with technical specs.
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Manufacturing equipment</li>
                <li>• Office technology</li>
                <li>• Specialized machinery</li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Enterprise Features */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Enterprise-Grade Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-3">Multi-Client Management</h3>
              <p className="text-gray-700">
                Manage multiple liquidation projects simultaneously with separate dashboards and reporting.
              </p>
            </Card>
            <Card className="p-6">
              <div className="text-4xl mb-4">🏪</div>
              <h3 className="text-xl font-semibold mb-3">White-Label Storefronts</h3>
              <p className="text-gray-700">
                Create branded storefronts for each client with custom domains and branding.
              </p>
            </Card>
            <Card className="p-6">
              <div className="text-4xl mb-4">📈</div>
              <h3 className="text-xl font-semibold mb-3">Advanced Analytics</h3>
              <p className="text-gray-700">
                Track recovery rates, time-to-sale, and performance metrics for stakeholder reporting.
              </p>
            </Card>
            <Card className="p-6">
              <div className="text-4xl mb-4">🔐</div>
              <h3 className="text-xl font-semibold mb-3">Secure Document Management</h3>
              <p className="text-gray-700">
                Store invoices, receipts, and documentation securely for compliance and auditing.
              </p>
            </Card>
            <Card className="p-6">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-xl font-semibold mb-3">Team Collaboration</h3>
              <p className="text-gray-700">
                Multiple team members can work on liquidations with role-based access control.
              </p>
            </Card>
            <Card className="p-6">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-xl font-semibold mb-3">Mobile Inventory App</h3>
              <p className="text-gray-700">
                Catalog items on-site with mobile app featuring barcode scanning and batch upload.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Volume Pricing */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Volume Pricing Tiers</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 border-2">
              <h3 className="text-xl font-semibold mb-2">Standard</h3>
              <p className="text-gray-600 mb-4">1-500 items</p>
              <div className="text-3xl font-bold mb-4">$1.50<span className="text-lg text-gray-600">/item</span></div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>AI-generated listings</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Basic analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Email support</span>
                </li>
              </ul>
            </Card>
            <Card className="p-6 border-2 border-indigo-500 shadow-lg relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </div>
              <h3 className="text-xl font-semibold mb-2">Professional</h3>
              <p className="text-gray-600 mb-4">501-2000 items</p>
              <div className="text-3xl font-bold mb-4">$1.20<span className="text-lg text-gray-600">/item</span></div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Everything in Standard</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Priority processing</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Advanced analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Phone support</span>
                </li>
              </ul>
            </Card>
            <Card className="p-6 border-2">
              <h3 className="text-xl font-semibold mb-2">Enterprise</h3>
              <p className="text-gray-600 mb-4">2000+ items</p>
              <div className="text-3xl font-bold mb-4">Custom</div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Everything in Professional</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Dedicated account manager</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Custom integrations</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>24/7 priority support</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Trusted by Leading Liquidation Firms</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-2xl">
                  👨‍💼
                </div>
                <div>
                  <h4 className="font-semibold text-lg">Robert Klein</h4>
                  <p className="text-gray-600">Commercial Liquidation Services</p>
                </div>
              </div>
              <p className="text-gray-700 italic">
                "We handle 50+ business liquidations annually. SellFast.Now has transformed our operations. 
                The AI handles technical specs better than our staff, and the cost savings mean better recovery rates for our clients."
              </p>
            </Card>
            <Card className="p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-2xl">
                  👩‍💼
                </div>
                <div>
                  <h4 className="font-semibold text-lg">Amanda Foster</h4>
                  <p className="text-gray-600">Asset Recovery Specialists</p>
                </div>
              </div>
              <p className="text-gray-700 italic">
                "The volume pricing is unbeatable. We recently liquidated a 2000-item retail closure and saved over $15,000 
                compared to traditional auction houses. Our clients are thrilled with the results."
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Maximize Your Recovery Rates?</h2>
          <p className="text-xl mb-8">
            Join professional liquidators who are recovering more value with AI-powered bulk listings.
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-indigo-600 hover:bg-gray-100 text-lg px-8 py-6"
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
              Request Enterprise Demo
            </Button>
          </div>
          <p className="mt-6 text-indigo-100">
            Volume discounts available • Custom enterprise pricing • Dedicated support
          </p>
        </div>
      </section>
    </div>
  );
}
