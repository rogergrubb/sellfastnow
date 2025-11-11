import { useState } from 'react';
import { CheckCircle, Sparkles, Zap, TrendingUp, Star } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export default function PricingPage() {
  const { toast } = useToast();
  // Get current user
  const { data: user } = useQuery<any>({
    queryKey: ['/api/auth/user'],
  });
  const [selectedCredits, setSelectedCredits] = useState(50);
  const [isProcessing, setIsProcessing] = useState(false);

  // Preset tiers (50% reduced prices)
  const presetTiers = [
    {
      credits: 10,
      basePrice: 0.49,
      discount: 0.10,
      pricePerCredit: 0.44,
      totalPrice: 4.41,
      badge: null,
    },
    {
      credits: 25,
      basePrice: 0.49,
      discount: 0.20,
      pricePerCredit: 0.39,
      totalPrice: 9.80,
      badge: null,
    },
    {
      credits: 50,
      basePrice: 0.49,
      discount: 0.30,
      pricePerCredit: 0.34,
      totalPrice: 17.15,
      badge: "⭐ Most Popular",
    },
    {
      credits: 100,
      basePrice: 0.49,
      discount: 0.40,
      pricePerCredit: 0.29,
      totalPrice: 29.40,
      badge: null,
    },
  ];

  // Calculate price based on credits (50% reduced base price)
  const calculatePrice = (credits: number) => {
    const basePrice = 0.49;
    let discount = 0;
    
    if (credits >= 100) {
      discount = 0.40; // 40% off
    } else if (credits >= 50) {
      discount = 0.30; // 30% off
    } else if (credits >= 25) {
      discount = 0.20; // 20% off
    } else if (credits >= 10) {
      discount = 0.10; // 10% off
    }
    
    const pricePerCredit = basePrice * (1 - discount);
    const totalPrice = pricePerCredit * credits;
    const savings = (basePrice * credits) - totalPrice;
    
    return {
      pricePerCredit: pricePerCredit.toFixed(2),
      totalPrice: totalPrice.toFixed(2),
      discount: Math.round(discount * 100),
      savings: savings.toFixed(2),
    };
  };

  const customPrice = calculatePrice(selectedCredits);

  // Purchase mutation
  const purchaseMutation = useMutation({
    mutationFn: async (credits: number) => {
      setIsProcessing(true);
      const price = calculatePrice(credits);
      
      // Create Stripe checkout session
      const response = await apiRequest('/api/credits/purchase', 'POST', {
        credits: credits,
        amount: parseFloat(price.totalPrice),
      });
      
      return response;
    },
    onSuccess: (data) => {
      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      setIsProcessing(false);
      toast({
        title: "Error",
        description: error.message || "Failed to initiate purchase",
        variant: "destructive",
      });
    },
  });

  const handlePurchase = (credits: number) => {
    if (!user) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to purchase AI credits",
        variant: "destructive",
      });
      window.location.href = '/sign-in';
      return;
    }
    
    purchaseMutation.mutate(credits);
  };

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white min-h-screen">
      {/* Hero Section */}
      <div className="py-16 px-4 sm:px-6 text-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <Sparkles className="w-16 h-16 mx-auto mb-4" />
        <h1 className="text-5xl font-bold mb-4">
          AI Credit Packages
        </h1>
        <p className="text-xl max-w-3xl mx-auto opacity-90">
          Power up your listings with AI-generated titles, descriptions, and SEO optimization.
          <br />
          Buy credits once, use them anytime.
        </p>
      </div>

      {/* Preset Tiers */}
      <div className="py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              Quick Purchase Options
            </h2>
            <p className="text-lg text-gray-600">
              Choose a preset package for quick checkout
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {presetTiers.map((tier, index) => (
              <div
                key={index}
                className={`relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border-2 ${
                  tier.badge ? 'border-yellow-400 transform scale-105' : 'border-gray-200'
                }`}
              >
                {tier.badge && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-sm font-bold px-4 py-1 rounded-full shadow-lg">
                    {tier.badge}
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className="text-gray-500 text-sm font-semibold uppercase tracking-wide mb-2">
                    {index === 0 && "Starter"}
                    {index === 1 && "Value"}
                    {index === 2 && "Power"}
                    {index === 3 && "Pro"}
                  </div>
                  <div className="text-5xl font-bold text-blue-600 mb-2">
                    {tier.credits}
                  </div>
                  <div className="text-gray-600 text-sm">AI Credits</div>
                </div>

                <div className="mb-6 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Per Credit:</span>
                    <span className="font-semibold">${tier.pricePerCredit}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-900 font-semibold">Total:</span>
                    <span className="text-2xl font-bold text-blue-600">${tier.totalPrice}</span>
                  </div>
                  <div className="bg-green-100 text-green-700 text-sm font-semibold px-3 py-1 rounded-full text-center">
                    Save {Math.round(tier.discount * 100)}%
                  </div>
                </div>

                <ul className="space-y-2 mb-6">
                  <li className="flex items-center text-sm text-gray-700">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    <span>{tier.credits} AI-powered listings</span>
                  </li>
                  <li className="flex items-center text-sm text-gray-700">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    <span>Auto-generated titles</span>
                  </li>
                  <li className="flex items-center text-sm text-gray-700">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    <span>SEO-optimized descriptions</span>
                  </li>
                  <li className="flex items-center text-sm text-gray-700">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    <span>Never expires</span>
                  </li>
                </ul>

                <button
                  onClick={() => handlePurchase(tier.credits)}
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold py-3 px-6 rounded-full hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Processing...' : `Buy ${tier.credits} Credits`}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Custom Slider Section */}
      <div className="py-16 px-4 sm:px-6 bg-gradient-to-b from-indigo-50 to-purple-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              Custom Amount
            </h2>
            <p className="text-lg text-gray-600">
              Need a different amount? Use the slider to customize your purchase
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            {/* Slider */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <label className="text-lg font-semibold text-gray-900">
                  Select Credits:
                </label>
                <div className="text-4xl font-bold text-blue-600">
                  {selectedCredits}
                </div>
              </div>
              
              <input
                type="range"
                min="1"
                max="200"
                value={selectedCredits}
                onChange={(e) => setSelectedCredits(parseInt(e.target.value))}
                className="w-full h-3 bg-gradient-to-r from-blue-200 to-indigo-300 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(selectedCredits / 200) * 100}%, #e5e7eb ${(selectedCredits / 200) * 100}%, #e5e7eb 100%)`
                }}
              />
              
              <div className="flex justify-between text-sm text-gray-500 mt-2">
                <span>1</span>
                <span>200+</span>
              </div>
            </div>

            {/* Discount Tiers Display */}
            <div className="mb-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Volume Discounts:</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className={`p-2 rounded ${selectedCredits >= 10 && selectedCredits < 25 ? 'bg-blue-200 font-bold' : 'bg-white'}`}>
                  <div className="text-gray-600">10-24 credits</div>
                  <div className="text-blue-600 font-semibold">10% off</div>
                </div>
                <div className={`p-2 rounded ${selectedCredits >= 25 && selectedCredits < 50 ? 'bg-blue-200 font-bold' : 'bg-white'}`}>
                  <div className="text-gray-600">25-49 credits</div>
                  <div className="text-blue-600 font-semibold">20% off</div>
                </div>
                <div className={`p-2 rounded ${selectedCredits >= 50 && selectedCredits < 100 ? 'bg-blue-200 font-bold' : 'bg-white'}`}>
                  <div className="text-gray-600">50-99 credits</div>
                  <div className="text-blue-600 font-semibold">30% off</div>
                </div>
                <div className={`p-2 rounded ${selectedCredits >= 100 ? 'bg-blue-200 font-bold' : 'bg-white'}`}>
                  <div className="text-gray-600">100+ credits</div>
                  <div className="text-blue-600 font-semibold">40% off</div>
                </div>
              </div>
            </div>

            {/* Price Summary */}
            <div className="mb-8 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Price per credit:</span>
                  <span className="text-xl font-semibold">${customPrice.pricePerCredit}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Discount:</span>
                  <span className="text-xl font-semibold text-green-600">{customPrice.discount}%</span>
                </div>
                {parseFloat(customPrice.savings) > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">You save:</span>
                    <span className="text-xl font-semibold text-green-600">${customPrice.savings}</span>
                  </div>
                )}
                <div className="border-t-2 border-gray-300 pt-3 flex justify-between items-center">
                  <span className="text-xl font-bold text-gray-900">Total:</span>
                  <span className="text-4xl font-bold text-blue-600">${customPrice.totalPrice}</span>
                </div>
              </div>
            </div>

            {/* Purchase Button */}
            <button
              onClick={() => handlePurchase(selectedCredits)}
              disabled={isProcessing}
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold py-4 px-8 text-lg rounded-full hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                'Processing...'
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Buy {selectedCredits} Credits for ${customPrice.totalPrice}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              What You Get with AI Credits
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">AI-Generated Titles</h3>
              <p className="text-gray-600">
                Compelling, keyword-rich titles that grab attention and improve search visibility
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">SEO-Optimized Descriptions</h3>
              <p className="text-gray-600">
                Detailed descriptions with meta tags that help your listings rank higher
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Never Expires</h3>
              <p className="text-gray-600">
                Buy once, use anytime. Your credits never expire and roll over indefinitely
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
