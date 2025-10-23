import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, QrCode, DollarSign, CheckCircle2, AlertCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface SellerMeetupInterfaceProps {
  listingId: string;
  listingTitle: string;
  originalPrice: number;
}

export default function SellerMeetupInterface({
  listingId,
  listingTitle,
  originalPrice,
}: SellerMeetupInterfaceProps) {
  const [negotiatedPrice, setNegotiatedPrice] = useState(originalPrice.toString());
  const [paymentSession, setPaymentSession] = useState<any>(null);

  // Create payment session mutation
  const createSession = useMutation({
    mutationFn: async (amount: number) => {
      const response = await fetch("/api/payment-sessions/seller-initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ listingId, amount }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create payment session");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setPaymentSession(data);
    },
  });

  const handleGenerateQR = () => {
    const amount = parseFloat(negotiatedPrice);
    
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    if (amount > originalPrice * 2) {
      alert("Price cannot be more than 2x the listed price");
      return;
    }

    createSession.mutate(amount);
  };

  const handleCopyLink = () => {
    if (paymentSession?.paymentUrl) {
      navigator.clipboard.writeText(paymentSession.paymentUrl);
      alert("Payment link copied to clipboard!");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Meeting for: {listingTitle}
          </CardTitle>
          <CardDescription>
            Generate a payment QR code after negotiating the final price
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Price Adjustment Section */}
          {!paymentSession && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                <h4 className="font-semibold text-sm">💰 Price Adjustment</h4>
                
                <div className="space-y-2">
                  <Label>Listed Price</Label>
                  <div className="text-2xl font-bold text-gray-900">
                    ${originalPrice.toFixed(2)}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="negotiatedPrice">Negotiated Price</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        $
                      </span>
                      <Input
                        id="negotiatedPrice"
                        type="number"
                        step="0.01"
                        min="1"
                        value={negotiatedPrice}
                        onChange={(e) => setNegotiatedPrice(e.target.value)}
                        className="pl-7"
                        placeholder="Enter agreed amount"
                      />
                    </div>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>💡 Tips:</strong>
                    <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                      <li>Inspect the item together first</li>
                      <li>Agree on final price verbally</li>
                      <li>Enter agreed amount above</li>
                      <li>Generate QR code for buyer to scan</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>

              <Button
                onClick={handleGenerateQR}
                disabled={createSession.isPending}
                className="w-full"
                size="lg"
              >
                {createSession.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <QrCode className="mr-2 h-4 w-4" />
                    Generate Payment QR Code
                  </>
                )}
              </Button>

              {createSession.isError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {createSession.error instanceof Error
                      ? createSession.error.message
                      : "Failed to create payment session"}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* QR Code Display Section */}
          {paymentSession && (
            <div className="space-y-4">
              <div className="bg-green-50 p-6 rounded-lg text-center space-y-4">
                <div className="flex items-center justify-center gap-2 text-green-700">
                  <CheckCircle2 className="h-5 w-5" />
                  <h4 className="font-semibold">⚡ Ready for Payment</h4>
                </div>

                <div className="text-3xl font-bold text-gray-900">
                  ${paymentSession.amount.toFixed(2)}
                </div>

                {paymentSession.amount !== originalPrice && (
                  <div className="text-sm text-gray-600">
                    Original: ${originalPrice.toFixed(2)}
                  </div>
                )}

                {/* QR Code */}
                <div className="bg-white p-6 rounded-lg inline-block">
                  <QRCodeSVG
                    value={paymentSession.paymentUrl}
                    size={256}
                    level="H"
                    includeMargin
                  />
                </div>

                {/* Instructions */}
                <div className="bg-white p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="text-4xl">💬</div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">
                        "Just have the buyer scan this code for instant payment!"
                      </p>
                      <ul className="mt-2 text-sm text-gray-600 space-y-1">
                        <li>• Buyer scans QR code with phone camera</li>
                        <li>• Buyer enters card details securely</li>
                        <li>• Payment held in escrow protection</li>
                        <li>• You get paid after confirming delivery</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    className="flex-1"
                  >
                    Copy Payment Link
                  </Button>
                  <Button
                    onClick={() => setPaymentSession(null)}
                    variant="outline"
                    className="flex-1"
                  >
                    Generate New QR
                  </Button>
                </div>

                <div className="text-xs text-gray-500">
                  QR code expires in 24 hours
                </div>
              </div>
            </div>
          )}

          {/* Alternative Payment Options */}
          <div className="border-t pt-4">
            <h4 className="font-semibold text-sm mb-3">OR</h4>
            <Button variant="outline" className="w-full">
              💵 Mark as Paid Outside Stripe
            </Button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              If buyer paid with cash or other payment app
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

