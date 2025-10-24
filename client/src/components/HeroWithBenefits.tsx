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
    detailedDescription: "Every user verifies either their email address or phone number before buying or selling. This step helps reduce scams and ensures you're connecting with real people, not bots or anonymous accounts.",
    position: "top-left",
    color: "blue", // Color theme for this card
  },
  {
    icon: Star,
    title: "Reputation System",
    description: "eBay-style ratings track seller reliability",
    detailedDescription: "Just like eBay, buyers and sellers rate each other after every transaction. These ratings create transparency—so you always know who you're dealing with. Over time, trusted users stand out with strong reputations, helping everyone buy and sell with confidence, not guesswork.",
    position: "top-right",
    color: "green",
  },
  {
    icon: TrendingUp,
    title: "Anti-Fraud Detection",
    description: "AI monitors for suspicious patterns and scams",
    detailedDescription: "Our advanced AI system continuously monitors all listings and user behavior for red flags like fake photos, suspicious pricing, common scam phrases, and unusual activity patterns. Suspicious accounts are automatically flagged for review.",
    position: "middle-left",
    color: "purple",
  },
  {
    icon: Award,
    title: "Transaction History",
    description: "See every user's complete track record",
    detailedDescription: "View the complete transaction history of any buyer or seller before you deal with them. See how many items they've bought or sold, their average rating, how long they've been a member, and any issues reported by other users.",
    position: "middle-right",
    color: "orange",
  },
  {
    icon: CreditCard,
    title: "Secure Payments",
    description: "No cash needed - pay safely online",
    detailedDescription: "Buyers can place funds into secure escrow as a deposit, showing sellers they're serious and will actually show up. This good-faith gesture helps sellers gauge real interest and reduces no-shows. Funds are held safely until both parties meet and confirm the transaction. No cash exchanges, no counterfeits, and full protection for both sides.",
    position: "bottom-left",
    color: "blue",
  },
  {
    icon: Lock,
    title: "Escrow Protection",
    description: "Funds held until you confirm receipt",
    detailedDescription: "Your payment is held in secure escrow until you receive the item and confirm it's as described. If there's a problem, you can open a dispute and get your money back. Sellers are protected too - once you approve, they get paid immediately.",
    position: "bottom-right",
    color: "green",
  },
];

// Color theme configurations
const colorThemes = {
  blue: {
    bg: "bg-blue-500/10",
    hoverBg: "hover:bg-blue-500/20",
    iconBg: "bg-blue-500/20",
    hoverIconBg: "group-hover:bg-blue-500/30",
    border: "border-blue-300/30",
    popupBg: "bg-blue-600",
    popupBorder: "border-blue-400",
  },
  green: {
    bg: "bg-green-500/10",
    hoverBg: "hover:bg-green-500/20",
    iconBg: "bg-green-500/20",
    hoverIconBg: "group-hover:bg-green-500/30",
    border: "border-green-300/30",
    popupBg: "bg-green-600",
    popupBorder: "border-green-400",
  },
  purple: {
    bg: "bg-purple-500/10",
    hoverBg: "hover:bg-purple-500/20",
    iconBg: "bg-purple-500/20",
    hoverIconBg: "group-hover:bg-purple-500/30",
    border: "border-purple-300/30",
    popupBg: "bg-purple-600",
    popupBorder: "border-purple-400",
  },
  orange: {
    bg: "bg-orange-500/10",
    hoverBg: "hover:bg-orange-500/20",
    iconBg: "bg-orange-500/20",
    hoverIconBg: "group-hover:bg-orange-500/30",
    border: "border-orange-300/30",
    popupBg: "bg-orange-600",
    popupBorder: "border-orange-400",
  },
};

export default function HeroWithBenefits({ onSearch, onCategorySelect }: HeroProps) {
  const [searchInput, setSearchInput] = useState("");
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const { isSignedIn } = useAuth();
  const [, setLocation] = useLocation();

  // No position classes needed - using flexbox for horizontal layout

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
        
        {/* Benefit Cards - Glass Morphism Banner - Hidden on mobile, visible on tablet+ */}
        <div className="hidden lg:block absolute top-4 left-0 right-0 z-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-center gap-3 xl:gap-4">
              {benefitCards.map((benefit, index) => {
                const Icon = benefit.icon;
                const theme = colorThemes[benefit.color as keyof typeof colorThemes];
                const isHovered = hoveredCard === index;
                
                return (
                  <div
                    key={index}
                    className={`flex-1 max-w-[180px] p-3 xl:p-4
                      ${theme.bg} backdrop-blur-md 
                      border ${theme.border}
                      rounded-xl shadow-2xl
                      ${theme.hoverBg} hover:scale-105
                      transition-all duration-300
                      group cursor-pointer relative`}
                    onMouseEnter={() => setHoveredCard(index)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className={`w-10 h-10 xl:w-12 xl:h-12 ${theme.iconBg} backdrop-blur-sm rounded-full flex items-center justify-center mb-2 ${theme.hoverIconBg} transition-colors`}>
                        <Icon className="h-5 w-5 xl:h-6 xl:w-6 text-white" />
                      </div>
                      <h3 className="text-white font-semibold text-xs xl:text-sm mb-1">
                        {benefit.title}
                      </h3>
                      <p className="text-white/80 text-[10px] xl:text-xs leading-tight">
                        {benefit.description}
                      </p>
                    </div>

                    {/* Hover Popup with Detailed Information */}
                    {isHovered && (
                      <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[280px] xl:w-[300px] 
                    ${theme.popupBg} backdrop-blur-lg
                    border-2 ${theme.popupBorder}
                    rounded-xl shadow-2xl p-5
                    animate-in fade-in slide-in-from-top-2 duration-200
                        z-50`}
                      >
                        {/* Arrow pointing up */}
                        <div className={`absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 ${theme.popupBg} border-t-2 border-l-2 ${theme.popupBorder} rotate-45`} />
                        
                        <div className="relative">
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-10 h-10 ${theme.iconBg} rounded-full flex items-center justify-center flex-shrink-0`}>
                              <Icon className="h-5 w-5 text-white" />
                            </div>
                            <h4 className="text-white font-bold text-base">{benefit.title}</h4>
                          </div>
                          <p className="text-white/90 text-sm leading-relaxed">
                            {benefit.detailedDescription}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
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
              const theme = colorThemes[benefit.color as keyof typeof colorThemes];
              return (
                <div
                  key={index}
                  className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 ${theme.iconBg.replace('/20', '-100')} rounded-full flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`h-5 w-5 text-${benefit.color}-600`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm mb-1">{benefit.title}</h3>
                      <p className="text-xs text-muted-foreground mb-2">{benefit.description}</p>
                      <p className="text-xs text-gray-600 leading-relaxed">{benefit.detailedDescription}</p>
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

