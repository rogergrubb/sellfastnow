import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CancellationCommentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingId: string;
  otherUserId: string;
  currentUserId: string;
  userRole: "buyer" | "seller";
  queryKey?: any[];
}

const cancellationReasons = [
  { value: "seller_unavailable", label: "Seller became unavailable", roles: ["buyer"] },
  { value: "buyer_unavailable", label: "Buyer became unavailable", roles: ["seller"] },
  { value: "price_disagreement", label: "Could not agree on price" },
  { value: "item_condition", label: "Item condition not as described" },
  { value: "payment_issues", label: "Payment issues" },
  { value: "location_issues", label: "Location/meeting issues" },
  { value: "changed_mind", label: "Changed my mind" },
  { value: "found_better_deal", label: "Found a better deal elsewhere" },
  { value: "safety_concerns", label: "Safety or trust concerns" },
  { value: "no_response", label: "Other party stopped responding" },
  { value: "other", label: "Other reason" },
];

export function CancellationCommentModal({
  open,
  onOpenChange,
  listingId,
  otherUserId,
  currentUserId,
  userRole,
  queryKey = ["/api/cancellations"],
}: CancellationCommentModalProps) {
  const { toast } = useToast();

  const [cancellationReason, setCancellationReason] = useState("");
  const [cancellationComment, setCancellationComment] = useState("");
  const [whoInitiated, setWhoInitiated] = useState<"self" | "other" | "mutual">("self");

  const createCancellationMutation = useMutation({
    mutationFn: async (cancellationData: any) => {
      return await apiRequest("/api/cancellations/create", "POST", cancellationData);
    },
    onSuccess: () => {
      toast({
        title: "Cancellation recorded",
        description: "Your cancellation comment has been submitted.",
      });
      queryClient.invalidateQueries({ queryKey });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit cancellation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setCancellationReason("");
    setCancellationComment("");
    setWhoInitiated("self");
  };

  const handleSubmit = () => {
    if (!cancellationReason) {
      toast({
        title: "Reason required",
        description: "Please select a cancellation reason.",
        variant: "destructive",
      });
      return;
    }

    if (cancellationComment.trim().length === 0) {
      toast({
        title: "Comment required",
        description: "Please provide details about the cancellation.",
        variant: "destructive",
      });
      return;
    }

    const cancellationData = {
      listingId,
      commenterId: currentUserId,
      commentedUserId: otherUserId,
      cancellationReason,
      cancellationComment: cancellationComment.trim(),
      whoInitiated,
      commenterRole: userRole,
    };

    createCancellationMutation.mutate(cancellationData);
  };

  // Filter reasons based on user role
  const availableReasons = cancellationReasons.filter(
    (reason) => !reason.roles || reason.roles.includes(userRole)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" data-testid="modal-cancellation-comment">
        <DialogHeader>
          <DialogTitle>Report Transaction Cancellation</DialogTitle>
          <DialogDescription>
            Help us improve by sharing why this transaction didn't complete
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Who Initiated Cancellation */}
          <div className="space-y-3">
            <Label>Who initiated the cancellation?</Label>
            <RadioGroup value={whoInitiated} onValueChange={(value: any) => setWhoInitiated(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="self" id="initiated-self" data-testid="radio-initiated-self" />
                <Label htmlFor="initiated-self" className="font-normal">
                  I initiated the cancellation
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="initiated-other" data-testid="radio-initiated-other" />
                <Label htmlFor="initiated-other" className="font-normal">
                  The other party initiated the cancellation
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mutual" id="initiated-mutual" data-testid="radio-initiated-mutual" />
                <Label htmlFor="initiated-mutual" className="font-normal">
                  It was a mutual decision
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Cancellation Reason */}
          <div className="space-y-2">
            <Label htmlFor="cancellation-reason">Reason for Cancellation *</Label>
            <Select value={cancellationReason} onValueChange={setCancellationReason}>
              <SelectTrigger id="cancellation-reason" data-testid="select-cancellation-reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {availableReasons.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cancellation Comment */}
          <div className="space-y-2">
            <Label htmlFor="cancellation-comment">Additional Details *</Label>
            <Textarea
              id="cancellation-comment"
              placeholder="Please provide details about what happened..."
              value={cancellationComment}
              onChange={(e) => setCancellationComment(e.target.value)}
              rows={5}
              data-testid="textarea-cancellation-comment"
            />
            <p className="text-xs text-muted-foreground">
              Your feedback helps maintain trust in our marketplace
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createCancellationMutation.isPending}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createCancellationMutation.isPending}
            data-testid="button-submit-cancellation"
          >
            {createCancellationMutation.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Submit Cancellation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
