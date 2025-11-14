import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Loader2, QrCode as QrCodeIcon, Copy, ExternalLink, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function Payment() {
  const { transactionId } = useParams<{ transactionId: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [paymentData, setPaymentData] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [linkCopied, setLinkCopied] = useState(false);

  // Create payment intent and get QR code
  const createPaymentMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/payments/transactions/${transactionId}/payment-intent`);
    },
    onSuccess: (data) => {
      setPaymentData(data);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Confirm payment after inspection
  const confirmPaymentMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/payments/transactions/${transactionId}/confirm-payment`);
    },
    onSuccess: () => {
      toast({
        title: "Payment Confirmed!",
        description: "The seller has been paid. Thank you!",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/transactions/${transactionId}`] });
      navigate("/messages");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Cancel payment if item is rejected
  const cancelPaymentMutation = useMutation({
    mutationFn: async (reason: string) => {
      return await apiRequest("POST", `/api/payments/transactions/${transactionId}/cancel-payment`, { reason });
    },
    onSuccess: () => {
      toast({
        title: "Payment Cancelled",
        description: "Your payment has been refunded.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/transactions/${transactionId}`] });
      navigate("/messages");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create payment intent on mount
  useEffect(() => {
    if (transactionId && !paymentData) {
      createPaymentMutation.mutate();
    }
  }, [transactionId]);

  // Update countdown timer
  useEffect(() => {
    if (!paymentData?.expiresAt) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = new Date(paymentData.expiresAt).getTime();
      const distance = expiry - now;

      if (distance < 0) {
        setTimeRemaining("Expired");
        return;
      }

      const hours = Math.floor(distance / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      setTimeRemaining(`${hours}h ${minutes}m remaining`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [paymentData]);

  // Copy link to clipboard
  const copyLink = () => {
    if (paymentData?.paymentUrl) {
      navigator.clipboard.writeText(paymentData.paymentUrl);
      setLinkCopied(true);
      toast({ title: "Link copied!", description: "Payment link copied to clipboard" });
      setTimeout(() => setLinkCopied(false), 3000);
    }
  };

  if (createPaymentMutation.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Creating payment...</p>
        </div>
      </div>
    );
  }

  if (!paymentData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <p className="text-center text-gray-600">Failed to load payment details</p>
          <Button onClick={() => navigate("/messages")} className="w-full mt-4">
            Back to Messages
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* QR Code Card */}
        <Card className="p-8 mb-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <QrCodeIcon className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Show QR Code to Seller</h1>
            <p className="text-gray-600 mb-2">
              The seller will scan this code to receive payment
            </p>
            {timeRemaining && (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6">
                <Clock className="h-4 w-4" />
                <span>{timeRemaining}</span>
              </div>
            )}

            {/* QR Code */}
            <div className="bg-white p-6 rounded-lg inline-block mb-4 border-4 border-gray-200">
              <img 
                src={paymentData.qrCode} 
                alt="Payment QR Code" 
                className="w-80 h-80"
              />
            </div>

            {/* Fallback Options */}
            <div className="flex gap-2 justify-center mb-6">
              <Button
                onClick={copyLink}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                {linkCopied ? (
                  <><Check className="h-3 w-3 mr-1" /> Copied!</>
                ) : (
                  <><Copy className="h-3 w-3 mr-1" /> Copy Link</>
                )}
              </Button>
              <Button
                onClick={() => window.open(paymentData.paymentUrl, '_blank')}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <ExternalLink className="h-3 w-3 mr-1" /> Open Link
              </Button>
            </div>

            {/* Payment Details */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Item Price:</span>
                <span className="font-semibold">${paymentData.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Platform Fee (5¢ per dollar):</span>
                <span className="font-semibold text-orange-600">-${paymentData.platformFee.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-semibold">Seller Receives:</span>
                <span className="font-bold text-green-600">${paymentData.sellerPayout.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              <p className="font-semibold mb-1">💡 How it works:</p>
              <ol className="text-left space-y-1 ml-4 list-decimal">
                <li>Seller scans this QR code with their phone</li>
                <li>Payment is held securely in escrow</li>
                <li>You inspect the item at the meetup</li>
                <li>If satisfied, confirm below to release payment</li>
                <li>If not satisfied, cancel to get refund</li>
              </ol>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">After Inspecting the Item:</h3>
          <div className="space-y-3">
            <Button
              onClick={() => confirmPaymentMutation.mutate()}
              disabled={confirmPaymentMutation.isPending}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              {confirmPaymentMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5 mr-2" />
                  Accept Item & Release Payment
                </>
              )}
            </Button>

            <Button
              onClick={() => cancelPaymentMutation.mutate("Item not as described")}
              disabled={cancelPaymentMutation.isPending}
              variant="outline"
              className="w-full border-red-300 text-red-600 hover:bg-red-50"
              size="lg"
            >
              {cancelPaymentMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <X className="h-5 w-5 mr-2" />
                  Reject Item & Get Refund
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-gray-500 mt-4 text-center">
            Payment is held securely until you confirm. You're protected by our buyer guarantee.
          </p>
        </Card>
      </div>
    </div>
  );
}

