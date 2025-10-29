import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Copy, ExternalLink, Share2 } from "lucide-react";
import { useState } from "react";
import {
  FacebookShareButton,
  TwitterShareButton,
  WhatsappShareButton,
  FacebookIcon,
  TwitterIcon,
  WhatsappIcon,
} from "react-share";
import { useToast } from "@/hooks/use-toast";

interface ListingSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingIds: string[];
  listingTitles: string[];
  batchId?: string; // Optional batch ID for collection link
}

export function ListingSuccessModal({
  isOpen,
  onClose,
  listingIds,
  listingTitles,
  batchId,
}: ListingSuccessModalProps) {
  const { toast } = useToast();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedBatch, setCopiedBatch] = useState(false);

  const baseUrl = window.location.origin;
  const listings = listingIds.map((id, index) => ({
    id,
    title: listingTitles[index] || "My Item",
    url: `${baseUrl}/listings/${id}`,
  }));
  
  const collectionUrl = batchId ? `${baseUrl}/collections/${batchId}` : null;
  const showCollectionLink = listings.length > 1 && collectionUrl;

  const copyToClipboard = async (url: string, index: number) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedIndex(index);
      toast({
        title: "Link copied!",
        description: "Share this link on your favorite social media platform",
      });
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please try copying manually",
        variant: "destructive",
      });
    }
  };
  
  const copyBatchLink = async () => {
    if (!collectionUrl) return;
    try {
      await navigator.clipboard.writeText(collectionUrl);
      setCopiedBatch(true);
      toast({
        title: "Collection link copied!",
        description: "Share this link to show all your items at once",
      });
      setTimeout(() => setCopiedBatch(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please try copying manually",
        variant: "destructive",
      });
    }
  };

  const handleViewListing = (id: string) => {
    window.open(`/listings/${id}`, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            {listings.length === 1 ? "Your Listing is Live!" : `${listings.length} Listings are Live!`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Success Message */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 font-medium">
              🎉 Congratulations! Your {listings.length === 1 ? "item is" : "items are"} now visible to buyers.
            </p>
            <p className="text-green-700 text-sm mt-1">
              Share {listings.length === 1 ? "this link" : "these links"} on social media to reach more potential buyers!
            </p>
          </div>
          
          {/* Batch Collection Link (for multiple items) */}
          {showCollectionLink && (
            <div className="border-2 border-primary rounded-lg p-4 space-y-3 bg-primary/5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <span className="text-primary">⭐</span>
                    Share All {listings.length} Items in One Link!
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Perfect for social media - shows all your items in a beautiful gallery
                  </p>
                </div>
              </div>

              {/* Collection Link */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={collectionUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border-2 border-primary rounded-md bg-white text-sm font-mono"
                  onClick={(e) => e.currentTarget.select()}
                />
                <Button
                  variant="default"
                  size="sm"
                  onClick={copyBatchLink}
                  className="shrink-0"
                >
                  {copiedBatch ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
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

              {/* Social Media Share Buttons for Collection */}
              <div className="flex items-center gap-3 pt-2">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Share2 className="w-4 h-4" />
                  Share collection:
                </span>
                <FacebookShareButton
                  url={collectionUrl}
                  quote={`Check out my ${listings.length} items on SellFast.Now!`}
                >
                  <FacebookIcon size={32} round />
                </FacebookShareButton>
                <TwitterShareButton
                  url={collectionUrl}
                  title={`Check out my ${listings.length} items on SellFast.Now!`}
                >
                  <TwitterIcon size={32} round />
                </TwitterShareButton>
                <WhatsappShareButton
                  url={collectionUrl}
                  title={`Check out my ${listings.length} items on SellFast.Now!`}
                >
                  <WhatsappIcon size={32} round />
                </WhatsappShareButton>
              </div>
            </div>
          )}

          {/* Listings */}
          {listings.map((listing, index) => (
            <div key={listing.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{listing.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Share this link to promote your listing
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewListing(listing.id)}
                  className="ml-2"
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  View
                </Button>
              </div>

              {/* Shareable Link */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={listing.url}
                  readOnly
                  className="flex-1 px-3 py-2 border rounded-md bg-gray-50 text-sm font-mono"
                  onClick={(e) => e.currentTarget.select()}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(listing.url, index)}
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

              {/* Social Media Share Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Share2 className="w-4 h-4" />
                  Quick share:
                </span>
                <FacebookShareButton
                  url={listing.url}
                  quote={`Check out my ${listing.title} on SellFast.Now!`}
                >
                  <FacebookIcon size={32} round />
                </FacebookShareButton>
                <TwitterShareButton
                  url={listing.url}
                  title={`Check out my ${listing.title} on SellFast.Now!`}
                >
                  <TwitterIcon size={32} round />
                </TwitterShareButton>
                <WhatsappShareButton
                  url={listing.url}
                  title={`Check out my ${listing.title} on SellFast.Now!`}
                >
                  <WhatsappIcon size={32} round />
                </WhatsappShareButton>
              </div>
            </div>
          ))}

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">💡 Sharing Tips</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Click the social media icons above for instant sharing</li>
              <li>• Or copy the link and paste it anywhere you like</li>
              <li>• Share on Facebook, Twitter, Instagram, WhatsApp, or email</li>
              <li>• The more you share, the faster your item will sell!</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button onClick={onClose} className="flex-1" size="lg">
              Done
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/dashboard'}
              className="flex-1"
              size="lg"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

