import { Check, X, TrendingDown, CircleDollarSign } from "lucide-react";
import SectionNav from "./SectionNav";

export default function ComparePricing() {
  return (
    <div id="pricing" className="bg-white dark:bg-gray-900 scroll-mt-20">
      <SectionNav currentSection="pricing" />
      <div className="py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Compare Our Pricing
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Fair, progressive pricing that's 70% cheaper than competitors
          </p>
        </div>

        {/* Example Scenario Callout */}
        <div className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl p-6 mb-8 border-2 border-blue-300 dark:border-blue-700">
          <div className="text-center">
            <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-2">
              Example Scenario
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              100 Items × $100 Each = $10,000 Total Sale
            </div>
            <div className="text-base text-gray-700 dark:text-gray-300">
              Typical estate sale with average item value of $100
            </div>
          </div>
        </div>

        {/* Progressive Fee Structure Explanation */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-8 mb-8 border-2 border-green-500 dark:border-green-600 shadow-xl">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <CircleDollarSign className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Our Fair, Progressive Pricing
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Pay based on item value - lower prices for everyday items, fair rates for premium goods. 
                Includes AI-generated titles, descriptions, valuations, and SEO meta tags.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-green-200 dark:border-green-700">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Low-Value Items</div>
              <div className="text-lg font-bold text-gray-900 dark:text-white mb-1">$0 - $50</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">5¢ per dollar</div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                Example: $20 book = $1 fee (5%)
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-green-200 dark:border-green-700">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Medium-Value Items</div>
              <div className="text-lg font-bold text-gray-900 dark:text-white mb-1">$51 - $100</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">4¢ per dollar</div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                Example: $100 chair = $4 fee (4%)
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-green-200 dark:border-green-700">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">High-Value Items</div>
              <div className="text-lg font-bold text-gray-900 dark:text-white mb-1">$101+</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">3¢ per dollar</div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                Example: $1,000 antique = $30 fee (3%)
              </div>
            </div>
          </div>

          <div className="mt-6 bg-green-100 dark:bg-green-900/30 rounded-lg p-4 border border-green-300 dark:border-green-700">
            <div className="flex items-center gap-2 mb-2">
              <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="font-semibold text-gray-900 dark:text-white">Your first five items per month are always free under $50</span>
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Try our system risk-free with 5 free AI-generated listings every month. If you want to post many items, use our amazing AI powered image identification and valuation tool for a very modest fee.
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto mb-12">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                <th className="p-4 text-left font-semibold text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700">
                  Service
                </th>
                <th className="p-4 text-left font-semibold text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700">
                  Listing Fee
                </th>
                <th className="p-4 text-left font-semibold text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700">
                  AI Features
                </th>
                <th className="p-4 text-left font-semibold text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700">
                  <div>Total Cost</div>
                  <div className="text-sm font-normal text-gray-600 dark:text-gray-400">(100 items @ $100)</div>
                </th>
                <th className="p-4 text-left font-semibold text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700">
                  You Keep
                </th>
              </tr>
            </thead>
            <tbody>
              {/* SellFast.Now */}
              <tr className="bg-green-50 dark:bg-green-900/20 border-2 border-green-500 dark:border-green-600">
                <td className="p-4 border border-gray-300 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-green-600 dark:text-green-400 text-lg">SellFast.Now</span>
                    <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full">BEST VALUE</span>
                  </div>
                </td>
                <td className="p-4 border border-gray-300 dark:border-gray-700">
                  <div className="space-y-2">
                    <div className="font-bold text-green-600 dark:text-green-400 text-lg">First 5 FREE/month (under $50)</div>
                    <div className="font-semibold text-gray-900 dark:text-white">Progressive pricing:</div>
                    <div className="space-y-1 text-sm">
                      <div className="text-gray-700 dark:text-gray-300">• $0-$50: 5¢ per dollar</div>
                      <div className="text-gray-700 dark:text-gray-300">• $51-$100: 4¢ per dollar</div>
                      <div className="text-gray-700 dark:text-gray-300">• $101+: 3¢ per dollar</div>
                    </div>
                  </div>
                </td>
                <td className="p-4 border border-gray-300 dark:border-gray-700">
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-1">
                      <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                      <span className="text-gray-700 dark:text-gray-300">AI-generated titles</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                      <span className="text-gray-700 dark:text-gray-300">AI-generated descriptions</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                      <span className="text-gray-700 dark:text-gray-300">Retail & used valuations</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                      <span className="text-gray-700 dark:text-gray-300 font-semibold">SEO meta tags</span>
                    </div>
                  </div>
                </td>
                <td className="p-4 border border-gray-300 dark:border-gray-700">
                  <div className="space-y-1">
                    <div className="text-sm text-gray-600 dark:text-gray-400">100 items @ $100 each:</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">100 × $4 = $400</div>
                    <div className="font-bold text-2xl text-green-600 dark:text-green-400">$400</div>
                    <div className="text-xs text-green-600 dark:text-green-400 font-semibold">Charged upfront</div>
                  </div>
                </td>
                <td className="p-4 border border-gray-300 dark:border-gray-700">
                  <div className="font-bold text-2xl text-green-600 dark:text-green-400">$9,600</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">(96%)</div>
                </td>
              </tr>

              {/* Traditional Estate Sale Company */}
              <tr className="bg-red-50 dark:bg-red-900/10">
                <td className="p-4 border border-gray-300 dark:border-gray-700">
                  <span className="font-semibold text-gray-900 dark:text-white">Traditional Estate Sale Co.</span>
                </td>
                <td className="p-4 border border-gray-300 dark:border-gray-700">
                  <div className="font-semibold text-red-600 dark:text-red-400">30-40% Commission</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">When items sell</div>
                </td>
                <td className="p-4 border border-gray-300 dark:border-gray-700">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold">
                      <X className="h-4 w-4" />
                      <span>No AI - Manual Only</span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      They write titles, descriptions, research prices, add keywords
                    </div>
                  </div>
                </td>
                <td className="p-4 border border-gray-300 dark:border-gray-700">
                  <div className="font-bold text-xl text-red-600 dark:text-red-400">$3,500</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">(35% avg)</div>
                </td>
                <td className="p-4 border border-gray-300 dark:border-gray-700">
                  <div className="font-bold text-xl text-gray-900 dark:text-white">$6,500</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">(65%)</div>
                </td>
              </tr>

              {/* eBay */}
              <tr>
                <td className="p-4 border border-gray-300 dark:border-gray-700">
                  <span className="font-semibold text-gray-900 dark:text-white">eBay</span>
                </td>
                <td className="p-4 border border-gray-300 dark:border-gray-700">
                  <div className="font-semibold text-gray-900 dark:text-white">~13% per sale</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">10% + 3% payment</div>
                </td>
                <td className="p-4 border border-gray-300 dark:border-gray-700">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold">
                      <X className="h-4 w-4" />
                      <span>No AI - Manual Only</span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      You write everything yourself
                    </div>
                  </div>
                </td>
                <td className="p-4 border border-gray-300 dark:border-gray-700">
                  <div className="font-bold text-xl text-gray-900 dark:text-white">$1,300</div>
                </td>
                <td className="p-4 border border-gray-300 dark:border-gray-700">
                  <div className="font-bold text-xl text-gray-900 dark:text-white">$8,700</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">(87%)</div>
                </td>
              </tr>

              {/* Mercari */}
              <tr>
                <td className="p-4 border border-gray-300 dark:border-gray-700">
                  <span className="font-semibold text-gray-900 dark:text-white">Mercari</span>
                </td>
                <td className="p-4 border border-gray-300 dark:border-gray-700">
                  <div className="font-semibold text-gray-900 dark:text-white">10% per sale</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">When items sell</div>
                </td>
                <td className="p-4 border border-gray-300 dark:border-gray-700">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold">
                      <X className="h-4 w-4" />
                      <span>No AI - Manual Only</span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      You write everything yourself
                    </div>
                  </div>
                </td>
                <td className="p-4 border border-gray-300 dark:border-gray-700">
                  <div className="font-bold text-xl text-gray-900 dark:text-white">$1,000</div>
                </td>
                <td className="p-4 border border-gray-300 dark:border-gray-700">
                  <div className="font-bold text-xl text-gray-900 dark:text-white">$9,000</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">(90%)</div>
                </td>
              </tr>

              {/* OfferUp */}
              <tr>
                <td className="p-4 border border-gray-300 dark:border-gray-700">
                  <span className="font-semibold text-gray-900 dark:text-white">OfferUp</span>
                </td>
                <td className="p-4 border border-gray-300 dark:border-gray-700">
                  <div className="font-semibold text-gray-900 dark:text-white">12.9% per sale</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Shipped items</div>
                </td>
                <td className="p-4 border border-gray-300 dark:border-gray-700">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold">
                      <X className="h-4 w-4" />
                      <span>No AI - Manual Only</span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      You write everything yourself
                    </div>
                  </div>
                </td>
                <td className="p-4 border border-gray-300 dark:border-gray-700">
                  <div className="font-bold text-xl text-gray-900 dark:text-white">$1,290</div>
                </td>
                <td className="p-4 border border-gray-300 dark:border-gray-700">
                  <div className="font-bold text-xl text-gray-900 dark:text-white">$8,710</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">(87.1%)</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* AI Advantage Callout */}
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl p-8 border-2 border-purple-500 dark:border-purple-600 shadow-xl mb-8">
          <div className="text-center">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
              🤖 Only SellFast.Now Offers AI Automation
            </h3>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-6 max-w-3xl mx-auto">
              Every other platform makes you manually write titles, descriptions, research prices, and add keywords for EVERY SINGLE ITEM. 
              We do it all automatically with AI - included in your listing fee.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                <div className="font-bold text-purple-600 dark:text-purple-400 mb-1">AI-Generated Titles</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Professional, SEO-optimized product titles</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                <div className="font-bold text-purple-600 dark:text-purple-400 mb-1">AI-Generated Descriptions</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Detailed 2-3 sentence descriptions</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                <div className="font-bold text-purple-600 dark:text-purple-400 mb-1">Retail & Used Values</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">AI researches market prices for you</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                <div className="font-bold text-purple-600 dark:text-purple-400 mb-1">Meta Tags for SEO</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Automatic keywords for better search results</div>
              </div>
            </div>
            <div className="mt-6 text-lg font-semibold text-gray-900 dark:text-white">
              Competitors: <span className="text-red-600 dark:text-red-400">❌ None of this</span> • 
              SellFast.Now: <span className="text-green-600 dark:text-green-400">✅ All included</span>
            </div>
          </div>
        </div>

        {/* Savings Callout */}
        <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-2xl p-8 border-2 border-green-500 dark:border-green-600 shadow-xl">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <TrendingDown className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Your Savings with SellFast.Now
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">vs Traditional Estate Sale</div>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">$3,100</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">saved on $10K sale (89% cheaper)</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">vs eBay</div>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">$900</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">saved on $10K sale (69% cheaper)</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">vs Mercari</div>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">$600</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">saved on $10K sale (60% cheaper)</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Advantages */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
              <h4 className="font-semibold text-gray-900 dark:text-white">Fair Progressive Pricing</h4>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Pay based on item value. Lower-priced items cost less to list, making it fair for all sellers.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
              <h4 className="font-semibold text-gray-900 dark:text-white">AI Does the Work</h4>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Unlike other platforms, we generate titles, descriptions, prices, and SEO tags automatically. No manual work required.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
              <h4 className="font-semibold text-gray-900 dark:text-white">Predictable Costs</h4>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Know exactly what you'll pay upfront. No hidden fees, no surprises, no percentage-based commissions.
            </p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

