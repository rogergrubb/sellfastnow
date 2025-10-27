import { Check, X, TrendingDown } from "lucide-react";

export default function ComparePricing() {
  return (
    <div id="pricing" className="bg-white dark:bg-gray-900 py-16 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Compare Our Pricing
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            See why we're the most affordable option for estate sales
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

        {/* Comparison Table */}
        <div className="overflow-x-auto mb-12">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                <th className="p-4 text-left font-semibold text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700">
                  Service
                </th>
                <th className="p-4 text-left font-semibold text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700">
                  AI Listing Fee
                </th>
                <th className="p-4 text-left font-semibold text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700">
                  Transaction Fee
                </th>
                <th className="p-4 text-left font-semibold text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700">
                  <div>Total Fees</div>
                  <div className="text-sm font-normal text-gray-600 dark:text-gray-400">(on $10,000 sale)</div>
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
                    <div className="font-bold text-green-600 dark:text-green-400 text-lg">First 5 FREE</div>
                    <div className="font-semibold text-gray-900 dark:text-white">Then $0.20/item includes:</div>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-1">
                        <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                        <span className="text-gray-700 dark:text-gray-300">AI-generated title</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                        <span className="text-gray-700 dark:text-gray-300">AI-generated description</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                        <span className="text-gray-700 dark:text-gray-300">Retail & used valuations</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                        <span className="text-gray-700 dark:text-gray-300 font-semibold">Meta tags for SEO</span>
                      </div>
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-400 font-semibold pt-1">
                      12% bulk discount @ 75+ items
                    </div>
                  </div>
                </td>
                <td className="p-4 border border-gray-300 dark:border-gray-700">
                  <div className="font-semibold text-gray-900 dark:text-white">5%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Only when sold</div>
                </td>
                <td className="p-4 border border-gray-300 dark:border-gray-700">
                  <div className="space-y-1">
                    <div className="text-sm text-gray-600 dark:text-gray-400">AI: $16.72</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Transaction: $500</div>
                    <div className="font-bold text-lg text-green-600 dark:text-green-400">Total: $516.72</div>
                  </div>
                </td>
                <td className="p-4 border border-gray-300 dark:border-gray-700">
                  <div className="font-bold text-2xl text-green-600 dark:text-green-400">$9,483</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">(94.8%)</div>
                </td>
              </tr>

              {/* Traditional Estate Sale Company */}
              <tr className="bg-red-50 dark:bg-red-900/10">
                <td className="p-4 border border-gray-300 dark:border-gray-700">
                  <span className="font-semibold text-gray-900 dark:text-white">Traditional Estate Sale Co.</span>
                </td>
                <td className="p-4 border border-gray-300 dark:border-gray-700">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold">
                      <X className="h-4 w-4" />
                      <span>No AI - Manual Only</span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      You write titles, descriptions, research prices, add keywords yourself
                    </div>
                  </div>
                </td>
                <td className="p-4 border border-gray-300 dark:border-gray-700">
                  <div className="font-semibold text-red-600 dark:text-red-400">30-40%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Commission</div>
                </td>
                <td className="p-4 border border-gray-300 dark:border-gray-700">
                  <div className="font-bold text-lg text-red-600 dark:text-red-400">$3,500</div>
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
                  <div className="font-semibold text-gray-900 dark:text-white">~13%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">10% + 3% payment</div>
                </td>
                <td className="p-4 border border-gray-300 dark:border-gray-700">
                  <div className="font-bold text-lg text-gray-900 dark:text-white">$1,300</div>
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
                  <div className="font-semibold text-gray-900 dark:text-white">10%</div>
                </td>
                <td className="p-4 border border-gray-300 dark:border-gray-700">
                  <div className="font-bold text-lg text-gray-900 dark:text-white">$1,000</div>
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
                  <div className="font-semibold text-gray-900 dark:text-white">12.9%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Shipped items</div>
                </td>
                <td className="p-4 border border-gray-300 dark:border-gray-700">
                  <div className="font-bold text-lg text-gray-900 dark:text-white">$1,290</div>
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
              We do it all automatically with AI for just <span className="font-bold text-purple-600 dark:text-purple-400">$0.20 per item</span>.
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
              SellFast.Now: <span className="text-green-600 dark:text-green-400">✅ All of this for $0.20</span>
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
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">$2,983</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">saved on $10K sale</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">vs eBay</div>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">$783</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">saved on $10K sale</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">vs Mercari</div>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">$483</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">saved on $10K sale</div>
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
              <h4 className="font-semibold text-gray-900 dark:text-white">AI Does the Work</h4>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Unlike other platforms, we generate titles, descriptions, and prices automatically. No manual work required.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
              <h4 className="font-semibold text-gray-900 dark:text-white">Lowest Fees</h4>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              5% transaction fee vs 10-40% elsewhere. Keep more of your money with transparent, fair pricing.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
              <h4 className="font-semibold text-gray-900 dark:text-white">No Hidden Costs</h4>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              First 5 items free, then $0.20/item with volume discounts. No listing fees, no subscriptions, no surprises.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

