import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Copy, Share2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface Listing {
  id: string;
  title: string;
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
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const baseUrl = window.location.origin;
  
  // Generate URL for user's complete listings page
  const allListingsUrl = userId 
    ? `${baseUrl}/users/${userId}` 
    : `${baseUrl}/dashboard`;

  const copyToClipboard = async (text: string, index?: number) => {
    try {
      await navigator.clipboard.writeText(text);
      
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Share2 className="w-6 h-6 text-primary" />
            Share Your Listings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Share All Listings Link */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">
              📋 Share Your Complete Listings Page
            </h3>
            <p className="text-sm text-blue-700 mb-3">
              Share this link to show all your active listings in one place
            </p>
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

          {/* Individual Listings */}
          {listings.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Individual Listings</h3>
              <p className="text-sm text-muted-foreground">
                Copy links to specific items to share on social media or with buyers
              </p>
              
              {listings.map((listing, index) => {
                const listingUrl = `${baseUrl}/listings/${listing.id}`;
                
                return (
                  <div key={listing.id} className="border rounded-lg p-3 space-y-2">
                    <h4 className="font-medium">{listing.title}</h4>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={listingUrl}
                        readOnly
                        className="flex-1 px-3 py-2 border rounded-md bg-gray-50 text-sm font-mono"
                        onClick={(e) => e.currentTarget.select()}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(listingUrl, index)}
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
                );
              })}
            </div>
          )}

          {/* Instructions */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">💡 Sharing Tips</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Share your complete listings page to showcase all your items</li>
              <li>• Share individual links for specific items buyers are interested in</li>
              <li>• Post on Facebook, Twitter, Instagram, WhatsApp, or email</li>
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

