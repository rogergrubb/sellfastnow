import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { UserStatsSummary } from "./UserStatsSummary";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, ArrowRightLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Offer {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  offerAmount: number;
  depositAmount: number;
  message: string | null;
  status: string;
  counterOfferAmount: number | null;
  counterOfferMessage: string | null;
  createdAt: Date;
}

interface ViewOfferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offer: Offer;
  listingTitle: string;
}

export function ViewOfferModal({
  open,
  onOpenChange,
  offer,
  listingTitle,
}: ViewOfferModalProps) {
  const [mode, setMode] = useState<"view" | "counter">("view");
  const [counterAmount, setCounterAmount] = useState("");
  const [counterMessage, setCounterMessage] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const acceptMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/offers/${offer.id}/accept`, "PATCH", {});
    },
    onSuccess: () => {
      toast({
        title: "Offer accepted",
        description: "The buyer will be notified",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/listings", offer.listingId, "offers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/offers/received"] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to accept offer",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const declineMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/offers/${offer.id}/decline`, "PATCH", {});
    },
    onSuccess: () => {
      toast({
        title: "Offer declined",
        description: "The buyer will be notified",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/listings", offer.listingId, "offers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/offers/received"] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to decline offer",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const counterMutation = useMutation({
    mutationFn: async (data: { counterOfferAmount: number; counterOfferMessage: string }) => {
      return await apiRequest(`/api/offers/${offer.id}/counter`, "PATCH", data);
    },
    onSuccess: () => {
      toast({
        title: "Counter offer sent",
        description: "The buyer will be notified",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/listings", offer.listingId, "offers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/offers/received"] });
      onOpenChange(false);
      setMode("view");
      setCounterAmount("");
      setCounterMessage("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send counter offer",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCounter = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(counterAmount);

    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid counter offer amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    counterMutation.mutate({
      counterOfferAmount: amount,
      counterOfferMessage: counterMessage.trim(),
    });
  };

  const statusColor = {
    pending: "bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400",
    accepted: "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400",
    declined: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400",
    countered: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
    withdrawn: "bg-gray-50 text-gray-700 dark:bg-gray-950/30 dark:text-gray-400",
  }[offer.status] || "bg-gray-50 text-gray-700 dark:bg-gray-950/30 dark:text-gray-400";

  const isPending = offer.status === "pending";
  const isProcessing = acceptMutation.isPending || declineMutation.isPending || counterMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="modal-view-offer">
        <DialogHeader>
          <DialogTitle data-testid="text-modal-title">Review Offer</DialogTitle>
          <DialogDescription data-testid="text-listing-title">
            {listingTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Offer Amount</p>
              <p className="text-3xl font-bold" data-testid="text-offer-amount">
                ${offer.offerAmount.toFixed(2)}
              </p>
              {offer.depositAmount > 0 && (
                <p className="text-sm text-muted-foreground mt-1" data-testid="text-deposit-amount">
                  Deposit: ${offer.depositAmount.toFixed(2)}
                </p>
              )}
            </div>
            <Badge className={statusColor} data-testid="badge-status">
              {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
            </Badge>
          </div>

          {offer.message && (
            <div data-testid="section-buyer-message">
              <Label>Message from Buyer</Label>
              <div className="mt-1 p-3 rounded-md bg-muted">
                <p className="text-sm" data-testid="text-buyer-message">{offer.message}</p>
              </div>
            </div>
          )}

          {offer.counterOfferAmount && (
            <div data-testid="section-counter-offer">
              <Label>Your Counter Offer</Label>
              <div className="mt-1 p-3 rounded-md bg-muted">
                <p className="text-lg font-semibold" data-testid="text-counter-amount">
                  ${offer.counterOfferAmount.toFixed(2)}
                </p>
                {offer.counterOfferMessage && (
                  <p className="text-sm text-muted-foreground mt-1" data-testid="text-counter-message">
                    {offer.counterOfferMessage}
                  </p>
                )}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs text-muted-foreground" data-testid="text-offer-time">
              Received {formatDistanceToNow(new Date(offer.createdAt), { addSuffix: true })}
            </p>
          </div>

          <div data-testid="section-buyer-stats">
            <h3 className="text-sm font-semibold mb-3">Buyer Track Record</h3>
            <UserStatsSummary userId={offer.buyerId} role="buyer" />
          </div>

          {mode === "view" && isPending && (
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => declineMutation.mutate()}
                disabled={isProcessing}
                data-testid="button-decline"
                className="flex-1"
              >
                {declineMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {!declineMutation.isPending && <XCircle className="mr-2 h-4 w-4" />}
                Decline
              </Button>
              <Button
                variant="outline"
                onClick={() => setMode("counter")}
                disabled={isProcessing}
                data-testid="button-counter"
                className="flex-1"
              >
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                Counter
              </Button>
              <Button
                onClick={() => acceptMutation.mutate()}
                disabled={isProcessing}
                data-testid="button-accept"
                className="flex-1"
              >
                {acceptMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {!acceptMutation.isPending && <CheckCircle className="mr-2 h-4 w-4" />}
                Accept
              </Button>
            </div>
          )}

          {mode === "counter" && (
            <form onSubmit={handleCounter} className="space-y-4 pt-4 border-t">
              <div>
                <Label htmlFor="counter-amount" data-testid="label-counter-amount">
                  Counter Offer Amount
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl font-semibold">$</span>
                  <Input
                    id="counter-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={counterAmount}
                    onChange={(e) => setCounterAmount(e.target.value)}
                    required
                    data-testid="input-counter-amount"
                    className="text-lg"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="counter-message" data-testid="label-counter-message">
                  Message (Optional)
                </Label>
                <Textarea
                  id="counter-message"
                  placeholder="Explain your counter offer..."
                  value={counterMessage}
                  onChange={(e) => setCounterMessage(e.target.value)}
                  rows={3}
                  maxLength={500}
                  data-testid="input-counter-message"
                  className="mt-1 resize-none"
                />
                <p className="text-sm text-muted-foreground text-right mt-1">
                  {counterMessage.length}/500
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setMode("view");
                    setCounterAmount("");
                    setCounterMessage("");
                  }}
                  disabled={isProcessing}
                  data-testid="button-cancel-counter"
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={isProcessing}
                  data-testid="button-submit-counter"
                  className="flex-1"
                >
                  {counterMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Counter Offer
                </Button>
              </div>
            </form>
          )}

          {!isPending && (
            <div className="flex justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-close"
              >
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
