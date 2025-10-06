import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Sparkles, SkipForward } from "lucide-react";
import { useLocation } from "wouter";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  processedCount: number;
  remainingCount: number;
  onSkip: () => void;
}

export function PaymentModal({
  open,
  onOpenChange,
  processedCount,
  remainingCount,
  onSkip,
}: PaymentModalProps) {
  const [, setLocation] = useLocation();

  const handlePurchase = () => {
    setLocation('/purchase-ai-credits');
  };

  const handleSkipClick = () => {
    onOpenChange(false);
    onSkip();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-payment-modal">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
            <DialogTitle data-testid="text-payment-modal-title">
              First {processedCount} Items Processed!
            </DialogTitle>
          </div>
          <DialogDescription className="text-left space-y-3 pt-2">
            <p>
              We've generated AI descriptions for your first {processedCount} items. Review them below.
            </p>
            <p className="font-medium text-foreground">
              You have {remainingCount} more item{remainingCount > 1 ? 's' : ''} remaining.
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <div className="text-sm font-medium mb-2">OPTIONS:</div>
          
          <Button
            className="w-full gap-2 h-auto py-3"
            onClick={handlePurchase}
            data-testid="button-purchase-ai-credits"
          >
            <Sparkles className="h-4 w-4" />
            <div className="text-left flex-1">
              <div>Generate AI for {remainingCount} more item{remainingCount > 1 ? 's' : ''} - $2.99</div>
              <div className="text-xs opacity-90">Includes 25 AI credits (20 credits saved!)</div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={handleSkipClick}
            data-testid="button-skip-ai"
          >
            <SkipForward className="h-4 w-4" />
            Skip AI - I'll enter details manually
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
