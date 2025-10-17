import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { UserStatsSummary } from "./UserStatsSummary";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface MakeOfferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingId: string;
  sellerId: string;
  askingPrice: number;
  listingTitle: string;
}

export function MakeOfferModal({
  open,
  onOpenChange,
  listingId,
  sellerId,
  askingPrice,
  listingTitle,
}: MakeOfferModalProps) {
  const [offerAmount, setOfferAmount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [message, setMessage] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createOfferMutation = useMutation({
    mutationFn: async (data: { offerAmount: number; depositAmount: number; message: string }) => {
      return await apiRequest("POST", `/api/listings/${listingId}/offers`, data);
    },
    onSuccess: () => {
      toast({
        title: "Offer sent",
        description: "Your offer has been sent to the seller",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/offers/made"] });
      onOpenChange(false);
      setOfferAmount("");
      setDepositAmount("");
      setMessage("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send offer",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const offer = parseFloat(offerAmount);
    const deposit = depositAmount ? parseFloat(depositAmount) : 0;

    if (isNaN(offer) || offer <= 0) {
      toast({
        title: "Invalid offer amount",
        description: "Please enter a valid offer amount",
        variant: "destructive",
      });
      return;
    }

    if (depositAmount && (isNaN(deposit) || deposit < 0)) {
      toast({
        title: "Invalid deposit amount",
        description: "Please enter a valid deposit amount",
        variant: "destructive",
      });
      return;
    }

    if (deposit > offer) {
      toast({
        title: "Invalid deposit amount",
        description: "Deposit cannot exceed offer amount",
        variant: "destructive",
      });
      return;
    }

    createOfferMutation.mutate({
      offerAmount: offer,
      depositAmount: deposit,
      message: message.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="modal-make-offer">
        <DialogHeader>
          <DialogTitle data-testid="text-modal-title">Make an Offer</DialogTitle>
          <DialogDescription data-testid="text-listing-title">
            {listingTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div data-testid="section-seller-stats">
            <h3 className="text-sm font-semibold mb-3">Seller Track Record</h3>
            <UserStatsSummary userId={sellerId} role="seller" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="offer-amount" data-testid="label-offer-amount">
                Offer Amount
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-semibold">$</span>
                <Input
                  id="offer-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value)}
                  required
                  data-testid="input-offer-amount"
                  className="text-lg"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-1" data-testid="text-asking-price">
                Asking price: ${askingPrice.toFixed(2)}
              </p>
            </div>

            <div>
              <Label htmlFor="deposit-amount" data-testid="label-deposit-amount">
                Deposit Amount (Optional)
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-semibold">$</span>
                <Input
                  id="deposit-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  data-testid="input-deposit-amount"
                  className="text-lg"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Optional deposit to show commitment
              </p>
            </div>

            <div>
              <Label htmlFor="offer-message" data-testid="label-message">
                Message to Seller (Optional)
              </Label>
              <Textarea
                id="offer-message"
                placeholder="Add a message to explain your offer..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                maxLength={500}
                data-testid="input-message"
                className="mt-1 resize-none"
              />
              <p className="text-sm text-muted-foreground text-right mt-1">
                {message.length}/500
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createOfferMutation.isPending}
                data-testid="button-cancel"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createOfferMutation.isPending}
                data-testid="button-submit-offer"
                className="flex-1"
              >
                {createOfferMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Send Offer
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
