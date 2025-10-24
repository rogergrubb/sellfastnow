import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Copy, Share2, Facebook, Twitter, Instagram, MessageCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { useSocialShareTracking } from "@/hooks/useSocialShareTracking";

interface Listing {
  id: string;
  title: string;
  images?: string[];
  price?: number;
}

interface DashboardShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  listings: Listing[];
  userId?: string;
}

export function DashboardShareModal({
  isOpen,
  onClose,
  listings,
  userId,
}: DashboardShareModalProps) {
  const { toast } = useToast();
  const { trackShare } = useSocialShareTracking();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [selectedListings, setSelectedListings] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const baseUrl = window.location.origin;
  
  // Generate URL for user's complete listings page (opens Listings tab)
  const allListingsUrl = userId 
    ? `${baseUrl}/users/${userId}?tab=listings` 
    : `${baseUrl}/dashboard`;

  const copyToClipboard = async (text: string, index?: number, listingId?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      
      // Track copy as a share event
      if (listingId) {
        trackShare({
          listingId,
          platform: "copy_link",
          shareType: "individual_listing",
          shareUrl: text,
        });
      } else if (text === allListingsUrl) {
        trackShare({
          platform: "copy_link",
          shareType: "complete_listings_page",
          shareUrl: text,
        });
      }
      
      if (index !== undefined) {
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
      } else {
        setCopiedAll(true);
        setTimeout(() => setCopiedAll(false), 2000);
      }
      
      toast({
        title: "Link copied!",
        description: "Share this link to promote your listing",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please try copying manually",
        variant: "destructive",
      });
    }
  };

  const toggleListingSelection = (listingId: string) => {
    const newSelection = new Set(selectedListings);
    if (newSelection.has(listingId)) {
      newSelection.delete(listingId);
    } else {
      newSelection.add(listingId);
    }
    setSelectedListings(newSelection);
    setSelectAll(newSelection.size === listings.length);
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedListings(new Set());
      setSelectAll(false);
    } else {
      setSelectedListings(new Set(listings.map(l => l.id)));
      setSelectAll(true);
    }
  };

  const getSelectedUrls = () => {
    if (selectedListings.size === 0) return [];
    return Array.from(selectedListings).map(id => `${baseUrl}/listings/${id}`);
  };

  const shareToFacebook = () => {
    const urls = getSelectedUrls();
    if (urls.length === 0) {
      toast({
        title: "No listings selected",
        description: "Please select at least one listing to share",
        variant: "destructive",
      });
      return;
    }

    // Share first URL to Facebook
    const url = urls[0];
    const listingId = Array.from(selectedListings)[0];
    
    // Track the share
    trackShare({
      listingId,
      platform: "facebook",
      shareType: "individual_listing",
      shareUrl: url,
    });
    
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
    
    if (urls.length > 1) {
      toast({
        title: "Multiple listings selected",
        description: `Sharing first listing. Copy other links to share separately.`,
      });
    }
  };

  const shareToTwitter = () => {
    const urls = getSelectedUrls();
    if (urls.length === 0) {
      toast({
        title: "No listings selected",
        description: "Please select at least one listing to share",
        variant: "destructive",
      });
      return;
    }

    const listingId = Array.from(selectedListings)[0];
    const selectedListing = listings.find(l => l.id === listingId);
    const text = selectedListing 
      ? `Check out this ${selectedListing.title}${selectedListing.price ? ` - $${selectedListing.price}` : ''} on SellFast.Now!`
      : 'Check out this item on SellFast.Now!';
    
    const url = urls[0];
    
    // Track the share
    trackShare({
      listingId,
      platform: "twitter",
      shareType: "individual_listing",
      shareUrl: url,
    });
    
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
    
    if (urls.length > 1) {
      toast({
        title: "Multiple listings selected",
        description: `Sharing first listing. Copy other links to share separately.`,
      });
    }
  };

  const shareToWhatsApp = () => {
    const urls = getSelectedUrls();
    if (urls.length === 0) {
      toast({
        title: "No listings selected",
        description: "Please select at least one listing to share",
        variant: "destructive",
      });
      return;
    }

    const listingId = Array.from(selectedListings)[0];
    const selectedListing = listings.find(l => l.id === listingId);
    const text = selectedListing 
      ? `Check out this ${selectedListing.title}${selectedListing.price ? ` - $${selectedListing.price}` : ''} on SellFast.Now: ${urls[0]}`
      : `Check out this item on SellFast.Now: ${urls[0]}`;
    
    // Track the share
    trackShare({
      listingId,
      platform: "whatsapp",
      shareType: "individual_listing",
      shareUrl: urls[0],
    });
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
    
    if (urls.length > 1) {
      toast({
        title: "Multiple listings selected",
        description: `Sharing first listing. Copy other links to share separately.`,
      });
    }
  };

  const copyAllSelected = () => {
    const urls = getSelectedUrls();
    if (urls.length === 0) {
      toast({
        title: "No listings selected",
        description: "Please select at least one listing to copy",
        variant: "destructive",
      });
      return;
    }

    const text = urls.join('\n');
    copyToClipboard(text);
  };

  const shareAllListingsToFacebook = () => {
    // Track the share
    trackShare({
      platform: "facebook",
      shareType: "complete_listings_page",
      shareUrl: allListingsUrl,
    });
    
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(allListingsUrl)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  };

  const shareAllListingsToTwitter = () => {
    const text = `Check out all my items for sale on SellFast.Now!`;
    
    // Track the share
    trackShare({
      platform: "twitter",
      shareType: "complete_listings_page",
      shareUrl: allListingsUrl,
    });
    
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(allListingsUrl)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  };

  const shareAllListingsToWhatsApp = () => {
    const text = `Check out all my items for sale on SellFast.Now: ${allListingsUrl}`;
    
    // Track the share
    trackShare({
      platform: "whatsapp",
      shareType: "complete_listings_page",
      shareUrl: allListingsUrl,
    });
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Share2 className="w-6 h-6 text-primary" />
            Share Your Listings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Social Media Share Buttons */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Quick Share to Social Media
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Select listings below, then click a platform to share
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={shareToFacebook}
                className="bg-[#1877F2] hover:bg-[#166FE5] text-white"
                size="lg"
              >
                <Facebook className="w-5 h-5 mr-2" />
                Facebook
              </Button>
              <Button
                onClick={shareToTwitter}
                className="bg-[#1DA1F2] hover:bg-[#1A8CD8] text-white"
                size="lg"
              >
                <Twitter className="w-5 h-5 mr-2" />
                Twitter / X
              </Button>
              <Button
                onClick={shareToWhatsApp}
                className="bg-[#25D366] hover:bg-[#22C55E] text-white"
                size="lg"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                WhatsApp
              </Button>
              <Button
                onClick={copyAllSelected}
                variant="outline"
                size="lg"
              >
                <Copy className="w-5 h-5 mr-2" />
                Copy Selected
              </Button>
            </div>
          </div>

          {/* Share All Listings Link */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">
              📋 Share Your Complete Listings Page
            </h3>
            <p className="text-sm text-blue-700 mb-3">
              Share this link to show all your active listings in one place
            </p>
            
            {/* Social Share Buttons for All Listings */}
            <div className="flex flex-wrap gap-2 mb-3">
              <Button
                onClick={shareAllListingsToFacebook}
                className="bg-[#1877F2] hover:bg-[#166FE5] text-white"
                size="sm"
              >
                <Facebook className="w-4 h-4 mr-1" />
                Facebook
              </Button>
              <Button
                onClick={shareAllListingsToTwitter}
                className="bg-[#1DA1F2] hover:bg-[#1A8CD8] text-white"
                size="sm"
              >
                <Twitter className="w-4 h-4 mr-1" />
                Twitter
              </Button>
              <Button
                onClick={shareAllListingsToWhatsApp}
                className="bg-[#25D366] hover:bg-[#22C55E] text-white"
                size="sm"
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                WhatsApp
              </Button>
            </div>

            {/* Copy URL */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={allListingsUrl}
                readOnly
                className="flex-1 px-3 py-2 border rounded-md bg-white text-sm font-mono"
                onClick={(e) => e.currentTarget.select()}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(allListingsUrl)}
                className="shrink-0"
              >
                {copiedAll ? (
                  <>
                    <Check className="w-4 h-4 mr-1 text-green-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Individual Listings with Thumbnails */}
          {listings.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">Individual Listings</h3>
                  <p className="text-sm text-muted-foreground">
                    Select items and share to social media or copy links
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="select-all"
                    checked={selectAll}
                    onCheckedChange={toggleSelectAll}
                  />
                  <label
                    htmlFor="select-all"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Select All
                  </label>
                </div>
              </div>
              
              {listings.map((listing, index) => {
                const listingUrl = `${baseUrl}/listings/${listing.id}`;
                const thumbnail = listing.images && listing.images.length > 0 ? listing.images[0] : null;
                const isSelected = selectedListings.has(listing.id);
                
                return (
                  <div 
                    key={listing.id} 
                    className={`border rounded-lg p-3 transition-all ${
                      isSelected ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <div className="pt-1">
                        <Checkbox
                          id={`listing-${listing.id}`}
                          checked={isSelected}
                          onCheckedChange={() => toggleListingSelection(listing.id)}
                        />
                      </div>

                      {/* Thumbnail */}
                      {thumbnail ? (
                        <img
                          src={thumbnail}
                          alt={listing.title}
                          className="w-16 h-16 object-cover rounded-md border border-gray-200 shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded-md border border-gray-200 flex items-center justify-center shrink-0">
                          <Share2 className="w-6 h-6 text-gray-400" />
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div>
                          <h4 className="font-medium text-gray-900">{listing.title}</h4>
                          {listing.price && (
                            <p className="text-sm font-semibold text-primary">${listing.price}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={listingUrl}
                            readOnly
                            className="flex-1 px-3 py-2 border rounded-md bg-gray-50 text-xs font-mono"
                            onClick={(e) => e.currentTarget.select()}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(listingUrl, index, listing.id)}
                            className="shrink-0"
                          >
                            {copiedIndex === index ? (
                              <>
                                <Check className="w-4 h-4 mr-1 text-green-600" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4 mr-1" />
                                Copy
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Instructions */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">💡 Sharing Tips</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Select one or more listings using the checkboxes</li>
              <li>• Click a social media button to share instantly</li>
              <li>• Share your complete listings page to showcase all items</li>
              <li>• Copy individual links for specific buyers</li>
              <li>• The more you share, the faster your items will sell!</li>
            </ul>
          </div>

          {/* Close Button */}
          <div className="flex justify-end pt-2">
            <Button onClick={onClose} size="lg">
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

