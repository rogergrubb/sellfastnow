import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, Clock, Image, Search } from "lucide-react";

interface AnalyzedItem {
  index: number;
  title: string;
  status: 'completed' | 'analyzing' | 'waiting';
}

interface ProgressModalProps {
  open: boolean;
  currentIndex: number;
  totalImages: number;
  analyzedItems: AnalyzedItem[];
  onClose?: () => void;
  countdown?: number;
  formatTime?: (seconds: number) => string;
}

export function ProgressModal({ open, currentIndex, totalImages, analyzedItems, onClose, countdown, formatTime }: ProgressModalProps) {
  const progress = totalImages > 0 ? (currentIndex / totalImages) * 100 : 0;
  const isComplete = progress === 100 && analyzedItems.every(item => item.status === 'completed');

  // Random tips to show during processing
  const tips = [
    "AI-generated descriptions help items sell 40% faster",
    "Quality descriptions increase buyer confidence",
    "AI detects details you might miss",
    "Professional listings get more views",
    "Accurate pricing attracts serious buyers"
  ];
  const randomTip = tips[Math.floor(Math.random() * tips.length)];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-md" 
        data-testid="dialog-progress"
        onInteractOutside={(e) => !isComplete && e.preventDefault()}
        onEscapeKeyDown={(e) => !isComplete && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            AI is generating your descriptions...
          </DialogTitle>
          <DialogDescription>
            {countdown !== undefined && countdown > 0 && formatTime ? (
              <div className="flex items-center gap-2 mt-2">
                <Clock className="h-4 w-4" />
                <span className="text-lg font-semibold">{formatTime(countdown)} remaining</span>
              </div>
            ) : (
              "Using AI to identify products from your images"
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Image className="h-4 w-4" />
                Processing image {currentIndex} of {totalImages}
              </span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} data-testid="progress-bar" />
          </div>

          {countdown !== undefined && countdown > 0 && (
            <div className="text-sm text-center text-muted-foreground italic py-2 border-t border-b">
              💡 Pro tip: {randomTip}
            </div>
          )}

          <div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-3">
            {analyzedItems.map((item) => (
              <div 
                key={item.index} 
                className="flex items-center gap-2 text-sm"
                data-testid={`item-status-${item.index}`}
              >
                {item.status === 'completed' && (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Item {item.index}: {item.title}</span>
                  </>
                )}
                {item.status === 'analyzing' && (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-primary flex-shrink-0" />
                    <span>Item {item.index}: Analyzing...</span>
                  </>
                )}
                {item.status === 'waiting' && (
                  <>
                    <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground">Item {item.index}: Waiting...</span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {isComplete && onClose && (
          <DialogFooter>
            <Button 
              onClick={onClose} 
              data-testid="button-close-progress"
              className="w-full"
            >
              Continue
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
