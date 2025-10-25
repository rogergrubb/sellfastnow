import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Helmet } from "react-helmet-async";
import ImageGallery from "@/components/ImageGallery";
import ListingCard from "@/components/ListingCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { LeaveReviewModal } from "@/components/LeaveReviewModal";
import { CancellationCommentModal } from "@/components/CancellationCommentModal";
import { CancelTransactionModal } from "@/components/CancelTransactionModal";
import { MakeOfferModal } from "@/components/MakeOfferModal";
import { MessageModal } from "@/components/MessageModal";
import { ContactInfoDisplay } from "@/components/ContactInfoDisplay";
import CheckoutModal from "@/components/CheckoutModal";
import { VerificationBadges } from "@/components/VerificationBadge";
import { MeetingPreferencesDisplay } from "@/components/SafetyPrompt";
import { DepositSubmissionModal } from "@/components/DepositSubmissionModal";
import { TransactionControlPanel } from "@/components/TransactionControlPanel";
import {
  MapPin,
  Heart,
  Share2,
  MessageCircle,
  Tag,
  AlertTriangle,
  DollarSign,
  Clock,
  Star,
  XCircle,
} from "lucide-react";
import type { Listing, User } from "@shared/schema";

interface ListingWithSeller {
  listing: Listing;
  seller: User;
}

export default function ListingDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isCancellationModalOpen, setIsCancellationModalOpen] = useState(false);
  const [isCancelTransactionModalOpen, setIsCancelTransactionModalOpen] = useState(false);
  const [isMakeOfferModalOpen, setIsMakeOfferModalOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

  // Fetch current user
  const { data: currentUser } = useQuery<User>({
    queryKey: ['/api/auth/user'],
    retry: false,
  });

  // Fetch listing with seller info
  const { data, isLoading } = useQuery<ListingWithSeller>({
    queryKey: [`/api/listings/${id}`],
    enabled: !!id,
  });

  // Fetch transaction details to check eligibility
  const { data: transactionDetails } = useQuery<any>({
    queryKey: [`/api/transactions/${id}/details`],
    enabled: !!id && !!currentUser,
  });

  // Fetch similar listings
  const { data: similarListings = [] } = useQuery<Listing[]>({
    queryKey: [`/api/listings/similar/${id}`],
    enabled: !!id,
  });

  // Check if favorited
  const { data: favoriteData } = useQuery<{ isFavorited: boolean }>({
    queryKey: [`/api/favorites/${id}`],
    enabled: !!id,
  });

  // Fetch seller statistics for rating display
  const { data: sellerStats } = useQuery<any>({
    queryKey: [`/api/statistics/user/${data?.seller?.id}`],
    enabled: !!data?.seller?.id,
  });

  useEffect(() => {
    if (favoriteData) {
      setIsFavorited(favoriteData.isFavorited);
    }
  }, [favoriteData]);

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/favorites/toggle`, {
        method: "POST",
        body: JSON.stringify({ listingId: id }),
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to toggle favorite");
      return response.json() as Promise<{ isFavorited: boolean }>;
    },
    onSuccess: (data: { isFavorited: boolean }) => {
      setIsFavorited(data.isFavorited);
      queryClient.invalidateQueries({ queryKey: [`/api/favorites/${id}`] });
      toast({
        title: data.isFavorited ? "Added to favorites" : "Removed from favorites",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "You must be logged in to save listings",
        variant: "destructive",
      });
    },
  });

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied to clipboard!" });
    } catch (error) {
      toast({
        title: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  const handleMessageSeller = () => {
    if (!currentUser) {
      toast({
        title: "Sign in required",
        description: "Please sign in to message the seller.",
        variant: "destructive",
      });
      return;
    }

    if (currentUser.id === seller?.id) {
      toast({
        title: "Cannot message yourself",
        description: "This is your own listing.",
        variant: "destructive",
      });
      return;
    }

    const contactPreference = seller?.contactPreference || 'in_app';
    const contactEmail = seller?.contactEmail || seller?.email;

    if (contactPreference === 'email') {
      // Open email client
      const subject = encodeURIComponent(`Inquiry about: ${listing?.title}`);
      const body = encodeURIComponent(`Hi,\n\nI'm interested in your listing "${listing?.title}".\n\nPlease let me know if it's still available.\n\nThanks!`);
      window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
    } else if (contactPreference === 'both') {
      // Show option to choose
      const choice = confirm(`Contact seller via:\n\nOK = In-app messaging\nCancel = Email (${contactEmail})`);
      if (choice) {
        setIsMessageModalOpen(true);
      } else {
        const subject = encodeURIComponent(`Inquiry about: ${listing?.title}`);
        const body = encodeURIComponent(`Hi,\n\nI'm interested in your listing "${listing?.title}".\n\nPlease let me know if it's still available.\n\nThanks!`);
        window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
      }
    } else {
      // Default to in-app messaging
      setIsMessageModalOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-2">Listing not found</h1>
        <Link href="/">
          <Button>Back to Home</Button>
        </Link>
      </div>
    );
  }

  const { listing, seller } = data;
  
  const getConditionColor = (condition: string) => {
    const colors: Record<string, string> = {
      new: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      "like-new": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      good: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      fair: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      poor: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    };
    return colors[condition] || colors.good;
  };

  const getTimeAgo = (date: Date | string | null) => {
    if (!date) return 'N/A';
    const now = new Date();
    const created = new Date(date);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const getSellerName = (seller: User) => {
    if (seller.firstName && seller.lastName) {
      return `${seller.firstName} ${seller.lastName}`;
    }
    if (seller.firstName) return seller.firstName;
    if (seller.email) return seller.email.split('@')[0];
    return 'Anonymous';
  };

  const shouldTruncate = listing.description.length > 300;
  const displayDescription = isDescriptionExpanded || !shouldTruncate
    ? listing.description
    : listing.description.slice(0, 300) + '...';

  // Prepare Open Graph data
  const ogTitle = listing.title;
  const ogDescription = listing.description.slice(0, 160) + (listing.description.length > 160 ? '...' : '');
  const ogImage = listing.images && listing.images.length > 0 ? listing.images[0] : '';
  const ogUrl = window.location.href;
  const ogPrice = listing.price ? `$${listing.price}` : 'Contact for price';

  return (
    <>
      <Helmet>
        {/* Primary Meta Tags */}
        <title>{listing.title} - SellFast.Now</title>
        <meta name="description" content={ogDescription} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="product" />
        <meta property="og:url" content={ogUrl} />
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDescription} />
        {ogImage && <meta property="og:image" content={ogImage} />}
        <meta property="og:site_name" content="SellFast.Now" />
        <meta property="product:price:amount" content={listing.price?.toString() || '0'} />
        <meta property="product:price:currency" content="USD" />
        <meta property="product:condition" content={listing.condition || 'used'} />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={ogUrl} />
        <meta property="twitter:title" content={ogTitle} />
        <meta property="twitter:description" content={ogDescription} />
        {ogImage && <meta property="twitter:image" content={ogImage} />}
        
        {/* Additional Meta Tags */}
        <meta name="author" content={getSellerName(seller)} />
        <meta name="keywords" content={`${listing.category}, ${listing.condition}, buy ${listing.title}, sell ${listing.title}`} />
      </Helmet>
      
      <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT SECTION - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <ImageGallery images={listing.images} title={listing.title} />

            {/* Listing Details Card */}
            <Card className="p-6">
              <h1 className="text-3xl font-bold mb-4" data-testid="text-listing-title">
                {listing.title}
              </h1>

              <div className="flex items-center gap-2 mb-4">
                <span className="text-4xl font-bold text-green-600 dark:text-green-500" data-testid="text-listing-price">
                  ${parseFloat(listing.price).toFixed(2)}
                </span>
                <Badge className={getConditionColor(listing.condition)} data-testid="badge-listing-condition">
                  {listing.condition}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2" data-testid="text-listing-posted">
                  <Clock className="h-4 w-4" />
                  <span>Posted {getTimeAgo(listing.createdAt)}</span>
                </div>
                
                <div className="flex items-center gap-2" data-testid="text-listing-location">
                  <MapPin className="h-4 w-4" />
                  <span>{listing.location}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  <Link href={`/?category=${listing.category}`}>
                    <Button variant="ghost" className="h-auto p-0 text-sm" data-testid="link-listing-category">
                      {listing.category.charAt(0).toUpperCase() + listing.category.slice(1)}
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>

            {/* Description Card */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Description</h2>
              <p className="text-muted-foreground whitespace-pre-line" data-testid="text-listing-description">
                {displayDescription}
              </p>
              {shouldTruncate && (
                <Button
                  variant="ghost"
                  className="mt-2 p-0 h-auto"
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  data-testid="button-description-toggle"
                >
                  {isDescriptionExpanded ? 'Show less' : 'Read more'}
                </Button>
              )}
            </Card>

            {/* Similar Listings */}
            {similarListings.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">You Might Also Like</h2>
                <div className="flex gap-6 overflow-x-auto pb-4">
                  {similarListings.map((similarListing) => (
                    <div key={similarListing.id} className="flex-shrink-0 w-64">
                      <ListingCard
                        id={similarListing.id}
                        image={similarListing.images[0]}
                        title={similarListing.title}
                        price={parseFloat(similarListing.price)}
                        location={similarListing.location}
                        timePosted={getTimeAgo(similarListing.createdAt)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="lg:col-span-1 space-y-6">
            {/* Seller Info Card */}
            <Card className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                    {getSellerName(seller).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg" data-testid="text-seller-name">
                    {getSellerName(seller)}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Member since {formatDate(seller.createdAt)}
                  </p>
                </div>
              </div>

              <VerificationBadges user={seller} size="sm" className="mb-3" />

              <div className="space-y-2 text-sm text-muted-foreground mb-4">
                {sellerStats && sellerStats.averageRating > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= sellerStats.averageRating
                              ? "fill-primary text-primary"
                              : "fill-muted text-muted"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-medium">{sellerStats.averageRating.toFixed(1)}</span>
                    <span>({sellerStats.totalReviewsReceived || 0} reviews)</span>
                  </div>
                )}
                {sellerStats?.responseRate && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {sellerStats.responseRate}% response rate
                    </Badge>
                  </div>
                )}
                {sellerStats?.totalListingsSold > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {sellerStats.totalListingsSold} items sold
                    </Badge>
                  </div>
                )}
              </div>

              <Link href={`/users/${seller.id}`}>
                <Button variant="outline" className="w-full" data-testid="button-view-profile">
                  View Profile
                </Button>
              </Link>
            </Card>

            {/* Contact Information Card */}
            {currentUser && currentUser.id !== seller.id && (
              <Card className="p-6">
                <ContactInfoDisplay
                  seller={seller}
                  currentUser={currentUser}
                  transactionStatus={{
                    hasOffer: transactionDetails?.hasOffer || false,
                    offerAccepted: transactionDetails?.offerAccepted || false,
                  }}
                  listingId={listing.id}
                />
              </Card>
            )}

            {/* Meeting Preferences Card */}
            <MeetingPreferencesDisplay seller={seller} />

            {/* Review/Transaction Actions Card */}
            {currentUser && (
              <Card className="p-6">
                <h3 className="font-semibold mb-3">Transaction Actions</h3>
                <div className="space-y-2">
                  {transactionDetails?.canCancelTransaction && (
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => setIsCancelTransactionModalOpen(true)}
                      data-testid="button-cancel-transaction"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel Transaction
                    </Button>
                  )}

                  {transactionDetails?.eligibleForReview ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setIsReviewModalOpen(true)}
                      data-testid="button-leave-review"
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Leave a Review
                    </Button>
                  ) : (
                    <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                      Complete a transaction to leave a review
                    </div>
                  )}
                  
                  {transactionDetails?.eligibleForCancellationReport ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setIsCancellationModalOpen(true)}
                      data-testid="button-report-cancellation"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Report Cancellation
                    </Button>
                  ) : transactionDetails && !transactionDetails.eligibleForReview && (
                    <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                      Only available for cancelled transactions
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Action Buttons - Desktop */}
            <Card className="p-6 hidden lg:block" data-testid="card-desktop-actions">
              <div className="space-y-3">
                {currentUser && data?.listing.userId !== currentUser.id && data?.listing.status === 'active' && (
                  <Button 
                    className="w-full" 
                    size="lg" 
                    onClick={() => setIsCheckoutModalOpen(true)}
                    data-testid="button-buy-now"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Buy Now - ${parseFloat(data.listing.price).toFixed(2)}
                  </Button>
                )}
                
                <Button 
                  className="w-full" 
                  size="lg" 
                  variant={currentUser && data?.listing.userId !== currentUser.id && data?.listing.status === 'active' ? 'outline' : 'default'}
                  onClick={handleMessageSeller}
                  data-testid="button-message-seller"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Message Seller
                </Button>
                
                {currentUser && data?.listing.userId !== currentUser.id && (
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    size="lg" 
                    onClick={() => setIsMakeOfferModalOpen(true)}
                    data-testid="button-make-offer"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Make Offer
                  </Button>
                )}
                
                {currentUser && data?.listing.userId !== currentUser.id && data?.listing.status === 'active' && (
                  <Button 
                    variant="default" 
                    className="w-full bg-green-600 hover:bg-green-700" 
                    size="lg" 
                    onClick={() => setIsDepositModalOpen(true)}
                    data-testid="button-submit-deposit"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Submit Deposit
                  </Button>
                )}

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => toggleFavoriteMutation.mutate()}
                  disabled={toggleFavoriteMutation.isPending}
                  data-testid="button-save-listing"
                >
                  <Heart className={`h-4 w-4 mr-2 ${isFavorited ? 'fill-current text-red-500' : ''}`} />
                  {isFavorited ? 'Saved' : 'Save'}
                </Button>

                <Button variant="outline" className="w-full" onClick={handleShare} data-testid="button-share-listing">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </Card>

            {/* Safety Tips Card */}
            <Card className="p-6 bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <h3 className="font-semibold text-orange-900 dark:text-orange-100">Safety Tips</h3>
              </div>
              <ul className="space-y-2 text-sm text-orange-800 dark:text-orange-200">
                <li className="flex gap-2">
                  <span className="flex-shrink-0">•</span>
                  <span>Meet in public places</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0">•</span>
                  <span>Inspect item before payment</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0">•</span>
                  <span>Use secure payment methods</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0">•</span>
                  <span>Trust your instincts</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile Action Buttons - Sticky Bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t lg:hidden shadow-lg" data-testid="card-mobile-actions">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => toggleFavoriteMutation.mutate()}
            disabled={toggleFavoriteMutation.isPending}
            data-testid="button-mobile-save"
          >
            <Heart className={`h-5 w-5 ${isFavorited ? 'fill-current text-red-500' : ''}`} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleShare}
            data-testid="button-mobile-share"
          >
            <Share2 className="h-5 w-5" />
          </Button>
          {currentUser && data?.listing.userId !== currentUser.id && (
            <Button 
              variant="outline" 
              className="flex-1" 
              size="lg"
              onClick={() => setIsMakeOfferModalOpen(true)}
              data-testid="button-mobile-make-offer"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Make Offer
            </Button>
          )}
          <Button 
            className="flex-1" 
            size="lg" 
            onClick={handleMessageSeller}
            data-testid="button-mobile-message"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Message
          </Button>
        </div>
      </div>
      
      {/* Spacer for mobile sticky buttons */}
      <div className="h-20 lg:hidden"></div>

      {/* Modals */}
      {currentUser && (
        <>
          <LeaveReviewModal
            open={isReviewModalOpen}
            onOpenChange={setIsReviewModalOpen}
            listingId={id!}
            reviewedUserId={seller.id}
            reviewerRole="buyer"
            currentUserId={currentUser.id}
            queryKey={['/api/reviews/listing', id]}
          />
          <CancellationCommentModal
            open={isCancellationModalOpen}
            onOpenChange={setIsCancellationModalOpen}
            listingId={id!}
            otherUserId={seller.id}
            currentUserId={currentUser.id}
            userRole="buyer"
            queryKey={['/api/cancellations/listing', id]}
          />
          {transactionDetails?.canCancelTransaction && (
            <CancelTransactionModal
              open={isCancelTransactionModalOpen}
              onOpenChange={setIsCancelTransactionModalOpen}
              listingId={id!}
              userRole={transactionDetails.userRole || 'buyer'}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: [`/api/transactions/${id}/details`] });
                queryClient.invalidateQueries({ queryKey: [`/api/listings/${id}`] });
              }}
            />
          )}
          {data?.listing.userId !== currentUser.id && (
            <MakeOfferModal
              open={isMakeOfferModalOpen}
              onOpenChange={setIsMakeOfferModalOpen}
              listingId={id!}
              sellerId={seller.id}
              askingPrice={Number(listing.price)}
              listingTitle={listing.title}
            />
          )}
          {data?.listing.userId !== currentUser.id && (
            <MessageModal
              isOpen={isMessageModalOpen}
              onClose={() => setIsMessageModalOpen(false)}
              listingId={id!}
              sellerId={seller.id}
              sellerName={getSellerName(seller)}
              listingTitle={listing.title}
            />
          )}
          {data && (
            <CheckoutModal
              listing={listing}
              seller={seller}
              open={isCheckoutModalOpen}
              onClose={() => setIsCheckoutModalOpen(false)}
            />
          )}
          {data && currentUser && data.listing.userId !== currentUser.id && (
            <DepositSubmissionModal
              open={isDepositModalOpen}
              onOpenChange={setIsDepositModalOpen}
              listingId={id!}
              sellerId={seller.id}
              listingTitle={listing.title}
              listingPrice={parseFloat(listing.price)}
            />
          )}
        </>
      )}
      </div>
    </>
  );
}
