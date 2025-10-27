import { Home, Package, Building2, Users, Heart, RefreshCw } from "lucide-react";

const audiences = [
  {
    icon: Home,
    title: "Realtors",
    description: "Help clients liquidate homes before or after sale. List entire estates in hours.",
    color: "blue",
  },
  {
    icon: Package,
    title: "Estate Liquidators",
    description: "Professional estate sale companies. Handle multiple estates per month efficiently.",
    color: "green",
  },
  {
    icon: Building2,
    title: "Business Liquidators",
    description: "Closing stores, restaurants, offices. Liquidate inventory and equipment fast.",
    color: "purple",
  },
  {
    icon: Users,
    title: "Downsizing Seniors",
    description: "Moving to smaller homes. Sell lifetime of items without the overwhelm.",
    color: "orange",
  },
  {
    icon: Heart,
    title: "Divorce/Life Changes",
    description: "Quick liquidation needed. Get it done fast without weeks of manual work.",
    color: "pink",
  },
  {
    icon: RefreshCw,
    title: "Resellers/Flippers",
    description: "Buy storage units, garage sales, auctions. List and flip items at scale.",
    color: "teal",
  },
];

const colorClasses = {
  blue: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    icon: "text-blue-600 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800",
    gradient: "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20",
  },
  green: {
    bg: "bg-green-100 dark:bg-green-900/30",
    icon: "text-green-600 dark:text-green-400",
    border: "border-green-200 dark:border-green-800",
    gradient: "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20",
  },
  purple: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    icon: "text-purple-600 dark:text-purple-400",
    border: "border-purple-200 dark:border-purple-800",
    gradient: "from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20",
  },
  orange: {
    bg: "bg-orange-100 dark:bg-orange-900/30",
    icon: "text-orange-600 dark:text-orange-400",
    border: "border-orange-200 dark:border-orange-800",
    gradient: "from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20",
  },
  pink: {
    bg: "bg-pink-100 dark:bg-pink-900/30",
    icon: "text-pink-600 dark:text-pink-400",
    border: "border-pink-200 dark:border-pink-800",
    gradient: "from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20",
  },
  teal: {
    bg: "bg-teal-100 dark:bg-teal-900/30",
    icon: "text-teal-600 dark:text-teal-400",
    border: "border-teal-200 dark:border-teal-800",
    gradient: "from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20",
  },
};

export default function TargetAudiences() {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Perfect For
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Designed for professionals and individuals who need to list items at scale
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {audiences.map((audience, index) => {
            const Icon = audience.icon;
            const colors = colorClasses[audience.color as keyof typeof colorClasses];
            
            return (
              <div
                key={index}
                className={`bg-gradient-to-br ${colors.gradient} rounded-xl p-6 border-2 ${colors.border} shadow-lg hover:shadow-xl transition-all hover:scale-105`}
              >
                <div className={`w-16 h-16 ${colors.bg} rounded-2xl flex items-center justify-center mb-4`}>
                  <Icon className={`h-8 w-8 ${colors.icon}`} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {audience.title}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {audience.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

