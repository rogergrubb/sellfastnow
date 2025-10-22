import { Button } from "@/components/ui/button";
import { DollarSign, Shield, Zap, ShieldCheck } from "lucide-react";

interface SellerBenefitsLandingProps {
  onGetStarted: () => void;
}

export function SellerBenefitsLanding({ onGetStarted }: SellerBenefitsLandingProps) {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
          <div className="flex-1 text-left">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              Sell locally.
              <br />
              Get paid instantly.
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              SellFast.Now handles payments and protection — you keep 97.5% of every sale.
            </p>
          </div>
          
          <div className="flex-1 flex justify-center">
            <img 
              src="/seller-benefits-hero.png" 
              alt="Payment received notification" 
              className="w-full max-w-sm"
            />
          </div>
        </div>
      </div>

      {/* Benefits Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Benefit 1: Instant Payouts */}
        <div className="flex gap-4">
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
            <DollarSign className="h-6 w-6 text-yellow-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2">Instant Payouts</h3>
            <p className="text-muted-foreground">
              Get paid directly to your bank — no waiting
            </p>
          </div>
        </div>

        {/* Benefit 2: Safe Transactions */}
        <div className="flex gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2">Safe Transactions</h3>
            <p className="text-muted-foreground">
              Buyer funds held securely until delivery confirmed
            </p>
          </div>
        </div>

        {/* Benefit 3: Low Fees, High Profits */}
        <div className="flex gap-4">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Zap className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2">Low Fees, High Profits</h3>
            <p className="text-muted-foreground">
              Keep 97.5% — less than half most platforms take
            </p>
          </div>
        </div>

        {/* Benefit 4: Cashless & Safe */}
        <div className="flex gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2">Cashless & Safe</h3>
            <p className="text-muted-foreground">
              No cash meetups — especially safe for women sellers
            </p>
          </div>
        </div>
      </div>

      {/* Cashless Safety Image */}
      <div className="mb-8 rounded-lg overflow-hidden">
        <img 
          src="/cashless-safety.png" 
          alt="Safe cashless transaction between seller and buyer" 
          className="w-full"
        />
      </div>

      {/* CTA Button */}
      <div className="text-center">
        <Button 
          onClick={onGetStarted}
          size="lg"
          className="w-full md:w-auto px-12 py-6 text-lg font-semibold"
        >
          Start Selling — Get Paid Today
        </Button>
        
        <p className="text-sm text-muted-foreground mt-4">
          Powered by Stripe — the most trusted online transaction service in the business
        </p>
      </div>
    </div>
  );
}

