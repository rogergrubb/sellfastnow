import { useLocation } from "wouter";
import { 
  Store, Upload, BarChart3, Palette, Users, DollarSign,
  ArrowRight, CheckCircle, Sparkles, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BusinessPartnerHero() {
  const [, navigate] = useLocation();

  const features = [
    {
      icon: Store,
      title: "Branded Storefront",
      description: "Custom logo, colors, and domain"
    },
    {
      icon: Upload,
      title: "Bulk Upload",
      description: "Import hundreds of items via CSV"
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Track sales, revenue, and clients"
    },
    {
      icon: DollarSign,
      title: "Only 3% Fee",
      description: "Keep 97% of every sale"
    }
  ];

  const stats = [
    { value: "156+", label: "Business Partners" },
    { value: "$2.4M", label: "Total Sales" },
    { value: "97%", label: "You Keep" },
    { value: "24/7", label: "Support" }
  ];

  return (
    <div className="relative bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="text-white">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span className="text-sm font-medium">For Businesses & Commercial Sellers</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold mb-6 leading-tight">
              Sell in Bulk with Your Own{" "}
              <span className="text-yellow-300">Branded Storefront</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl lg:text-2xl text-blue-100 mb-8 leading-relaxed">
              Join liquidators, realtors, and commercial sellers earning <strong className="text-white">97% per sale</strong> with professional tools built for high-volume selling.
            </p>

            {/* Benefits List */}
            <div className="space-y-3 mb-8">
              {[
                "Custom branding with your logo and colors",
                "Bulk upload tools for hundreds of items",
                "Dedicated analytics and client management",
                "Email & SMS marketing campaigns",
                "Stripe payments with automatic splits"
              ].map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-300 flex-shrink-0 mt-0.5" />
                  <span className="text-lg text-blue-50">{benefit}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Button
                size="lg"
                onClick={() => navigate("/partner/onboard")}
                className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold text-lg px-8 py-6 rounded-lg shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
              >
                Become a Partner
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/partner/premium-liquidators")}
                className="bg-white/10 hover:bg-white/20 text-white border-2 border-white/30 font-semibold text-lg px-8 py-6 rounded-lg backdrop-blur-sm"
              >
                View Example Storefront
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 pt-8 border-t border-white/20">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl lg:text-3xl font-bold text-yellow-300 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-blue-200">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Feature Cards */}
          <div className="hidden lg:block">
            <div className="grid grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all transform hover:scale-105 hover:shadow-2xl"
                >
                  <div className="w-12 h-12 bg-yellow-400 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-gray-900" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-blue-100">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Mockup Screenshot Placeholder */}
            <div className="mt-6 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg p-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg"></div>
                  <div>
                    <div className="h-3 w-32 bg-gray-300 rounded mb-2"></div>
                    <div className="h-2 w-24 bg-gray-200 rounded"></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-20 bg-gray-300 rounded"></div>
                  <div className="h-20 bg-gray-300 rounded"></div>
                  <div className="h-20 bg-gray-300 rounded"></div>
                  <div className="h-20 bg-gray-300 rounded"></div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-gray-600 font-medium">+24% this month</span>
                  </div>
                  <div className="h-2 w-16 bg-blue-600 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Wave Divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
          <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="rgb(249, 250, 251)"/>
        </svg>
      </div>
    </div>
  );
}

