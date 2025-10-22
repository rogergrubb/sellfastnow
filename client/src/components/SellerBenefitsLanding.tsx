import { Button } from "@/components/ui/button";
import { DollarSign, Shield, Zap, ShieldCheck } from "lucide-react";

interface SellerBenefitsLandingProps {
  onGetStarted: () => void;
}

export function SellerBenefitsLanding({ onGetStarted }: SellerBenefitsLandingProps) {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section - Compact */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1 text-left">
            <h1 className="text-3xl md:text-4xl font-bold mb-3 leading-tight">
              Sell locally.
              <br />
              Get paid instantly.
            </h1>
            <p className="text-base text-muted-foreground mb-2">
              SellFast.Now handles payments and protection — you keep 97.5% of every sale.
            </p>
            <p className="text-sm text-muted-foreground font-semibold">
              💳 Accept up to $999,999 per transaction • No monthly limits
            </p>
          </div>
          
          <div className="flex-1 flex justify-center">
            <img 
              src="/seller-benefits-hero.png" 
              alt="Payment received notification" 
              className="w-full max-w-xs"
            />
          </div>
        </div>
      </div>

      {/* Benefits Grid - Compact */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {/* Benefit 1: Instant Payouts */}
        <div className="flex gap-3">
          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
            <DollarSign className="h-5 w-5 text-yellow-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold mb-1">Instant Payouts</h3>
            <p className="text-sm text-muted-foreground">
              Get paid directly to your bank — no waiting
            </p>
          </div>
        </div>

        {/* Benefit 2: Safe Transactions */}
        <div className="flex gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Shield className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold mb-1">Safe Transactions</h3>
            <p className="text-sm text-muted-foreground">
              Buyer funds held securely until delivery confirmed
            </p>
          </div>
        </div>

        {/* Benefit 3: Low Fees, High Profits */}
        <div className="flex gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Zap className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold mb-1">Low Fees, High Profits</h3>
            <p className="text-sm text-muted-foreground">
              Keep 97.5% — less than half most platforms take
            </p>
          </div>
        </div>

        {/* Benefit 4: Cashless & Safe */}
        <div className="flex gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold mb-1">Cashless & Safe</h3>
            <p className="text-sm text-muted-foreground">
              No cash meetups — especially safe for women sellers
            </p>
          </div>
        </div>
      </div>

      {/* Cashless Safety Image - Smaller */}
      <div className="mb-6 rounded-lg overflow-hidden max-h-64">
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
          size="lg"
          className="w-full md:w-auto px-8 py-4 text-base font-semibold"
        >
          Start Selling — Get Paid Today
        </Button>
        
        <p className="text-xs text-muted-foreground mt-3">
          Powered by Stripe — the most trusted online transaction service in the business
        </p>
      </div>
    </div>
  );
}

