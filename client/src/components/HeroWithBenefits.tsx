import { useState } from "react";
import { Search, Shield, Star, TrendingUp, Award, CreditCard, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/AuthContext";
import { useLocation } from "wouter";
import heroImage from "@assets/generated_images/Marketplace_hero_collage_image_05e817b0.png";

const categories = ["Electronics", "Furniture", "Clothing", "Vehicles", "Services", "More"];

interface HeroProps {
  onSearch: (query: string) => void;
  onCategorySelect: (category: string) => void;
}

const benefitCards = [
  {
    icon: Shield,
    title: "Verified Users",
    description: "Phone, email, and ID verification required",
    position: "top-left", // positioned around circle
  },
  {
    icon: Star,
    title: "Reputation System",
    description: "eBay-style ratings track seller reliability",
    position: "top-right",
  },
  {
    icon: TrendingUp,
    title: "Anti-Fraud Detection",
    description: "AI monitors for suspicious patterns and scams",
    position: "middle-left",
  },
  {
    icon: Award,
    title: "Transaction History",
    description: "See every user's complete track record",
    position: "middle-right",
  },
  {
    icon: CreditCard,
    title: "Secure Payments",
    description: "No cash needed - pay safely online",
    position: "bottom-left",
  },
  {
    icon: Lock,
    title: "Escrow Protection",
    description: "Funds held until you confirm receipt",
    position: "bottom-right",
  },
];

export default function HeroWithBenefits({ onSearch, onCategorySelect }: HeroProps) {
  const [searchInput, setSearchInput] = useState("");
  const { isSignedIn } = useAuth();
  const [, setLocation] = useLocation();

  // Position classes for circular arrangement
  const positionClasses = {
    "top-left": "absolute top-[10%] left-[5%] lg:left-[10%]",
    "top-right": "absolute top-[10%] right-[5%] lg:right-[10%]",
    "middle-left": "absolute top-[40%] left-[2%] lg:left-[5%]",
    "middle-right": "absolute top-[40%] right-[2%] lg:right-[5%]",
    "bottom-left": "absolute bottom-[25%] left-[5%] lg:left-[10%]",
    "bottom-right": "absolute bottom-[25%] right-[5%] lg:right-[10%]",
  };

  return (
    <div className="relative">
      {/* Hero Section with Circular Benefit Cards */}
      <div className="relative min-h-[700px] lg:min-h-[800px] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/50 to-black/30" />
        
        {/* Benefit Cards - Glass Morphism - Hidden on mobile, visible on tablet+ */}
        <div className="hidden md:block absolute inset-0">
          {benefitCards.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div
                key={index}
                className={`${positionClasses[benefit.position as keyof typeof positionClasses]} 
                  w-[180px] lg:w-[220px] p-4 lg:p-5
                  bg-white/10 backdrop-blur-md 
                  border border-white/20 
                  rounded-2xl shadow-2xl
                  hover:bg-white/15 hover:scale-105
                  transition-all duration-300
                  group cursor-pointer`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 lg:w-14 lg:h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-3 group-hover:bg-white/30 transition-colors">
                    <Icon className="h-6 w-6 lg:h-7 lg:w-7 text-white" />
                  </div>
                  <h3 className="text-white font-semibold text-sm lg:text-base mb-1">
                    {benefit.title}
                  </h3>
                  <p className="text-white/80 text-xs lg:text-sm leading-tight">
                    {benefit.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Center Content - Search Area */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 drop-shadow-2xl">
            Buy & Sell Anything Locally
          </h1>
          <p className="text-lg sm:text-xl text-white/90 mb-8 drop-shadow-lg">
            Your trusted marketplace for finding great deals and selling items fast
          </p>

          {/* Search Bar - Glass Morphism */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="What are you looking for?"
                className="pl-10 h-14 text-base bg-white/95 backdrop-blur-sm border-white/20 shadow-2xl"
                data-testid="input-hero-search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSearch(searchInput)}
              />
            </div>
            <Button 
              size="lg" 
              className="h-14 px-8 bg-secondary hover:bg-secondary text-secondary-foreground shadow-2xl"
              data-testid="button-hero-search"
              onClick={() => onSearch(searchInput)}
            >
              Search
            </Button>
          </div>

          {/* Category Buttons */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {categories.map((category) => (
              <Button
                key={category}
                variant="outline"
                size="sm"
                className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 shadow-lg"
                data-testid={`button-category-${category.toLowerCase()}`}
                onClick={() => onCategorySelect(category.toLowerCase())}
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Post Ad Button */}
          <div>
            <Button 
              size="lg" 
              className="bg-secondary hover:bg-secondary text-secondary-foreground h-14 px-10 shadow-2xl text-lg font-semibold"
              data-testid="button-hero-post"
              onClick={() => setLocation('/post-ad')}
            >
              Post Your Ad - It's Free!
            </Button>
          </div>
        </div>
      </div>

      {/* Safe Electronic Payments Banner - Full Width Blue Strip */}
      <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 py-8 lg:py-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-6">
            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">
              Safe Electronic Payments - No Cash Required
            </h2>
            <p className="text-white/90 text-base lg:text-lg">
              Pay securely with your credit card. Your money is held safely until you confirm receipt of the item.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-3">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Buyer Protection</h3>
              <p className="text-white/80 text-sm">
                Your payment is protected until you receive and approve your item
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-3">
                <Lock className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Seller Protection</h3>
              <p className="text-white/80 text-sm">
                Get paid securely once the buyer confirms receipt
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-3">
                <CreditCard className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">2.5% Fee</h3>
              <p className="text-white/80 text-sm">
                Simple, transparent pricing for secure transactions
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-Only Benefit Cards - Below Banner */}
      <div className="md:hidden bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-6">Safe & Trusted Marketplace</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {benefitCards.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={index}
                  className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm mb-1">{benefit.title}</h3>
                      <p className="text-xs text-muted-foreground">{benefit.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

