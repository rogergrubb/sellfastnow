import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/AuthContext";
import { CreditCard, Shield, Lock } from "lucide-react";
import type { Listing } from "@shared/schema";

interface CheckoutModalProps {
  listing: Listing;
  seller: any;
  open: boolean;
  onClose: () => void;
}

export default function CheckoutModal({ listing, seller, open, onClose }: CheckoutModalProps) {
  const { toast } = useToast();
  const { user, getToken } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [zipCode, setZipCode] = useState("");

  const price = parseFloat(listing.price);
  const platformFee = price * 0.025; // 2.5% platform fee
  const total = price + platformFee;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to complete your purchase",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const token = await getToken();
      
      // Create transaction
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          buyerId: user.id,
          sellerId: listing.userId,
          listingId: listing.id,
          amount: total.toFixed(2),
          currency: "usd",
          description: `Purchase of ${listing.title}`,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create transaction");
      }

      const transaction = await response.json();

      // Capture payment
      const captureResponse = await fetch(`/api/transactions/${transaction.id}/capture`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!captureResponse.ok) {
        throw new Error("Failed to process payment");
      }

      toast({
        title: "Payment successful!",
        description: "Your payment is being held securely. Contact the seller to arrange pickup.",
      });

      onClose();
      
      // Redirect to transactions page
      window.location.href = "/transactions";
      
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Payment failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Secure Checkout</DialogTitle>
          <DialogDescription>
            Complete your purchase safely with our escrow protection
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h3 className="font-semibold">Order Summary</h3>
            <div className="flex items-start gap-3">
              {listing.images && listing.images[0] && (
                <img 
                  src={listing.images[0]} 
                  alt={listing.title}
                  className="w-16 h-16 object-cover rounded"
                />
              )}
              <div className="flex-1">
                <p className="font-medium">{listing.title}</p>
                <p className="text-sm text-muted-foreground">Sold by {seller?.firstName || "Seller"}</p>
              </div>
            </div>
            <div className="border-t pt-2 space-y-1">
              <div className="flex justify-between text-sm">
                <span>Item Price</span>
                <span>${price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Platform Fee (2.5%)</span>
                <span>${platformFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg border-t pt-2">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Security Features */}
          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div className="flex flex-col items-center gap-1">
              <Shield className="h-5 w-5 text-green-600" />
              <span>Escrow Protection</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Lock className="h-5 w-5 text-blue-600" />
              <span>Secure Payment</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <CreditCard className="h-5 w-5 text-purple-600" />
              <span>Stripe Powered</span>
            </div>
          </div>

          {/* Payment Form */}
          <form onSubmit={handleCheckout} className="space-y-4">
            <div>
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input
                id="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                maxLength={19}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <Label htmlFor="expiry">Expiry</Label>
                <Input
                  id="expiry"
                  placeholder="MM/YY"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  maxLength={5}
                  required
                />
              </div>
              <div className="col-span-1">
                <Label htmlFor="cvc">CVC</Label>
                <Input
                  id="cvc"
                  placeholder="123"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value)}
                  maxLength={4}
                  required
                />
              </div>
              <div className="col-span-1">
                <Label htmlFor="zip">ZIP</Label>
                <Input
                  id="zip"
                  placeholder="12345"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  maxLength={5}
                  required
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-sm">
              <p className="font-semibold text-blue-900 mb-1">How Escrow Works:</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-800">
                <li>Your payment is held securely</li>
                <li>Arrange pickup with the seller</li>
                <li>Confirm receipt to release funds</li>
                <li>Seller gets paid, you leave a review</li>
              </ol>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onClose}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isProcessing}
              >
                {isProcessing ? "Processing..." : `Pay $${total.toFixed(2)}`}
              </Button>
            </div>
          </form>

          <p className="text-xs text-center text-muted-foreground">
            By completing this purchase, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

