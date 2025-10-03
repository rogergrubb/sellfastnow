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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CancelTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingTitle: string;
  listingPrice: string;
  otherPartyName: string;
  transactionId: string;
  userRole: "buyer" | "seller";
  scheduledMeetupTime?: Date;
  onSuccess?: () => void;
}

const cancellationReasons = [
  { value: "found_better_deal", label: "Found better deal" },
  { value: "personal_emergency", label: "Personal/family emergency" },
  { value: "changed_mind", label: "Changed my mind" },
  { value: "item_concerns", label: "Item concerns from photos/description" },
  { value: "scheduling_conflict", label: "Scheduling conflict" },
  { value: "unresponsive", label: "Seller/Buyer unresponsive" },
  { value: "price_too_high", label: "Price too high" },
  { value: "other", label: "Other" },
];

export function CancelTransactionModal({
  open,
  onOpenChange,
  listingTitle,
  listingPrice,
  otherPartyName,
  transactionId,
  userRole,
  scheduledMeetupTime,
  onSuccess,
}: CancelTransactionModalProps) {
  const { toast } = useToast();
  const [reasonCategory, setReasonCategory] = useState("");
  const [comment, setComment] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  const cancelMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest(`/api/transactions/${transactionId}/cancel`, "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Transaction cancelled",
        description: "The other party has been notified.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/transactions/${transactionId}/details`] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      setReasonCategory("");
      setComment("");
      setIsPublic(true);
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to cancel",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!reasonCategory) {
      toast({
        title: "Please select a reason",
        variant: "destructive",
      });
      return;
    }

    cancelMutation.mutate({
      cancelledBy: userRole,
      reasonCategory,
      comment: comment.trim() || undefined,
      isPublic,
      scheduledMeetupTime,
    });
  };

  const characterCount = comment.length;
  const maxChars = 500;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" data-testid="dialog-cancel-transaction">
        <DialogHeader>
          <DialogTitle data-testid="heading-cancel-transaction">Cancel Your Offer?</DialogTitle>
          <DialogDescription>
            Review the cancellation details before proceeding
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Listing Info */}
          <div className="border-b pb-4">
            <p className="font-semibold" data-testid="text-listing-info">
              {listingTitle} - ${listingPrice}
            </p>
            <p className="text-sm text-muted-foreground" data-testid="text-other-party">
              {userRole === "buyer" ? "Seller" : "Buyer"}: {otherPartyName}
            </p>
          </div>

          {/* Refund Info */}
          <div className="bg-muted/50 p-4 rounded-md space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm">Deposit will be fully refunded to you</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm">No penalties or fees</span>
            </div>
          </div>

          {/* Warning */}
          <div className="flex gap-2 items-start bg-orange-50 dark:bg-orange-950 p-3 rounded-md">
            <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-orange-900 dark:text-orange-100">
              This cancellation will appear on your public profile in transaction history.
            </p>
          </div>

          {/* Reason Selection */}
          <div className="space-y-2">
            <Label htmlFor="reason">
              Would you like to explain why?{" "}
              <span className="text-muted-foreground">(Optional, but recommended)</span>
            </Label>
            <Select value={reasonCategory} onValueChange={setReasonCategory}>
              <SelectTrigger id="reason" data-testid="select-cancel-reason">
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {cancellationReasons.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">Additional comment (optional)</Label>
            <Textarea
              id="comment"
              placeholder="I'm really sorry for the late cancellation..."
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, maxChars))}
              rows={4}
              data-testid="textarea-cancel-comment"
            />
            <p className="text-xs text-muted-foreground text-right" data-testid="text-char-count">
              {characterCount} / {maxChars} characters
            </p>
          </div>

          {/* Public Toggle */}
          <div className="flex items-start space-x-2">
            <Checkbox
              id="public"
              checked={isPublic}
              onCheckedChange={(checked) => setIsPublic(checked === true)}
              data-testid="checkbox-public"
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="public"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Make this comment public
              </label>
              <p className="text-sm text-muted-foreground">
                (Recommended for transparency)
              </p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Note: Public comments help maintain your reputation and show you communicate well.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={cancelMutation.isPending}
            data-testid="button-keep-offer"
          >
            Keep Offer
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={cancelMutation.isPending}
            data-testid="button-confirm-cancel"
          >
            {cancelMutation.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Cancel Transaction
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
