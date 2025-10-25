import { useState } from "react";
import { useMutation } from "@tantml/react-query";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, AlertTriangle, Clock, Shield, MapPin } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface Transaction {
  id: string;
  status: string;
  amount: string;
  depositAmount: string;
  listingId: string;
  sellerId: string;
  buyerId: string;
  depositSubmittedAt: string;
  depositAcceptedAt?: string;
}

interface TransactionControlPanelProps {
  transaction: Transaction;
  listingTitle: string;
  onTransactionComplete?: () => void;
}

export function TransactionControlPanel({
  transaction,
  listingTitle,
  onTransactionComplete,
}: TransactionControlPanelProps) {
  const { toast } = useToast();
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [refundReason, setRefundReason] = useState("");

  // Complete transaction mutation
  const completeTransactionMutation = useMutation({
    mutationFn: async () => {
      // Get user's location if available
      let latitude, longitude;
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
        } catch (error) {
          console.log("Location access denied, continuing without location");
        }
      }

      const response = await fetch(`/api/transactions/${transaction.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ latitude, longitude }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to complete transaction");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Transaction Complete! 🎉",
        description: "Funds have been transferred to the seller. Thank you for your purchase!",
      });
      setIsConfirmDialogOpen(false);
      onTransactionComplete?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Refund transaction mutation
  const refundTransactionMutation = useMutation({
    mutationFn: async () => {
      // Get user's location if available
      let latitude, longitude;
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
        } catch (error) {
          console.log("Location access denied, continuing without location");
        }
      }

      const response = await fetch(`/api/transactions/${transaction.id}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          reason: refundReason || "Item not as described",
          latitude,
          longitude,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to process refund");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Refund Processed",
        description: "Your refund has been processed instantly. Funds will appear in your account within 2-7 business days.",
      });
      setIsRefundDialogOpen(false);
      onTransactionComplete?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = () => {
    switch (transaction.status) {
      case "deposit_submitted":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Awaiting Seller Acceptance</Badge>;
      case "deposit_accepted":
      case "in_escrow":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Deposit Accepted - In Escrow</Badge>;
      case "completed":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Completed</Badge>;
      case "refunded":
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Refunded</Badge>;
      default:
        return <Badge variant="secondary">{transaction.status}</Badge>;
    }
  };

  const canCompleteOrRefund = transaction.status === "deposit_accepted" || transaction.status === "in_escrow";

  return (
    <>
      <Card className="border-2 border-blue-200 bg-blue-50/50">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Transaction Status
              </CardTitle>
              <CardDescription className="mt-1">
                {listingTitle}
              </CardDescription>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Transaction Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Deposit Amount</p>
              <p className="font-semibold text-lg">${parseFloat(transaction.depositAmount || transaction.amount).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-600">Status</p>
              <p className="font-semibold capitalize">{transaction.status.replace(/_/g, " ")}</p>
            </div>
          </div>

          {/* Status-specific messages */}
          {transaction.status === "deposit_submitted" && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Your deposit has been submitted and is awaiting seller acceptance. 
                The seller will be notified and can accept or reject your deposit.
              </AlertDescription>
            </Alert>
          )}

          {canCompleteOrRefund && (
            <>
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-900">
                  <p className="font-medium mb-1">Ready to meet!</p>
                  <p className="text-sm">
                    Your deposit is in secure escrow. When you meet the seller and inspect the item, 
                    you can either complete the transaction or request an instant refund.
                  </p>
                </AlertDescription>
              </Alert>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setIsRefundDialogOpen(true)}
                  className="h-auto py-4 flex-col gap-2 border-2 border-red-200 hover:bg-red-50"
                >
                  <XCircle className="h-6 w-6 text-red-600" />
                  <div className="text-center">
                    <div className="font-semibold">Cancel & Refund</div>
                    <div className="text-xs text-gray-600">Item not as described</div>
                  </div>
                </Button>

                <Button
                  size="lg"
                  onClick={() => setIsConfirmDialogOpen(true)}
                  className="h-auto py-4 flex-col gap-2 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-semibold">Confirm & Complete</div>
                    <div className="text-xs">Item is as described</div>
                  </div>
                </Button>
              </div>
            </>
          )}

          {transaction.status === "completed" && (
            <Alert className="bg-blue-50 border-blue-200">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                Transaction completed successfully! Funds have been transferred to the seller.
              </AlertDescription>
            </Alert>
          )}

          {transaction.status === "refunded" && (
            <Alert className="bg-gray-50 border-gray-200">
              <XCircle className="h-4 w-4 text-gray-600" />
              <AlertDescription className="text-gray-900">
                Refund processed. Funds will appear in your account within 2-7 business days.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Confirm Completion Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Confirm Transaction
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to complete this transaction?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-2">This action will:</p>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>Transfer ${parseFloat(transaction.depositAmount || transaction.amount).toFixed(2)} to the seller</li>
                  <li>Mark the transaction as complete</li>
                  <li>Record your location for safety</li>
                  <li>This action cannot be undone</li>
                </ul>
              </AlertDescription>
            </Alert>

            <p className="text-sm text-gray-600">
              Only confirm if you have received the item and it matches the description.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmDialogOpen(false)}
              disabled={completeTransactionMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => completeTransactionMutation.mutate()}
              disabled={completeTransactionMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {completeTransactionMutation.isPending ? "Processing..." : "Confirm & Complete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={isRefundDialogOpen} onOpenChange={setIsRefundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Cancel & Request Refund
            </DialogTitle>
            <DialogDescription>
              If the item is not as described, you can cancel and get an instant refund.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert className="bg-red-50 border-red-200">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-900">
                <p className="font-medium mb-2">This action will:</p>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>Process an instant refund of ${parseFloat(transaction.depositAmount || transaction.amount).toFixed(2)}</li>
                  <li>Cancel the transaction</li>
                  <li>Funds will appear in your account within 2-7 business days</li>
                  <li>This action cannot be undone</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div>
              <Label htmlFor="refundReason">Reason for cancellation (optional)</Label>
              <Textarea
                id="refundReason"
                placeholder="e.g., Item condition doesn't match description, wrong item, etc."
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRefundDialogOpen(false)}
              disabled={refundTransactionMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => refundTransactionMutation.mutate()}
              disabled={refundTransactionMutation.isPending}
              variant="destructive"
            >
              {refundTransactionMutation.isPending ? "Processing..." : "Confirm Refund"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

