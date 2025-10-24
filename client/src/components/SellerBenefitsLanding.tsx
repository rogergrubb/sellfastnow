import { Button } from "@/components/ui/button";

interface SellerBenefitsLandingProps {
  onGetStarted: () => void;
}

export function SellerBenefitsLanding({ onGetStarted }: SellerBenefitsLandingProps) {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Marketplace Hero Image - Compact */}
      <div className="mb-3">
        <img 
          src="/marketplace-hero.png" 
          alt="Buy & Sell Anything Locally - SellFast.Now Marketplace" 
          className="w-full h-auto rounded-lg shadow-md"
        />
      </div>
    </div>
  );
}

