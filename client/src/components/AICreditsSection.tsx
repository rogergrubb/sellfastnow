import { useState } from 'react';
import { Sparkles, Calculator, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AICreditsPackage {
  credits: number;
  price: number;
  savings: number;
  popular?: boolean;
}

interface AICreditsSectionProps {
  onPurchase: (credits: number, price: number, isCustom: boolean) => void;
}

export function AICreditsSection({ onPurchase }: AICreditsSectionProps) {
  const [customCredits, setCustomCredits] = useState<string>('');
  const STANDARD_RATE = 0.15; // $0.15 per credit

  // Bulk packages with discounts
  const bulkPackages: AICreditsPackage[] = [
    { credits: 50, price: 6, savings: 20 },
    { credits: 100, price: 10, savings: 33, popular: true },
    { credits: 250, price: 22, savings: 41 },
    { credits: 500, price: 40, savings: 47 },
  ];

  const calculateCustomPrice = (credits: number): number => {
    return Number((credits * STANDARD_RATE).toFixed(2));
  };

  const handleCustomPurchase = () => {
    const credits = parseInt(customCredits);
    if (credits && credits > 0) {
      const price = calculateCustomPrice(credits);
      onPurchase(credits, price, true);
    }
  };

  const handlePackagePurchase = (pkg: AICreditsPackage) => {
    onPurchase(pkg.credits, pkg.price, false);
  };

  return (
    <div className="py-12 sm:py-14 md:py-16 px-4 sm:px-6 bg-gradient-to-b from-amber-50 to-orange-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold mb-3 md:mb-4">
            <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
            AI Credits Only
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4 px-2">
            ⚡ Buy AI Credits Your Way
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto px-4">
            Need just AI assistance without photo unlocks? Choose your own amount or save with bulk packages.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8 mb-8 md:mb-12">
          {/* Custom Amount Section */}
          <div className="bg-white rounded-xl md:rounded-2xl shadow-xl p-5 sm:p-6 md:p-8 border-2 border-amber-300">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5 md:mb-6">
              <Calculator className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-amber-600 flex-shrink-0" />
              <div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold">Custom Amount</h3>
                <p className="text-xs sm:text-sm text-gray-600">Pay as you go • ${STANDARD_RATE} per credit</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How many AI credits do you need?
                </label>
                <Input
                  type="number"
                  min="1"
                  placeholder="Enter number of credits"
                  value={customCredits}
                  onChange={(e) => setCustomCredits(e.target.value)}
                  className="text-lg"
                />
              </div>

              {customCredits && parseInt(customCredits) > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700">Credits:</span>
                    <span className="font-bold">{parseInt(customCredits)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700">Rate:</span>
                    <span className="font-bold">${STANDARD_RATE} per credit</span>
                  </div>
                  <div className="border-t border-amber-300 pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">Total:</span>
                      <span className="text-2xl font-bold text-amber-600">
                        ${calculateCustomPrice(parseInt(customCredits))}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={handleCustomPurchase}
                disabled={!customCredits || parseInt(customCredits) <= 0}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-6 text-lg"
              >
                💳 Purchase Custom Credits
              </Button>

              <p className="text-xs text-gray-500 text-center">
                Perfect for one-time needs or occasional users
              </p>
            </div>
          </div>

          {/* Bulk Packages Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-green-300">
            <div className="flex items-center gap-3 mb-6">
              <Package className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="text-2xl font-bold">Bulk Packages</h3>
                <p className="text-sm text-gray-600">Save up to 47% with volume discounts</p>
              </div>
            </div>

            <div className="space-y-3">
              {bulkPackages.map((pkg) => (
                <div
                  key={pkg.credits}
                  className={`relative border-2 rounded-xl p-4 transition-all hover:shadow-md ${
                    pkg.popular
                      ? 'border-green-400 bg-green-50'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      ⭐ BEST VALUE
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-bold text-lg">{pkg.credits} Credits</div>
                      <div className="text-sm text-gray-600">
                        ${(pkg.price / pkg.credits).toFixed(3)} per credit
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">${pkg.price}</div>
                      <div className="text-xs text-green-600 font-semibold">
                        Save {pkg.savings}%
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => handlePackagePurchase(pkg)}
                    className={`w-full mt-2 font-bold ${
                      pkg.popular
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                        : 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800'
                    }`}
                  >
                    🎯 Get {pkg.credits} Credits – ${pkg.price}
                  </Button>

                  <div className="mt-2 text-xs text-center text-gray-500">
                    vs ${calculateCustomPrice(pkg.credits)} at standard rate
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              Great for regular sellers who want maximum value
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 max-w-4xl mx-auto">
          <div className="flex items-start gap-4">
            <Sparkles className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-bold text-lg mb-2">What are AI Credits?</h4>
              <p className="text-gray-700 text-sm mb-2">
                Each AI credit generates a complete listing with:
              </p>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Optimized title for search visibility</li>
                <li>• Detailed, compelling description</li>
                <li>• Market value estimation</li>
                <li>• Relevant SEO meta-tags</li>
              </ul>
              <p className="text-xs text-gray-500 mt-3">
                Note: AI credits are separate from photo unlocks. To post with more than 1 photo, you'll need a listing unlock package above.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
