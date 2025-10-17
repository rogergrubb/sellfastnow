import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Info, Sparkles } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  completedItems: Array<{ title: string }>;
  remainingCount: number;
  onContinueManual: () => void;
  onGenerateAll: () => void;
}

const PRICE_PER_ITEM = 0.20;

export default function PricingModal({
  isOpen,
  onClose,
  completedItems,
  remainingCount,
  onContinueManual,
  onGenerateAll,
}: PricingModalProps) {
  const totalCost = (remainingCount * PRICE_PER_ITEM).toFixed(2);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" data-testid="modal-pricing">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="h-6 w-6 text-primary" />
            AI Description Summary
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Completed Items */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <p className="font-semibold text-lg">
                First {completedItems.length} items completed with AI (FREE)
              </p>
            </div>
            <div className="ml-7 space-y-1">
              {completedItems.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {item.title || `Item ${index + 1}`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Remaining Items */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <p className="font-semibold text-lg">
                {remainingCount} items remaining without descriptions
              </p>
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Continue with AI for remaining items?</h3>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-5 w-5">
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <div className="space-y-2">
                    <p className="font-semibold">💡 Why the cost?</p>
                    <p className="text-sm">
                      Each AI-generated description uses advanced image recognition and natural
                      language processing. Your first 5 are free each month!
                    </p>
                    <div className="pt-2 border-t">
                      <p className="text-sm font-semibold mb-1">What you get:</p>
                      <ul className="text-sm space-y-0.5 list-disc list-inside">
                        <li>Product title</li>
                        <li>Detailed description</li>
                        <li>Accurate category</li>
                        <li>Price suggestions (retail & used)</li>
                        <li>Condition assessment</li>
                      </ul>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Pricing Breakdown:</p>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>
                  • {remainingCount} remaining items × ${PRICE_PER_ITEM.toFixed(2)} each = $
                  {totalCost}
                </p>
                <p className="font-semibold text-foreground text-base">Total: ${totalCost}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onContinueManual}
              data-testid="button-continue-manual"
            >
              Continue Manually (Free)
            </Button>
            <Button
              className="flex-1"
              onClick={onGenerateAll}
              data-testid="button-generate-all"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Generate All - ${totalCost}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            All AI-generated content is editable in the next step
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
