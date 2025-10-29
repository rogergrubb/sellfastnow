import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useLocation } from "wouter";
import { Calculator, TrendingDown } from "lucide-react";
import SectionNav from "./SectionNav";

export default function PricingCalculatorEstate() {
  const [itemCount, setItemCount] = useState([100]);
  const [, navigate] = useLocation();

  const count = itemCount[0];
  
  // Calculate AI generation cost
  const freeItems = 5;
  const paidItems = Math.max(0, count - freeItems);
  
  // Volume discounts
  let pricePerItem = 0.20;
  if (count >= 75) {
    pricePerItem = 0.20 * 0.88; // 12% off
  } else if (count >= 50) {
    pricePerItem = 0.20 * 0.91; // 9% off
  } else if (count >= 20) {
    pricePerItem = 0.20 * 0.94; // 6% off
  } else if (count >= 10) {
    pricePerItem = 0.20 * 0.97; // 3% off
  }
  
  const aiCost = paidItems * pricePerItem;
  
  // Assume average sale price of $50 per item (better for bulk estate sales)
  const avgItemPrice = 50;
  const totalSaleValue = count * avgItemPrice;
  const transactionFee = totalSaleValue * 0.05; // 5%
  
  const totalCost = aiCost + transactionFee;
  const youKeep = totalSaleValue - totalCost;
  const percentKeep = ((youKeep / totalSaleValue) * 100).toFixed(1);
  
  // Traditional estate sale company (35% commission)
  const traditionalFee = totalSaleValue * 0.35;
  const savings = traditionalFee - totalCost;

  return (
    <div id="savings-calculator" className="bg-white dark:bg-gray-900 scroll-mt-20">
      <SectionNav currentSection="calculator" />
      <div className="py-16">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Calculator className="h-8 w-8 text-green-600 dark:text-green-400" />
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              Calculate Your Costs
            </h2>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">
            Perfect for Realtors, Liquidators & Estate Sale Professionals
          </p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            Example: 100 items @ $50 each = only $200 in fees (4% total)
          </p>
          
          {/* Competitor Comparison */}
          <div className="mt-6 bg-white/90 dark:bg-gray-800/90 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
              Compare: Same 100 Items @ $50 Each ($5,000 Total)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
                <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">eBay</div>
                <div className="text-lg font-bold text-red-600 dark:text-red-400">$650</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">13% fees</div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
                <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Mercari</div>
                <div className="text-lg font-bold text-orange-600 dark:text-orange-400">$500</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">10% fees</div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Facebook</div>
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">$250</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">5% fees</div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
                <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Traditional</div>
                <div className="text-lg font-bold text-red-600 dark:text-red-400">$1,750</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">35% commission</div>
              </div>
              <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-3 border-2 border-green-500 dark:border-green-600">
                <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">SellFast.Now</div>
                <div className="text-xl font-bold text-green-600 dark:text-green-400">$200</div>
                <div className="text-xs font-semibold text-green-600 dark:text-green-400">4% total ✓</div>
              </div>
            </div>
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
              💰 <span className="font-semibold">Save $450-$1,550</span> compared to competitors!
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-8 border-2 border-green-200 dark:border-green-800 shadow-xl">
          {/* Slider */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <label className="text-lg font-semibold text-gray-900 dark:text-white">
                Number of items:
              </label>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {count}
              </div>
            </div>
            <Slider
              value={itemCount}
              onValueChange={setItemCount}
              min={1}
              max={500}
              step={1}
              className="mb-2"
            />
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>1 item</span>
              <span>500 items</span>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="space-y-4 mb-6">
            <div className="bg-white/80 dark:bg-gray-900/80 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">AI Generation Cost:</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">First 5 items:</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">FREE</span>
                </div>
                {paidItems > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Next {paidItems} items: ${pricePerItem.toFixed(3)} each
                        {count >= 10 && (
                          <span className="text-green-600 dark:text-green-400 ml-1">
                            ({count >= 75 ? '12%' : count >= 50 ? '9%' : count >= 20 ? '6%' : '3%'} bulk discount)
                          </span>
                        )}
                      </span>
                      <span className="font-semibold">${aiCost.toFixed(2)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between pt-2 border-t border-gray-300 dark:border-gray-600">
                  <span className="font-semibold text-gray-900 dark:text-white">Total AI cost:</span>
                  <span className="font-bold text-lg text-green-600 dark:text-green-400">${aiCost.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-gray-900/80 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Transaction Fee (only when items sell):</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">5% of sale price</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    (${avgItemPrice} avg per item)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">If all items sell for ${totalSaleValue.toLocaleString()}:</span>
                  <span className="font-semibold">${transactionFee.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="bg-green-600 dark:bg-green-700 rounded-lg p-6 text-white mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xl font-semibold">YOUR TOTAL COST:</span>
              <span className="text-3xl font-bold">${totalCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xl font-semibold">YOU KEEP:</span>
              <span className="text-3xl font-bold">${youKeep.toFixed(2)} ({percentKeep}%)</span>
            </div>
          </div>

          {/* Comparison */}
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6 border-2 border-red-200 dark:border-red-800">
            <div className="flex items-start gap-3 mb-4">
              <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  vs Traditional Estate Sale Company (35% commission):
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Their fee:</span>
                    <span className="font-semibold text-red-600 dark:text-red-400">${traditionalFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-red-200 dark:border-red-800">
                    <span className="font-bold text-gray-900 dark:text-white">YOUR SAVINGS:</span>
                    <span className="font-bold text-2xl text-green-600 dark:text-green-400">${savings.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-8 text-center">
            <Button
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white h-14 px-10 text-lg font-semibold shadow-xl"
              onClick={() => navigate('/post-ad')}
            >
              Start Listing - First 5 Free →
            </Button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

