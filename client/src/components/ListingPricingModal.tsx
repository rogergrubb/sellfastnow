import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, CircleDollarSign, Sparkles } from "lucide-react";

interface ListingItem {
  title: string;
  price: number;
}

interface ListingPricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  items: ListingItem[];
  freeItemsRemaining: number;
  isProcessing?: boolean;
}

// Progressive pricing tiers
const calculateItemFee = (price: number): number => {
  if (price <= 50) {
    return price * 0.05; // 5¢ per dollar
  } else if (price <= 100) {
    return price * 0.04; // 4¢ per dollar
  } else {
    return price * 0.03; // 3¢ per dollar
  }
};

const getTierInfo = (price: number): { rate: string; percentage: string } => {
  if (price <= 50) {
    return { rate: "5¢ per dollar", percentage: "5%" };
  } else if (price <= 100) {
    return { rate: "4¢ per dollar", percentage: "4%" };
  } else {
    return { rate: "3¢ per dollar", percentage: "3%" };
  }
};

export function ListingPricingModal({
  isOpen,
  onClose,
  onConfirm,
  items,
  freeItemsRemaining,
  isProcessing = false,
}: ListingPricingModalProps) {
  // Calculate fees for each item
  const itemsWithFees = items.map((item, index) => {
    const baseFee = calculateItemFee(item.price);
    const tierInfo = getTierInfo(item.price);
    
    // Check if this item qualifies for free (first 5 under $50)
    const qualifiesForFree = item.price <= 50 && index < freeItemsRemaining;
    const actualFee = qualifiesForFree ? 0 : baseFee;
    
    return {
      ...item,
      baseFee,
      actualFee,
      tierInfo,
      isFree: qualifiesForFree,
    };
  });

  const totalFee = itemsWithFees.reduce((sum, item) => sum + item.actualFee, 0);
  const freeItemsUsed = itemsWithFees.filter(item => item.isFree).length;
  const paidItems = itemsWithFees.filter(item => !item.isFree).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <CircleDollarSign className="h-6 w-6 text-green-600" />
            Listing Fee Breakdown
          </DialogTitle>
          <DialogDescription>
            Review your listing fees before publishing. Our progressive pricing ensures fair rates based on item value.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progressive Pricing Explanation */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-green-600" />
              Our Fair, Progressive Pricing
            </h3>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <div className="font-semibold text-green-700 dark:text-green-400">$0 - $50</div>
                <div className="text-gray-600 dark:text-gray-400">5¢ per dollar (5%)</div>
              </div>
              <div>
                <div className="font-semibold text-green-700 dark:text-green-400">$51 - $100</div>
                <div className="text-gray-600 dark:text-gray-400">4¢ per dollar (4%)</div>
              </div>
              <div>
                <div className="font-semibold text-green-700 dark:text-green-400">$101+</div>
                <div className="text-gray-600 dark:text-gray-400">3¢ per dollar (3%)</div>
              </div>
            </div>
          </div>

          {/* Free Items Banner */}
          {freeItemsRemaining > 0 && (
            <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-4 border border-green-300 dark:border-green-700">
              <div className="flex items-center gap-2 mb-1">
                <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="font-semibold text-gray-900 dark:text-white text-lg">
                  The First 5 Under 50 Are FREE
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 ml-7">
                You have {freeItemsRemaining} free {freeItemsRemaining === 1 ? 'listing' : 'listings'} remaining this month • Includes AI-generated titles, descriptions, valuations, and SEO meta tags
              </p>
            </div>
          )}

          {/* Itemized Breakdown */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">Items to Publish ({items.length})</h3>
            
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {itemsWithFees.map((item, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    item.isFree
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white truncate">
                        {item.title || `Item ${index + 1}`}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Price: ${item.price.toFixed(2)} • {item.tierInfo.rate}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {item.isFree ? (
                        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                          FREE
                        </Badge>
                      ) : (
                        <div>
                          <div className="font-bold text-gray-900 dark:text-white">
                            ${item.actualFee.toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500">
                            ({item.tierInfo.percentage})
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="border-t pt-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Free items applied:</span>
              <span className="font-medium text-green-600 dark:text-green-400">
                {freeItemsUsed} × $0.00
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Paid items:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {paidItems} items
              </span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t">
              <span className="text-lg font-semibold text-gray-900 dark:text-white">Total Listing Fee:</span>
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                ${totalFee.toFixed(2)}
              </span>
            </div>
            {totalFee === 0 && (
              <p className="text-sm text-green-600 dark:text-green-400 text-center">
                🎉 All items are free this month!
              </p>
            )}
          </div>

          {/* What's Included */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">What's Included:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-blue-600" />
                <span className="text-gray-700 dark:text-gray-300">AI-generated titles</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-blue-600" />
                <span className="text-gray-700 dark:text-gray-300">AI-generated descriptions</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-blue-600" />
                <span className="text-gray-700 dark:text-gray-300">Retail valuations</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-blue-600" />
                <span className="text-gray-700 dark:text-gray-300">Used valuations</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-blue-600" />
                <span className="text-gray-700 dark:text-gray-300">SEO meta tags</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-blue-600" />
                <span className="text-gray-700 dark:text-gray-300">Professional listings</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isProcessing}
            className="bg-green-600 hover:bg-green-700"
          >
            {isProcessing ? (
              <>Processing...</>
            ) : totalFee > 0 ? (
              <>Pay ${totalFee.toFixed(2)} & Publish</>
            ) : (
              <>Publish for Free</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

