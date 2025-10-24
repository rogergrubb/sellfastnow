import { Button } from "@/components/ui/button";

interface SellerBenefitsLandingProps {
  onGetStarted: () => void;
}

export function SellerBenefitsLanding({ onGetStarted }: SellerBenefitsLandingProps) {
  return (
    <div className="max-w-4xl mx-auto">
      {/* New Compact Hero Image */}
      <div className="mb-4">
        <img 
          src="/seller-hero-new.png" 
          alt="Start Selling & Get Paid Today - SellFast.Now" 
          className="w-full h-auto rounded-lg shadow-sm"
        />
      </div>

      {/* CTA Button - Compact */}
      <div className="text-center mb-4">
        <Button 
          onClick={onGetStarted}
          size="lg"
          className="w-full md:w-auto px-8 py-3 text-base font-semibold bg-orange-500 hover:bg-orange-600"
        >
          Get Started
        </Button>
        
        <p className="text-xs text-muted-foreground mt-2">
          Powered by Stripe — Keep 97.5% of every sale
        </p>
      </div>
    </div>
  );
}

