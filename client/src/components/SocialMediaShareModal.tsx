import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  Share2,
  Facebook,
  Twitter,
  Linkedin,
  MessageCircle,
  Copy,
  ExternalLink,
  Package,
  AlertCircle,
} from "lucide-react";
import type { Listing } from "@shared/schema";

interface SocialMediaShareModalProps {
  open: boolean;
  onClose: () => void;
}

export function SocialMediaShareModal({ open, onClose }: SocialMediaShareModalProps) {
  const { user, getToken } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [shareMode, setShareMode] = useState<'single' | 'all'>('single');

  // Fetch user's listings
  const { data: userListings = [], isLoading } = useQuery<Listing[]>({
    queryKey: ['/api/listings/user', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const token = await getToken();
      const response = await fetch(`/api/listings?userId=${user.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: open && !!user,
  });

  // Auto-select first listing if available
  useEffect(() => {
    if (userListings.length > 0 && !selectedListing) {
      setSelectedListing(userListings[0]);
    }
  }, [userListings, selectedListing]);

  const generateShareLinks = (listing: Listing | null, mode: 'single' | 'all') => {
    const baseUrl = window.location.origin;
    
    if (mode === 'all') {
      // Generate a link to user's storefront/profile showing all listings
      const profileUrl = `${baseUrl}/user/${user?.id}`;
      const title = `Check out my ${userListings.length} listings on SellFast.Now!`;
      
      return {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`,
        twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(profileUrl)}&text=${encodeURIComponent(title)}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`,
        whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title} - ${profileUrl}`)}`,
        direct: profileUrl,
      };
    }
    
    // Single listing mode
    if (!listing) return null;
    const listingUrl = `${baseUrl}/listing/${listing.id}`;
    const title = listing.title;

    return {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(listingUrl)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(listingUrl)}&text=${encodeURIComponent(title)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(listingUrl)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title} - ${listingUrl}`)}`,
      direct: listingUrl,
    };
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied!",
      description: "Share link has been copied to your clipboard.",
    });
  };

  const handleShare = (platform: string, url: string) => {
    window.open(url, '_blank', 'width=600,height=400');
    toast({
      title: `Sharing on ${platform}`,
      description: "Opening share dialog...",
    });
  };

  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign In Required</DialogTitle>
            <DialogDescription>
              Please sign in to share your listings on social media.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => {
            onClose();
            navigate('/auth');
          }}>
            Sign In
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Loading Your Listings...</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (userListings.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              No Listings Yet
            </DialogTitle>
            <DialogDescription>
              You don't have any active listings to share. Create your first listing to start sharing on social media!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Package className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="font-semibold text-sm">Post Your First Item</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  It only takes a few minutes to create a listing
                </p>
              </div>
            </div>
            <Button 
              onClick={() => {
                onClose();
                navigate('/post-ad');
              }}
              className="w-full"
              size="lg"
            >
              <Package className="w-4 h-4 mr-2" />
              Post Your First Item to Sell
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const shareLinks = generateShareLinks(shareMode === 'single' ? selectedListing : null, shareMode);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share Your Listings on Social Media
          </DialogTitle>
          <DialogDescription>
            Generate shareable links for your listings. Share one item or up to 1,000 at a time!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Share Mode Toggle */}
          <div>
            <label className="text-sm font-medium mb-3 block">What would you like to share?</label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={shareMode === 'single' ? 'default' : 'outline'}
                className="w-full"
                onClick={() => setShareMode('single')}
              >
                One Listing
              </Button>
              <Button
                variant={shareMode === 'all' ? 'default' : 'outline'}
                className="w-full"
                onClick={() => setShareMode('all')}
              >
                All Listings ({userListings.length})
              </Button>
            </div>
          </div>

          {/* Listing Selector - Only show in single mode */}
          {shareMode === 'single' && (
          <div>
            <label className="text-sm font-medium mb-2 block">Select a Listing to Share</label>
            <select
              className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
              value={selectedListing?.id || ''}
              onChange={(e) => {
                const listing = userListings.find(l => l.id === parseInt(e.target.value));
                setSelectedListing(listing || null);
              }}
            >
              {userListings.map((listing) => (
                <option key={listing.id} value={listing.id}>
                  {listing.title} - ${listing.price}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              You have {userListings.length} listing{userListings.length !== 1 ? 's' : ''} available to share
            </p>
          </div>
          )}

          {/* Share Buttons */}
          {shareLinks && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="flex items-center justify-center gap-2"
                  onClick={() => handleShare('Facebook', shareLinks.facebook)}
                >
                  <Facebook className="w-4 h-4" />
                  Facebook
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center justify-center gap-2"
                  onClick={() => handleShare('Twitter', shareLinks.twitter)}
                >
                  <Twitter className="w-4 h-4" />
                  Twitter
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center justify-center gap-2"
                  onClick={() => handleShare('LinkedIn', shareLinks.linkedin)}
                >
                  <Linkedin className="w-4 h-4" />
                  LinkedIn
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center justify-center gap-2"
                  onClick={() => handleShare('WhatsApp', shareLinks.whatsapp)}
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </Button>
              </div>

              {/* Direct Link */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Direct Link</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareLinks.direct}
                    readOnly
                    className="flex-1 p-2 border rounded-md bg-gray-50 dark:bg-gray-800 dark:border-gray-700 text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopyLink(shareLinks.direct)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(shareLinks.direct, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Bulk Share Info */}
              <div className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 p-4 rounded-lg border border-cyan-200 dark:border-cyan-800">
                <p className="text-sm font-semibold text-cyan-900 dark:text-cyan-100 mb-1">
                  💡 Pro Tip: Bulk Sharing
                </p>
                <p className="text-xs text-cyan-800 dark:text-cyan-200">
                  Want to share multiple listings at once? Visit your Dashboard to generate bulk share links for up to 1,000 items simultaneously!
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
