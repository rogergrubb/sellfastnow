import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, QrCode, DollarSign, Send, Camera, AlertCircle, CheckCircle2 } from "lucide-react";

interface BuyerPaymentInterfaceProps {
  listingId: string;
  listingTitle: string;
  originalPrice: number;
  sellerId: string;
  sellerName: string;
}

export default function BuyerPaymentInterface({
  listingId,
  listingTitle,
  originalPrice,
  sellerId,
  sellerName,
}: BuyerPaymentInterfaceProps) {
  const [offerAmount, setOfferAmount] = useState(originalPrice.toString());
  const [offerSent, setOfferSent] = useState(false);

  // Send offer mutation
  const sendOffer = useMutation({
    mutationFn: async (amount: number) => {
      const response = await fetch("/api/payment-sessions/buyer-initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ listingId, amount }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send offer");
      }

      return response.json();
    },
    onSuccess: () => {
      setOfferSent(true);
    },
  });

  const handleSendOffer = () => {
    const amount = parseFloat(offerAmount);
    
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    if (amount > originalPrice * 2) {
      alert("Offer cannot be more than 2x the listed price");
      return;
    }

    sendOffer.mutate(amount);
  };

  const handleOpenCamera = () => {
    // In a real implementation, this would open the device camera
    // For now, we'll show an alert
    alert("Camera feature coming soon! For now, ask the seller to show you their QR code.");
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>💳 Payment Options</CardTitle>
          <CardDescription>
            {listingTitle} - ${originalPrice.toFixed(2)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="stripe" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="stripe">⚡ Stripe</TabsTrigger>
              <TabsTrigger value="cash">💵 Cash</TabsTrigger>
              <TabsTrigger value="other">📱 Other Apps</TabsTrigger>
            </TabsList>

            {/* Stripe Payment Tab */}
            <TabsContent value="stripe" className="space-y-4">
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">⚡ Streamlined Stripe Payment</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Quick & easy QR code checkout with escrow protection
                  </p>
                  
                  <div className="space-y-3">
                    {/* Scan QR Option */}
                    <div className="bg-white p-4 rounded-lg border-2 border-blue-200">
                      <div className="flex items-start gap-3">
                        <QrCode className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                        <div className="flex-1">
                          <h5 className="font-semibold text-sm mb-1">
                            📱 Scan Seller's QR Code
                          </h5>
                          <p className="text-xs text-gray-600 mb-3">
                            Ask the seller to show you their payment QR code
                          </p>
                          <Button
                            onClick={handleOpenCamera}
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            <Camera className="mr-2 h-4 w-4" />
                            Open Camera to Scan
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-blue-50 px-2 text-gray-500">OR</span>
                      </div>
                    </div>

                    {/* Send Offer Option */}
                    {!offerSent ? (
                      <div className="bg-white p-4 rounded-lg border-2 border-blue-200">
                        <div className="flex items-start gap-3">
                          <Send className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                          <div className="flex-1 space-y-3">
                            <div>
                              <h5 className="font-semibold text-sm mb-1">
                                💰 Send Payment Offer
                              </h5>
                              <p className="text-xs text-gray-600">
                                Enter the price you both agreed on
                              </p>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="offerAmount" className="text-xs">
                                Agreed Price
                              </Label>
                              <div className="flex gap-2">
                                <div className="relative flex-1">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                    $
                                  </span>
                                  <Input
                                    id="offerAmount"
                                    type="number"
                                    step="0.01"
                                    min="1"
                                    value={offerAmount}
                                    onChange={(e) => setOfferAmount(e.target.value)}
                                    className="pl-7"
                                    placeholder="Enter amount"
                                  />
                                </div>
                              </div>
                            </div>

                            <Button
                              onClick={handleSendOffer}
                              disabled={sendOffer.isPending}
                              className="w-full"
                              size="sm"
                            >
                              {sendOffer.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Sending...
                                </>
                              ) : (
                                <>
                                  <Send className="mr-2 h-4 w-4" />
                                  Send Offer to Seller
                                </>
                              )}
                            </Button>

                            {sendOffer.isError && (
                              <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription className="text-xs">
                                  {sendOffer.error instanceof Error
                                    ? sendOffer.error.message
                                    : "Failed to send offer"}
                                </AlertDescription>
                              </Alert>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                          <div>
                            <h5 className="font-semibold text-sm text-green-900 mb-1">
                              Offer Sent!
                            </h5>
                            <p className="text-xs text-green-700">
                              Waiting for {sellerName} to accept your ${offerAmount} offer.
                              You'll be notified when they respond.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Benefits */}
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs font-semibold text-gray-700 mb-2">
                      ✅ Benefits:
                    </p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li>• 🛡️ Escrow protection - funds held safely</li>
                      <li>• 💳 All major cards accepted</li>
                      <li>• 📱 No app download needed</li>
                      <li>• ✅ Automatic receipt</li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Cash Payment Tab */}
            <TabsContent value="cash" className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">💵 Cash Payment</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Pay with cash when you meet in person
                </p>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Meet in a safe, public place</li>
                  <li>• Inspect item before paying</li>
                  <li>• Bring exact change if possible</li>
                  <li>• Get a receipt if needed</li>
                </ul>
              </div>
            </TabsContent>

            {/* Other Apps Tab */}
            <TabsContent value="other" className="space-y-4">
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">📱 Other Payment Apps</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Use Venmo, Zelle, PayPal, Cash App, etc.
                </p>
                <p className="text-sm text-gray-600 mb-3">
                  Arrange payment details directly with {sellerName}
                </p>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Note: Payments outside Stripe are not covered by our escrow protection.
                    Please be cautious and meet in safe locations.
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

