import { Camera, Brain, Search, Tag, Share2, TrendingDown, DollarSign } from "lucide-react";
import SectionNav from "./SectionNav";

const features = [
  {
    icon: Camera,
    title: "Bulk Photo Upload",
    description: "No limits. Upload entire estates from your phone or computer via QR code.",
    color: "green",
  },
  {
    icon: Brain,
    title: "AI-Generated Content",
    description: "Titles, descriptions, valuations, condition assessment - all automatic.",
    color: "blue",
  },
  {
    icon: Search,
    title: "SEO Meta Tags",
    description: "AI creates searchable keywords so buyers find your items in search results.",
    color: "purple",
  },
  {
    icon: Tag,
    title: "Personal Branding",
    description: "All listings show your name/business. Build your reputation as a liquidator.",
    color: "orange",
  },
  {
    icon: Share2,
    title: "One Link, All Platforms",
    description: "Auto-generated shareable link works on Facebook, Instagram, TikTok, X, Craigslist, Marketplace.",
    color: "pink",
  },
  {
    icon: DollarSign,
    title: "Fair Progressive Pricing",
    description: "First 5 free. Then 3-5 pennies per dollar based on item value. Lower fees for higher-value items.",
    color: "green",
  },
];

const colorClasses = {
  green: {
    bg: "bg-green-100 dark:bg-green-900/30",
    icon: "text-green-600 dark:text-green-400",
    border: "border-green-200 dark:border-green-800",
  },
  blue: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    icon: "text-blue-600 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800",
  },
  purple: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    icon: "text-purple-600 dark:text-purple-400",
    border: "border-purple-200 dark:border-purple-800",
  },
  orange: {
    bg: "bg-orange-100 dark:bg-orange-900/30",
    icon: "text-orange-600 dark:text-orange-400",
    border: "border-orange-200 dark:border-orange-800",
  },
  pink: {
    bg: "bg-pink-100 dark:bg-pink-900/30",
    icon: "text-pink-600 dark:text-pink-400",
    border: "border-pink-200 dark:border-pink-800",
  },
};

export default function EstateKeyFeatures() {
  return (
    <div id="features" className="bg-gray-50 dark:bg-gray-800 scroll-mt-20">
      <SectionNav currentSection="features" />
      <div className="py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Everything You Need for Estate Liquidation
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Professional tools designed specifically for bulk sellers
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const colors = colorClasses[feature.color as keyof typeof colorClasses];
            
            return (
              <div
                key={index}
                className={`bg-white dark:bg-gray-900 rounded-xl p-6 border-2 ${colors.border} shadow-lg hover:shadow-xl transition-shadow`}
              >
                <div className={`w-14 h-14 ${colors.bg} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className={`h-7 w-7 ${colors.icon}`} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
      </div>
    </div>
  );
}

