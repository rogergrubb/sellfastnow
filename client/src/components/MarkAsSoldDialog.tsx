import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Listing } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";

interface MarkAsSoldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listing: Listing | null;
  onConfirm: (data: {
    buyerId: string;
    amount: number;
    paymentMethod: string;
  }) => void;
  isLoading?: boolean;
}

interface MessagedUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export function MarkAsSoldDialog({
  open,
  onOpenChange,
  listing,
  onConfirm,
  isLoading = false,
}: MarkAsSoldDialogProps) {
  const { user } = useAuth();
  const [buyerId, setBuyerId] = useState("");
  const [amount, setAmount] = useState(listing?.price?.toString() || "");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [manualEmail, setManualEmail] = useState("");
  const [useManualEntry, setUseManualEntry] = useState(false);

  // Fetch users who have messaged about this listing
  const { data: messagedUsers = [], isLoading: loadingUsers } = useQuery<MessagedUser[]>({
    queryKey: ["messaged-users", listing?.id, user?.id],
    queryFn: async () => {
      if (!listing?.id || !user?.id) return [];
      
      const response = await fetch(
        `/api/transactions/listing/${listing.id}/messaged-users?sellerId=${user.id}`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch messaged users");
      }
      
      return response.json();
    },
    enabled: open && !!listing?.id && !!user?.id,
  });

  // Update amount when listing changes
  useEffect(() => {
    if (listing?.price) {
      setAmount(listing.price.toString());
    }
  }, [listing?.price]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setBuyerId("");
      setManualEmail("");
      setUseManualEntry(false);
      setPaymentMethod("cash");
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!buyerId && !manualEmail) || !amount) {
      return;
    }

    onConfirm({
      buyerId: useManualEntry ? manualEmail : buyerId,
      amount: parseFloat(amount),
      paymentMethod,
    });

    // Reset form
    setBuyerId("");
    setManualEmail("");
    setAmount("");
    setPaymentMethod("cash");
    setUseManualEntry(false);
  };

  const hasMessagedUsers = messagedUsers.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
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

            {/* Buyer Selection */}
            <div className="grid gap-2">
              <Label htmlFor="buyer">
                Who bought this item? <span className="text-red-500">*</span>
              </Label>

              {loadingUsers ? (
                <div className="text-sm text-gray-500 py-2">Loading users...</div>
              ) : hasMessagedUsers && !useManualEntry ? (
                <>
                  <Select
                    value={buyerId}
                    onValueChange={setBuyerId}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="buyer">
                      <SelectValue placeholder="Select a buyer" />
                    </SelectTrigger>
                    <SelectContent>
                      {messagedUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.firstName} {user.lastName} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    These users have messaged you about this listing.
                  </p>
                  <Button
                    type="button"
                    variant="link"
                    className="text-xs p-0 h-auto justify-start"
                    onClick={() => setUseManualEntry(true)}
                  >
                    Buyer not listed? Enter email manually
                  </Button>
                </>
              ) : (
                <>
                  <Input
                    id="buyerEmail"
                    type="email"
                    placeholder="buyer@example.com"
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <p className="text-xs text-gray-500">
                    {hasMessagedUsers 
                      ? "Enter the buyer's email address."
                      : "No one has messaged you about this listing yet. Enter the buyer's email address."}
                  </p>
                  {hasMessagedUsers && (
                    <Button
                      type="button"
                      variant="link"
                      className="text-xs p-0 h-auto justify-start"
                      onClick={() => {
                        setUseManualEntry(false);
                        setManualEmail("");
                      }}
                    >
                      ← Back to message list
                    </Button>
                  )}
                </>
              )}
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
            <Button 
              type="submit" 
              disabled={
                isLoading || 
                (!buyerId && !manualEmail) || 
                !amount
              }
            >
              {isLoading ? "Marking as Sold..." : "Mark as Sold"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
