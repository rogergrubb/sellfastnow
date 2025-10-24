import { Button } from "@/components/ui/button";
import { DollarSign, Shield, Zap, ShieldCheck } from "lucide-react";

interface SellerBenefitsLandingProps {
  onGetStarted: () => void;
}

export function SellerBenefitsLanding({ onGetStarted }: SellerBenefitsLandingProps) {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Benefits Grid - Compact */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {/* Benefit 1: Instant Payouts */}
        <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg">
          <DollarSign className="h-4 w-4 text-yellow-600 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-semibold">Instant Payouts</h3>
          </div>
        </div>

        {/* Benefit 2: Safe Transactions */}
        <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
          <Shield className="h-4 w-4 text-blue-600 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-semibold">Safe Transactions</h3>
          </div>
        </div>

        {/* Benefit 3: Low Fees, High Profits */}
        <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
          <Zap className="h-4 w-4 text-purple-600 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-semibold">Keep 97.5%</h3>
          </div>
        </div>

        {/* Benefit 4: Cashless & Safe */}
        <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
          <ShieldCheck className="h-4 w-4 text-green-600 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-semibold">Cashless & Safe</h3>
          </div>
        </div>
      </div>

      {/* Cashless Safety Image - Compact */}
      <div className="mb-4 rounded-lg overflow-hidden max-h-40">
        <img 
          src="/cashless-safety.png" 
          alt="Safe cashless transaction between seller and buyer" 
          className="w-full h-full object-cover"
        />
      </div>

      {/* CTA Button - Compact */}
      <div className="text-center">
        <Button 
          onClick={onGetStarted}
          size="default"
          className="w-full md:w-auto px-6 py-2 text-sm font-semibold"
        >
          Start Selling — Get Paid Today
        </Button>
        
        <p className="text-xs text-muted-foreground mt-2">
          Powered by Stripe
        </p>
      </div>
    </div>
  );
}

