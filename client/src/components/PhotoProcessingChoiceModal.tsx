import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Camera, Images } from "lucide-react";
import { useState } from "react";

interface PhotoProcessingChoiceModalProps {
  open: boolean;
  photoCount: number;
  onChoice: (isMultipleAngles: boolean) => void;
}

export function PhotoProcessingChoiceModal({
  open,
  photoCount,
  onChoice,
}: PhotoProcessingChoiceModalProps) {
  const [selectedChoice, setSelectedChoice] = useState<string>("");

  const handleContinue = () => {
    if (selectedChoice === "one-item") {
      onChoice(true); // Multiple angles of one item - will trigger AI analysis
    } else if (selectedChoice === "multiple-items") {
      onChoice(false); // Multiple different items - will trigger AI analysis
    }
  };
  
  // Reset selection when modal opens/closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedChoice("");
    }
  };

  const creditCost = selectedChoice === "one-item" ? 1 : photoCount;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-photo-processing-choice">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            How should we process these {photoCount} photos?
          </DialogTitle>
          <DialogDescription>
            Choose how your photos should be analyzed to save AI credits
          </DialogDescription>
        </DialogHeader>

        <RadioGroup
          value={selectedChoice}
          onValueChange={setSelectedChoice}
          className="space-y-4"
        >
          <div className="flex items-start space-x-3 rounded-lg border p-4 hover-elevate">
            <RadioGroupItem value="one-item" id="one-item" data-testid="radio-one-item" />
            <div className="flex-1 space-y-1">
              <Label htmlFor="one-item" className="cursor-pointer font-medium">
                One Item - Multiple Angles
              </Label>
              <p className="text-sm text-muted-foreground">
                These photos show the SAME product from different angles
                (e.g., {photoCount} photos of a sofa)
              </p>
              <p className="text-sm font-medium text-primary">
                → Creates 1 listing with {photoCount} photos
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 rounded-lg border p-4 hover-elevate">
            <RadioGroupItem value="multiple-items" id="multiple-items" data-testid="radio-multiple-items" />
            <div className="flex-1 space-y-1">
              <Label htmlFor="multiple-items" className="cursor-pointer font-medium">
                Multiple Items - Different Products
              </Label>
              <p className="text-sm text-muted-foreground">
                Each photo is a DIFFERENT product
                (e.g., {photoCount} separate items to sell)
              </p>
              <p className="text-sm font-medium text-primary">
                → Creates {photoCount} separate listings
              </p>
            </div>
          </div>
        </RadioGroup>

        {selectedChoice && (
          <div className="rounded-lg bg-muted p-3 text-sm">
            <p className="font-medium">
              This will use {creditCost} AI credit{creditCost > 1 ? "s" : ""}
            </p>
          </div>
        )}

        <Button
          onClick={handleContinue}
          disabled={!selectedChoice}
          className="w-full"
          data-testid="button-continue-processing"
        >
          Continue with AI Generation
        </Button>
      </DialogContent>
    </Dialog>
  );
}
