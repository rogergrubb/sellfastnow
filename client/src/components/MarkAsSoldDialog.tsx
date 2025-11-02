import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Listing } from "@/lib/types";

interface MarkAsSoldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listing: Listing | null;
  onConfirm: (data: {
    buyerEmail: string;
    amount: number;
    paymentMethod: string;
  }) => void;
  isLoading?: boolean;
}

export function MarkAsSoldDialog({
  open,
  onOpenChange,
  listing,
  onConfirm,
  isLoading = false,
}: MarkAsSoldDialogProps) {
  const [buyerEmail, setBuyerEmail] = useState("");
  const [amount, setAmount] = useState(listing?.price?.toString() || "");
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!buyerEmail || !amount) {
      return;
    }

    onConfirm({
      buyerEmail,
      amount: parseFloat(amount),
      paymentMethod,
    });

    // Reset form
    setBuyerEmail("");
    setAmount("");
    setPaymentMethod("cash");
  };

  // Update amount when listing changes
  useState(() => {
    if (listing?.price) {
      setAmount(listing.price.toString());
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Mark as Sold</DialogTitle>
            <DialogDescription>
              Record the sale details for this listing. This will create a transaction record
              and allow you to review the buyer.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Listing Info */}
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="font-medium text-sm">{listing?.title}</p>
              <p className="text-sm text-gray-600">Listed at: ${listing?.price}</p>
            </div>

            {/* Buyer Email */}
            <div className="grid gap-2">
              <Label htmlFor="buyerEmail">
                Buyer Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="buyerEmail"
                type="email"
                placeholder="buyer@example.com"
                value={buyerEmail}
                onChange={(e) => setBuyerEmail(e.target.value)}
                required
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">
                Enter the buyer's email address. They'll be able to review you too.
              </p>
            </div>

            {/* Sale Amount */}
            <div className="grid gap-2">
              <Label htmlFor="amount">
                Sale Amount <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-7"
                  required
                  disabled={isLoading}
                />
              </div>
              <p className="text-xs text-gray-500">
                The actual amount paid (can be different from listing price)
              </p>
            </div>

            {/* Payment Method */}
            <div className="grid gap-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                value={paymentMethod}
                onValueChange={setPaymentMethod}
                disabled={isLoading}
              >
                <SelectTrigger id="paymentMethod">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="venmo">Venmo</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="zelle">Zelle</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !buyerEmail || !amount}>
              {isLoading ? "Marking as Sold..." : "Mark as Sold"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
