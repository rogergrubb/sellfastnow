import { useState, useEffect } from "react";
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

  // Detailed educational messages that rotate every 8-10 seconds
  const educationalMessages = [
    {
      title: "Why Professional Photos Matter",
      message: "Listings with 5+ clear photos receive 67% more views. Our AI works best with well-lit images from multiple angles, helping identify every detail buyers want to know."
    },
    {
      title: "The Power of Detailed Descriptions",
      message: "Items with comprehensive descriptions sell 45% faster. Include measurements, brand names, condition details, and purchase history. AI analysis helps ensure nothing important is missed."
    },
    {
      title: "Smart Pricing Psychology",
      message: "Pricing at $99 instead of $100 can increase click-through rates by 20%. Round numbers suggest firm pricing, while precise amounts ($47) feel more negotiable and research-backed."
    },
    {
      title: "First Impressions Count",
      message: "Buyers form an opinion within 3 seconds of seeing your listing. A strong title with key specs (brand, model, size, condition) dramatically improves click rates and filters out casual browsers."
    },
    {
      title: "Timing Your Listing",
      message: "Items listed on Thursday evenings get 3x more weekend traffic when buyers have time to browse. Fresh listings appear higher in search results, maximizing your initial exposure window."
    },
    {
      title: "Building Buyer Trust",
      message: "Transparent condition ratings and honest flaw disclosure actually increase final sale prices by building credibility. Buyers appreciate knowing exactly what they're getting before they inquire."
    }
  ];

  // State to track current message index
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  // Rotate messages every 8-10 seconds (using 9 seconds as middle ground)
  useEffect(() => {
    if (!open || isComplete) return;
    
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % educationalMessages.length);
    }, 9000);

    return () => clearInterval(interval);
  }, [open, isComplete, educationalMessages.length]);

  const currentMessage = educationalMessages[currentMessageIndex];

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
            {countdown !== undefined && formatTime ? (
              <div className="flex items-center gap-2 mt-2">
                <Clock className="h-4 w-4" />
                <span className="text-lg font-semibold">
                  {countdown > 0 ? `${formatTime(countdown)} remaining` : "Almost done..."}
                </span>
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

          {countdown !== undefined && (
            <div className="space-y-2 py-3 px-4 border-t border-b bg-accent/30 rounded-md">
              <div className="text-sm font-semibold text-primary flex items-center gap-2">
                💡 {currentMessage.title}
              </div>
              <div className="text-sm text-muted-foreground leading-relaxed">
                {currentMessage.message}
              </div>
              <div className="flex justify-center gap-1.5 pt-1">
                {educationalMessages.map((_, index) => (
                  <div 
                    key={index}
                    className={`h-1.5 rounded-full transition-all ${
                      index === currentMessageIndex ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/30'
                    }`}
                    data-testid={`message-indicator-${index}`}
                  />
                ))}
              </div>
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
