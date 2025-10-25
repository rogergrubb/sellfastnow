import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, AlertTriangle, DollarSign, Clock, User, Shield } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Transaction {
  id: string;
  status: string;
  amount: string;
  depositAmount: string;
  listingId: string;
  sellerId: string;
  buyerId: string;
  depositSubmittedAt: string;
  buyer?: {
    id: string;
    username: string;
    email: string;
  };
  listing?: {
    id: string;
    title: string;
    price: string;
  };
}

interface DepositAcceptanceCardProps {
  transaction: Transaction;
  onActionComplete?: () => void;
}

export function DepositAcceptanceCard({
  transaction,
  onActionComplete,
}: DepositAcceptanceCardProps) {
  const { toast } = useToast();
  const [isAcceptDialogOpen, setIsAcceptDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // Accept deposit mutation
  const acceptDepositMutation = useMutation({
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

      const response = await fetch(`/api/deposits/${transaction.id}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ latitude, longitude }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to accept deposit");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Deposit Accepted! 🎉",
        description: "The funds are now in escrow. You can proceed with the meetup.",
      });
      setIsAcceptDialogOpen(false);
      onActionComplete?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reject deposit mutation
  const rejectDepositMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/deposits/${transaction.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          reason: rejectionReason || "Seller declined",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to reject deposit");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Deposit Rejected",
        description: "The buyer's authorization has been released.",
      });
      setIsRejectDialogOpen(false);
      onActionComplete?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const depositAmount = parseFloat(transaction.depositAmount || transaction.amount);
  const platformFee = depositAmount * 0.025;
  const sellerReceives = depositAmount * 0.975;

  return (
    <>
      <Card className="border-2 border-orange-200 bg-orange-50/50">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-orange-600" />
                New Deposit Request
              </CardTitle>
              <CardDescription className="mt-1">
                {transaction.listing?.title || "Your listing"}
              </CardDescription>
            </div>
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              <Clock className="h-3 w-3 mr-1" />
              Pending
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Buyer Info */}
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
            <Avatar>
              <AvatarFallback>
                {transaction.buyer?.username?.[0]?.toUpperCase() || "B"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{transaction.buyer?.username || "Buyer"}</p>
              <p className="text-sm text-gray-600">Submitted a deposit request</p>
            </div>
          </div>

          {/* Deposit Details */}
          <div className="space-y-2 p-4 bg-white rounded-lg border">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Deposit Amount:</span>
              <span className="font-semibold">${depositAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Platform Fee (2.5%):</span>
              <span className="text-gray-600">-${platformFee.toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between">
              <span className="font-medium">You'll Receive:</span>
              <span className="font-bold text-green-600">${sellerReceives.toFixed(2)}</span>
            </div>
          </div>

          {/* Info Alert */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <p className="text-sm">
                <strong>What happens next:</strong> If you accept, the buyer's deposit will be captured 
                and held in secure escrow. When you meet and the buyer confirms receipt, funds will be 
                transferred to your account.
              </p>
            </AlertDescription>
          </Alert>

          {/* Timestamp */}
          <p className="text-xs text-gray-500 text-center">
            Submitted {new Date(transaction.depositSubmittedAt).toLocaleString()}
          </p>
        </CardContent>

        <CardFooter className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setIsRejectDialogOpen(true)}
            className="flex-1 border-red-200 hover:bg-red-50"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reject
          </Button>
          <Button
            onClick={() => setIsAcceptDialogOpen(true)}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Accept Deposit
          </Button>
        </CardFooter>
      </Card>

      {/* Accept Dialog */}
      <Dialog open={isAcceptDialogOpen} onOpenChange={setIsAcceptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Accept Deposit
            </DialogTitle>
            <DialogDescription>
              Confirm that you want to accept this deposit and proceed with the transaction.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert className="bg-green-50 border-green-200">
              <Shield className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900">
                <p className="font-medium mb-2">By accepting this deposit:</p>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>The buyer's payment of ${depositAmount.toFixed(2)} will be captured and held in escrow</li>
                  <li>You commit to meeting the buyer to complete the sale</li>
                  <li>You'll receive ${sellerReceives.toFixed(2)} after the buyer confirms receipt</li>
                  <li>Funds typically arrive in your account within 2-7 business days</li>
                </ul>
              </AlertDescription>
            </Alert>

            <p className="text-sm text-gray-600">
              Make sure you're ready to proceed with this sale before accepting.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAcceptDialogOpen(false)}
              disabled={acceptDepositMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => acceptDepositMutation.mutate()}
              disabled={acceptDepositMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {acceptDepositMutation.isPending ? "Processing..." : "Accept Deposit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Reject Deposit
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this deposit request?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert className="bg-red-50 border-red-200">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-900">
                <p className="font-medium mb-2">This action will:</p>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>Release the buyer's payment authorization</li>
                  <li>Notify the buyer that you declined their deposit</li>
                  <li>The buyer can submit a new deposit if they wish</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div>
              <Label htmlFor="rejectionReason">Reason for rejection (optional)</Label>
              <Textarea
                id="rejectionReason"
                placeholder="e.g., Item no longer available, price changed, etc."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="mt-1"
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                This reason will be shared with the buyer
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRejectDialogOpen(false)}
              disabled={rejectDepositMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => rejectDepositMutation.mutate()}
              disabled={rejectDepositMutation.isPending}
              variant="destructive"
            >
              {rejectDepositMutation.isPending ? "Processing..." : "Reject Deposit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

