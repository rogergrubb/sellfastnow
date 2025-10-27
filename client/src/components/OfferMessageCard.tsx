import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Check, X, ArrowRightLeft, Star } from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LeaveReviewModal } from "@/components/LeaveReviewModal";
import { useAuth } from "@/lib/AuthContext";

interface OfferMessageCardProps {
  messageType: string;
  metadata: {
    offerId: string;
    offerAmount: number | string;
    depositAmount?: number | string;
    status: string;
    originalAmount?: number | string;
    counterAmount?: number | string;
    transactionId?: string;
    amount?: number | string;
    platformFee?: number | string;
    sellerPayout?: number | string;
    buyerId?: string;
    sellerId?: string;
  };
  content: string;
  isOwnMessage: boolean;
  listingId: string;
}

export function OfferMessageCard({
  messageType,
  metadata,
  content,
  isOwnMessage,
  listingId,
}: OfferMessageCardProps) {
  const { user } = useAuth();
  const [showCounterForm, setShowCounterForm] = useState(false);
  const [showAcceptForm, setShowAcceptForm] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [counterAmount, setCounterAmount] = useState("");
  const [counterMessage, setCounterMessage] = useState("");
  const [acceptMessage, setAcceptMessage] = useState("");
  const [rejectMessage, setRejectMessage] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const acceptOfferMutation = useMutation({
    mutationFn: async (message?: string) => {
      return await apiRequest("PATCH", `/api/offers/${metadata.offerId}`, {
        status: "accepted",
        responseMessage: message,
      });
    },
    onSuccess: () => {
      toast({
        title: "Offer accepted",
        description: "The other party will be notified",
      });
      setShowAcceptForm(false);
      setAcceptMessage("");
      queryClient.invalidateQueries({ queryKey: [`/api/messages/listing/${listingId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to accept offer",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectOfferMutation = useMutation({
    mutationFn: async (message?: string) => {
      return await apiRequest("PATCH", `/api/offers/${metadata.offerId}`, {
        status: "rejected",
        responseMessage: message,
      });
    },
    onSuccess: () => {
      toast({
        title: "Offer declined",
        description: "The other party will be notified",
      });
      setShowRejectForm(false);
      setRejectMessage("");
      queryClient.invalidateQueries({ queryKey: [`/api/messages/listing/${listingId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to decline offer",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const counterOfferMutation = useMutation({
    mutationFn: async () => {
      const amount = parseFloat(counterAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Invalid counter offer amount");
      }
      return await apiRequest("PATCH", `/api/offers/${metadata.offerId}`, {
        status: "countered",
        counterOfferAmount: amount,
        counterOfferMessage: counterMessage,
      });
    },
    onSuccess: () => {
      toast({
        title: "Counter offer sent",
        description: "The buyer will be notified",
      });
      setShowCounterForm(false);
      setCounterAmount("");
      setCounterMessage("");
      queryClient.invalidateQueries({ queryKey: [`/api/messages/listing/${listingId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send counter offer",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-green-100 text-green-800 border-green-300";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-300";
      case "countered":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return <Check className="h-4 w-4" />;
      case "rejected":
        return <X className="h-4 w-4" />;
      case "countered":
        return <ArrowRightLeft className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const renderOfferMade = () => {
    const offerAmount = typeof metadata.offerAmount === "string" 
      ? parseFloat(metadata.offerAmount) 
      : metadata.offerAmount;
    const depositAmount = metadata.depositAmount 
      ? (typeof metadata.depositAmount === "string" 
          ? parseFloat(metadata.depositAmount) 
          : metadata.depositAmount)
      : 0;

    return (
      <Card className={`p-4 border-2 ${getStatusColor(metadata.status)}`}>
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-white">
            {getStatusIcon(metadata.status)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-semibold text-sm">
                {isOwnMessage ? "You made an offer" : "Offer received"}
              </h4>
              <span className="text-xs px-2 py-1 rounded-full bg-white capitalize">
                {metadata.status}
              </span>
            </div>
            
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Offer Amount:</span>
                <span className="font-semibold">${offerAmount.toFixed(2)}</span>
              </div>
              {depositAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Deposit:</span>
                  <span className="font-semibold">${depositAmount.toFixed(2)}</span>
                </div>
              )}
            </div>

            {content && (
              <p className="mt-2 text-sm text-muted-foreground italic">
                "{content}"
              </p>
            )}

            {/* Action buttons when offer is pending */}
            {!isOwnMessage && metadata.status === "pending" && !showCounterForm && !showAcceptForm && !showRejectForm && (
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => setShowAcceptForm(true)}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowCounterForm(true)}
                >
                  <ArrowRightLeft className="h-4 w-4 mr-1" />
                  Counter
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setShowRejectForm(true)}
                >
                  <X className="h-4 w-4 mr-1" />
                  Decline
                </Button>
              </div>
            )}

            {/* Accept form */}
            {showAcceptForm && (
              <div className="mt-3 space-y-2 p-3 bg-white rounded-lg">
                <div>
                  <label className="text-xs text-muted-foreground">Message (optional)</label>
                  <Textarea
                    placeholder="Add a message..."
                    value={acceptMessage}
                    onChange={(e) => setAcceptMessage(e.target.value)}
                    className="mt-1"
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => acceptOfferMutation.mutate(acceptMessage)}
                    disabled={acceptOfferMutation.isPending}
                  >
                    Confirm Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowAcceptForm(false);
                      setAcceptMessage("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Reject form */}
            {showRejectForm && (
              <div className="mt-3 space-y-2 p-3 bg-white rounded-lg">
                <div>
                  <label className="text-xs text-muted-foreground">Message (optional)</label>
                  <Textarea
                    placeholder="Add a reason for declining..."
                    value={rejectMessage}
                    onChange={(e) => setRejectMessage(e.target.value)}
                    className="mt-1"
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => rejectOfferMutation.mutate(rejectMessage)}
                    disabled={rejectOfferMutation.isPending}
                  >
                    Confirm Decline
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowRejectForm(false);
                      setRejectMessage("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Counter offer form */}
            {showCounterForm && (
              <div className="mt-3 space-y-2 p-3 bg-white rounded-lg">
                <div>
                  <label className="text-xs text-muted-foreground">Counter Offer Amount</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Enter amount"
                    value={counterAmount}
                    onChange={(e) => setCounterAmount(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Message (optional)</label>
                  <Textarea
                    placeholder="Add a message..."
                    value={counterMessage}
                    onChange={(e) => setCounterMessage(e.target.value)}
                    className="mt-1"
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => counterOfferMutation.mutate()}
                    disabled={counterOfferMutation.isPending}
                  >
                    Send Counter Offer
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowCounterForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  };

  const renderOfferAccepted = () => {
    return (
      <>
        <Card className="p-4 border-2 bg-green-50 border-green-300">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-green-100">
              <Check className="h-4 w-4 text-green-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm text-green-800">
                Offer Accepted! 🎉
              </h4>
              <p className="text-sm text-green-700 mb-3">{content}</p>
              
              {/* Leave Review Button */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowReviewModal(true)}
                className="text-green-700 border-green-300 hover:bg-green-100"
              >
                <Star className="h-4 w-4 mr-1" />
                Leave Review
              </Button>
            </div>
          </div>
        </Card>

        {/* Review Modal */}
        {showReviewModal && user && metadata.buyerId && metadata.sellerId && (
          <LeaveReviewModal
            open={showReviewModal}
            onOpenChange={setShowReviewModal}
            listingId={listingId}
            reviewedUserId={user.id === metadata.buyerId ? metadata.sellerId : metadata.buyerId}
            reviewerRole={user.id === metadata.buyerId ? "buyer" : "seller"}
            currentUserId={user.id}
          />
        )}
      </>
    );
  };

  const renderOfferRejected = () => {
    return (
      <Card className="p-4 border-2 bg-red-50 border-red-300">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-red-100">
            <X className="h-4 w-4 text-red-600" />
          </div>
          <div>
            <h4 className="font-semibold text-sm text-red-800">
              Offer Declined
            </h4>
            <p className="text-sm text-red-700">{content}</p>
          </div>
        </div>
      </Card>
    );
  };

  const renderOfferCountered = () => {
    const counterAmount = metadata.counterAmount 
      ? (typeof metadata.counterAmount === "string" 
          ? parseFloat(metadata.counterAmount) 
          : metadata.counterAmount)
      : 0;

    return (
      <Card className="p-4 border-2 bg-blue-50 border-blue-300">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-blue-100">
            <ArrowRightLeft className="h-4 w-4 text-blue-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-sm text-blue-800 mb-2">
              Counter Offer
            </h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">Original Offer:</span>
                <span className="font-semibold text-blue-800">
                  ${metadata.originalAmount ? parseFloat(metadata.originalAmount as string).toFixed(2) : "0.00"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Counter Offer:</span>
                <span className="font-semibold text-blue-800">
                  ${counterAmount.toFixed(2)}
                </span>
              </div>
            </div>
            {content && (
              <p className="mt-2 text-sm text-blue-700 italic">
                "{content}"
              </p>
            )}

            {/* Action buttons for recipient of counter offer */}
            {!isOwnMessage && metadata.status === "countered" && !showCounterForm && !showAcceptForm && !showRejectForm && (
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => setShowAcceptForm(true)}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowCounterForm(true)}
                >
                  <ArrowRightLeft className="h-4 w-4 mr-1" />
                  Counter Again
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setShowRejectForm(true)}
                >
                  <X className="h-4 w-4 mr-1" />
                  Decline
                </Button>
              </div>
            )}

            {/* Accept form */}
            {showAcceptForm && (
              <div className="mt-3 space-y-2 p-3 bg-white rounded-lg">
                <div>
                  <label className="text-xs text-muted-foreground">Message (optional)</label>
                  <Textarea
                    placeholder="Add a message..."
                    value={acceptMessage}
                    onChange={(e) => setAcceptMessage(e.target.value)}
                    className="mt-1"
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => acceptOfferMutation.mutate(acceptMessage)}
                    disabled={acceptOfferMutation.isPending}
                  >
                    Confirm Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowAcceptForm(false);
                      setAcceptMessage("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Reject form */}
            {showRejectForm && (
              <div className="mt-3 space-y-2 p-3 bg-white rounded-lg">
                <div>
                  <label className="text-xs text-muted-foreground">Message (optional)</label>
                  <Textarea
                    placeholder="Add a reason for declining..."
                    value={rejectMessage}
                    onChange={(e) => setRejectMessage(e.target.value)}
                    className="mt-1"
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => rejectOfferMutation.mutate(rejectMessage)}
                    disabled={rejectOfferMutation.isPending}
                  >
                    Confirm Decline
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowRejectForm(false);
                      setRejectMessage("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Counter form */}
            {showCounterForm && (
              <div className="mt-3 space-y-2 p-3 bg-white rounded-lg">
                <div>
                  <label className="text-xs text-muted-foreground">Counter Offer Amount</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Enter amount"
                    value={counterAmount}
                    onChange={(e) => setCounterAmount(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Message (optional)</label>
                  <Textarea
                    placeholder="Add a message..."
                    value={counterMessage}
                    onChange={(e) => setCounterMessage(e.target.value)}
                    className="mt-1"
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => counterOfferMutation.mutate()}
                    disabled={counterOfferMutation.isPending}
                  >
                    Send Counter Offer
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowCounterForm(false);
                      setCounterAmount("");
                      setCounterMessage("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  };

  const renderPaymentRequired = () => {
    const amount = metadata.amount 
      ? (typeof metadata.amount === "string" 
          ? parseFloat(metadata.amount) 
          : metadata.amount)
      : 0;
    const platformFee = metadata.platformFee
      ? (typeof metadata.platformFee === "string"
          ? parseFloat(metadata.platformFee)
          : metadata.platformFee)
      : 0;

    return (
      <Card className="p-4 border-2 bg-gradient-to-r from-green-50 to-blue-50 border-green-300">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-green-100">
            <DollarSign className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-lg text-green-800 mb-2">
              ✅ Offer Accepted!
            </h4>
            <p className="text-sm text-gray-700 mb-3">
              {content}
            </p>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Item Price:</span>
                <span className="font-semibold">${amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Platform Fee (5¢ per dollar):</span>
                <span className="font-semibold">${platformFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-semibold text-gray-800">Total to Pay:</span>
                <span className="font-bold text-green-700">${amount.toFixed(2)}</span>
              </div>
            </div>

            {/* Proceed to Payment button - only show to buyer */}
            {!isOwnMessage && (
              <div className="space-y-2">
                <Button
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                  size="lg"
                  onClick={() => {
                    // TODO: Implement Stripe payment flow
                    window.location.href = `/payment/${metadata.transactionId}`;
                  }}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Proceed to Payment
                </Button>
                <p className="text-xs text-center text-gray-500">
                  Your payment will be held securely until you confirm receipt of the item
                </p>
              </div>
            )}

            {/* For seller - just show waiting message */}
            {isOwnMessage && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  ⏳ Waiting for buyer to complete payment...
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  };

  // Render based on message type
  switch (messageType) {
    case "offer_made":
      return renderOfferMade();
    case "offer_accepted":
      return renderOfferAccepted();
    case "offer_rejected":
      return renderOfferRejected();
    case "offer_countered":
      return renderOfferCountered();
    case "payment_required":
      return renderPaymentRequired();
    default:
      return null;
  }
}

