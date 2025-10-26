import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Package, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  ArrowLeft,
  MapPin
} from "lucide-react";
import { VerificationBadges } from "@/components/VerificationBadge";
import { MeetupInitiationModal } from "@/components/MeetupInitiationModal";
import { LiveMeetupMap } from "@/components/LiveMeetupMap";
import { ReliabilityBadge } from "@/components/ReliabilityBadge";

interface Transaction {
  id: string;
  buyerId: string;
  sellerId: string;
  listingId: string;
  amount: string;
  platformFee: string;
  sellerPayout: string;
  status: string;
  createdAt: string;
  meetupScheduledAt?: string;
  meetupLocation?: string;
  listing?: {
    title: string;
    images?: string[];
  };
  buyer?: {
    firstName?: string;
    lastName?: string;
    emailVerified?: boolean;
    phoneVerified?: boolean;
    idVerified?: boolean;
    addressVerified?: boolean;
  };
  seller?: {
    firstName?: string;
    lastName?: string;
    emailVerified?: boolean;
    phoneVerified?: boolean;
    idVerified?: boolean;
    addressVerified?: boolean;
  };
}

export default function Transactions() {
  const { user, getToken } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("buying");
  const [meetupModalOpen, setMeetupModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [activeMeetupSession, setActiveMeetupSession] = useState<string | null>(null);

  // Fetch transactions where user is buyer
  const { data: buyingTransactions = [], isLoading: buyingLoading } = useQuery<Transaction[]>({
    queryKey: [`/api/transactions/buyer/${user?.id}`],
    enabled: !!user,
  });

  // Fetch transactions where user is seller
  const { data: sellingTransactions = [], isLoading: sellingLoading } = useQuery<Transaction[]>({
    queryKey: [`/api/transactions/seller/${user?.id}`],
    enabled: !!user,
  });

  const handleConfirmReceipt = async (transactionId: string) => {
    try {
      const token = await getToken();
      const response = await fetch(`/api/transactions/${transactionId}/release`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: user?.id }),
      });

      if (!response.ok) throw new Error("Failed to confirm receipt");

      toast({
        title: "Receipt confirmed!",
        description: "Funds have been released to the seller. You can now leave a review.",
      });

      // Refresh transactions
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to confirm receipt. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "Pending", variant: "outline" },
      payment_captured: { label: "Payment Held", variant: "default" },
      shipped: { label: "Shipped", variant: "secondary" },
      delivered: { label: "Delivered", variant: "secondary" },
      completed: { label: "Completed", variant: "default" },
      disputed: { label: "Disputed", variant: "destructive" },
      refunded: { label: "Refunded", variant: "destructive" },
      cancelled: { label: "Cancelled", variant: "outline" },
    };

    const config = statusConfig[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "payment_captured":
        return <Clock className="h-5 w-5 text-blue-600" />;
      case "disputed":
      case "refunded":
      case "cancelled":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Package className="h-5 w-5 text-gray-600" />;
    }
  };

  const renderTransaction = (transaction: Transaction, isBuyer: boolean) => {
    const otherParty = isBuyer ? transaction.seller : transaction.buyer;
    const otherPartyName = otherParty?.firstName 
      ? `${otherParty.firstName} ${otherParty.lastName || ''}`.trim()
      : isBuyer ? "Seller" : "Buyer";

    return (
      <Card key={transaction.id} className="hover-elevate">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Transaction Image */}
            <div className="w-full sm:w-24 h-24 bg-muted rounded-md overflow-hidden flex-shrink-0">
              {transaction.listing?.images?.[0] ? (
                <img
                  src={transaction.listing.images[0]}
                  alt={transaction.listing.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Transaction Details */}
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <Link href={`/listings/${transaction.listingId}`}>
                    <h3 className="font-semibold text-lg hover:text-primary">
                      {transaction.listing?.title || "Item"}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm text-muted-foreground">
                      {isBuyer ? "Purchased from" : "Sold to"} {otherPartyName}
                    </p>
                    {otherParty && (
                      <>
                        <VerificationBadges
                          user={otherParty}
                          size="sm"
                          showLabels={false}
                        />
                        <ReliabilityBadge 
                          userId={isBuyer ? transaction.sellerId : transaction.buyerId}
                        />
                      </>
                    )}
                  </div>
                </div>
                {getStatusIcon(transaction.status)}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {getStatusBadge(transaction.status)}
                <span className="text-sm text-muted-foreground">
                  {new Date(transaction.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-semibold ml-1">${parseFloat(transaction.amount).toFixed(2)}</span>
                </div>
                {!isBuyer && (
                  <div>
                    <span className="text-muted-foreground">Your Payout:</span>
                    <span className="font-semibold ml-1 text-green-600">
                      ${parseFloat(transaction.sellerPayout).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {transaction.meetupLocation && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Meetup:</span>
                  <span className="ml-1">{transaction.meetupLocation}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                {/* Drop My Pin Button - Show for payment_captured status */}
                {transaction.status === "payment_captured" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                    onClick={() => {
                      setSelectedTransaction(transaction);
                      setMeetupModalOpen(true);
                    }}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Drop My Pin
                  </Button>
                )}
                {isBuyer && transaction.status === "payment_captured" && (
                  <Button
                    size="sm"
                    onClick={() => handleConfirmReceipt(transaction.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm Receipt
                  </Button>
                )}
                {transaction.status === "completed" && (
                  <Link href={`/listings/${transaction.listingId}`}>
                    <Button size="sm" variant="outline">
                      Leave Review
                    </Button>
                  </Link>
                )}
                {transaction.status === "payment_captured" && (
                  <Button size="sm" variant="outline">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Report Issue
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!user) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Card>
          <CardContent className="p-12 text-center">
            <h2 className="text-2xl font-bold mb-4">Sign in Required</h2>
            <p className="text-muted-foreground mb-6">
              Please sign in to view your transactions
            </p>
            <Link href="/">
              <Button>Go to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">My Transactions</h1>
          <p className="text-muted-foreground">
            Manage your purchases and sales with secure escrow protection
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="buying">
            Buying ({buyingTransactions.length})
          </TabsTrigger>
          <TabsTrigger value="selling">
            Selling ({sellingTransactions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="buying" className="space-y-4">
          {buyingLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : buyingTransactions.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No purchases yet</h3>
                <p className="text-muted-foreground mb-6">
                  Browse listings and make your first purchase
                </p>
                <Link href="/">
                  <Button>Browse Listings</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            buyingTransactions.map((transaction) => renderTransaction(transaction, true))
          )}
        </TabsContent>

        <TabsContent value="selling" className="space-y-4">
          {sellingLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : sellingTransactions.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No sales yet</h3>
                <p className="text-muted-foreground mb-6">
                  List items to start selling
                </p>
                <Link href="/post-ad">
                  <Button>Create Listing</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            sellingTransactions.map((transaction) => renderTransaction(transaction, false))
          )}
        </TabsContent>
      </Tabs>

      {/* Meetup Initiation Modal */}
      {selectedTransaction && (
        <MeetupInitiationModal
          isOpen={meetupModalOpen}
          onClose={() => {
            setMeetupModalOpen(false);
            setSelectedTransaction(null);
          }}
          transactionId={selectedTransaction.id}
          listingId={selectedTransaction.listingId}
          onSuccess={(sessionId) => {
            setActiveMeetupSession(sessionId);
            toast({
              title: "Meetup session started!",
              description: "The other party has been notified.",
            });
          }}
        />
      )}

      {/* Live Meetup Map */}
      {activeMeetupSession && user && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl">
            <LiveMeetupMap
              sessionId={activeMeetupSession}
              userId={user.id}
              onClose={() => setActiveMeetupSession(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

