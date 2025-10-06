import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Check, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

interface ProcessedItem {
  index: number;
  imageUrl: string;
  title: string;
  description: string;
  tags: string[];
  retailPrice: number;
  usedPrice: number;
  status: 'waiting' | 'analyzing' | 'completed';
}

interface SequentialProcessingModalProps {
  open: boolean;
  currentIndex: number;
  totalItems: number;
  currentItem: ProcessedItem | null;
  remainingCredits: number;
}

export function SequentialProcessingModal({
  open,
  currentIndex,
  totalItems,
  currentItem,
  remainingCredits,
}: SequentialProcessingModalProps) {
  const [animatedTitle, setAnimatedTitle] = useState("");
  const [animatedDescription, setAnimatedDescription] = useState("");
  const [animatedTags, setAnimatedTags] = useState("");
  const [animatedPricing, setAnimatedPricing] = useState("");

  // Animate title with typing effect
  useEffect(() => {
    if (!currentItem || currentItem.status !== 'completed') {
      setAnimatedTitle("");
      return;
    }

    let index = 0;
    const title = currentItem.title;
    setAnimatedTitle("");

    const interval = setInterval(() => {
      if (index < title.length) {
        setAnimatedTitle(title.substring(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [currentItem?.title, currentItem?.status]);

  // Animate description
  useEffect(() => {
    if (!currentItem || currentItem.status !== 'completed' || animatedTitle !== currentItem.title) {
      setAnimatedDescription("");
      return;
    }

    let index = 0;
    const description = currentItem.description;
    setAnimatedDescription("");

    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        if (index < description.length) {
          setAnimatedDescription(description.substring(0, index + 1));
          index++;
        } else {
          clearInterval(interval);
        }
      }, 10);
    }, 300);

    return () => clearTimeout(timeout);
  }, [currentItem?.description, currentItem?.status, animatedTitle, currentItem?.title]);

  // Animate tags
  useEffect(() => {
    if (!currentItem || currentItem.status !== 'completed' || animatedDescription !== currentItem.description) {
      setAnimatedTags("");
      return;
    }

    const tags = currentItem.tags.join(", ");
    setAnimatedTags("");

    const timeout = setTimeout(() => {
      setAnimatedTags(tags);
    }, 500);

    return () => clearTimeout(timeout);
  }, [currentItem?.tags, currentItem?.status, animatedDescription, currentItem?.description]);

  // Animate pricing
  useEffect(() => {
    if (!currentItem || currentItem.status !== 'completed' || !animatedTags) {
      setAnimatedPricing("");
      return;
    }

    const pricing = `Retail: $${currentItem.retailPrice} | Suggested: $${currentItem.usedPrice}`;
    setAnimatedPricing("");

    const timeout = setTimeout(() => {
      setAnimatedPricing(pricing);
    }, 700);

    return () => clearTimeout(timeout);
  }, [currentItem?.retailPrice, currentItem?.usedPrice, currentItem?.status, animatedTags]);

  const progressPercent = (currentIndex / totalItems) * 100;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-2xl" data-testid="dialog-sequential-processing">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">⚡ AI Processing Your Items...</h3>
            <Progress value={progressPercent} className="mt-2" />
            <p className="text-sm text-muted-foreground mt-2">
              Processing item {currentIndex + 1} of {totalItems} • {remainingCredits} credits remaining
            </p>
          </div>

          {currentItem && (
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <img
                  src={currentItem.imageUrl}
                  alt={`Item ${currentItem.index}`}
                  className="w-20 h-20 object-cover rounded-md"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Photo #{currentItem.index}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium">Title:</p>
                  {currentItem.status === 'analyzing' && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing...
                    </p>
                  )}
                  {currentItem.status === 'completed' && (
                    <p className="text-sm flex items-start gap-2">
                      {animatedTitle === currentItem.title && <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />}
                      <span>{animatedTitle}</span>
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm font-medium">Description:</p>
                  {currentItem.status === 'analyzing' && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </p>
                  )}
                  {currentItem.status === 'completed' && (
                    <p className="text-sm text-muted-foreground">{animatedDescription}</p>
                  )}
                </div>

                <div>
                  <p className="text-sm font-medium">Tags:</p>
                  {currentItem.status === 'analyzing' && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Finding keywords...
                    </p>
                  )}
                  {currentItem.status === 'completed' && animatedTags && (
                    <p className="text-sm flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{animatedTags}</span>
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm font-medium">Pricing:</p>
                  {currentItem.status === 'analyzing' && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Estimating value...
                    </p>
                  )}
                  {currentItem.status === 'completed' && animatedPricing && (
                    <p className="text-sm flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{animatedPricing}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
