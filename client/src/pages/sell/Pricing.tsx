import { CheckCircle, Zap, Star, Gem, TrendingUp, Sparkles } from "lucide-react";

import { useState } from 'react';
import { PricingTierPaymentModal } from '@/components/PricingTierPaymentModal';
import { AICreditsSection } from '@/components/AICreditsSection';
import { useToast } from '@/hooks/use-toast';

export default function PricingPage() {
  const { toast } = useToast();
  const [selectedTier, setSelectedTier] = useState<{
    id: string;
    name: string;
    price: number;
    listings: number;
    photos: number;
    aiCredits: number;
  } | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const handlePurchase = (tier: any, tierId: string) => {
    setSelectedTier({
      id: tierId,
      name: tier.name,
      price: parseFloat(tier.price.replace('$', '')),
      listings: tier.listings,
      photos: tier.photos,
      aiCredits: tier.aiCredits,
    });
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    toast({
      title: 'Purchase Successful!',
      description: 'Your credits have been added to your account.',
    });
    // Optionally redirect to post-ad page
    setTimeout(() => window.location.href = '/post-ad', 1500);
  };

  const handleAICreditsPurchase = (credits: number, price: number, isCustom: boolean) => {
    setSelectedTier({
      id: isCustom ? 'ai-credits-custom' : `ai-credits-${credits}`,
      name: isCustom ? `${credits} AI Credits (Custom)` : `${credits} AI Credits Package`,
      price: price,
      listings: 0,
      photos: 0,
      aiCredits: credits,
    });
    setIsPaymentModalOpen(true);
  };
  const individualTiers = [
    {
      name: "Single Listing Unlock",
      price: "$0.99",
      listings: 1,
      photos: 20,
      aiCredits: 1,
      savings: null,
      description: "For one-time sellers who just need that full, polished post.",
      buttonText: "🔓 Unlock 1 Listing",
      badge: null,
    },
    {
      name: "Double Deal",
      price: "$1.49",
      listings: 2,
      photos: 20,
      aiCredits: 2,
      savings: "25%",
      description: "Best for quick weekend sellers.",
      buttonText: "⚡ Unlock 2 Listings",
      badge: null,
    },
    {
      name: "Triple Boost",
      price: "$1.99",
      listings: 3,
      photos: 20,
      aiCredits: 3,
      savings: "33%",
      description: "Most popular for light resellers.",
      buttonText: "✨ Boost 3 Listings",
      badge: "⭐ Most Popular",
    },
    {
      name: "Five-Item Pack",
      price: "$2.99",
      listings: 5,
      photos: 20,
      aiCredits: 5,
      savings: "40%",
      description: "For the regular local hustler or declutterer.",
      buttonText: "💼 Upgrade 5 Listings",
      badge: null,
    },
    {
      name: "Six-Pack Pro",
      price: "$3.49",
      listings: 6,
      photos: 20,
      aiCredits: 6,
      savings: "42%",
      description: "Serious local sellers' favorite.",
      buttonText: "🚀 Unlock Six-Pack Pro",
      badge: "💰 Best Value (Starter)",
    },
  ];

  const bulkTiers = [
    {
      name: "Power Starter Pack",
      price: "$4.99",
      listings: 10,
      photos: 20,
      aiCredits: 10,
      savings: "50%",
      description: "Ideal for consistent sellers — one upgrade covers your month.",
      buttonText: "💡 Start Selling Smarter",
      badge: null,
      monthly: false,
    },
    {
      name: "Local Hero Pack",
      price: "$9.99",
      listings: 25,
      photos: 50,
      aiCredits: 30,
      savings: "65%",
      description: "For serious flippers, crafters, or local shop owners.",
      buttonText: "⚡ Upgrade to Local Hero",
      badge: "⭐ Most Popular Bulk Option",
      monthly: false,
    },
    {
      name: "Marketplace Pro Pack",
      price: "$14.99",
      listings: 50,
      photos: 50,
      aiCredits: 75,
      savings: "75%",
      description: "Build your own small marketplace presence.",
      buttonText: "🚀 Go Marketplace Pro",
      badge: null,
      monthly: false,
      features: ['Includes "Trusted Seller" profile badge'],
    },
    {
      name: "Mega Growth Pack",
      price: "$19.99",
      priceNote: "/ month",
      listings: 100,
      photos: 50,
      aiCredits: 100,
      savings: "90%",
      description: "Perfect for stores, resellers, and local service providers.",
      buttonText: "🌍 Upgrade to Mega Growth",
      badge: "💎 Ultimate Value",
      monthly: true,
      features: [
        '"Featured Seller" badge + spotlight placement',
        'Priority moderation and early access to new features',
      ],
    },
  ];

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white min-h-screen">
      {/* Hero Section */}
      <div className="py-16 px-4 text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          ⚡ SellFast.Now Pricing
        </h1>
        <p className="text-2xl md:text-3xl font-semibold mb-4">
          🪙 Sell free — always.
        </p>
        <p className="text-lg md:text-xl max-w-3xl mx-auto opacity-90">
          Every item includes 1 photo + 1 AI listing assist (title, description, valuation, meta-tags).
          <br />
          Need more photos or AI power? Upgrade once and post with ease.
        </p>
      </div>

      {/* Individual & Small Seller Options */}
      <div className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              🔸 Individual & Small Seller Options
            </h2>
            <p className="text-lg text-gray-600">
              Perfect for casual sellers, weekend warriors, and light resellers
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {individualTiers.map((tier, index) => (
              <div
                key={index}
                className={`relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border-2 ${
                  tier.badge ? 'border-yellow-400' : 'border-gray-200'
                }`}
              >
                {tier.badge && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-sm font-bold px-4 py-1 rounded-full shadow-lg">
                    {tier.badge}
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold text-blue-600">{tier.price}</span>
                  </div>
                  {tier.savings && (
                    <div className="mt-2 inline-block bg-green-100 text-green-700 text-sm font-semibold px-3 py-1 rounded-full">
                      Save {tier.savings} vs singles
                    </div>
                  )}
                </div>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-center text-gray-700">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span><strong>{tier.listings}</strong> listing{tier.listings > 1 ? 's' : ''}</span>
                  </li>
                  <li className="flex items-center text-gray-700">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span><strong>{tier.photos}</strong> photos each</span>
                  </li>
                  <li className="flex items-center text-gray-700">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span><strong>{tier.aiCredits}</strong> AI credit{tier.aiCredits > 1 ? 's' : ''}</span>
                  </li>
                </ul>

                <p className="text-sm text-gray-600 mb-6 min-h-[40px]">
                  {tier.description}
                </p>

                <button 
                  onClick={() => handlePurchase(tier, `${tier.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`)}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold py-3 px-6 rounded-full hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  {tier.buttonText} – {tier.price}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bulk & Power Seller Bundles */}
      <div className="py-16 px-4 bg-gradient-to-b from-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              🔹 Bulk & Power Seller Bundles
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              These are for frequent posters, semi-pro sellers, and mini-shop owners.
              <br />
              Each pack comes with extra AI credits for smarter, faster listing creation.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {bulkTiers.map((tier, index) => (
              <div
                key={index}
                className={`relative bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-8 border-2 ${
                  tier.badge ? 'border-purple-400' : 'border-gray-200'
                }`}
              >
                {tier.badge && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold px-4 py-1 rounded-full shadow-lg">
                    {tier.badge}
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold text-purple-600">{tier.price}</span>
                    {tier.priceNote && (
                      <span className="text-lg text-gray-500">{tier.priceNote}</span>
                    )}
                  </div>
                  {tier.savings && (
                    <div className="mt-2 inline-block bg-green-100 text-green-700 text-sm font-semibold px-3 py-1 rounded-full">
                      Save {tier.savings} vs single unlocks
                    </div>
                  )}
                </div>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-center text-gray-700">
                    <CheckCircle className="h-5 w-5 text-purple-500 mr-3 flex-shrink-0" />
                    <span><strong>{tier.listings}</strong> listing{tier.listings !== "∞" && tier.listings > 1 ? 's' : tier.listings === "∞" ? 's' : ''}</span>
                  </li>
                  <li className="flex items-center text-gray-700">
                    <CheckCircle className="h-5 w-5 text-purple-500 mr-3 flex-shrink-0" />
                    <span><strong>{tier.photos}</strong> photos each</span>
                  </li>
                  <li className="flex items-center text-gray-700">
                    <CheckCircle className="h-5 w-5 text-purple-500 mr-3 flex-shrink-0" />
                    <span><strong>{tier.aiCredits}</strong> AI credit{tier.aiCredits !== "∞" && tier.aiCredits > 1 ? 's' : tier.aiCredits === "∞" ? 's' : ''}</span>
                  </li>
                  {tier.features?.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-gray-700">
                      <Star className="h-5 w-5 text-yellow-500 mr-3 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <p className="text-sm text-gray-600 mb-6">
                  {tier.description}
                </p>

                <button 
                  onClick={() => handlePurchase(tier, `${tier.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`)}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold py-3 px-6 rounded-full hover:from-purple-600 hover:to-pink-700 transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  {tier.buttonText} – {tier.price}{tier.priceNote || ''}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Credits Purchase Section */}
      <AICreditsSection onPurchase={handleAICreditsPurchase} />

      {/* What the AI Does */}
      <div className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              🧠 What the AI Does
            </h2>
            <p className="text-lg text-gray-600">
              Every AI credit automatically:
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4 p-6 bg-blue-50 rounded-xl">
              <Sparkles className="h-8 w-8 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-2">Writes a clean, accurate title</h3>
                <p className="text-gray-600 text-sm">Optimized for search and clarity</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 bg-purple-50 rounded-xl">
              <Zap className="h-8 w-8 text-purple-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-2">Generates a detailed description</h3>
                <p className="text-gray-600 text-sm">Highlights features and benefits</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 bg-green-50 rounded-xl">
              <TrendingUp className="h-8 w-8 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-2">Estimates market value range</h3>
                <p className="text-gray-600 text-sm">Based on current market data</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 bg-orange-50 rounded-xl">
              <Gem className="h-8 w-8 text-orange-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-2">Adds relevant local SEO meta-tags</h3>
                <p className="text-gray-600 text-sm">Helps buyers find your items faster</p>
              </div>
            </div>
          </div>

          <p className="text-center text-gray-500 text-sm mt-8">
            (AI doesn't modify images — it helps your listings perform better.)
          </p>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              🎯 Summary of Tiers
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-xl shadow-lg overflow-hidden">
              <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-bold">Tier</th>
                  <th className="px-6 py-4 text-center font-bold">Listings</th>
                  <th className="px-6 py-4 text-center font-bold">Photos/item</th>
                  <th className="px-6 py-4 text-center font-bold">AI Credits</th>
                  <th className="px-6 py-4 text-center font-bold">Price</th>
                  <th className="px-6 py-4 text-center font-bold">Savings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-semibold">Single Unlock</td>
                  <td className="px-6 py-4 text-center">1</td>
                  <td className="px-6 py-4 text-center">20</td>
                  <td className="px-6 py-4 text-center">1</td>
                  <td className="px-6 py-4 text-center font-bold text-blue-600">$0.99</td>
                  <td className="px-6 py-4 text-center text-gray-400">—</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-semibold">Double Deal</td>
                  <td className="px-6 py-4 text-center">2</td>
                  <td className="px-6 py-4 text-center">20</td>
                  <td className="px-6 py-4 text-center">2</td>
                  <td className="px-6 py-4 text-center font-bold text-blue-600">$1.49</td>
                  <td className="px-6 py-4 text-center text-green-600 font-semibold">25%</td>
                </tr>
                <tr className="hover:bg-gray-50 bg-yellow-50">
                  <td className="px-6 py-4 font-semibold">Triple Boost ⭐</td>
                  <td className="px-6 py-4 text-center">3</td>
                  <td className="px-6 py-4 text-center">20</td>
                  <td className="px-6 py-4 text-center">3</td>
                  <td className="px-6 py-4 text-center font-bold text-blue-600">$1.99</td>
                  <td className="px-6 py-4 text-center text-green-600 font-semibold">33%</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-semibold">Five-Item Pack</td>
                  <td className="px-6 py-4 text-center">5</td>
                  <td className="px-6 py-4 text-center">20</td>
                  <td className="px-6 py-4 text-center">5</td>
                  <td className="px-6 py-4 text-center font-bold text-blue-600">$2.99</td>
                  <td className="px-6 py-4 text-center text-green-600 font-semibold">40%</td>
                </tr>
                <tr className="hover:bg-gray-50 bg-yellow-50">
                  <td className="px-6 py-4 font-semibold">Six-Pack Pro 💰</td>
                  <td className="px-6 py-4 text-center">6</td>
                  <td className="px-6 py-4 text-center">20</td>
                  <td className="px-6 py-4 text-center">6</td>
                  <td className="px-6 py-4 text-center font-bold text-blue-600">$3.49</td>
                  <td className="px-6 py-4 text-center text-green-600 font-semibold">42%</td>
                </tr>
                <tr className="hover:bg-gray-50 bg-purple-50">
                  <td className="px-6 py-4 font-semibold">Power Starter</td>
                  <td className="px-6 py-4 text-center">10</td>
                  <td className="px-6 py-4 text-center">20</td>
                  <td className="px-6 py-4 text-center">10</td>
                  <td className="px-6 py-4 text-center font-bold text-purple-600">$4.99</td>
                  <td className="px-6 py-4 text-center text-green-600 font-semibold">50%</td>
                </tr>
                <tr className="hover:bg-gray-50 bg-purple-50">
                  <td className="px-6 py-4 font-semibold">Local Hero ⭐</td>
                  <td className="px-6 py-4 text-center">25</td>
                  <td className="px-6 py-4 text-center">50</td>
                  <td className="px-6 py-4 text-center">30</td>
                  <td className="px-6 py-4 text-center font-bold text-purple-600">$9.99</td>
                  <td className="px-6 py-4 text-center text-green-600 font-semibold">65%</td>
                </tr>
                <tr className="hover:bg-gray-50 bg-purple-50">
                  <td className="px-6 py-4 font-semibold">Marketplace Pro</td>
                  <td className="px-6 py-4 text-center">50</td>
                  <td className="px-6 py-4 text-center">50</td>
                  <td className="px-6 py-4 text-center">75</td>
                  <td className="px-6 py-4 text-center font-bold text-purple-600">$14.99</td>
                  <td className="px-6 py-4 text-center text-green-600 font-semibold">75%</td>
                </tr>
                <tr className="hover:bg-gray-50 bg-gradient-to-r from-purple-50 to-pink-50">
                  <td className="px-6 py-4 font-semibold">Unlimited Growth 💎</td>
                  <td className="px-6 py-4 text-center">∞</td>
                  <td className="px-6 py-4 text-center">50</td>
                  <td className="px-6 py-4 text-center">∞</td>
                  <td className="px-6 py-4 text-center font-bold text-purple-600">$19.99/mo</td>
                  <td className="px-6 py-4 text-center text-green-600 font-semibold">90%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Fine Print */}
      <div className="py-12 px-4 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold mb-6 text-center">🧾 Fine Print</h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-600">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <p>All payments are securely processed by Stripe.</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <p>No recurring charges except on monthly Unlimited plans.</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <p>Refunds if upgrades or credits fail.</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <p>Prices shown in USD.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Ready to Start Selling Smarter?
        </h2>
        <p className="text-xl mb-8 max-w-2xl mx-auto">
          Choose the plan that fits your needs and start posting with confidence.
        </p>
        <button
          onClick={() => window.location.href = '/post-ad'}
          className="bg-white text-blue-600 font-bold py-4 px-8 rounded-full text-lg hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          🚀 Post Your First Item Free
        </button>
      </div>

      {/* Payment Modal */}
      <PricingTierPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        tier={selectedTier}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
